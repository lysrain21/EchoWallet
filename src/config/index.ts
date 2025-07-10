/**
 * Echo Wallet - Configuration
 * 钱包配置文件，包含网络、API密钥等配置
 */

export const WALLET_CONFIG = {
  // ZeroDev 配置
  ZERODEV_PROJECT_ID: process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID || '',
  
  // 网络配置
  NETWORKS: {
    sepolia: {
      chainId: 11155111,
      name: 'Sepolia Testnet',
      rpcUrl: 'https://sepolia.infura.io/v3/' + (process.env.NEXT_PUBLIC_INFURA_KEY || ''),
      bundlerUrl: `https://rpc.zerodev.app/api/v2/bundler/${process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID}`,
      paymasterUrl: `https://rpc.zerodev.app/api/v2/paymaster/${process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID}`,
      entryPointAddress: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
      explorerUrl: 'https://sepolia.etherscan.io'
    },
    mainnet: {
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/' + (process.env.NEXT_PUBLIC_INFURA_KEY || ''),
      bundlerUrl: `https://rpc.zerodev.app/api/v2/bundler/${process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID}`,
      paymasterUrl: `https://rpc.zerodev.app/api/v2/paymaster/${process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID}`,
      entryPointAddress: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
      explorerUrl: 'https://etherscan.io'
    }
  },

  // 默认代币列表
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

  // 语音识别配置
  SPEECH_CONFIG: {
    SUPPORTED_LANGUAGES: ['zh-CN', 'en-US'],
    DEFAULT_LANGUAGE: 'zh-CN',
    CONFIDENCE_THRESHOLD: 0.7,
    MAX_ALTERNATIVES: 3,
    CONTINUOUS_MODE: true
  },

  // 可访问性配置
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

  // 安全配置
  SECURITY: {
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30分钟
    MAX_RETRY_ATTEMPTS: 3,
    REQUIRE_CONFIRMATION: true
  }
}

// 语音命令模板
export const VOICE_COMMANDS = {
  CREATE_WALLET: [
    '创建钱包',
    '新建钱包',
    '建立新钱包',
    'create wallet',
    'new wallet'
  ],
  
  IMPORT_WALLET: [
    '导入钱包',
    '恢复钱包',
    '从助记词恢复',
    'import wallet',
    'restore wallet'
  ],
  
  CHECK_BALANCE: [
    '查询余额',
    '我有多少钱',
    '账户余额',
    'check balance',
    'show balance'
  ],
  
  TRANSFER: [
    '转账',
    '发送',
    '转账给',
    'transfer',
    'send',
    'send to'
  ],
  
  TRANSACTION_STATUS: [
    '查询交易',
    '交易状态',
    '查看交易',
    'check transaction',
    'transaction status'
  ]
}

// 语音播报模板
export const TTS_TEMPLATES = {
  WALLET_CREATED: '钱包创建成功，您的地址是 {address}',
  BALANCE_RESULT: '您的 {token} 余额是 {amount}',
  TRANSFER_CONFIRM: '请确认转账：发送 {amount} {token} 到地址 {to}',
  TRANSFER_SUCCESS: '转账已提交成功，正在等待网络确认',
  TRANSFER_FAILED: '转账失败：{error}',
  WAITING_FOR_COMMAND: '请说出您的指令',
  COMMAND_NOT_RECOGNIZED: '抱歉，我没有理解您的指令，请重新说一遍',
  PROCESSING: '正在处理您的请求，请稍候...'
}
