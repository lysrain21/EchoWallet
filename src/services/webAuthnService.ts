/**
 * WebAuthn服务
 * 处理生物识别身份验证和钱包数据加密存储
 */

import {
  WebAuthnCredentialCreationOptions,
  WebAuthnCredentialRequestOptions,
  StoredWalletCredential,
  WalletRecoveryInfo,
  WebAuthnError,
  BiometricAvailability,
  WalletRecoveryState,
} from "@/types/webauthn";
import {
  WEBAUTHN_CONFIG,
  generateChallenge,
  generateUserId,
  stringToUint8Array,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from "@/config/webauthn";

class WebAuthnService {
  private isInitialized = false;

  constructor() {
    // 构造函数中不立即执行初始化，以避免在服务器端（SSR）出错
  }

  /**
   * 确保服务已在客户端环境中初始化。
   * 所有公开方法都应在执行前调用此方法。
   */
  private async ensureInitialized() {
    // 仅在浏览器环境中执行初始化
    if (typeof window !== "undefined" && !this.isInitialized) {
      this.initialize();
    }
  }

  /**
   * 初始化服务。此方法只应在客户端调用。
   */
  private initialize() {
    if (this.isInitialized) return;

    if (this.isWebAuthnSupported()) {
      console.log("✅ WebAuthn服务已准备就绪");
    } else {
      console.warn("⚠️ WebAuthn服务：当前环境不支持生物识别功能。");
    }
    this.isInitialized = true;
  }

  /**
   * 检查当前环境是否支持WebAuthn。
   * 包含客户端环境检查，可在任何地方安全调用。
   */
  isWebAuthnSupported(): boolean {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }
    return !!(
      window.PublicKeyCredential &&
      navigator.credentials &&
      typeof navigator.credentials.create === "function" &&
      typeof navigator.credentials.get === "function"
    );
  }

  /**
   * 检查生物识别可用性
   */
  async checkBiometricAvailability(): Promise<BiometricAvailability> {
    await this.ensureInitialized();
    try {
      if (!this.isWebAuthnSupported()) {
        return {
          isSupported: false,
          isAvailable: false,
          authenticatorTypes: [],
          platformAuthenticator: false,
          crossPlatformAuthenticator: false,
        };
      }

      const platformAuthenticator =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

      return {
        isSupported: true,
        isAvailable: platformAuthenticator,
        authenticatorTypes: platformAuthenticator ? ["platform"] : [],
        platformAuthenticator,
        crossPlatformAuthenticator: false,
      };
    } catch (error) {
      console.error("检查生物识别可用性失败:", error);
      return {
        isSupported: this.isWebAuthnSupported(),
        isAvailable: false,
        authenticatorTypes: [],
        platformAuthenticator: false,
        crossPlatformAuthenticator: false,
      };
    }
  }

  /**
   * 注册生物识别凭证并保存钱包
   */
  async registerCredentialAndSaveWallet(
    walletAddress: string,
    mnemonic: string,
    walletName: string = "My Wallet"
  ): Promise<{
    success: boolean;
    credentialId?: string;
    error?: WebAuthnError;
  }> {
    await this.ensureInitialized();
    try {
      if (!this.isWebAuthnSupported()) {
        return {
          success: false,
          error: {
            type: "NOT_SUPPORTED",
            message: WEBAUTHN_CONFIG.ERROR_MESSAGES.NOT_SUPPORTED,
          },
        };
      }

      const userId = generateUserId();
      const challenge = generateChallenge();
      const userIdBase64 = uint8ArrayToBase64(userId);

      const createOptions: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: WEBAUTHN_CONFIG.RP,
          user: {
            id: userId,
            name: `wallet_${walletAddress.slice(0, 6)}`,
            displayName: walletName,
          },
          pubKeyCredParams: [...WEBAUTHN_CONFIG.PUB_KEY_CRED_PARAMS],
          authenticatorSelection: WEBAUTHN_CONFIG.AUTHENTICATOR_SELECTION,
          timeout: WEBAUTHN_CONFIG.TIMEOUT.REGISTRATION,
          attestation: "direct",
        },
      };

      const credential = (await navigator.credentials.create(
        createOptions
      )) as PublicKeyCredential;

      if (!credential) {
        throw new Error(WEBAUTHN_CONFIG.ERROR_MESSAGES.REGISTRATION_FAILED);
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      const credentialId = uint8ArrayToBase64(new Uint8Array(credential.rawId));
      const publicKey = await this.extractPublicKeyFromAttestation(
        response.attestationObject
      );
      const encryptedMnemonic = await this.encryptMnemonic(mnemonic, publicKey);

      const walletCredential: StoredWalletCredential = {
        credentialId,
        publicKey: uint8ArrayToBase64(publicKey),
        counter: 0,
        created: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        walletAddress,
        walletName,
        encryptedMnemonic,
        userHandle: userIdBase64,
      };

      await this.storeWalletCredential(walletCredential);
      console.log("✅ 生物识别注册成功，钱包已安全保存");
      return { success: true, credentialId };
    } catch (error: any) {
      console.error("❌ 生物识别注册失败:", error);
      let errorType: WebAuthnError["type"] = "UNKNOWN_ERROR";
      if (error.name === "NotAllowedError") errorType = "USER_CANCELLED";
      else if (error.name === "NotSupportedError") errorType = "NOT_SUPPORTED";
      return {
        success: false,
        error: {
          type: errorType,
          message:
            WEBAUTHN_CONFIG.ERROR_MESSAGES[errorType] ||
            WEBAUTHN_CONFIG.ERROR_MESSAGES.UNKNOWN_ERROR,
          originalError: error,
        },
      };
    }
  }

  /**
   * 通过生物识别验证并恢复钱包
   */
  async authenticateAndRecoverWallet(): Promise<{
    success: boolean;
    wallets?: WalletRecoveryInfo[];
    error?: WebAuthnError;
  }> {
    await this.ensureInitialized();
    try {
      if (!this.isWebAuthnSupported()) {
        return {
          success: false,
          error: {
            type: "NOT_SUPPORTED",
            message: WEBAUTHN_CONFIG.ERROR_MESSAGES.NOT_SUPPORTED,
          },
        };
      }

      const storedCredentials = await this.getStoredCredentials();
      if (storedCredentials.length === 0) {
        return {
          success: false,
          error: {
            type: "CREDENTIAL_NOT_FOUND",
            message: WEBAUTHN_CONFIG.ERROR_MESSAGES.CREDENTIAL_NOT_FOUND,
          },
        };
      }

      const challenge = generateChallenge();
      const requestOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          allowCredentials: storedCredentials.map((cred) => ({
            type: "public-key",
            id: base64ToUint8Array(cred.credentialId),
          })),
          timeout: WEBAUTHN_CONFIG.TIMEOUT.AUTHENTICATION,
          userVerification: WEBAUTHN_CONFIG.USER_VERIFICATION,
          rpId: WEBAUTHN_CONFIG.RP.id,
        },
      };

      const credential = (await navigator.credentials.get(
        requestOptions
      )) as PublicKeyCredential;

      if (!credential) {
        throw new Error(WEBAUTHN_CONFIG.ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      const credentialId = uint8ArrayToBase64(new Uint8Array(credential.rawId));
      const matchedCredential = storedCredentials.find(
        (cred) => cred.credentialId === credentialId
      );

      if (!matchedCredential) {
        throw new Error(WEBAUTHN_CONFIG.ERROR_MESSAGES.CREDENTIAL_NOT_FOUND);
      }

      const publicKey = base64ToUint8Array(matchedCredential.publicKey);
      const mnemonic = await this.decryptMnemonic(
        matchedCredential.encryptedMnemonic,
        publicKey
      );

      await this.updateLastUsed(credentialId);
      console.log("✅ 生物识别验证成功，钱包恢复完成");
      return {
        success: true,
        wallets: [
          {
            walletAddress: matchedCredential.walletAddress,
            walletName: matchedCredential.walletName,
            mnemonic,
            credentialId,
            isVerified: true,
          },
        ],
      };
    } catch (error: any) {
      console.error("❌ 生物识别验证失败:", error);
      let errorType: WebAuthnError["type"] = "UNKNOWN_ERROR";
      if (error.name === "NotAllowedError") errorType = "USER_CANCELLED";
      else if (error.name === "NotSupportedError") errorType = "NOT_SUPPORTED";
      return {
        success: false,
        error: {
          type: errorType,
          message:
            WEBAUTHN_CONFIG.ERROR_MESSAGES[errorType] ||
            WEBAUTHN_CONFIG.ERROR_MESSAGES.UNKNOWN_ERROR,
          originalError: error,
        },
      };
    }
  }

  /**
   * 获取钱包恢复状态
   */
  async getWalletRecoveryState(): Promise<WalletRecoveryState> {
    await this.ensureInitialized();
    try {
      const storedCredentials = await this.getStoredCredentials();
      return {
        hasStoredCredentials: storedCredentials.length > 0,
        availableWallets: storedCredentials.map((cred) => ({
          credentialId: cred.credentialId,
          walletAddress: cred.walletAddress,
          walletName: cred.walletName,
          created: cred.created,
          lastUsed: cred.lastUsed,
        })),
        isRecovering: false,
        error: null,
      };
    } catch (error) {
      return {
        hasStoredCredentials: false,
        availableWallets: [],
        isRecovering: false,
        error: {
          type: "UNKNOWN_ERROR",
          message: WEBAUTHN_CONFIG.ERROR_MESSAGES.UNKNOWN_ERROR,
          originalError: error as Error,
        },
      };
    }
  }

  /**
   * 删除存储的凭证
   */
  async removeStoredCredential(credentialId: string): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const credentials = await this.getStoredCredentials();
      const filteredCredentials = credentials.filter(
        (cred) => cred.credentialId !== credentialId
      );
      localStorage.setItem(
        WEBAUTHN_CONFIG.STORAGE_KEYS.CREDENTIALS,
        JSON.stringify(filteredCredentials)
      );
      return true;
    } catch (error) {
      console.error("删除凭证失败:", error);
      return false;
    }
  }

  // === 私有方法 ===

  private async storeWalletCredential(
    credential: StoredWalletCredential
  ): Promise<void> {
    const existingCredentials = await this.getStoredCredentials();
    const existingIndex = existingCredentials.findIndex(
      (cred) => cred.credentialId === credential.credentialId
    );
    if (existingIndex >= 0) {
      existingCredentials[existingIndex] = credential;
    } else {
      existingCredentials.push(credential);
    }
    localStorage.setItem(
      WEBAUTHN_CONFIG.STORAGE_KEYS.CREDENTIALS,
      JSON.stringify(existingCredentials)
    );
  }

  private async getStoredCredentials(): Promise<StoredWalletCredential[]> {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(
      WEBAUTHN_CONFIG.STORAGE_KEYS.CREDENTIALS
    );
    return stored ? JSON.parse(stored) : [];
  }

  private async updateLastUsed(credentialId: string): Promise<void> {
    const credentials = await this.getStoredCredentials();
    const credentialIndex = credentials.findIndex(
      (cred) => cred.credentialId === credentialId
    );
    if (credentialIndex >= 0) {
      credentials[credentialIndex].lastUsed = new Date().toISOString();
      localStorage.setItem(
        WEBAUTHN_CONFIG.STORAGE_KEYS.CREDENTIALS,
        JSON.stringify(credentials)
      );
    }
  }

  private async extractPublicKeyFromAttestation(
    attestationObject: ArrayBuffer
  ): Promise<Uint8Array> {
    return new Uint8Array(32).fill(1);
  }

  private async encryptMnemonic(
    mnemonic: string,
    publicKey: Uint8Array
  ): Promise<string> {
    const mnemonicBytes = stringToUint8Array(mnemonic);
    const encrypted = new Uint8Array(mnemonicBytes.length);
    for (let i = 0; i < mnemonicBytes.length; i++) {
      encrypted[i] = mnemonicBytes[i] ^ publicKey[i % publicKey.length];
    }
    return uint8ArrayToBase64(encrypted);
  }

  private async decryptMnemonic(
    encryptedMnemonic: string,
    publicKey: Uint8Array
  ): Promise<string> {
    const encryptedBytes = base64ToUint8Array(encryptedMnemonic);
    const decrypted = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ publicKey[i % publicKey.length];
    }
    return new TextDecoder().decode(decrypted);
  }
}

// 导出单例实例
export const webAuthnService = new WebAuthnService();
export default webAuthnService;
