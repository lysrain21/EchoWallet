/**
 * WebAuthn配置
 * 用于生物识别身份验证配置
 */

export const WEBAUTHN_CONFIG = {
  // 依赖方信息
  RP: {
    name: 'Echo Wallet',
    id: 'localhost', // 生产环境需要更改为实际域名
  },

  // 用户验证要求
  USER_VERIFICATION: 'required' as UserVerificationRequirement,

  // 身份验证器选择标准
  AUTHENTICATOR_SELECTION: {
    authenticatorAttachment: 'platform' as AuthenticatorAttachment, // 优先使用设备内置身份验证器
    userVerification: 'required' as UserVerificationRequirement,
    requireResidentKey: true,
    residentKey: 'required' as ResidentKeyRequirement
  },

  // 公钥凭证参数
  PUB_KEY_CRED_PARAMS: [
    {
      type: 'public-key' as const,
      alg: -7 // ES256 (ECDSA w/ SHA-256)
    },
    {
      type: 'public-key' as const,
      alg: -257 // RS256 (RSASSA-PKCS1-v1_5 w/ SHA-256)
    }
  ],

  // 超时设置（毫秒）
  TIMEOUT: {
    REGISTRATION: 60000, // 注册超时：60秒
    AUTHENTICATION: 30000 // 认证超时：30秒
  },

  // 本地存储键名
  STORAGE_KEYS: {
    CREDENTIALS: 'echo_wallet_credentials',
    LAST_USED: 'echo_wallet_last_used',
    USER_PREFERENCES: 'echo_wallet_webauthn_prefs'
  },

  // 挑战字节长度
  CHALLENGE_LENGTH: 32,

  // 用户ID长度
  USER_ID_LENGTH: 16,

  // 错误消息
  ERROR_MESSAGES: {
    NOT_SUPPORTED: '您的浏览器不支持生物识别功能',
    USER_CANCELLED: '用户取消了生物识别验证',
    AUTHENTICATION_FAILED: '生物识别验证失败',
    REGISTRATION_FAILED: '生物识别注册失败',
    CREDENTIAL_NOT_FOUND: '未找到存储的钱包凭证',
    DECRYPTION_FAILED: '钱包数据解密失败',
    UNKNOWN_ERROR: '发生未知错误'
  } satisfies Record<string, string>,

  // 语音提示
  VOICE_PROMPTS: {
    REGISTRATION_START: '正在启动生物识别注册，请按照提示完成身份验证',
    REGISTRATION_SUCCESS: '生物识别注册成功，钱包已安全保存',
    AUTHENTICATION_START: '正在进行生物识别验证，请验证您的身份',
    AUTHENTICATION_SUCCESS: '生物识别验证成功，正在恢复钱包',
    MULTIPLE_WALLETS_FOUND: '找到多个钱包，请选择要恢复的钱包',
    NO_CREDENTIALS_FOUND: '未找到已保存的钱包，请先创建钱包'
  }
} as const

/**
 * 生成随机挑战
 */
export function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(WEBAUTHN_CONFIG.CHALLENGE_LENGTH))
}

/**
 * 生成用户ID
 */
export function generateUserId(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(WEBAUTHN_CONFIG.USER_ID_LENGTH))
}

/**
 * 将字符串转换为Uint8Array
 */
export function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

/**
 * 将Uint8Array转换为字符串
 */
export function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr)
}

/**
 * 将Uint8Array转换为Base64
 */
export function uint8ArrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
}

/**
 * 将Base64转换为Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  return new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)))
}