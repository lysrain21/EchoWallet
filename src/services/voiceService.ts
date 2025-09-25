/**
 * Echo Wallet - Voice Recognition Service (refactored)
 * Handles speech input and speech output with additional optimization.
 */

import { VoiceCommand } from '@/types'
import { TTS_TEMPLATES, WALLET_CONFIG } from '@/config'
import { VoiceRecognitionOptimizer } from './voiceOptimizer'

// Speech recognition type declarations
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

class VoiceService {
  private recognition: any = null
  private synthesis: SpeechSynthesis | null = null
  private isListening = false
  private onCommandCallback?: (command: VoiceCommand) => void
  private onErrorCallback?: (error: string) => void

  constructor() {
    this.initSpeechRecognition()
    this.initSpeechSynthesis()
  }

  /**
   * Initialize speech recognition.
   */
  private initSpeechRecognition() {
    if (typeof window === 'undefined') return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition is not supported in this browser')
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.lang = WALLET_CONFIG.SPEECH_CONFIG.DEFAULT_LANGUAGE
    this.recognition.continuous = false
    this.recognition.interimResults = false
    this.recognition.maxAlternatives = WALLET_CONFIG.SPEECH_CONFIG.MAX_ALTERNATIVES

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0]
      if (result.isFinal && result[0].confidence > WALLET_CONFIG.SPEECH_CONFIG.CONFIDENCE_THRESHOLD) {
        const rawTranscript = result[0].transcript.trim()
        
        // Use the optimizer to post-process the transcript
        const optimizedTranscript = VoiceRecognitionOptimizer.optimizeText(rawTranscript)

        console.log(`🎤 Raw transcript: "${rawTranscript}"`)
        console.log(`✨ Optimized transcript: "${optimizedTranscript}"`)
        
        this.processVoiceInput(optimizedTranscript, result[0].confidence)
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)

      let errorMessage = 'Speech recognition failed. Please try again.'

      // Provide user-friendly messages for different error types
      switch (event.error) {
        case 'no-speech':
          // For no-speech errors, log only and avoid speaking an error
          console.log('🔇 No speech detected. Waiting for the user to speak again.')
          this.isListening = false
          // Pass a friendly error to the callback without speaking it aloud
          this.onErrorCallback?.('No speech detected')
          return
        case 'audio-capture':
          errorMessage = 'Unable to access the microphone. Please check the connection and allow microphone access in the browser.'
          break
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.'
          break
        case 'network':
          errorMessage = 'Network connection issue. Please check your connection and try again.'
          break
        case 'aborted':
          // User stopped the recognition manually; no error needs to be spoken
          this.isListening = false
          return
        case 'bad-grammar':
          errorMessage = 'Speech recognition encountered a grammar error. Please repeat your command clearly.'
          break
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service is unavailable. Please try again later.'
          break
        default:
          errorMessage = `Speech recognition encountered an issue: ${event.error}. Please try again.`
      }

      // Speak the error message and pass it to the callback
      this.speak(errorMessage)
      this.onErrorCallback?.(errorMessage)
      this.isListening = false
    }

    this.recognition.onend = () => {
      this.isListening = false
    }
  }

  /**
   * Initialize speech synthesis.
   */
  private initSpeechSynthesis() {
    if (typeof window === 'undefined') return
    this.synthesis = window.speechSynthesis
  }

  /**
   * Start listening for voice input.
   */
  startListening(onCommand: (command: VoiceCommand) => void, onError?: (error: string) => void) {
    if (!this.recognition) {
      onError?.('Speech recognition is not available')
      return
    }

    if (this.isListening) {
      this.stopListening()
    }

    this.onCommandCallback = onCommand
    this.onErrorCallback = onError
    this.isListening = true

    try {
      this.recognition.start()
    } catch (error) {
      this.isListening = false
      onError?.('Unable to start speech recognition')
    }
  }

  /**
   * Start listening for raw text (used during step-by-step flows).
   */
  startListeningForText(onText: (text: string) => void, onError?: (error: string) => void) {
    if (!this.recognition) {
      onError?.('Speech recognition is not available')
      return
    }

    if (this.isListening) {
      this.stopListening()
    }

    // Use a temporary callback that passes the raw transcript without parsing
    this.onCommandCallback = (command) => {
      // Pass the command text when available; otherwise fall back to the command type
      const text = command.parameters?.text || command.type
      onText(text)
    }
    this.onErrorCallback = onError
    this.isListening = true

    try {
      this.recognition.start()
    } catch (error) {
      this.isListening = false
      onError?.('Unable to start speech recognition')
    }
  }

  /**
   * Stop listening for voice input.
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  /**
   * Speak a message using speech synthesis.
   */
  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }) {
    if (!this.synthesis) {
      console.warn('Speech synthesis is not available')
      return
    }

    // Cancel any ongoing speech
    this.synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = WALLET_CONFIG.SPEECH_CONFIG.DEFAULT_LANGUAGE
    utterance.rate = options?.rate || 1
    utterance.pitch = options?.pitch || 1
    utterance.volume = options?.volume || 1

    console.log(`🔊 Speaking: "${text}"`)
    this.synthesis.speak(utterance)
  }

  /**
   * Speak using one of the predefined text-to-speech templates.
   */
  speakTemplate(template: keyof typeof TTS_TEMPLATES, variables?: Record<string, string>) {
    let text = TTS_TEMPLATES[template]
    
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        text = text.replace(`{${key}}`, value)
      })
    }

    this.speak(text)
  }

  /**
   * Handle voice input that has already been optimized.
   */
  private processVoiceInput(transcript: string, confidence: number) {
    console.log('🎤 Processing voice input:', transcript, 'confidence:', confidence)

    // If the consumer expects raw text (step-by-step flow), create a pseudo command
    const command = this.parseCommand(transcript)
    if (command) {
      command.confidence = confidence
      this.onCommandCallback?.(command)
    } else {
      // Fallback: deliver the transcript as a generic text command
      const textCommand: VoiceCommand = {
        type: 'text_input',
        parameters: { text: transcript },
        confidence: confidence
      }
      this.onCommandCallback?.(textCommand)
    }
  }

  /**
   * Parse optimized transcript into a high-level command.
   */
  private parseCommand(transcript: string): VoiceCommand | null {
    const text = transcript.toLowerCase()

    if (text.includes('create wallet') || text.includes('new wallet') || text.includes('generate wallet')) {
      return { type: 'create_wallet', confidence: 0 }
    }

    if (
      text.includes('import wallet') ||
      text.includes('restore wallet') ||
      text.includes('recover wallet') ||
      text.includes('sign in wallet') ||
      text.includes('biometric') ||
      text.includes('fingerprint') ||
      text.includes('face id') ||
      text.includes('face unlock')
    ) {
      return { type: 'import_wallet', confidence: 0 }
    }

    if (text.includes('balance') || text.includes('check balance') || text.includes('show balance')) {
      return { type: 'balance', confidence: 0 }
    }

    if (
      text.includes('contact') ||
      text.includes('contacts') ||
      text.includes('address book') ||
      text.includes('show contacts') ||
      text.includes('view contacts') ||
      text.includes('favorite contacts')
    ) {
      console.log('🔍 Recognized contacts command:', transcript)
      return {
        type: 'contacts',
        parameters: { text: transcript },
        confidence: 0
      }
    }

    if (text.includes('transfer') || text.includes('send') || text.includes('pay')) {
      const transferInfo = this.parseSimpleTransfer(transcript)

      if (transferInfo && transferInfo.type !== 'amount_only') {
        return {
          type: 'transfer',
          parameters: {
            text: transcript,
            ...transferInfo,
            token: transferInfo.token || 'eth',
            isComplete: true
          },
          confidence: 0
        }
      }

      return {
        type: 'transfer',
        parameters: {
          text: transcript,
          ...(transferInfo?.type === 'amount_only'
            ? { amount: transferInfo.amount, token: 'eth' }
            : {}),
          isComplete: false
        },
        confidence: 0
      }
    }

    if (text.includes('transaction status') || text.includes('check transaction') || text.includes('track transaction')) {
      const hash = this.extractTransactionHash(text)
      return {
        type: 'transaction_status',
        parameters: { hash },
        confidence: 0
      }
    }

    if (text.includes('switch network') || text.includes('change network') || text.includes('mainnet') || text.includes('testnet')) {
      return {
        type: 'switch_network',
        parameters: { text: transcript },
        confidence: 0
      }
    }

    return null
  }

  /**
   * Extract a transaction hash from free-form text.
   */
  private extractTransactionHash(text: string): string | undefined {
    const hashPattern = /(0x[a-fA-F0-9]{64})/
    const match = text.match(hashPattern)
    return match?.[0]
  }

  /**
   * Parse transfer-related utterances and extract useful parameters.
   */
  private parseSimpleTransfer(transcript: string): any {
    const optimizedText = VoiceRecognitionOptimizer.optimizeText(transcript)
    console.log(`🔍 Parsing transfer command: "${optimizedText}"`)

    const parsed = VoiceRecognitionOptimizer.parseTransferCommand(optimizedText)
    if (parsed && parsed.amount) {
      const validation = VoiceRecognitionOptimizer.validateAmount(parsed.amount)
      if (!validation.isValid) {
        console.log(`❌ Amount validation failed: ${validation.message}`)
        return null
      }

      return {
        ...parsed,
        amount: validation.corrected,
        token: parsed.token || 'eth'
      }
    }

    const amountMatch = optimizedText.match(/([0-9.]+)/i)
    if (amountMatch) {
      const validation = VoiceRecognitionOptimizer.validateAmount(amountMatch[1])
      if (validation.isValid) {
        console.log(`✅ Extracted amount only: ${validation.corrected} ETH`)
        return {
          type: 'amount_only',
          amount: validation.corrected,
          token: 'eth'
        }
      }
    }

    console.log('❌ Failed to parse transfer command')
    return null
  }

  /**
   * Get the current speech service state.
   */
  getState() {
    return {
      isListening: this.isListening,
      isSupported: !!this.recognition && !!this.synthesis
    }
  }
}

// Singleton instance
export const voiceService = new VoiceService()

// Global type declarations
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}
