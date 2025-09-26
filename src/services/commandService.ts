/**
 * Echo Wallet - Voice command service
 * Coordinates speech recognition with wallet operations.
 */

import { VoiceCommand, TransferRequest, TokenBalance } from '@/types'
import { voiceService } from './voiceService'
import { walletService } from './walletService'
import { useWalletStore } from '@/store'
import { contactsService } from './contactsService'
import { VoiceRecognitionOptimizer } from './voiceOptimizer'

class CommandService {
  private isProcessing = false

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
    const { setVoiceState, setLoading, setError, transfer } = useWalletStore.getState()
    const parameterText = this.getParameterString(command.parameters, 'text')
    const isCompleteTransfer = this.getParameterBoolean(command.parameters, 'isComplete')

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
          if (transfer.isActive) {
            await this.handleTransferStepInput(parameterText ?? '')
          } else {
            // Determine whether the command already includes full transfer details
            if (isCompleteTransfer) {
              // For complete transfer commands, use the optimized flow
              await this.handleCompleteTransferCommand(command.parameters)
            } else {
              // For partial commands (e.g., just "transfer"), start the guided flow
              await this.startStepByStepTransferFlow()
            }
          }
          break

        case 'contacts':
          await this.handleContactCommand(parameterText ?? '')
          break

        case 'read_address':
          await this.handleReadAddress()
          break

        case 'text_input':
          // Handle text input during the transfer flow
          if (transfer.isActive) {
            await this.handleTransferStepInput(parameterText ?? '')
          } else {
            voiceService.speak('Sorry, I did not understand that command.')
          }
          break

        case 'switch_network':
          const rawText = (parameterText ?? '').toLowerCase()
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
          await this.handleTransactionStatus(this.getParameterString(command.parameters, 'hash'))
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
   * Handle read address command
   */
  private async handleReadAddress() {
    const { wallet, setSharedAddress } = useWalletStore.getState()

    if (!wallet) {
      voiceService.speak('No wallet is available yet. Please create or import a wallet first.')
      return
    }

    setSharedAddress(wallet.address)

    const spokenAddress = wallet.address.split('').join(' ')
    voiceService.speak(
      `Your wallet address is ${spokenAddress}. The full address is now displayed on screen for sharing.`,
      { rate: 0.95 }
    )
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
          const text = this.getParameterString(confirmCommand.parameters, 'text') || ''
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
      const tokens: TokenBalance[] = []
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
  private extractMnemonic(): string | null {
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
          const text = (this.getParameterString(confirmCommand.parameters, 'text') || '').toLowerCase()
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
        useWalletStore.getState().setTransferState({
          isActive: true,
          step: 'confirm',
          recipient: {
            type: 'contact',
            value: contact.address,
            displayName: contact.name
          },
          amount: optimized.amount,
        })
        
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
          const { transfer } = useWalletStore.getState()
          // Ignore "no speech" errors and prompt again gently
          if (error.includes('No speech detected')) {
            // voiceService already handled the spoken feedback
            setTimeout(() => {
              if (transfer.isActive && transfer.step === 'recipient') {
                this.waitForRecipientInput()
              }
            }, 2000)
            return
          }
          
          this.cancelTransferFlow('Too many speech recognition failures')
        }
      )
    }, 1000)
  }

  /**
   * Handle transfer step input
   */
  private async handleTransferStepInput(input: string) {
    const { transfer } = useWalletStore.getState()
    if (!transfer.isActive) return

    // Handle cancel commands
    if (input.includes('cancel') || input.includes('exit')) {
      this.cancelTransferFlow('User cancelled')
      return
    }

    switch (transfer.step) {
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
    const { setTransferState } = useWalletStore.getState()
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
      setTransferState({
        recipient: {
          type: 'contact',
          value: contact.address,
          displayName: contact.name
        },
        step: 'amount'
      })
      voiceService.speak(`Recipient: ${contact.name}. Please specify the transfer amount now.`)
      this.waitForAmountInput()
      return
    }

    // Check whether the input is a wallet address
    const addressMatch = input.match(/(0x[a-fA-F0-9]{40})/)
    if (addressMatch && walletService.isValidAddress(addressMatch[1])) {
      setTransferState({
        recipient: {
          type: 'address',
          value: addressMatch[1]
        },
        step: 'amount'
      })
      const shortAddress = `${addressMatch[1].slice(0, 6)}...${addressMatch[1].slice(-4)}`
      voiceService.speak(`Recipient address: ${shortAddress}. Please specify the transfer amount now.`)
      this.waitForAmountInput()
      return
    }

    // No match found
    this.cancelTransferFlow('Could not recognize the recipient information.')
  }

  /**
   * Wait for amount input
   */
  private waitForAmountInput() {
    setTimeout(() => {
      voiceService.startListeningForText(
        (text) => this.handleTransferStepInput(text),
        (error) => {
          const { transfer } = useWalletStore.getState()
          // Ignore "no speech" errors and prompt again gently
          if (error.includes('No speech detected')) {
            // voiceService already handled the spoken feedback
            setTimeout(() => {
              if (transfer.isActive && transfer.step === 'amount') {
                this.waitForAmountInput()
              }
            }, 2000)
            return
          }
          
          this.cancelTransferFlow('Too many speech recognition failures')
        }
      )
    }, 1000)
  }

  /**
   * Handle amount input
   */
  private async handleAmountInput(input: string) {
    const { setTransferState } = useWalletStore.getState()
    // Normalize the amount input
    const optimizedInput = VoiceRecognitionOptimizer.optimizeText(input)
    
    // Extract numeric amount only
    const amountMatch = optimizedInput.match(/([0-9.]+)/i)
    
    if (!amountMatch) {
      this.cancelTransferFlow('Could not identify the amount.')
      return
    }

    const amount = amountMatch[1]

    // Validate the amount
    const validation = VoiceRecognitionOptimizer.validateAmount(amount)
    if (!validation.isValid) {
      this.cancelTransferFlow('Invalid amount format.')
      return
    }

    setTransferState({ amount: validation.corrected, step: 'confirm' })
    voiceService.speak(`Transfer amount: ${validation.corrected} ETH`)
    this.showTransferSummary()
  }

  /**
   * Present transfer summary and await confirmation
   */
  private showTransferSummary() {
    const { transfer } = useWalletStore.getState()
    const recipientInfo = transfer.recipient!.displayName || 
                         `address ${transfer.recipient!.value.slice(0, 6)}...${transfer.recipient!.value.slice(-4)}`
    
    const summary = `Please confirm the transfer: send ${transfer.amount} ETH to ${recipientInfo}. Say "confirm" to execute the transfer or "cancel" to exit.`
    
    voiceService.speak(summary)
    this.waitForConfirmation()
  }

  /**
   * Wait for final confirmation
   */
  private waitForConfirmation() {
    console.log('⏳ Waiting for final confirmation...')
    const { transfer } = useWalletStore.getState()
    console.log('🔍 Current transfer state:', transfer)
    
    setTimeout(() => {
      voiceService.startListeningForText(
        (text) => {
          console.log('🎤 Received speech input during confirmation step:', text)
          const { transfer } = useWalletStore.getState()
          console.log('📊 Current flow state:', {
            isActive: transfer.isActive,
            step: transfer.step,
            recipient: transfer.recipient?.displayName || transfer.recipient?.value,
            amount: transfer.amount
          })
          this.handleTransferStepInput(text)
        },
        (error) => {
          console.log('❌ Speech recognition error during confirmation step:', error)
          const { transfer } = useWalletStore.getState()
          // Ignore "no speech" errors and prompt again gently
          if (error.includes('No speech detected')) {
            // voiceService already handled the spoken feedback
            setTimeout(() => {
              if (transfer.isActive && transfer.step === 'confirm') {
                voiceService.speak('Please say "confirm" to execute the transfer or "cancel" to exit.')
                this.waitForConfirmation()
              }
            }, 2000)
            return
          }
          
          this.cancelTransferFlow('Too many speech recognition failures')
        }
      )
    }, 1000)
  }

  /**
   * Handle final confirmation input
   */
  private async handleConfirmationInput(input: string) {
    console.log('🔍 Handling confirmation input:', input)
    const { transfer } = useWalletStore.getState()
    console.log('📊 Transfer state at confirmation:', {
      isActive: transfer.isActive,
      step: transfer.step,
      recipient: transfer.recipient,
      amount: transfer.amount,
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
      voiceService.speak('Please clearly say "confirm" to execute the transfer or "cancel" to exit.')
      this.waitForConfirmation()
    }
  }

  /**
   * Execute step-by-step transfer
   */
  private async executeStepTransfer() {
    const { wallet, transfer } = useWalletStore.getState()
    
    console.log('🚀 Starting step-by-step transfer')
    console.log('💰 Transfer details:', {
      recipient: transfer.recipient,
      amount: transfer.amount
    })
    
    if (!wallet || !transfer.recipient) {
      console.error('❌ Transfer information is incomplete')
      this.cancelTransferFlow('Transfer information is incomplete')
      return
    }

    const transferRequest: TransferRequest = {
      to: transfer.recipient.value,
      amount: transfer.amount,
      token: undefined, // ETH only
      tokenSymbol: 'eth'
    }

    try {
      voiceService.speak('Executing the transfer. Please wait...')
      console.log('📤 Sending transfer request:', transferRequest)
      
      // Mark contact as used when applicable
      if (transfer.recipient.type === 'contact') {
        const contact = contactsService.findContactByAddress(transfer.recipient.value)
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
    voiceService.speak(`Transfer cancelled: ${reason}`)
    this.resetTransferSteps()
  }

  /**
   * Reset transfer steps
   */
  private resetTransferSteps() {
    useWalletStore.getState().setTransferState({
      isActive: false,
      step: 'idle',
      recipient: null,
      amount: '',
    })
  }

  /**
   * Start guided step-by-step transfer flow
   */
  private async startStepByStepTransferFlow() {
    const { wallet, setTransferState } = useWalletStore.getState()
    
    if (!wallet) {
      voiceService.speak('Please create or import a wallet first.')
      return
    }

    // Reset transfer state
    setTransferState({
      isActive: true,
      step: 'recipient',
      recipient: null,
      amount: '',
    })

    // Begin by asking for the contact
    voiceService.speak('Starting transfer flow. Please say the contact name.')
    this.waitForRecipientInput()
  }

  private getParameterString(
    params: Record<string, unknown> | undefined,
    key: string
  ): string | undefined {
    const value = params?.[key]
    return typeof value === 'string' ? value : undefined
  }

  private getParameterBoolean(
    params: Record<string, unknown> | undefined,
    key: string
  ): boolean {
    const value = params?.[key]
    return typeof value === 'boolean' ? value : false
  }
}

// Singleton instance
export const commandService = new CommandService()
