/**
 * WebAuthn configuration
 * Configuration for biometric authentication.
 */

export const WEBAUTHN_CONFIG = {
  // Relying party information
  RP: {
    name: 'Echo Wallet',
    defaultId: 'localhost',
  },

  // User verification requirements
  USER_VERIFICATION: 'required' as UserVerificationRequirement,

  // Authenticator selection criteria
  AUTHENTICATOR_SELECTION: {
    authenticatorAttachment: 'platform' as AuthenticatorAttachment, // Prefer built-in authenticators
    userVerification: 'required' as UserVerificationRequirement,
    requireResidentKey: true,
    residentKey: 'required' as ResidentKeyRequirement
  },

  // Public key credential parameters
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

  // Timeout settings (ms)
  TIMEOUT: {
    REGISTRATION: 60000, // Registration timeout: 60 seconds
    AUTHENTICATION: 30000 // Authentication timeout: 30 seconds
  },

  // Local storage keys
  STORAGE_KEYS: {
    CREDENTIALS: 'echo_wallet_credentials',
    LAST_USED: 'echo_wallet_last_used',
    USER_PREFERENCES: 'echo_wallet_webauthn_prefs'
  },

  // Challenge byte length
  CHALLENGE_LENGTH: 32,

  // User ID length
  USER_ID_LENGTH: 16,

  // Error messages
  ERROR_MESSAGES: {
    NOT_SUPPORTED: 'Your browser does not support biometric authentication.',
    USER_CANCELLED: 'Biometric authentication cancelled by user.',
    AUTHENTICATION_FAILED: 'Biometric authentication failed.',
    REGISTRATION_FAILED: 'Biometric registration failed.',
    CREDENTIAL_NOT_FOUND: 'Stored wallet credential not found.',
    DECRYPTION_FAILED: 'Failed to decrypt wallet data.',
    UNKNOWN_ERROR: 'An unknown error occurred.'
  } satisfies Record<string, string>,

  // Voice prompts
  VOICE_PROMPTS: {
    REGISTRATION_START: 'Starting biometric registration. Please follow the prompts to authenticate.',
    REGISTRATION_SUCCESS: 'Biometric registration succeeded. Wallet stored securely.',
    AUTHENTICATION_START: 'Performing biometric authentication. Please verify your identity.',
    AUTHENTICATION_SUCCESS: 'Biometric authentication successful. Restoring wallet.',
    MULTIPLE_WALLETS_FOUND: 'Multiple wallets found. Please choose one to restore.',
    NO_CREDENTIALS_FOUND: 'No saved wallet found. Please create one first.'
  }
} as const

/**
 * Generate random challenge
 */
export function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(WEBAUTHN_CONFIG.CHALLENGE_LENGTH))
}

/**
 * Generate user ID
 */
export function generateUserId(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(WEBAUTHN_CONFIG.USER_ID_LENGTH))
}

/**
 * Convert string to Uint8Array
 */
export function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

/**
 * Convert Uint8Array to string
 */
export function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr)
}

/**
 * Convert Uint8Array to Base64
 */
export function uint8ArrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
}

/**
 * Convert Base64 to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  return new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)))
}

/**
 * Resolve the relying party ID based on runtime context.
 * - Uses the browser's hostname when available.
 * - Falls back to NEXT_PUBLIC_WEBAUTHN_RP_ID during SSR/static builds.
 * - Defaults to localhost for local development.
 */
export function resolveRelyingPartyId(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname
  }

  const envId =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID?.trim()
      : undefined

  return envId || WEBAUTHN_CONFIG.RP.defaultId
}

/**
 * Build the relying party entity for WebAuthn requests.
 */
export function buildRelyingPartyEntity(): PublicKeyCredentialRpEntity {
  return {
    name: WEBAUTHN_CONFIG.RP.name,
    id: resolveRelyingPartyId(),
  }
}
