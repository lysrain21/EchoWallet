/**
 * Echo Wallet - Type Definitions
 * 为盲人用户设计的Web3钱包类型定义
 */

// UserOperation type is not exported from @account-abstraction/sdk, so we define it here based on ERC-4337 spec
export interface UserOperation {
  sender: string
  nonce: string
  initCode: string
  callData: string
  callGasLimit: string
  verificationGasLimit: string
  preVerificationGas: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  paymasterAndData: string
  signature: string
}

// 钱包相关类型
export interface WalletAccount {
  address: string
  privateKey: string
  mnemonic?: string
  isSmartWallet: boolean
  aaWalletAddress?: string
}

export interface WalletBalance {
  eth: string
  tokens: TokenBalance[]
}

export interface TokenBalance {
  symbol: string
  address: string
  balance: string
  decimals: number
  name: string
}

// 交易相关类型
export interface Transaction {
  hash: string
  to: string
  value: string
  gasPrice?: string
  gasLimit?: string
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  userOperation?: UserOperation
}

export interface TransferRequest {
  to: string
  amount: string
  token?: string // ETH 或代币地址
  tokenSymbol?: string
}

// 语音相关类型
export interface VoiceCommand {
  type: 'create_wallet' | 'transfer' | 'balance' | 'import_wallet' | 'transaction_status' | 'contacts' | 'switch_network' | 'text_input'
  parameters?: Record<string, any>
  confidence: number
}

export interface VoiceState {
  isListening: boolean
  isProcessing: boolean
  lastCommand?: VoiceCommand
  error?: string
}

// 应用状态类型
export interface AppState {
  wallet: WalletAccount | null
  balance: WalletBalance
  transactions: Transaction[]
  voice: VoiceState
  isLoading: boolean
  error: string | null
  network: 'mainnet' | 'sepolia' | 'polygon'
}

// ERC-4337 相关类型
export interface AAWalletConfig {
  bundlerUrl: string
  paymasterUrl: string
  entryPointAddress: string
  factoryAddress: string
}

export interface PaymasterResult {
  paymasterAndData: string
  preVerificationGas: string
  verificationGasLimit: string
  callGasLimit: string
}

// 语音识别配置
export interface SpeechConfig {
  language: 'zh-CN' | 'en-US'
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
}

// 可访问性配置
export interface AccessibilityConfig {
  announceActions: boolean
  verboseMode: boolean
  confirmTransactions: boolean
  readAddresses: boolean
}
