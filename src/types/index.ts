/**
 * Echo Wallet - Type Definitions
 * Shared types for the voice-first Web3 wallet.
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

// Wallet types
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

// Transaction types
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
  token?: string
  tokenSymbol?: string
}

// Voice-related types
export interface VoiceCommand {
  type: 'create_wallet' | 'transfer' | 'balance' | 'import_wallet' | 'transaction_status' | 'contacts' | 'switch_network' | 'read_address' | 'text_input'
  parameters?: Record<string, unknown>
  confidence: number
}

export interface VoiceState {
  isListening: boolean
  isProcessing: boolean
  lastCommand?: VoiceCommand
  error?: string
}

// Transfer state for step-by-step flow
export interface TransferState {
  isActive: boolean;
  step: 'idle' | 'recipient' | 'amount' | 'token' | 'confirm';
  recipient: {
    type: 'contact' | 'address';
    value: string;
    displayName?: string;
  } | null;
  amount: string;
  token: string;
}

// Application state types
export interface AppState {
  wallet: WalletAccount | null
  balance: WalletBalance
  transactions: Transaction[]
  voice: VoiceState
  transfer: TransferState;
  isLoading: boolean
  error: string | null
  sharedAddress: string | null
  network: 'mainnet' | 'sepolia' | 'polygon'
}

// ERC-4337 related types
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

// Speech recognition configuration
export interface SpeechConfig {
  language: 'zh-CN' | 'en-US'
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
}

// Accessibility configuration
export interface AccessibilityConfig {
  announceActions: boolean
  verboseMode: boolean
  confirmTransactions: boolean
  readAddresses: boolean
}
