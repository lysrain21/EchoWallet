/**
 * WebAuthn相关类型定义
 * 用于生物识别身份验证和钱包恢复
 */

/**
 * WebAuthn凭证创建选项
 */
export interface WebAuthnCredentialCreationOptions {
  challenge: Uint8Array
  rp: {
    name: string
    id: string
  }
  user: {
    id: Uint8Array
    name: string
    displayName: string
  }
  pubKeyCredParams: PublicKeyCredentialParameters[]
  authenticatorSelection?: AuthenticatorSelectionCriteria
  timeout?: number
  attestation?: AttestationConveyancePreference
}

/**
 * WebAuthn凭证请求选项
 */
export interface WebAuthnCredentialRequestOptions {
  challenge: Uint8Array
  allowCredentials?: PublicKeyCredentialDescriptor[]
  timeout?: number
  userVerification?: UserVerificationRequirement
  rpId?: string
}

/**
 * 存储在浏览器中的钱包凭证信息
 */
export interface StoredWalletCredential {
  credentialId: string
  publicKey: string
  counter: number
  created: string
  lastUsed: string
  walletAddress: string
  walletName: string
  encryptedMnemonic: string // 使用WebAuthn公钥加密的助记词
  userHandle: string
}

/**
 * WebAuthn身份验证结果
 */
export interface WebAuthnAuthenticationResult {
  credentialId: string
  clientDataJSON: string
  authenticatorData: string
  signature: string
  userHandle?: string
}

/**
 * WebAuthn注册结果
 */
export interface WebAuthnRegistrationResult {
  credentialId: string
  publicKey: string
  clientDataJSON: string
  attestationObject: string
}

/**
 * 钱包恢复信息
 */
export interface WalletRecoveryInfo {
  walletAddress: string
  walletName: string
  mnemonic: string
  credentialId: string
  isVerified: boolean
}

/**
 * WebAuthn错误类型
 */
export type WebAuthnErrorType = 
  | 'NOT_SUPPORTED'
  | 'USER_CANCELLED'
  | 'AUTHENTICATION_FAILED'
  | 'REGISTRATION_FAILED'
  | 'CREDENTIAL_NOT_FOUND'
  | 'DECRYPTION_FAILED'
  | 'UNKNOWN_ERROR'

/**
 * WebAuthn错误
 */
export interface WebAuthnError {
  type: WebAuthnErrorType
  message: string
  originalError?: Error
}

/**
 * 生物识别可用性检查结果
 */
export interface BiometricAvailability {
  isSupported: boolean
  isAvailable: boolean
  authenticatorTypes: AuthenticatorType[]
  platformAuthenticator: boolean
  crossPlatformAuthenticator: boolean
}

/**
 * 身份验证器类型
 */
export type AuthenticatorType = 
  | 'platform' // 设备内置（如Face ID、Touch ID、Windows Hello）
  | 'cross-platform' // 外部设备（如USB安全密钥）

/**
 * 钱包恢复状态
 */
export interface WalletRecoveryState {
  hasStoredCredentials: boolean
  availableWallets: Array<{
    credentialId: string
    walletAddress: string
    walletName: string
    created: string
    lastUsed: string
  }>
  isRecovering: boolean
  error: WebAuthnError | null
}