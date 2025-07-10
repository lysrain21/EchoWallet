/**
 * Echo Wallet - 简化版钱包服务
 * 使用ethers.js v5实现基础功能，集成WebAuthn生物识别
 */

import { ethers } from 'ethers'
import { WalletAccount, TransferRequest, Transaction } from '@/types'
import { WALLET_CONFIG } from '@/config'
import { webAuthnService } from './webAuthnService'
import { WalletRecoveryInfo, BiometricAvailability } from '@/types/webauthn'

// ERC20 ABI (转账函数)
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
   * 初始化提供者
   */
  private initProvider() {
    const networkConfig = WALLET_CONFIG.NETWORKS[this.currentNetwork]
    this.provider = new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl)
  }

  /**
   * 创建新钱包（带生物识别保存选项）
   */
  async createWallet(options?: {
    enableBiometric?: boolean
    walletName?: string
  }): Promise<WalletAccount> {
    try {
      console.log('🚀 开始创建新钱包...')
      
      // 生成助记词
      const wallet = ethers.Wallet.createRandom()
      
      // 验证钱包生成是否成功
      if (!wallet.address || !wallet.privateKey || !wallet.mnemonic) {
        throw new Error('钱包生成失败：缺少必要信息')
      }

      // 验证地址格式
      if (!ethers.utils.isAddress(wallet.address)) {
        throw new Error('钱包生成失败：地址格式无效')
      }

      const walletAccount: WalletAccount = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase,
        isSmartWallet: false, // 暂时使用EOA钱包
        aaWalletAddress: undefined
      }

      // 详细日志输出
      console.log('✅ 钱包创建成功！')
      console.log('📍 钱包地址:', wallet.address)
      console.log('🔑 私钥长度:', wallet.privateKey.length, '字符')
      console.log('📝 助记词:', wallet.mnemonic?.phrase)
      console.log('🔢 助记词单词数:', wallet.mnemonic?.phrase.split(' ').length)
      
      // 验证助记词和私钥的对应关系
      try {
        const recoveredWallet = ethers.Wallet.fromMnemonic(wallet.mnemonic?.phrase || '')
        if (recoveredWallet.address === wallet.address) {
          console.log('✅ 助记词验证成功：可以正确恢复钱包')
        } else {
          console.error('❌ 助记词验证失败：恢复的地址不匹配')
        }
      } catch (error) {
        console.error('❌ 助记词验证失败:', error)
      }

      // 如果启用了生物识别，保存到WebAuthn
      if (options?.enableBiometric) {
        console.log('🔐 启用生物识别保存...')
        const biometricResult = await webAuthnService.registerCredentialAndSaveWallet(
          wallet.address,
          wallet.mnemonic?.phrase || '',
          options.walletName || 'My Wallet'
        )
        
        if (biometricResult.success) {
          console.log('✅ 生物识别保存成功，钱包已安全存储')
        } else {
          console.warn('⚠️ 生物识别保存失败，但钱包创建成功:', biometricResult.error?.message)
        }
      }

      return walletAccount
    } catch (error) {
      console.error('❌ 创建钱包失败:', error)
      throw new Error('钱包创建失败')
    }
  }

  /**
   * 从助记词导入钱包
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
      console.error('导入钱包失败:', error)
      throw new Error('钱包导入失败')
    }
  }

  /**
   * 获取ETH余额
   */
  async getETHBalance(address: string): Promise<string> {
    if (!this.provider) throw new Error('Provider 未初始化')
    
    try {
      const balance = await this.provider.getBalance(address)
      return ethers.utils.formatEther(balance)
    } catch (error) {
      console.error('获取ETH余额失败:', error)
      return '0'
    }
  }

  /**
   * 获取ERC20代币余额
   */
  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    if (!this.provider) throw new Error('Provider 未初始化')
    
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
      const balance = await contract.balanceOf(walletAddress)
      const decimals = await contract.decimals()
      return ethers.utils.formatUnits(balance, decimals)
    } catch (error) {
      console.error('获取代币余额失败:', error)
      return '0'
    }
  }

  /**
   * 发送ETH转账（需要私钥签名）
   */
  async transferETH(request: TransferRequest, privateKey: string): Promise<string> {
    if (!this.provider) throw new Error('Provider 未初始化')
    
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider)
      
      const tx = await wallet.sendTransaction({
        to: request.to,
        value: ethers.utils.parseEther(request.amount)
      })

      return tx.hash
    } catch (error) {
      console.error('ETH转账失败:', error)
      throw new Error('转账失败')
    }
  }

  /**
   * 发送ERC20代币转账
   */
  async transferToken(request: TransferRequest, privateKey: string): Promise<string> {
    if (!this.provider) throw new Error('Provider 未初始化')
    if (!request.token) throw new Error('代币地址未提供')
    
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider)
      const contract = new ethers.Contract(request.token, ERC20_ABI, wallet)
      
      // 获取代币精度
      const decimals = await contract.decimals()
      
      const tx = await contract.transfer(
        request.to,
        ethers.utils.parseUnits(request.amount, decimals)
      )

      return tx.hash
    } catch (error) {
      console.error('代币转账失败:', error)
      throw new Error('代币转账失败')
    }
  }

  /**
   * 查询交易状态
   */
  async getTransactionStatus(hash: string): Promise<Transaction | null> {
    if (!this.provider) throw new Error('Provider 未初始化')
    
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
      console.error('查询交易状态失败:', error)
      return null
    }
  }

  /**
   * 切换网络
   */
  async switchNetwork(network: 'mainnet' | 'sepolia') {
    this.currentNetwork = network
    this.initProvider()
  }

  /**
   * 验证地址格式
   */
  isValidAddress(address: string): boolean {
    return ethers.utils.isAddress(address)
  }

  /**
   * 格式化地址显示（用于语音播报）
   */
  formatAddressForSpeech(address: string): string {
    if (!address) return ''
    // 简化地址播报：前6位 + 后4位
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  /**
   * 获取当前网络配置
   */
  getCurrentNetwork() {
    return WALLET_CONFIG.NETWORKS[this.currentNetwork]
  }

  /**
   * 估算gas费用
   */
  async estimateGas(request: TransferRequest): Promise<string> {
    if (!this.provider) throw new Error('Provider 未初始化')
    
    try {
      let gasEstimate: ethers.BigNumber
      
      if (request.token) {
        // ERC20代币转账
        const contract = new ethers.Contract(request.token, ERC20_ABI, this.provider)
        const decimals = await contract.decimals()
        gasEstimate = await contract.estimateGas.transfer(
          request.to,
          ethers.utils.parseUnits(request.amount, decimals)
        )
      } else {
        // ETH转账
        gasEstimate = await this.provider.estimateGas({
          to: request.to,
          value: ethers.utils.parseEther(request.amount)
        })
      }
      
      const gasPrice = await this.provider.getGasPrice()
      const totalGas = gasEstimate.mul(gasPrice)
      
      return ethers.utils.formatEther(totalGas)
    } catch (error) {
      console.error('估算gas失败:', error)
      return '0.001' // 默认值
    }
  }

  /**
   * 验证钱包信息的完整性和正确性
   */
  validateWallet(wallet: WalletAccount): boolean {
    try {
      console.log('🔍 开始验证钱包信息...')
      
      // 检查必要字段
      if (!wallet.address || !wallet.privateKey) {
        console.error('❌ 钱包缺少必要信息')
        return false
      }

      // 验证地址格式
      if (!ethers.utils.isAddress(wallet.address)) {
        console.error('❌ 钱包地址格式无效:', wallet.address)
        return false
      }

      // 验证私钥格式
      if (!wallet.privateKey.startsWith('0x') || wallet.privateKey.length !== 66) {
        console.error('❌ 私钥格式无效')
        return false
      }

      // 验证私钥和地址的对应关系
      try {
        const walletFromPrivateKey = new ethers.Wallet(wallet.privateKey)
        if (walletFromPrivateKey.address !== wallet.address) {
          console.error('❌ 私钥和地址不匹配')
          return false
        }
      } catch (error) {
        console.error('❌ 私钥无效:', error)
        return false
      }

      // 验证助记词（如果存在）
      if (wallet.mnemonic) {
        try {
          const walletFromMnemonic = ethers.Wallet.fromMnemonic(wallet.mnemonic)
          if (walletFromMnemonic.address !== wallet.address) {
            console.error('❌ 助记词和地址不匹配')
            return false
          }
          
          // 检查助记词单词数量
          const words = wallet.mnemonic.split(' ')
          if (words.length !== 12 && words.length !== 24) {
            console.error('❌ 助记词单词数量异常:', words.length)
            return false
          }
          
        } catch (error) {
          console.error('❌ 助记词无效:', error)
          return false
        }
      }

      console.log('✅ 钱包验证通过！')
      return true
    } catch (error) {
      console.error('❌ 钱包验证过程中出现错误:', error)
      return false
    }
  }

  /**
   * 测试钱包连接性（检查是否能查询余额）
   */
  async testWalletConnection(address: string): Promise<boolean> {
    try {
      console.log('🌐 测试钱包连接性...')
      
      if (!this.provider) {
        console.error('❌ 网络提供者未初始化')
        return false
      }

      // 尝试查询余额
      const balance = await this.provider.getBalance(address)
      console.log('✅ 网络连接成功，余额:', ethers.utils.formatEther(balance), 'ETH')
      
      // 尝试查询nonce
      const nonce = await this.provider.getTransactionCount(address)
      console.log('✅ 账户nonce:', nonce)
      
      return true
    } catch (error) {
      console.error('❌ 钱包连接测试失败:', error)
      return false
    }
  }

  /**
   * 完整的钱包创建和验证流程（带生物识别保存）
   */
  async createAndVerifyWallet(): Promise<WalletAccount> {
    // 首先检查生物识别可用性
    const biometricAvailability = await this.checkBiometricAvailability()
    const enableBiometric = biometricAvailability.isSupported && biometricAvailability.isAvailable
    
    if (enableBiometric) {
      console.log('🔐 检测到生物识别功能，将启用安全保存')
    } else {
      console.log('⚠️ 生物识别功能不可用，使用常规创建模式')
    }
    
    // 创建钱包并启用生物识别保存
    const wallet = await this.createWallet({
      enableBiometric,
      walletName: `钱包 ${new Date().toLocaleString()}`
    })
    
    // 验证钱包信息
    if (!this.validateWallet(wallet)) {
      throw new Error('钱包验证失败')
    }
    
    // 测试网络连接
    const isConnected = await this.testWalletConnection(wallet.address)
    if (!isConnected) {
      console.warn('⚠️ 网络连接测试失败，但钱包创建成功')
    }
    
    return wallet
  }

  /**
   * 通过生物识别恢复钱包
   */
  async recoverWalletWithBiometric(): Promise<{
    success: boolean
    wallets?: WalletAccount[]
    error?: string
  }> {
    try {
      console.log('🔐 开始生物识别钱包恢复...')
      
      // 检查生物识别可用性
      const availability = await webAuthnService.checkBiometricAvailability()
      if (!availability.isAvailable) {
        return {
          success: false,
          error: '生物识别功能不可用，请检查设备设置'
        }
      }

      // 执行生物识别验证和钱包恢复
      const recoveryResult = await webAuthnService.authenticateAndRecoverWallet()
      
      if (!recoveryResult.success || !recoveryResult.wallets) {
        return {
          success: false,
          error: recoveryResult.error?.message || '钱包恢复失败'
        }
      }

      // 将恢复的钱包信息转换为WalletAccount格式
      const walletAccounts: WalletAccount[] = []
      
      for (const recoveredWallet of recoveryResult.wallets) {
        try {
          // 从助记词恢复钱包
          const wallet = ethers.Wallet.fromMnemonic(recoveredWallet.mnemonic)
          
          // 验证地址是否匹配
          if (wallet.address.toLowerCase() !== recoveredWallet.walletAddress.toLowerCase()) {
            console.warn('⚠️ 地址不匹配，跳过此钱包:', recoveredWallet.walletAddress)
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
          
          console.log('✅ 钱包恢复成功:', wallet.address)
        } catch (error) {
          console.error('❌ 钱包恢复失败:', recoveredWallet.walletAddress, error)
        }
      }

      if (walletAccounts.length === 0) {
        return {
          success: false,
          error: '没有成功恢复任何钱包'
        }
      }

      console.log(`✅ 总共恢复 ${walletAccounts.length} 个钱包`)
      
      return {
        success: true,
        wallets: walletAccounts
      }
    } catch (error) {
      console.error('❌ 生物识别钱包恢复失败:', error)
      return {
        success: false,
        error: '生物识别钱包恢复失败'
      }
    }
  }

  /**
   * 检查生物识别可用性
   */
  async checkBiometricAvailability(): Promise<BiometricAvailability> {
    return await webAuthnService.checkBiometricAvailability()
  }

  /**
   * 获取钱包恢复状态
   */
  async getWalletRecoveryState() {
    return await webAuthnService.getWalletRecoveryState()
  }

  /**
   * 删除存储的生物识别凭证
   */
  async removeBiometricCredential(credentialId: string): Promise<boolean> {
    return await webAuthnService.removeStoredCredential(credentialId)
  }
}

// 单例实例
export const walletService = new WalletService()
