/**
 * Echo Wallet - Simplified wallet service
 * Implements core features with ethers.js v5 and integrates WebAuthn biometrics.
 */

import { ethers } from 'ethers'
import { WalletAccount, TransferRequest, Transaction } from '@/types'
import { WALLET_CONFIG } from '@/config'
import { webAuthnService } from './webAuthnService'
import { BiometricAvailability } from '@/types/webauthn'

// ERC20 ABI (transfer function)
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
]

class WalletService {
  private provider: ethers.providers.JsonRpcProvider | null = null
  private currentNetwork: 'mainnet' | 'sepolia' = 'sepolia'

  constructor() {
    this.initProvider()
  }

  /**
   * Initialize provider
   */
  private initProvider() {
    const networkConfig = WALLET_CONFIG.NETWORKS[this.currentNetwork]
    this.provider = new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl)
  }

  /**
   * Create a wallet with optional biometric storage
   */
  async createWallet(options?: {
    enableBiometric?: boolean
    walletName?: string
  }): Promise<WalletAccount> {
    try {
      console.log('🚀 Starting wallet creation...')
      
      // Generate mnemonic
      const wallet = ethers.Wallet.createRandom()
      
      // Verify wallet generation succeeded
      if (!wallet.address || !wallet.privateKey || !wallet.mnemonic) {
        throw new Error('Wallet creation failed: missing required information')
      }

      // Validate address format
      if (!ethers.utils.isAddress(wallet.address)) {
        throw new Error('Wallet creation failed: invalid address format')
      }

      const walletAccount: WalletAccount = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase,
        isSmartWallet: false, // temporary EOA wallet
        aaWalletAddress: undefined
      }

      // Detailed logging
      console.log('✅ Wallet created successfully!')
      console.log('📍 Wallet address:', wallet.address)
      console.log('🔑 Private key length:', wallet.privateKey.length, 'characters')
      console.log('📝 Mnemonic:', wallet.mnemonic?.phrase)
      console.log('🔢 Mnemonic word count:', wallet.mnemonic?.phrase.split(' ').length)
      
      // Verify mnemonic and private key alignment
      try {
        const recoveredWallet = ethers.Wallet.fromMnemonic(wallet.mnemonic?.phrase || '')
        if (recoveredWallet.address === wallet.address) {
          console.log('✅ Mnemonic verification succeeded: wallet can be recovered correctly')
        } else {
          console.error('❌ Mnemonic verification failed: recovered address does not match')
        }
      } catch (error) {
        console.error('❌ Mnemonic verification failed:', error)
      }

      // Save to WebAuthn when biometrics are enabled
      if (options?.enableBiometric) {
        console.log('🔐 Enabling biometric storage...')
        const biometricResult = await webAuthnService.registerCredentialAndSaveWallet(
          wallet.address,
          wallet.mnemonic?.phrase || '',
          options.walletName || 'My Wallet'
        )
        
        if (biometricResult.success) {
          console.log('✅ Biometric storage succeeded; wallet saved securely')
        } else {
          console.warn('⚠️ Biometric storage failed, but wallet creation succeeded:', biometricResult.error?.message)
        }
      }

      return walletAccount
    } catch (error) {
      console.error('❌ Wallet creation failed:', error)
      throw new Error('Wallet creation failed')
    }
  }

  /**
   * Import wallet from mnemonic
   */
  async importWallet(mnemonic: string): Promise<WalletAccount> {
    try {
      const wallet = ethers.Wallet.fromMnemonic(mnemonic)
      
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: mnemonic,
        isSmartWallet: false,
        aaWalletAddress: undefined
      }
    } catch (error) {
      console.error('Wallet import failed:', error)
      throw new Error('Wallet import failed')
    }
  }

  /**
   * Get ETH balance
   */
  async getETHBalance(address: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized')
    
    try {
      const balance = await this.provider.getBalance(address)
      return ethers.utils.formatEther(balance)
    } catch (error) {
      console.error('Failed to fetch ETH balance:', error)
      return '0'
    }
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized')
    
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
      const balance = await contract.balanceOf(walletAddress)
      const decimals = await contract.decimals()
      return ethers.utils.formatUnits(balance, decimals)
    } catch (error) {
      console.error('Failed to fetch token balance:', error)
      return '0'
    }
  }

  /**
   * Send ETH transfer (requires private key signature)
   */
  async transferETH(request: TransferRequest, privateKey: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized')
    
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider)
      
      const tx = await wallet.sendTransaction({
        to: request.to,
        value: ethers.utils.parseEther(request.amount)
      })

      return tx.hash
    } catch (error) {
      console.error('ETH transfer failed:', error)
      throw new Error('Transfer failed')
    }
  }

  /**
   * Send ERC20 token transfer
   */
  async transferToken(request: TransferRequest, privateKey: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized')
    if (!request.token) throw new Error('Token address not provided')
    
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider)
      const contract = new ethers.Contract(request.token, ERC20_ABI, wallet)
      
      // Fetch token decimals
      const decimals = await contract.decimals()
      
      const tx = await contract.transfer(
        request.to,
        ethers.utils.parseUnits(request.amount, decimals)
      )

      return tx.hash
    } catch (error) {
      console.error('Token transfer failed:', error)
      throw new Error('Token transfer failed')
    }
  }

  /**
   * Query transaction status
   */
  async getTransactionStatus(hash: string): Promise<Transaction | null> {
    if (!this.provider) throw new Error('Provider not initialized')
    
    try {
      const tx = await this.provider.getTransaction(hash)
      if (!tx) return null

      const receipt = await this.provider.getTransactionReceipt(hash)
      
      return {
        hash,
        to: tx.to || '',
        value: ethers.utils.formatEther(tx.value),
        gasPrice: tx.gasPrice ? ethers.utils.formatUnits(tx.gasPrice, 'gwei') : undefined,
        gasLimit: tx.gasLimit ? tx.gasLimit.toString() : undefined,
        timestamp: Date.now(),
        status: receipt ? (receipt.status === 1 ? 'confirmed' : 'failed') : 'pending'
      }
    } catch (error) {
      console.error('Failed to query transaction status:', error)
      return null
    }
  }

  /**
   * Switch network
   */
  async switchNetwork(network: 'mainnet' | 'sepolia') {
    this.currentNetwork = network
    this.initProvider()
  }

  /**
   * Validate address format
   */
  isValidAddress(address: string): boolean {
    return ethers.utils.isAddress(address)
  }

  /**
   * Format address for speech output
   */
  formatAddressForSpeech(address: string): string {
    if (!address) return ''
    // Simplified address speech: first 6 + last 4
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  /**
   * Get current network configuration
   */
  getCurrentNetwork() {
    return WALLET_CONFIG.NETWORKS[this.currentNetwork]
  }

  /**
   * Estimate gas costs
   */
  async estimateGas(request: TransferRequest): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized')
    
    try {
      let gasEstimate: ethers.BigNumber
      
      if (request.token) {
        // ERC20 token transfer
        const contract = new ethers.Contract(request.token, ERC20_ABI, this.provider)
        const decimals = await contract.decimals()
        gasEstimate = await contract.estimateGas.transfer(
          request.to,
          ethers.utils.parseUnits(request.amount, decimals)
        )
      } else {
        // ETH transfer
        gasEstimate = await this.provider.estimateGas({
          to: request.to,
          value: ethers.utils.parseEther(request.amount)
        })
      }
      
      const gasPrice = await this.provider.getGasPrice()
      const totalGas = gasEstimate.mul(gasPrice)
      
      return ethers.utils.formatEther(totalGas)
    } catch (error) {
      console.error('Failed to estimate gas:', error)
      return '0.001' // default value
    }
  }

  /**
   * Validate wallet completeness and correctness
   */
  validateWallet(wallet: WalletAccount): boolean {
    try {
      console.log('🔍 Starting wallet validation...')
      
      // Check required fields
      if (!wallet.address || !wallet.privateKey) {
        console.error('❌ Wallet is missing required information')
        return false
      }

      // Validate address format
      if (!ethers.utils.isAddress(wallet.address)) {
        console.error('❌ Wallet address format is invalid:', wallet.address)
        return false
      }

      // Validate private key format
      if (!wallet.privateKey.startsWith('0x') || wallet.privateKey.length !== 66) {
        console.error('❌ Private key format is invalid')
        return false
      }

      // Validate private key and address match
      try {
        const walletFromPrivateKey = new ethers.Wallet(wallet.privateKey)
        if (walletFromPrivateKey.address !== wallet.address) {
          console.error('❌ Private key does not match address')
          return false
        }
      } catch (error) {
        console.error('❌ Invalid private key:', error)
        return false
      }

      // Validate mnemonic (if present)
      if (wallet.mnemonic) {
        try {
          const walletFromMnemonic = ethers.Wallet.fromMnemonic(wallet.mnemonic)
          if (walletFromMnemonic.address !== wallet.address) {
            console.error('❌ Mnemonic does not match address')
            return false
          }
          
          // Check mnemonic word count
          const words = wallet.mnemonic.split(' ')
          if (words.length !== 12 && words.length !== 24) {
            console.error('❌ Unexpected mnemonic word count:', words.length)
            return false
          }
          
        } catch (error) {
          console.error('❌ Invalid mnemonic:', error)
          return false
        }
      }

      console.log('✅ Wallet validation succeeded!')
      return true
    } catch (error) {
      console.error('❌ Error occurred during wallet validation:', error)
      return false
    }
  }

  /**
   * Test wallet connectivity (balance query)
   */
  async testWalletConnection(address: string): Promise<boolean> {
    try {
      console.log('🌐 Testing wallet connectivity...')
      
      if (!this.provider) {
        console.error('❌ Network provider not initialized')
        return false
      }

      // Attempt to fetch the balance
      const balance = await this.provider.getBalance(address)
      console.log('✅ Network connection succeeded, balance:', ethers.utils.formatEther(balance), 'ETH')
      
      // Attempt to fetch the nonce
      const nonce = await this.provider.getTransactionCount(address)
      console.log('✅ Account nonce:', nonce)
      
      return true
    } catch (error) {
      console.error('❌ Wallet connectivity test failed:', error)
      return false
    }
  }

  /**
   * Complete wallet creation and verification flow (with biometrics)
   */
  async createAndVerifyWallet(): Promise<WalletAccount> {
    // First check biometric availability
    const biometricAvailability = await this.checkBiometricAvailability()
    const enableBiometric = biometricAvailability.isSupported && biometricAvailability.isAvailable
    
    if (enableBiometric) {
      console.log('🔐 Biometrics detected; enabling secure storage')
    } else {
      console.log('⚠️ Biometrics unavailable; using standard creation mode')
    }
    
    // Create wallet and enable biometric storage
    const wallet = await this.createWallet({
      enableBiometric,
      walletName: `Wallet ${new Date().toLocaleString()}`
    })
    
    // Validate wallet information
    if (!this.validateWallet(wallet)) {
      throw new Error('Wallet validation failed')
    }
    
    // Test network connection
    const isConnected = await this.testWalletConnection(wallet.address)
    if (!isConnected) {
      console.warn('⚠️ Network test failed, but wallet creation succeeded')
    }
    
    return wallet
  }

  /**
   * Recover wallet via biometrics
   */
  async recoverWalletWithBiometric(): Promise<{
    success: boolean
    wallets?: WalletAccount[]
    error?: string
  }> {
    try {
      console.log('🔐 Starting biometric wallet recovery...')
      
      // Check biometric availability
      const availability = await webAuthnService.checkBiometricAvailability()
      if (!availability.isAvailable) {
        return {
          success: false,
          error: 'Biometrics unavailable. Check device settings.'
        }
      }

      // Run biometric verification and wallet recovery
      const recoveryResult = await webAuthnService.authenticateAndRecoverWallet()
      
      if (!recoveryResult.success || !recoveryResult.wallets) {
        return {
          success: false,
          error: recoveryResult.error?.message || 'Wallet recovery failed'
        }
      }

      // Convert recovered wallet data into WalletAccount format
      const walletAccounts: WalletAccount[] = []
      
      for (const recoveredWallet of recoveryResult.wallets) {
        try {
          // Recover wallet from mnemonic
          const wallet = ethers.Wallet.fromMnemonic(recoveredWallet.mnemonic)
          
          // Verify that the address matches
          if (wallet.address.toLowerCase() !== recoveredWallet.walletAddress.toLowerCase()) {
            console.warn('⚠️ Address mismatch; skipping wallet:', recoveredWallet.walletAddress)
            continue
          }

          const walletAccount: WalletAccount = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: recoveredWallet.mnemonic,
            isSmartWallet: false,
            aaWalletAddress: undefined
          }

          walletAccounts.push(walletAccount)
          
          console.log('✅ Wallet recovery succeeded:', wallet.address)
        } catch (error) {
          console.error('❌ Wallet recovery failed:', recoveredWallet.walletAddress, error)
        }
      }

      if (walletAccounts.length === 0) {
        return {
          success: false,
          error: 'No wallets were successfully recovered'
        }
      }

      console.log(`✅ Total wallets recovered ${walletAccounts.length} wallets`)
      
      return {
        success: true,
        wallets: walletAccounts
      }
    } catch (error) {
      console.error('❌ Biometric wallet recovery failed:', error)
      return {
        success: false,
        error: 'Biometric wallet recovery failed'
      }
    }
  }

  /**
   * Check biometric availability
   */
  async checkBiometricAvailability(): Promise<BiometricAvailability> {
    return await webAuthnService.checkBiometricAvailability()
  }

  /**
   * Get wallet recovery status
   */
  async getWalletRecoveryState() {
    return await webAuthnService.getWalletRecoveryState()
  }

  /**
   * Remove stored biometric credentials
   */
  async removeBiometricCredential(credentialId: string): Promise<boolean> {
    return await webAuthnService.removeStoredCredential(credentialId)
  }
}

// Singleton instance
export const walletService = new WalletService()
