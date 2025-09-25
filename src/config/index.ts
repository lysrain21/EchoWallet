/**
 * Echo Wallet - Configuration
 * Wallet configuration including network and speech settings.
 */

const INFURA_KEY = process.env.NEXT_PUBLIC_INFURA_KEY || ''

const buildRpcUrl = (network: 'sepolia' | 'mainnet') => {
  if (INFURA_KEY) {
    return `https://${network}.infura.io/v3/${INFURA_KEY}`
  }

  return network === 'sepolia'
    ? 'https://ethereum-sepolia-rpc.publicnode.com'
    : 'https://cloudflare-eth.com'
}

export const WALLET_CONFIG = {
  // ZeroDev configuration
  ZERODEV_PROJECT_ID: process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID || '',
  
  // Network configuration
  NETWORKS: {
    sepolia: {
      chainId: 11155111,
      name: 'Sepolia Testnet',
      rpcUrl: buildRpcUrl('sepolia'),
      bundlerUrl: `https://rpc.zerodev.app/api/v2/bundler/${process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID}`,
      paymasterUrl: `https://rpc.zerodev.app/api/v2/paymaster/${process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID}`,
      entryPointAddress: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
      explorerUrl: 'https://sepolia.etherscan.io'
    },
    mainnet: {
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrl: buildRpcUrl('mainnet'),
      bundlerUrl: `https://rpc.zerodev.app/api/v2/bundler/${process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID}`,
      paymasterUrl: `https://rpc.zerodev.app/api/v2/paymaster/${process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID}`,
      entryPointAddress: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
      explorerUrl: 'https://etherscan.io'
    }
  },

  // Default token list
  DEFAULT_TOKENS: {
    sepolia: [
      {
        symbol: 'USDC',
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        name: 'USD Coin',
        decimals: 6
      }
    ],
    mainnet: [
      {
        symbol: 'USDC',
        address: '0xA0b86a33E6575d7eBeA5Ae8C48Fd0e4E0C0C1b9a',
        name: 'USD Coin',
        decimals: 6
      },
      {
        symbol: 'USDT',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        name: 'Tether USD',
        decimals: 6
      }
    ]
  },

  // Speech recognition configuration
  SPEECH_CONFIG: {
    SUPPORTED_LANGUAGES: ['en-US'],
    DEFAULT_LANGUAGE: 'en-US',
    CONFIDENCE_THRESHOLD: 0.7,
    MAX_ALTERNATIVES: 3,
    CONTINUOUS_MODE: true
  },

  // Accessibility configuration
  ACCESSIBILITY: {
    ANNOUNCE_ACTIONS: true,
    VERBOSE_MODE: true,
    CONFIRM_TRANSACTIONS: true,
    READ_ADDRESSES: true,
    KEYBOARD_SHORTCUTS: {
      ACTIVATE_VOICE: 'Space',
      STOP_VOICE: 'Escape',
      REPEAT_LAST: 'R',
      HELP: 'F1'
    }
  },

  // Security configuration
  SECURITY: {
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    MAX_RETRY_ATTEMPTS: 3,
    REQUIRE_CONFIRMATION: true
  }
}

// Voice command templates
export const VOICE_COMMANDS = {
  CREATE_WALLET: [
    'create wallet',
    'new wallet',
    'generate wallet'
  ],
  
  IMPORT_WALLET: [
    'import wallet',
    'restore wallet',
    'recover wallet',
    'sign in wallet'
  ],
  
  CHECK_BALANCE: [
    'check balance',
    'show balance',
    'what is my balance',
    'wallet balance'
  ],
  
  TRANSFER: [
    'transfer',
    'send',
    'send to',
    'transfer to'
  ],
  
  TRANSACTION_STATUS: [
    'check transaction',
    'transaction status',
    'track transaction',
    'transaction update'
  ]
}

// Text-to-speech templates
export const TTS_TEMPLATES = {
  WALLET_CREATED: 'Wallet created successfully. Your address is {address}',
  BALANCE_RESULT: 'Your {token} balance is {amount}',
  TRANSFER_CONFIRM: 'Please confirm the transfer: send {amount} {token} to address {to}',
  TRANSFER_SUCCESS: 'Transfer submitted successfully. Waiting for network confirmation.',
  TRANSFER_FAILED: 'Transfer failed: {error}',
  WAITING_FOR_COMMAND: 'Please say your command.',
  COMMAND_NOT_RECOGNIZED: 'Sorry, I did not understand your command. Please try again.',
  PROCESSING: 'Processing your request, please wait...'
}
