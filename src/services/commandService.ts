/**
 * Echo Wallet - 语音命令处理服务
 * 协调语音识别和钱包操作
 */

import { VoiceCommand, TransferRequest } from '@/types'
import { voiceService } from './voiceService'
import { walletService } from './walletService'
import { useWalletStore } from '@/store'
import { TTS_TEMPLATES } from '@/config'
import { contactsService } from './contactsService'
import { VoiceRecognitionOptimizer } from './voiceOptimizer'

class CommandService {
  private isProcessing = false
  // 分步转账状态管理 - 简化版，移除代币选择步骤
  private transferSteps = {
    isActive: false,
    step: 'idle' as 'idle' | 'recipient' | 'amount' | 'confirm',
    recipient: null as { type: 'contact' | 'address', value: string, displayName?: string } | null,
    amount: '',
    attempts: 0,
    maxAttempts: 3
  }

  /**
   * 开始语音监听
   */
  startListening() {
    const { setVoiceState } = useWalletStore.getState()
    
    if (this.isProcessing) {
      voiceService.speak('系统正在处理中，请稍候')
      return
    }

    setVoiceState({ isListening: true })
    voiceService.speak('请说出您的指令')

    voiceService.startListening(
      (command) => this.handleCommand(command),
      (error) => {
        setVoiceState({ isListening: false, error })
        
        // 对于"没有检测到语音"的错误，提供更友好的处理
        if (error.includes('没有检测到语音')) {
          // voiceService 已经处理了语音播报，这里只需要重新启动监听
          setTimeout(() => {
            if (!this.isProcessing) {
              this.startListening()
            }
          }, 2000)
        } else {
          // 其他错误直接播报
          voiceService.speak(error)
        }
      }
    )
  }

  /**
   * 停止语音监听
   */
  stopListening() {
    const { setVoiceState } = useWalletStore.getState()
    voiceService.stopListening()
    setVoiceState({ isListening: false })
  }

  /**
   * 处理语音命令
   */
  private async handleCommand(command: VoiceCommand) {
    const { setVoiceState, setLoading, setError } = useWalletStore.getState()
    
    try {
      this.isProcessing = true
      setVoiceState({ isProcessing: true, lastCommand: command })
      setLoading(true)

      voiceService.speak('正在处理您的请求...')

      switch (command.type) {
        case 'create_wallet':
          await this.handleCreateWallet()
          break
        
        case 'import_wallet':
          await this.handleImportWallet()
          break
        
        case 'balance':
          await this.handleCheckBalance()
          break
        
        case 'transfer':
          // 检查是否已在转账流程中
          if (this.transferSteps.isActive) {
            await this.handleTransferStepInput(command.parameters?.text || '')
          } else {
            // 检查是否为完整的转账命令
            if (command.parameters?.isComplete) {
              // 完整转账命令，使用优化的处理流程
              await this.handleCompleteTransferCommand(command.parameters)
            } else {
              // 简单转账命令（如"转账"），开始分步流程
              await this.startStepByStepTransferFlow()
            }
          }
          break

        case 'contacts':
          await this.handleContactCommand(command.parameters?.text || '')
          break

        case 'text_input':
          // 处理转账流程中的文本输入
          if (this.transferSteps.isActive) {
            await this.handleTransferStepInput(command.parameters?.text || '')
          } else {
            voiceService.speak('抱歉，我不理解这个命令')
          }
          break

        case 'switch_network':
          const text = command.parameters?.text || ''
          const network = text.includes('主网') ? 'mainnet' : 'sepolia'
          await walletService.switchNetwork(network)
          voiceService.speak(`已切换到${network === 'mainnet' ? '主网' : '测试网'}`)
          break
        
        case 'transaction_status':
          await this.handleTransactionStatus(command.parameters?.hash)
          break
        
        default:
          voiceService.speak('抱歉，我不理解这个命令')
      }

    } catch (error) {
      console.error('命令处理失败:', error)
      setError(error instanceof Error ? error.message : '未知错误')
      voiceService.speak(`操作失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      this.isProcessing = false
      setVoiceState({ isProcessing: false, isListening: false })
      setLoading(false)
    }
  }

  /**
   * 处理创建钱包命令
   */
  private async handleCreateWallet() {
    const { setWallet } = useWalletStore.getState()
    
    try {
      console.log('🎤 用户请求创建钱包')
      
      // 首先检查生物识别可用性并告知用户
      const biometricAvailability = await walletService.checkBiometricAvailability()
      
      if (biometricAvailability.isSupported && biometricAvailability.isAvailable) {
        voiceService.speak('检测到生物识别功能，将在创建钱包后自动保存到您的设备')
      }
      
      // 使用增强的钱包创建方法
      const wallet = await walletService.createAndVerifyWallet()
      setWallet(wallet)
      
      console.log('💾 钱包已保存到状态管理')
      
      if (wallet.mnemonic) {
        voiceService.speak('钱包创建成功。助记词已生成并显示在界面上，请妥善保存。')
        
        // 检查是否成功保存到生物识别
        if (biometricAvailability.isSupported && biometricAvailability.isAvailable) {
          setTimeout(() => {
            voiceService.speak('钱包已通过生物识别安全保存到您的设备。下次访问时，您可以说"导入钱包"并使用生物识别快速恢复。')
          }, 3000)
        }
        
        setTimeout(() => {
          voiceService.speakTemplate('WALLET_CREATED', {
            address: walletService.formatAddressForSpeech(wallet.address)
          })
          
          // 播报验证信息
          voiceService.speak('钱包验证完成，所有信息正确。请在浏览器控制台查看详细信息。')
        }, 2000)
      }
      
      // 同时更新余额
      await this.updateBalance(wallet.address)
      
    } catch (error) {
      console.error('❌ 钱包创建失败:', error)
      throw error
    }
  }

  /**
   * 处理导入钱包命令 - 仅使用生物识别
   */
  private async handleImportWallet() {
    const { setWallet } = useWalletStore.getState()
    
    try {
      // 检查生物识别可用性
      const biometricAvailability = await walletService.checkBiometricAvailability()
      
      if (!biometricAvailability.isSupported || !biometricAvailability.isAvailable) {
        voiceService.speak('您的设备不支持生物识别功能，无法导入钱包。请先在支持生物识别的设备上创建钱包。')
        return
      }
      
      // 检查是否有已保存的钱包
      const recoveryState = await walletService.getWalletRecoveryState()
      
      if (!recoveryState.hasStoredCredentials) {
        voiceService.speak('未找到已保存的钱包。请先创建钱包，系统会自动保存到您的设备。')
        return
      }
      
      // 开始生物识别恢复
      console.log('🔐 开始生物识别钱包恢复...')
      voiceService.speak('请使用生物识别验证您的身份以恢复钱包')
      
      const recoveryResult = await walletService.recoverWalletWithBiometric()
      
      if (recoveryResult.success && recoveryResult.wallets && recoveryResult.wallets.length > 0) {
        // 生物识别恢复成功
        const wallet = recoveryResult.wallets[0] // 使用第一个钱包
        setWallet(wallet)
        
        voiceService.speak('生物识别验证成功，钱包已恢复')
        console.log('✅ 通过生物识别成功恢复钱包:', wallet.address)
        
        // 更新余额
        await this.updateBalance(wallet.address)
        
        setTimeout(() => {
          voiceService.speakTemplate('WALLET_CREATED', {
            address: walletService.formatAddressForSpeech(wallet.address)
          })
        }, 2000)
        
      } else {
        // 生物识别恢复失败
        const errorMessage = recoveryResult.error || '生物识别验证失败'
        voiceService.speak(`钱包恢复失败：${errorMessage}`)
        console.error('❌ 生物识别钱包恢复失败:', recoveryResult.error)
      }
      
    } catch (error) {
      console.error('❌ 导入钱包失败:', error)
      voiceService.speak('钱包导入过程中出现错误，请重试')
    }
  }

  /**
   * 处理查询余额命令
   */
  private async handleCheckBalance() {
    const { wallet } = useWalletStore.getState()
    
    if (!wallet) {
      voiceService.speak('请先创建或导入钱包')
      return
    }

    await this.updateBalance(wallet.address)
    
    const { balance } = useWalletStore.getState()
    
    // 播报ETH余额
    voiceService.speakTemplate('BALANCE_RESULT', {
      token: 'ETH',
      amount: parseFloat(balance.eth).toFixed(4)
    })
    
    // 播报代币余额
    if (balance.tokens.length > 0) {
      setTimeout(() => {
        balance.tokens.forEach((token, index) => {
          setTimeout(() => {
            voiceService.speakTemplate('BALANCE_RESULT', {
              token: token.symbol,
              amount: parseFloat(token.balance).toFixed(4)
            })
          }, index * 2000)
        })
      }, 2000)
    }
  }

  /**
   * 处理转账命令
   */
  private async handleTransfer(params: any) {
    const { wallet } = useWalletStore.getState()
    
    if (!wallet) {
      voiceService.speak('请先创建或导入钱包')
      return
    }

    if (!params || !params.amount || !params.to) {
      voiceService.speak('转账信息不完整，请重新说明金额和收款地址')
      return
    }

    // 验证地址格式
    if (!walletService.isValidAddress(params.to)) {
      voiceService.speak('收款地址格式错误，请检查')
      return
    }

    const transferRequest: TransferRequest = {
      to: params.to,
      amount: params.amount,
      token: params.token === 'eth' ? undefined : params.token,
      tokenSymbol: params.token
    }

    // 语音确认
    const tokenName = params.token || 'ETH'
    const addressForSpeech = walletService.formatAddressForSpeech(params.to)
    
    voiceService.speakTemplate('TRANSFER_CONFIRM', {
      amount: params.amount,
      token: tokenName,
      to: addressForSpeech
    })

    // 等待用户确认
    setTimeout(() => {
      voiceService.speak('请说"确认"来完成转账，或说"取消"来取消操作')
      
      voiceService.startListening(
        async (confirmCommand) => {
          const text = confirmCommand.parameters?.text || ''
          if (text.includes('确认') || text.includes('confirm')) {
            await this.executeTransfer(transferRequest, wallet.privateKey)
          } else {
            voiceService.speak('转账已取消')
          }
        },
        () => voiceService.speak('确认失败，转账已取消')
      )
    }, 3000)
  }

  /**
   * 执行转账 - 简化版，只支持ETH
   */
  private async executeTransfer(request: TransferRequest, privateKey: string) {
    const { addTransaction } = useWalletStore.getState()
    
    console.log('🔄 开始执行ETH转账')
    console.log('📋 转账请求详情:', request)
    
    try {
      // 只处理ETH转账
      console.log('🌐 调用 walletService.transferETH...')
      const txHash = await walletService.transferETH(request, privateKey)
      console.log('✅ 转账成功，交易哈希:', txHash)

      // 添加交易记录
      const transaction = {
        hash: txHash,
        to: request.to,
        value: request.amount,
        timestamp: Date.now(),
        status: 'pending' as const
      }
      
      addTransaction(transaction)
      console.log('📝 交易记录已添加到状态管理')
      
      voiceService.speakTemplate('TRANSFER_SUCCESS', { hash: txHash })
      
      // 更新余额
      setTimeout(() => {
        const { wallet } = useWalletStore.getState()
        if (wallet) {
          console.log('🔄 5秒后更新余额...')
          this.updateBalance(wallet.address)
        }
      }, 5000)
      
    } catch (error) {
      console.error('❌ 转账执行失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      voiceService.speakTemplate('TRANSFER_FAILED', { error: errorMessage })
      throw error // 重新抛出错误，让上层处理
    }
  }

  /**
   * 处理交易状态查询
   */
  private async handleTransactionStatus(hash?: string) {
    if (!hash) {
      voiceService.speak('请提供交易哈希地址')
      return
    }

    const transaction = await walletService.getTransactionStatus(hash)
    
    if (!transaction) {
      voiceService.speak('未找到该交易')
      return
    }

    const statusText = transaction.status === 'confirmed' ? '已确认' : 
                      transaction.status === 'failed' ? '失败' : '待确认'
    
    voiceService.speak(`交易状态：${statusText}，金额：${transaction.value} ETH`)
  }

  /**
   * 更新钱包余额
   */
  private async updateBalance(address: string) {
    const { updateBalance } = useWalletStore.getState()
    
    try {
      const ethBalance = await walletService.getETHBalance(address)
      
      // 获取代币余额
      const tokens: any[] = []
      const networkConfig = walletService.getCurrentNetwork()
      // 这里可以根据网络配置获取默认代币余额
      
      updateBalance({
        eth: ethBalance,
        tokens
      })
      
    } catch (error) {
      console.error('更新余额失败:', error)
    }
  }

  /**
   * 从语音命令中提取助记词
   */
  private extractMnemonic(command: VoiceCommand): string | null {
    // 这里需要实现从语音识别结果中提取12个助记词的逻辑
    // 暂时返回null，实际实现需要根据语音识别结果解析
    return null
  }

  /**
   * 解析转账命令 - 使用优化解析器
   */
  private parseTransferCommand(text: string) {
    console.log('🔍 开始解析转账命令:', text)
    
    // 使用优化的解析器
    const result = VoiceRecognitionOptimizer.parseTransferCommand(text)
    
    if (result) {
      // 验证金额格式
      const amountValidation = VoiceRecognitionOptimizer.validateAmount(result.amount)
      
      if (!amountValidation.isValid) {
        voiceService.speak(amountValidation.message)
        return null
      }
      
      // 更新为修正后的金额
      result.amount = amountValidation.corrected
      
      console.log('✅ 转账命令解析成功:', result)
      return result
    }
    
    console.log('❌ 转账命令解析失败')
    return null
  }

  /**
   * 处理转账命令 - 优化版
   */
  private async handleTransferOptimized(params: any) {
    const { wallet } = useWalletStore.getState()
    
    if (!wallet) {
      voiceService.speak('请先创建或导入钱包')
      return
    }

    if (!params || !params.amount) {
      voiceService.speak('请说明转账金额')
      return
    }

    let targetAddress: string | undefined
    let contactName: string | undefined

    // 根据不同类型处理
    switch (params.type) {
      case 'contact':
        const contact = contactsService.findContact(params.contactName)
        if (!contact) {
          voiceService.speak(`未找到联系人 ${params.contactName}，请在网页界面添加此联系人`)
          return
        }
        targetAddress = contact.address
        contactName = contact.name
        contactsService.markContactUsed(contact.id)
        break

      case 'quick':
        const recentContacts = contactsService.getFrequentContacts(1)
        if (recentContacts.length === 0) {
          voiceService.speak('没有最近使用的联系人，请在网页界面添加联系人')
          return
        }
        targetAddress = recentContacts[0].address
        contactName = recentContacts[0].name
        contactsService.markContactUsed(recentContacts[0].id)
        break

      case 'address':
        if (!walletService.isValidAddress(params.to)) {
          voiceService.speak('收款地址格式错误，请检查')
          return
        }
        targetAddress = params.to
        break

      default:
        voiceService.speak('转账信息不完整，请重新说明')
        return
    }

    // 构建转账请求
    const transferRequest: TransferRequest = {
      to: targetAddress!,
      amount: params.amount,
      token: params.token === 'eth' ? undefined : params.token,
      tokenSymbol: params.token
    }

    // 语音确认 - 使用联系人名称或简化地址
    const tokenName = params.token || 'ETH'
    const recipientInfo = contactName || walletService.formatAddressForSpeech(targetAddress!)
    
    voiceService.speakTemplate('TRANSFER_CONFIRM', {
      amount: params.amount,
      token: tokenName,
      to: recipientInfo
    })

    // 等待用户确认
    this.waitForTransferConfirmation(transferRequest, wallet.privateKey)
  }

  /**
   * 等待转账确认
   */
  private waitForTransferConfirmation(request: TransferRequest, privateKey: string) {
    setTimeout(() => {
      voiceService.speak('请说"确认"来完成转账，或说"取消"来取消操作')
      
      voiceService.startListening(
        async (confirmCommand) => {
          const text = confirmCommand.parameters?.text || ''
          if (text.includes('确认') || text.includes('confirm') || text.includes('是的')) {
            await this.executeTransfer(request, privateKey)
          } else if (text.includes('取消') || text.includes('不') || text.includes('cancel')) {
            voiceService.speak('转账已取消')
          } else {
            voiceService.speak('请说"确认"或"取消"')
            this.waitForTransferConfirmation(request, privateKey) // 重新等待
          }
        },
        () => {
          voiceService.speak('确认失败，转账已取消')
        }
      )
    }, 3000)
  }

  /**
   * 处理联系人相关命令
   */
  private async handleContactCommand(command: string) {
    console.log('🔍 处理联系人命令:', command)
    
    if (command.includes('显示联系人') || command.includes('查看联系人') || 
        command.includes('联系人列表') || command.includes('联系人')) {
      const contacts = contactsService.getContacts()
      
      console.log('📞 当前联系人数量:', contacts.length)
      
      if (contacts.length === 0) {
        voiceService.speak('暂无保存的联系人，请在网页界面添加联系人')
        return
      }

      voiceService.speak(`您有 ${contacts.length} 个联系人，开始播报`)
      
      // 逐个播报联系人
      contacts.slice(0, 5).forEach((contact, index) => {
        setTimeout(() => {
          const announcement = `${index + 1}. ${contact.name}，地址结尾${contact.address.slice(-6)}`
          voiceService.speak(announcement)
          console.log(`📢 播报联系人 ${index + 1}:`, announcement)
        }, (index + 1) * 2000)
      })

      // 如果联系人超过5个，提示还有更多
      if (contacts.length > 5) {
        setTimeout(() => {
          voiceService.speak(`还有 ${contacts.length - 5} 个联系人，共 ${contacts.length} 个`)
        }, 6 * 2000)
      }
    }
    
    if (command.includes('常用联系人')) {
      const frequent = contactsService.getFrequentContacts()
      
      console.log('⭐ 常用联系人数量:', frequent.length)
      
      if (frequent.length === 0) {
        voiceService.speak('暂无常用联系人，常用联系人根据使用次数自动生成')
        return
      }

      voiceService.speak('常用联系人列表:')
      frequent.forEach((contact, index) => {
        setTimeout(() => {
          const announcement = `${contact.name}，使用了 ${contact.usageCount} 次`
          voiceService.speak(announcement)
          console.log(`📢 播报常用联系人:`, announcement)
        }, (index + 1) * 2000)
      })
    }
  }

  /**
   * 获取语音服务状态
   */
  getVoiceState() {
    return voiceService.getState()
  }

  /**
   * 检查是否为完整的转账命令
   */
  private isCompleteTransferCommand(params: any): boolean {
    if (!params || !params.text) return false
    
    const optimized = VoiceRecognitionOptimizer.parseTransferCommand(params.text)
    return !!(optimized && optimized.amount && optimized.contactName)
  }

  /**
   * 处理完整的转账命令
   */
  private async handleCompleteTransferCommand(params: any) {
    const optimized = VoiceRecognitionOptimizer.parseTransferCommand(params.text)
    
    if (!optimized || !optimized.contactName || !optimized.amount) {
      // 如果无法解析完整信息，转为分步流程
      voiceService.speak('转账信息不完整，开始分步转账流程。请说出联系人姓名')
      await this.startStepByStepTransferFlow()
      return
    }

    // 处理收款人
    if (optimized.type === 'contact' && optimized.contactName) {
      const contact = contactsService.findContact(optimized.contactName)
      if (contact) {
        this.transferSteps = {
          isActive: true,
          step: 'confirm',
          recipient: {
            type: 'contact',
            value: contact.address,
            displayName: contact.name
          },
          amount: optimized.amount,
          attempts: 0,
          maxAttempts: 3
        }
        
        voiceService.speak(`确认转账信息：转账 ${optimized.amount} ETH 给 ${contact.name}`)
        this.waitForConfirmation()
        return
      } else {
        // 明确处理联系人未找到的情况
        voiceService.speak(`未找到联系人"${optimized.contactName}"，请在网页界面添加此联系人，然后重试转账`)
        this.cancelTransferFlow('联系人不存在')
        return
      }
    }

    // 如果找不到联系人或其他问题，回到步骤引导
    voiceService.speak('无法识别联系人信息，开始分步转账流程。请说出联系人姓名')
    await this.startStepByStepTransferFlow()
  }

  /**
   * 等待收款人输入
   */
  private waitForRecipientInput() {
    setTimeout(() => {
      voiceService.startListeningForText(
        (text) => this.handleTransferStepInput(text),
        (error) => {
          // 对于"没有检测到语音"的错误，不计入尝试次数，并给出更友好的提示
          if (error.includes('没有检测到语音')) {
            // voiceService 已经处理了语音播报
            setTimeout(() => {
              if (this.transferSteps.isActive && this.transferSteps.step === 'recipient') {
                this.waitForRecipientInput()
              }
            }, 2000)
            return
          }
          
          this.transferSteps.attempts++
          if (this.transferSteps.attempts >= this.transferSteps.maxAttempts) {
            this.cancelTransferFlow('语音识别失败次数过多')
          } else {
            const friendlyMessage = error.includes('语音识别失败') ? 
              '语音识别失败，请重新清晰地说明转账给谁' : error
            voiceService.speak(friendlyMessage)
            this.waitForRecipientInput()
          }
        }
      )
    }, 1000)
  }

  /**
   * 处理转账步骤输入
   */
  private async handleTransferStepInput(input: string) {
    if (!this.transferSteps.isActive) return

    // 处理取消命令
    if (input.includes('取消') || input.includes('退出') || input.includes('cancel')) {
      this.cancelTransferFlow('用户取消')
      return
    }

    switch (this.transferSteps.step) {
      case 'recipient':
        await this.handleRecipientInput(input)
        break
      case 'amount':
        await this.handleAmountInput(input)
        break
      case 'confirm':
        await this.handleConfirmationInput(input)
        break
    }
  }

  /**
   * 处理收款人输入
   */
  private async handleRecipientInput(input: string) {
    // 优化输入文本
    const optimizedInput = VoiceRecognitionOptimizer.optimizeText(input)
    
    // 提取联系人姓名 - 简化版，直接使用输入作为联系人名
    let contactName = input.trim()
    
    // 如果输入包含"给"字，提取联系人姓名
    const contactMatch = optimizedInput.match(/给\s*([^0-9\s]+)/i) || 
                        optimizedInput.match(/([^0-9\s]+)/i)
    if (contactMatch) {
      contactName = contactMatch[1].trim()
    }
    
    // 尝试查找联系人
    const contact = contactsService.findContact(contactName)
    
    if (contact) {
      this.transferSteps.recipient = {
        type: 'contact',
        value: contact.address,
        displayName: contact.name
      }
      voiceService.speak(`收款人：${contact.name}。现在请说明转账金额`)
      this.transferSteps.step = 'amount'
      this.waitForAmountInput()
      return
    }

    // 检查是否为钱包地址
    const addressMatch = input.match(/(0x[a-fA-F0-9]{40})/)
    if (addressMatch && walletService.isValidAddress(addressMatch[1])) {
      this.transferSteps.recipient = {
        type: 'address',
        value: addressMatch[1]
      }
      const shortAddress = `${addressMatch[1].slice(0, 6)}...${addressMatch[1].slice(-4)}`
      voiceService.speak(`收款地址：${shortAddress}。现在请说明转账金额`)
      this.transferSteps.step = 'amount'
      this.waitForAmountInput()
      return
    }

    // 未找到匹配项
    this.transferSteps.attempts++
    if (this.transferSteps.attempts >= this.transferSteps.maxAttempts) {
      this.cancelTransferFlow('无法识别收款人信息')
      return
    }

    voiceService.speak(`未找到联系人"${contactName}"，请在网页界面添加此联系人，或重新说出联系人姓名`)
    this.waitForRecipientInput()
  }

  /**
   * 等待金额输入
   */
  private waitForAmountInput() {
    setTimeout(() => {
      voiceService.startListeningForText(
        (text) => this.handleTransferStepInput(text),
        (error) => {
          // 对于"没有检测到语音"的错误，不计入尝试次数，并给出更友好的提示
          if (error.includes('没有检测到语音')) {
            // voiceService 已经处理了语音播报
            setTimeout(() => {
              if (this.transferSteps.isActive && this.transferSteps.step === 'amount') {
                this.waitForAmountInput()
              }
            }, 2000)
            return
          }
          
          this.transferSteps.attempts++
          if (this.transferSteps.attempts >= this.transferSteps.maxAttempts) {
            this.cancelTransferFlow('语音识别失败次数过多')
          } else {
            const friendlyMessage = error.includes('语音识别失败') ? 
              '语音识别失败，请重新清晰地说明转账金额' : error
            voiceService.speak(friendlyMessage)
            this.waitForAmountInput()
          }
        }
      )
    }, 1000)
  }

  /**
   * 处理金额输入
   */
  private async handleAmountInput(input: string) {
    // 使用优化器处理金额输入
    const optimizedInput = VoiceRecognitionOptimizer.optimizeText(input)
    
    // 提取金额 - 简化版，不再提取代币类型
    const amountMatch = optimizedInput.match(/([0-9.]+)/i)
    
    if (!amountMatch) {
      this.transferSteps.attempts++
      if (this.transferSteps.attempts >= this.transferSteps.maxAttempts) {
        this.cancelTransferFlow('无法识别金额信息')
        return
      }
      
      voiceService.speak('无法识别金额，请说明数字金额，例如：0.1 或 五十')
      this.waitForAmountInput()
      return
    }

    const amount = amountMatch[1]

    // 验证金额
    const validation = VoiceRecognitionOptimizer.validateAmount(amount)
    if (!validation.isValid) {
      this.transferSteps.attempts++
      if (this.transferSteps.attempts >= this.transferSteps.maxAttempts) {
        this.cancelTransferFlow('金额格式错误')
        return
      }
      
      voiceService.speak(validation.message)
      this.waitForAmountInput()
      return
    }

    this.transferSteps.amount = validation.corrected
    
    // 直接进入确认步骤，固定使用ETH
    this.transferSteps.step = 'confirm'
    voiceService.speak(`转账金额：${validation.corrected} ETH`)
    this.showTransferSummary()
  }

  /**
   * 显示转账摘要并等待确认
   */
  private showTransferSummary() {
    const recipientInfo = this.transferSteps.recipient!.displayName || 
                         `地址 ${this.transferSteps.recipient!.value.slice(0, 6)}...${this.transferSteps.recipient!.value.slice(-4)}`
    
    const summary = `请确认转账信息：转账 ${this.transferSteps.amount} ETH 给 ${recipientInfo}。请说"确认"执行转账，或说"取消"退出`
    
    voiceService.speak(summary)
    this.waitForConfirmation()
  }

  /**
   * 等待最终确认
   */
  private waitForConfirmation() {
    console.log('⏳ 等待用户最终确认...')
    console.log('🔍 当前转账状态:', this.transferSteps)
    
    setTimeout(() => {
      voiceService.startListeningForText(
        (text) => {
          console.log('🎤 收到确认步骤的语音输入:', text)
          console.log('📊 当前流程状态:', {
            isActive: this.transferSteps.isActive,
            step: this.transferSteps.step,
            recipient: this.transferSteps.recipient?.displayName || this.transferSteps.recipient?.value,
            amount: this.transferSteps.amount
          })
          this.handleTransferStepInput(text)
        },
        (error) => {
          console.log('❌ 确认步骤语音识别错误:', error)
          // 对于"没有检测到语音"的错误，不计入尝试次数，并给出更友好的提示
          if (error.includes('没有检测到语音')) {
            // voiceService 已经处理了语音播报
            setTimeout(() => {
              if (this.transferSteps.isActive && this.transferSteps.step === 'confirm') {
                voiceService.speak('请说"确认"执行转账，或说"取消"退出')
                this.waitForConfirmation()
              }
            }, 2000)
            return
          }
          
          this.transferSteps.attempts++
          if (this.transferSteps.attempts >= this.transferSteps.maxAttempts) {
            this.cancelTransferFlow('语音识别失败次数过多')
          } else {
            const friendlyMessage = error.includes('语音识别失败') ? 
              '语音识别失败，请重新说"确认"或"取消"' : error
            voiceService.speak(friendlyMessage)
            this.waitForConfirmation()
          }
        }
      )
    }, 1000)
  }

  /**
   * 处理最终确认输入
   */
  private async handleConfirmationInput(input: string) {
    console.log('🔍 处理确认输入:', input)
    console.log('📊 确认时的转账状态:', {
      isActive: this.transferSteps.isActive,
      step: this.transferSteps.step,
      recipient: this.transferSteps.recipient,
      amount: this.transferSteps.amount,
      attempts: this.transferSteps.attempts
    })
    
    if (input.includes('确认') || input.includes('是的') || input.includes('confirm') || input.includes('ok')) {
      console.log('✅ 用户确认转账，开始执行...')
      try {
        await this.executeStepTransfer()
        console.log('🎉 转账执行完成')
      } catch (error) {
        console.error('❌ 转账执行异常:', error)
        this.cancelTransferFlow(`转账执行失败：${error instanceof Error ? error.message : '未知错误'}`)
      }
    } else if (input.includes('取消') || input.includes('不') || input.includes('cancel')) {
      console.log('❌ 用户取消转账')
      this.cancelTransferFlow('用户取消')
    } else {
      console.log('🔄 用户输入不明确，重新询问')
      console.log('🔍 用户说的是:', `"${input}"`)
      this.transferSteps.attempts++
      if (this.transferSteps.attempts >= this.transferSteps.maxAttempts) {
        this.cancelTransferFlow('确认失败次数过多')
      } else {
        voiceService.speak('请明确说"确认"执行转账，或说"取消"退出')
        this.waitForConfirmation()
      }
    }
  }

  /**
   * 执行分步转账
   */
  private async executeStepTransfer() {
    const { wallet } = useWalletStore.getState()
    
    console.log('🚀 开始执行分步转账')
    console.log('💰 转账信息:', {
      recipient: this.transferSteps.recipient,
      amount: this.transferSteps.amount
    })
    
    if (!wallet || !this.transferSteps.recipient) {
      console.error('❌ 转账信息不完整')
      this.cancelTransferFlow('转账信息不完整')
      return
    }

    const transferRequest: TransferRequest = {
      to: this.transferSteps.recipient.value,
      amount: this.transferSteps.amount,
      token: undefined, // 固定为ETH
      tokenSymbol: 'eth'
    }

    try {
      voiceService.speak('正在执行转账，请稍候...')
      console.log('📤 发送转账请求:', transferRequest)
      
      // 如果是联系人，标记使用
      if (this.transferSteps.recipient.type === 'contact') {
        const contact = contactsService.findContactByAddress(this.transferSteps.recipient.value)
        if (contact) {
          contactsService.markContactUsed(contact.id)
          console.log('📞 已标记联系人使用:', contact.name)
        }
      }

      await this.executeTransfer(transferRequest, wallet.privateKey)
      console.log('✅ 转账执行完成')
      this.resetTransferSteps()
      
    } catch (error) {
      console.error('❌ 转账执行失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      voiceService.speak(`转账失败：${errorMessage}`)
      this.cancelTransferFlow(`转账失败：${errorMessage}`)
    }
  }

  /**
   * 取消转账流程
   */
  private cancelTransferFlow(reason: string) {
    voiceService.speak(`转账已取消：${reason}`)
    this.resetTransferSteps()
  }

  /**
   * 重置转账步骤
   */
  private resetTransferSteps() {
    this.transferSteps = {
      isActive: false,
      step: 'idle',
      recipient: null,
      amount: '',
      attempts: 0,
      maxAttempts: 3
    }
  }

  /**
   * 开始逐步转账流程 - 清晰的步骤引导
   */
  private async startStepByStepTransferFlow() {
    const { wallet } = useWalletStore.getState()
    
    if (!wallet) {
      voiceService.speak('请先创建或导入钱包')
      return
    }

    // 重置转账状态
    this.transferSteps = {
      isActive: true,
      step: 'recipient',
      recipient: null,
      amount: '',
      attempts: 0,
      maxAttempts: 3
    }

    // 开始第一步：询问联系人
    voiceService.speak('开始转账流程。请说出联系人姓名')
    this.waitForRecipientInput()
  }

}

// 单例实例
export const commandService = new CommandService()
