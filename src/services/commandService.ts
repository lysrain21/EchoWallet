/**
 * Echo Wallet - Voice command service
 * Coordinates speech recognition with wallet operations.
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
  // Step-by-step transfer state (simplified, ETH only)
  private transferSteps = {
    isActive: false,
    step: 'idle' as 'idle' | 'recipient' | 'amount' | 'confirm',
    recipient: null as { type: 'contact' | 'address', value: string, displayName?: string } | null,
    amount: '',
    attempts: 0,
    maxAttempts: 3
  }

  /**
   * Start voice listening.
   */
  startListening() {
    const { setVoiceState } = useWalletStore.getState()
    
    if (this.isProcessing) {
      voiceService.speak('The system is processing. Please wait a moment.')
      return
    }

    setVoiceState({ isListening: true })
    voiceService.speak('Please say your command.')

    voiceService.startListening(
      (command) => this.handleCommand(command),
      (error) => {
        setVoiceState({ isListening: false, error })
        
        // Handle "no speech" errors gracefully by restarting the listener
        if (error.includes('No speech detected')) {
          setTimeout(() => {
            if (!this.isProcessing) {
              this.startListening()
            }
          }, 2000)
        } else {
          voiceService.speak(error)
        }
      }
    )
  }

  /**
   * Stop voice listening.
   */
  stopListening() {
    const { setVoiceState } = useWalletStore.getState()
    voiceService.stopListening()
    setVoiceState({ isListening: false })
  }

  /**
   * Handle recognized voice command.
   */
  private async handleCommand(command: VoiceCommand) {
    const { setVoiceState, setLoading, setError } = useWalletStore.getState()
    
    try {
      this.isProcessing = true
      setVoiceState({ isProcessing: true, lastCommand: command })
      setLoading(true)

      voiceService.speak('Processing your request...')

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
          // Check whether a transfer flow is already active
          if (this.transferSteps.isActive) {
            await this.handleTransferStepInput(command.parameters?.text || '')
          } else {
            // Determine whether the command already includes full transfer details
            if (command.parameters?.isComplete) {
              // For complete transfer commands, use the optimized flow
              await this.handleCompleteTransferCommand(command.parameters)
            } else {
              // For partial commands (e.g., just "transfer"), start the guided flow
              await this.startStepByStepTransferFlow()
            }
          }
          break

        case 'contacts':
          await this.handleContactCommand(command.parameters?.text || '')
          break

        case 'text_input':
          // Handle text input during the transfer flow
          if (this.transferSteps.isActive) {
            await this.handleTransferStepInput(command.parameters?.text || '')
          } else {
            voiceService.speak('Sorry, I did not understand that command.')
          }
          break

        case 'switch_network':
          const rawText = (command.parameters?.text || '').toLowerCase()
          let targetNetwork: 'mainnet' | 'sepolia' = 'sepolia'
          if (rawText.includes('mainnet')) {
            targetNetwork = 'mainnet'
          } else if (rawText.includes('sepolia') || rawText.includes('testnet')) {
            targetNetwork = 'sepolia'
          }
          await walletService.switchNetwork(targetNetwork)
          voiceService.speak(`Switched to ${targetNetwork === 'mainnet' ? 'mainnet' : 'testnet'}`)
          break
        
        case 'transaction_status':
          await this.handleTransactionStatus(command.parameters?.hash)
          break
        
        default:
          voiceService.speak('Sorry, I did not understand that command.')
      }

    } catch (error) {
      console.error('Command processing failed:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      voiceService.speak(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      this.isProcessing = false
      setVoiceState({ isProcessing: false, isListening: false })
      setLoading(false)
    }
  }

  /**
   * Handle create wallet command
   */
  private async handleCreateWallet() {
    const { setWallet } = useWalletStore.getState()
    
    try {
      console.log('🎤 User requested wallet creation')
      
      // Check biometric availability and inform the user
      const biometricAvailability = await walletService.checkBiometricAvailability()
      
      if (biometricAvailability.isSupported && biometricAvailability.isAvailable) {
        voiceService.speak('Biometric support detected. The wallet will be saved to your device after creation.')
      }
      
      // Use the enhanced wallet creation method
      const wallet = await walletService.createAndVerifyWallet()
      setWallet(wallet)
      
      console.log('💾 Wallet saved to state management')
      
      if (wallet.mnemonic) {
        voiceService.speak('Wallet created successfully. The recovery phrase is displayed; please store it safely.')
        
        // If biometrics are available, confirm saving
        if (biometricAvailability.isSupported && biometricAvailability.isAvailable) {
          setTimeout(() => {
            voiceService.speak('The wallet has been securely saved via biometrics on your device. Next time, say "import wallet" and use biometrics to restore quickly.')
          }, 3000)
        }
        
        setTimeout(() => {
          voiceService.speakTemplate('WALLET_CREATED', {
            address: walletService.formatAddressForSpeech(wallet.address)
          })
          
          // Announce verification details
          voiceService.speak('Wallet verification completed. All information is correct. Check the browser console for details.')
        }, 2000)
      }
      
      // Update the balance as well
      await this.updateBalance(wallet.address)
      
    } catch (error) {
      console.error('❌ Wallet creation failed:', error)
      throw error
    }
  }

  /**
   * Handle import wallet command (biometrics only)
   */
  private async handleImportWallet() {
    const { setWallet } = useWalletStore.getState()
    
    try {
      // Check biometric availability
      const biometricAvailability = await walletService.checkBiometricAvailability()
      
      if (!biometricAvailability.isSupported || !biometricAvailability.isAvailable) {
        voiceService.speak('Your device does not support biometrics, so the wallet cannot be imported. Please create the wallet on a device that supports biometrics first.')
        return
      }
      
      // Ensure a saved wallet exists
      const recoveryState = await walletService.getWalletRecoveryState()
      
      if (!recoveryState.hasStoredCredentials) {
        voiceService.speak('No saved wallet found. Please create a wallet first so it can be saved to your device.')
        return
      }
      
      // Begin biometric recovery
      console.log('🔐 Starting biometric wallet recovery...')
      voiceService.speak('Please use biometrics to verify your identity and restore the wallet.')
      
      const recoveryResult = await walletService.recoverWalletWithBiometric()
      
      if (recoveryResult.success && recoveryResult.wallets && recoveryResult.wallets.length > 0) {
        // Biometric recovery succeeded
        const wallet = recoveryResult.wallets[0] // Use the first recovered wallet
        setWallet(wallet)
        
        voiceService.speak('Biometric verification succeeded. Wallet restored.')
        console.log('✅ Wallet restored via biometrics:', wallet.address)
        
        // Refresh the balance
        await this.updateBalance(wallet.address)
        
        setTimeout(() => {
          voiceService.speakTemplate('WALLET_CREATED', {
            address: walletService.formatAddressForSpeech(wallet.address)
          })
        }, 2000)
        
      } else {
        // Biometric recovery failed
        const errorMessage = recoveryResult.error || 'Biometric verification failed'
        voiceService.speak(`Wallet recovery failed: ${errorMessage}`)
        console.error('❌ Biometric wallet recovery failed:', recoveryResult.error)
      }
      
    } catch (error) {
      console.error('❌ Wallet import failed:', error)
      voiceService.speak('An error occurred while importing the wallet. Please try again.')
    }
  }

  /**
   * Handle check balance command
   */
  private async handleCheckBalance() {
    const { wallet } = useWalletStore.getState()
    
    if (!wallet) {
      voiceService.speak('Please create or import a wallet first.')
      return
    }

    await this.updateBalance(wallet.address)
    
    const { balance } = useWalletStore.getState()
    
    // Announce ETH balance
    voiceService.speakTemplate('BALANCE_RESULT', {
      token: 'ETH',
      amount: parseFloat(balance.eth).toFixed(4)
    })
    
    // Announce token balances
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
   * Handle transfer command
   */
  private async handleTransfer(params: any) {
    const { wallet } = useWalletStore.getState()
    
    if (!wallet) {
      voiceService.speak('Please create or import a wallet first.')
      return
    }

    if (!params || !params.amount || !params.to) {
      voiceService.speak('Transfer information is incomplete. Please restate the amount and recipient address.')
      return
    }

    // Validate address format
    if (!walletService.isValidAddress(params.to)) {
      voiceService.speak('The recipient address format is invalid. Please check it.')
      return
    }

    const transferRequest: TransferRequest = {
      to: params.to,
      amount: params.amount,
      token: params.token === 'eth' ? undefined : params.token,
      tokenSymbol: params.token
    }

    // Voice confirmation
    const tokenName = params.token || 'ETH'
    const addressForSpeech = walletService.formatAddressForSpeech(params.to)
    
    voiceService.speakTemplate('TRANSFER_CONFIRM', {
      amount: params.amount,
      token: tokenName,
      to: addressForSpeech
    })

    // Await user confirmation
    setTimeout(() => {
      voiceService.speak('Please say "confirm" to complete the transfer or "cancel" to abort.')
      
      voiceService.startListening(
        async (confirmCommand) => {
          const text = confirmCommand.parameters?.text || ''
          if (text.includes('confirm') || text.includes('yes')) {
            await this.executeTransfer(transferRequest, wallet.privateKey)
          } else {
            voiceService.speak('Transfer cancelled.')
          }
        },
        () => voiceService.speak('Confirmation failed. Transfer cancelled.')
      )
    }, 3000)
  }

  /**
   * Execute transfer (ETH only)
   */
  private async executeTransfer(request: TransferRequest, privateKey: string) {
    const { addTransaction } = useWalletStore.getState()
    
    console.log('🔄 Starting ETH transfer')
    console.log('📋 Transfer request details:', request)
    
    try {
      // Handle ETH transfers only
      console.log('🌐 Calling walletService.transferETH...')
      const txHash = await walletService.transferETH(request, privateKey)
      console.log('✅ Transfer succeeded, transaction hash:', txHash)

      // Record the transaction
      const transaction = {
        hash: txHash,
        to: request.to,
        value: request.amount,
        timestamp: Date.now(),
        status: 'pending' as const
      }
      
      addTransaction(transaction)
      console.log('📝 Transaction recorded in state management')
      
      voiceService.speakTemplate('TRANSFER_SUCCESS', { hash: txHash })
      
      // Refresh the balance
      setTimeout(() => {
        const { wallet } = useWalletStore.getState()
        if (wallet) {
          console.log('🔄 Updating balance again in 5 seconds...')
          this.updateBalance(wallet.address)
        }
      }, 5000)
      
    } catch (error) {
      console.error('❌ Transfer execution failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      voiceService.speakTemplate('TRANSFER_FAILED', { error: errorMessage })
      throw error // Rethrow the error so callers can handle it
    }
  }

  /**
   * Handle transaction status query
   */
  private async handleTransactionStatus(hash?: string) {
    if (!hash) {
      voiceService.speak('Please provide the transaction hash.')
      return
    }

    const transaction = await walletService.getTransactionStatus(hash)
    
    if (!transaction) {
      voiceService.speak('Transaction not found')
      return
    }

    const statusText = transaction.status === 'confirmed' ? 'confirmed' : 
                      transaction.status === 'failed' ? 'failed' : 'pending confirmation'
    
    voiceService.speak(`Transaction status: ${statusText}, amount: ${transaction.value} ETH`)
  }

  /**
   * Update wallet balance
   */
  private async updateBalance(address: string) {
    const { updateBalance } = useWalletStore.getState()
    
    try {
      const ethBalance = await walletService.getETHBalance(address)
      
      // Fetch token balances
      const tokens: any[] = []
      const networkConfig = walletService.getCurrentNetwork()
      // TODO: fetch default token balances based on network configuration
      
      updateBalance({
        eth: ethBalance,
        tokens
      })
      
    } catch (error) {
      console.error('Failed to update balance:', error)
    }
  }

  /**
   * Extract mnemonic from voice command
   */
  private extractMnemonic(command: VoiceCommand): string | null {
    // TODO: parse 12-word mnemonic from speech results
    // Currently returns null; implement parsing when available
    return null
  }

  /**
   * Parse transfer command using optimizer
   */
  private parseTransferCommand(text: string) {
    console.log('🔍 Starting transfer command parsing:', text)
    
    // Use optimized parser
    const result = VoiceRecognitionOptimizer.parseTransferCommand(text)
    
    if (result) {
      // Validate amount format
      const amountValidation = VoiceRecognitionOptimizer.validateAmount(result.amount)
      
      if (!amountValidation.isValid) {
        voiceService.speak(amountValidation.message)
        return null
      }
      
      // Store corrected amount
      result.amount = amountValidation.corrected
      
      console.log('✅ Transfer command parsed successfully:', result)
      return result
    }
    
    console.log('❌ Failed to parse transfer command')
    return null
  }

  /**
   * Handle transfer command (optimized)
   */
  private async handleTransferOptimized(params: any) {
    const { wallet } = useWalletStore.getState()
    
    if (!wallet) {
      voiceService.speak('Please create or import a wallet first.')
      return
    }

    if (!params || !params.amount) {
      voiceService.speak('Please specify the transfer amount.')
      return
    }

    let targetAddress: string | undefined
    let contactName: string | undefined

    // Handle according to recipient type
    switch (params.type) {
      case 'contact':
        const contact = contactsService.findContact(params.contactName)
        if (!contact) {
        voiceService.speak(`No contact found for ${params.contactName}. Please add this contact on the web interface.`)
          return
        }
        targetAddress = contact.address
        contactName = contact.name
        contactsService.markContactUsed(contact.id)
        break

      case 'quick':
        const recentContacts = contactsService.getFrequentContacts(1)
        if (recentContacts.length === 0) {
          voiceService.speak('No recently used contacts. Please add contacts on the web interface.')
          return
        }
        targetAddress = recentContacts[0].address
        contactName = recentContacts[0].name
        contactsService.markContactUsed(recentContacts[0].id)
        break

      case 'address':
        if (!walletService.isValidAddress(params.to)) {
          voiceService.speak('The recipient address format is invalid. Please check it.')
          return
        }
        targetAddress = params.to
        break

      default:
        voiceService.speak('Transfer information is incomplete. Please restate it.')
        return
    }

    // Build transfer request
    const transferRequest: TransferRequest = {
      to: targetAddress!,
      amount: params.amount,
      token: params.token === 'eth' ? undefined : params.token,
      tokenSymbol: params.token
    }

    // Voice confirmation with contact name or shortened address
    const tokenName = params.token || 'ETH'
    const recipientInfo = contactName || walletService.formatAddressForSpeech(targetAddress!)
    
    voiceService.speakTemplate('TRANSFER_CONFIRM', {
      amount: params.amount,
      token: tokenName,
      to: recipientInfo
    })

    // Await user confirmation
    this.waitForTransferConfirmation(transferRequest, wallet.privateKey)
  }

  /**
   * Wait for transfer confirmation
   */
  private waitForTransferConfirmation(request: TransferRequest, privateKey: string) {
    setTimeout(() => {
      voiceService.speak('Please say "confirm" to complete the transfer or "cancel" to abort.')
      
      voiceService.startListening(
        async (confirmCommand) => {
          const text = (confirmCommand.parameters?.text || '').toLowerCase()
        if (text.includes('confirm') || text.includes('yes')) {
            await this.executeTransfer(request, privateKey)
          } else if (text.includes('cancel') || text.includes('no') || text.includes('stop')) {
            voiceService.speak('Transfer cancelled.')
          } else {
            voiceService.speak('Please say "confirm" or "cancel".')
            this.waitForTransferConfirmation(request, privateKey) // Retry waiting
          }
        },
        () => {
          voiceService.speak('Confirmation failed. Transfer cancelled.')
        }
      )
    }, 3000)
  }

  /**
   * Handle contact-related voice commands.
   */
  private async handleContactCommand(command: string) {
    console.log('🔍 Handling contacts command:', command)
    
    if (command.includes('show contacts') || command.includes('view contacts') || 
        command.includes('contacts list') || command.includes('contact list')) {
      const contacts = contactsService.getContacts()
      
      console.log('📞 Current contact count:', contacts.length)
      
      if (contacts.length === 0) {
        voiceService.speak('No contacts saved. Please add a contact on the web interface.')
        return
      }

      voiceService.speak(`You have ${contacts.length} contacts. Announcing them now.`)
      
      // Announce up to the first five contacts
      contacts.slice(0, 5).forEach((contact, index) => {
        setTimeout(() => {
          const announcement = `${index + 1}. ${contact.name}, address ending ${contact.address.slice(-6)}`
          voiceService.speak(announcement)
          console.log(`📢 Announcing contact ${index + 1}:`, announcement)
        }, (index + 1) * 2000)
      })

      // Mention remaining contacts if more than five
      if (contacts.length > 5) {
        setTimeout(() => {
          voiceService.speak(`There are ${contacts.length - 5} more contacts, ${contacts.length} in total.`)
        }, 6 * 2000)
      }
    }
    
    if (command.includes('frequent contacts')) {
      const frequent = contactsService.getFrequentContacts()
      
      console.log('⭐ Frequent contacts count:', frequent.length)
      
      if (frequent.length === 0) {
        voiceService.speak('No frequent contacts yet. Frequent contacts are generated automatically based on usage.')
        return
      }

      voiceService.speak('Frequent contacts list:')
      frequent.forEach((contact, index) => {
        setTimeout(() => {
          const announcement = `${contact.name}, used ${contact.usageCount} times`
          voiceService.speak(announcement)
          console.log('📢 Announcing frequent contact:', announcement)
        }, (index + 1) * 2000)
      })
    }
  }

  /**
   * Get voice service state
   */
  getVoiceState() {
    return voiceService.getState()
  }

  /**
   * Check if the transfer command is complete
   */
  private isCompleteTransferCommand(params: any): boolean {
    if (!params || !params.text) return false
    
    const optimized = VoiceRecognitionOptimizer.parseTransferCommand(params.text)
    return !!(optimized && optimized.amount && optimized.contactName)
  }

  /**
   * Handle a complete transfer command
   */
  private async handleCompleteTransferCommand(params: any) {
    const optimized = VoiceRecognitionOptimizer.parseTransferCommand(params.text)
    
    if (!optimized || !optimized.contactName || !optimized.amount) {
      // If parsing fails, fall back to the guided flow
      voiceService.speak('Transfer information is incomplete. Starting the guided transfer flow. Please say the contact name.')
      await this.startStepByStepTransferFlow()
      return
    }

    // Handle recipient
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
        
        voiceService.speak(`Confirm transfer details: send ${optimized.amount} ETH to ${contact.name}.`)
        this.waitForConfirmation()
        return
      } else {
        // Handle missing contacts explicitly
        voiceService.speak(`No contact found for "${optimized.contactName}". Please add this contact on the web interface and try again.`)
        this.cancelTransferFlow('Contact does not exist')
        return
      }
    }

    // Return to the guided flow when no contact is found
    voiceService.speak('Could not identify the contact. Starting the step-by-step transfer flow. Please say the contact name.')
    await this.startStepByStepTransferFlow()
  }

  /**
   * Wait for recipient input
   */
  private waitForRecipientInput() {
    setTimeout(() => {
      voiceService.startListeningForText(
        (text) => this.handleTransferStepInput(text),
        (error) => {
          // Ignore "no speech" errors and prompt again gently
          if (error.includes('No speech detected')) {
            // voiceService already handled the spoken feedback
            setTimeout(() => {
              if (this.transferSteps.isActive && this.transferSteps.step === 'recipient') {
                this.waitForRecipientInput()
              }
            }, 2000)
            return
          }
          
          this.transferSteps.attempts++
          if (this.transferSteps.attempts >= this.transferSteps.maxAttempts) {
            this.cancelTransferFlow('Too many speech recognition failures')
          } else {
            const friendlyMessage = error.includes('Speech recognition failed') ? 
              'Speech recognition failed. Please clearly repeat who to transfer to.' : error
            voiceService.speak(friendlyMessage)
            this.waitForRecipientInput()
          }
        }
      )
    }, 1000)
  }

  /**
   * Handle transfer step input
   */
  private async handleTransferStepInput(input: string) {
    if (!this.transferSteps.isActive) return

    // Handle cancel commands
    if (input.includes('cancel') || input.includes('exit')) {
      this.cancelTransferFlow('User cancelled')
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
   * Handle recipient input
   */
  private async handleRecipientInput(input: string) {
    // Normalize the raw input
    const optimizedInput = VoiceRecognitionOptimizer.optimizeText(input)
    
    // Simplified contact name extraction
    let contactName = input.trim()
    
    // If the input contains "to" or "for", extract the contact name after it
    const contactMatch = optimizedInput.match(/(?:to|for)\s*([a-z][a-z\s]+)/i) ||
                        optimizedInput.match(/([a-z][a-z\s]+)/i)
    if (contactMatch) {
      contactName = contactMatch[1].trim()
    }
    
    // Attempt to find the contact
    const contact = contactsService.findContact(contactName)
    
    if (contact) {
      this.transferSteps.recipient = {
        type: 'contact',
        value: contact.address,
        displayName: contact.name
      }
      voiceService.speak(`Recipient: ${contact.name}. Please specify the transfer amount now.`)
      this.transferSteps.step = 'amount'
      this.waitForAmountInput()
      return
    }

    // Check whether the input is a wallet address
    const addressMatch = input.match(/(0x[a-fA-F0-9]{40})/)
    if (addressMatch && walletService.isValidAddress(addressMatch[1])) {
      this.transferSteps.recipient = {
        type: 'address',
        value: addressMatch[1]
      }
      const shortAddress = `${addressMatch[1].slice(0, 6)}...${addressMatch[1].slice(-4)}`
      voiceService.speak(`Recipient address: ${shortAddress}. Please specify the transfer amount now.`)
      this.transferSteps.step = 'amount'
      this.waitForAmountInput()
      return
    }

    // No match found
    this.transferSteps.attempts++
    if (this.transferSteps.attempts >= this.transferSteps.maxAttempts) {
      this.cancelTransferFlow('Could not recognize the recipient information.')
      return
    }

    voiceService.speak(`No contact found for "${contactName}". Please add the contact on the web interface or say the contact name again.`)
    this.waitForRecipientInput()
  }

  /**
   * Wait for amount input
   */
  private waitForAmountInput() {
    setTimeout(() => {
      voiceService.startListeningForText(
        (text) => this.handleTransferStepInput(text),
        (error) => {
          // Ignore "no speech" errors and prompt again gently
          if (error.includes('No speech detected')) {
            // voiceService already handled the spoken feedback
            setTimeout(() => {
              if (this.transferSteps.isActive && this.transferSteps.step === 'amount') {
                this.waitForAmountInput()
              }
            }, 2000)
            return
          }
          
          this.transferSteps.attempts++
          if (this.transferSteps.attempts >= this.transferSteps.maxAttempts) {
            this.cancelTransferFlow('Too many speech recognition failures')
          } else {
            const friendlyMessage = error.includes('Speech recognition failed') ? 
              'Speech recognition failed. Please clearly repeat the transfer amount.' : error
            voiceService.speak(friendlyMessage)
            this.waitForAmountInput()
          }
        }
      )
    }, 1000)
  }

  /**
   * Handle amount input
   */
  private async handleAmountInput(input: string) {
    // Normalize the amount input
    const optimizedInput = VoiceRecognitionOptimizer.optimizeText(input)
    
    // Extract numeric amount only
    const amountMatch = optimizedInput.match(/([0-9.]+)/i)
    
    if (!amountMatch) {
      this.transferSteps.attempts++
      if (this.transferSteps.attempts >= this.transferSteps.maxAttempts) {
        this.cancelTransferFlow('Could not identify the amount.')
        return
      }
      
      voiceService.speak('Could not understand the amount. Please state a numeric value such as 0.1 or fifty.')
      this.waitForAmountInput()
      return
    }

    const amount = amountMatch[1]

    // Validate the amount
    const validation = VoiceRecognitionOptimizer.validateAmount(amount)
    if (!validation.isValid) {
      this.transferSteps.attempts++
      if (this.transferSteps.attempts >= this.transferSteps.maxAttempts) {
        this.cancelTransferFlow('Invalid amount format.')
        return
      }
      
      voiceService.speak(validation.message)
      this.waitForAmountInput()
      return
    }

    this.transferSteps.amount = validation.corrected
    
    // Proceed directly to confirmation using ETH
    this.transferSteps.step = 'confirm'
    voiceService.speak(`Transfer amount: ${validation.corrected} ETH`)
    this.showTransferSummary()
  }

  /**
   * Present transfer summary and await confirmation
   */
  private showTransferSummary() {
    const recipientInfo = this.transferSteps.recipient!.displayName || 
                         `address ${this.transferSteps.recipient!.value.slice(0, 6)}...${this.transferSteps.recipient!.value.slice(-4)}`
    
    const summary = `Please confirm the transfer: send ${this.transferSteps.amount} ETH to ${recipientInfo}. Say "confirm" to execute the transfer or "cancel" to exit.`
    
    voiceService.speak(summary)
    this.waitForConfirmation()
  }

  /**
   * Wait for final confirmation
   */
  private waitForConfirmation() {
    console.log('⏳ Waiting for final confirmation...')
    console.log('🔍 Current transfer state:', this.transferSteps)
    
    setTimeout(() => {
      voiceService.startListeningForText(
        (text) => {
          console.log('🎤 Received speech input during confirmation step:', text)
          console.log('📊 Current flow state:', {
            isActive: this.transferSteps.isActive,
            step: this.transferSteps.step,
            recipient: this.transferSteps.recipient?.displayName || this.transferSteps.recipient?.value,
            amount: this.transferSteps.amount
          })
          this.handleTransferStepInput(text)
        },
        (error) => {
          console.log('❌ Speech recognition error during confirmation step:', error)
          // Ignore "no speech" errors and prompt again gently
          if (error.includes('No speech detected')) {
            // voiceService already handled the spoken feedback
            setTimeout(() => {
              if (this.transferSteps.isActive && this.transferSteps.step === 'confirm') {
                voiceService.speak('Please say "confirm" to execute the transfer or "cancel" to exit.')
                this.waitForConfirmation()
              }
            }, 2000)
            return
          }
          
          this.transferSteps.attempts++
          if (this.transferSteps.attempts >= this.transferSteps.maxAttempts) {
            this.cancelTransferFlow('Too many speech recognition failures')
          } else {
            const friendlyMessage = error.includes('Speech recognition failed') ? 
              'Speech recognition failed. Please say "confirm" or "cancel" again.' : error
            voiceService.speak(friendlyMessage)
            this.waitForConfirmation()
          }
        }
      )
    }, 1000)
  }

  /**
   * Handle final confirmation input
   */
  private async handleConfirmationInput(input: string) {
    console.log('🔍 Handling confirmation input:', input)
    console.log('📊 Transfer state at confirmation:', {
      isActive: this.transferSteps.isActive,
      step: this.transferSteps.step,
      recipient: this.transferSteps.recipient,
      amount: this.transferSteps.amount,
      attempts: this.transferSteps.attempts
    })
    
    if (input.includes('confirm') || input.includes('yes') || input.includes('ok')) {
      console.log('✅ User confirmed the transfer. Executing...')
      try {
        await this.executeStepTransfer()
        console.log('🎉 Transfer execution completed')
      } catch (error) {
        console.error('❌ Transfer execution exception:', error)
        this.cancelTransferFlow(`Transfer execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else if (input.includes('cancel') || input.includes('no') || input.includes('stop')) {
      console.log('❌ User cancelled the transfer')
      this.cancelTransferFlow('User cancelled')
    } else {
      console.log('🔄 Input unclear; asking again')
      console.log('🔍 User said:', `"${input}"`)
      this.transferSteps.attempts++
      if (this.transferSteps.attempts >= this.transferSteps.maxAttempts) {
        this.cancelTransferFlow('Too many failed confirmations')
      } else {
        voiceService.speak('Please clearly say "confirm" to execute the transfer or "cancel" to exit.')
        this.waitForConfirmation()
      }
    }
  }

  /**
   * Execute step-by-step transfer
   */
  private async executeStepTransfer() {
    const { wallet } = useWalletStore.getState()
    
    console.log('🚀 Starting step-by-step transfer')
    console.log('💰 Transfer details:', {
      recipient: this.transferSteps.recipient,
      amount: this.transferSteps.amount
    })
    
    if (!wallet || !this.transferSteps.recipient) {
      console.error('❌ Transfer information is incomplete')
      this.cancelTransferFlow('Transfer information is incomplete')
      return
    }

    const transferRequest: TransferRequest = {
      to: this.transferSteps.recipient.value,
      amount: this.transferSteps.amount,
      token: undefined, // ETH only
      tokenSymbol: 'eth'
    }

    try {
      voiceService.speak('Executing the transfer. Please wait...')
      console.log('📤 Sending transfer request:', transferRequest)
      
      // Mark contact as used when applicable
      if (this.transferSteps.recipient.type === 'contact') {
        const contact = contactsService.findContactByAddress(this.transferSteps.recipient.value)
        if (contact) {
          contactsService.markContactUsed(contact.id)
          console.log('📞 Marked contact as used:', contact.name)
        }
      }

      await this.executeTransfer(transferRequest, wallet.privateKey)
      console.log('✅ Transfer execution completed')
      this.resetTransferSteps()
      
    } catch (error) {
      console.error('❌ Transfer execution failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      voiceService.speak(`Transfer failed: ${errorMessage}`)
      this.cancelTransferFlow(`Transfer failed: ${errorMessage}`)
    }
  }

  /**
   * Cancel transfer flow
   */
  private cancelTransferFlow(reason: string) {
    voiceService.speak(`Transfer cancelled.：${reason}`)
    this.resetTransferSteps()
  }

  /**
   * Reset transfer steps
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
   * Start guided step-by-step transfer flow
   */
  private async startStepByStepTransferFlow() {
    const { wallet } = useWalletStore.getState()
    
    if (!wallet) {
      voiceService.speak('Please create or import a wallet first.')
      return
    }

    // Reset transfer state
    this.transferSteps = {
      isActive: true,
      step: 'recipient',
      recipient: null,
      amount: '',
      attempts: 0,
      maxAttempts: 3
    }

    // Begin by asking for the contact
    voiceService.speak('Starting transfer flow. Please say the contact name.')
    this.waitForRecipientInput()
  }

}

// Singleton instance
export const commandService = new CommandService()
