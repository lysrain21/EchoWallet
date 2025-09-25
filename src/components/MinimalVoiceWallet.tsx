/**
 * Echo Wallet - Minimal voice-first wallet interface
 * Pure voice experience tailored for blind and low-vision users.
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useWalletStore, useVoiceState } from '@/store'
import { VoiceWaveform } from './VoiceWaveform'
import { VoiceFeedbackModal } from './VoiceFeedbackModal'
import { commandService } from '@/services/commandService'
import { voiceService } from '@/services/voiceService'

export function MinimalVoiceWallet() {
  const { wallet } = useWalletStore()
  const voiceState = useVoiceState()
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false)

  // Handle voice feedback events
  const handleVoiceFeedback = useCallback((message: string) => {
    setFeedbackMessage(message)
    setShowFeedback(true)
  }, [])

  // Initialize voice service and welcome message
  useEffect(() => {
    const hasPlayedBefore = localStorage.getItem('echo-welcome-played')
    
    if (!hasPlayedBefore && !hasPlayedWelcome) {
      setTimeout(() => {
        const welcomeMessage = 'Welcome to Echo Wallet, a Web3 wallet built for blind and low-vision users. Press Space or tap the screen to start voice control.'
        voiceService.speak(welcomeMessage)
        handleVoiceFeedback(welcomeMessage)
        setHasPlayedWelcome(true)
        localStorage.setItem('echo-welcome-played', 'true')
      }, 1000)
    }

    // Listen to feedback from the voice service
    const originalSpeak = voiceService.speak.bind(voiceService)
    voiceService.speak = (text: string, options?: any) => {
      originalSpeak(text, options)
      handleVoiceFeedback(text)
    }

    // Global keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
      // Space starts listening
      if (event.code === 'Space' && !voiceState.isListening && !voiceState.isProcessing) {
        event.preventDefault()
        startVoiceInteraction()
      }
      
      // Escape stops listening
      if (event.key === 'Escape' && voiceState.isListening) {
        event.preventDefault()
        commandService.stopListening()
        handleVoiceFeedback('Voice listening stopped.')
      }

      // R repeats the last command
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault()
        if (voiceState.lastCommand) {
          const message = `Repeating last command: ${voiceState.lastCommand.parameters?.text || 'unknown command'}`
          voiceService.speak(message)
          handleVoiceFeedback(message)
        } else {
          const message = 'No command available to repeat.'
          voiceService.speak(message)
          handleVoiceFeedback(message)
        }
      }

      // F1 displays help
      if (event.key === 'F1') {
        event.preventDefault()
        showHelp()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [voiceState, hasPlayedWelcome, handleVoiceFeedback])

  // Start voice interaction
  const startVoiceInteraction = useCallback(() => {
    if (voiceState.isProcessing) {
      handleVoiceFeedback('The system is processing, please wait.')
      return
    }

    if (voiceState.isListening) {
      handleVoiceFeedback('Listening, please speak.')
      return
    }

    commandService.startListening()
    handleVoiceFeedback('Listening started. Please say your command.')
  }, [voiceState, handleVoiceFeedback])

  // Display help information
  const showHelp = useCallback(() => {
    const helpMessage = `
      Echo Wallet voice commands:
      Create wallet – generate a new wallet address
      Import wallet – recover using biometrics  
      Check balance – hear your current balance
      Transfer – start the guided transfer flow
      Check transaction – review transaction status
      
      Keyboard shortcuts:
      Space – start voice input
      Escape – stop listening
      R – repeat last command
      F1 – show this help
    `
    voiceService.speak(helpMessage)
    handleVoiceFeedback(helpMessage)
  }, [handleVoiceFeedback])

  // Handle tap events for touch devices
  const handleScreenTouch = useCallback(() => {
    if (!voiceState.isListening && !voiceState.isProcessing) {
      startVoiceInteraction()
    }
  }, [voiceState, startVoiceInteraction])

  return (
    <div 
      className="
        min-h-screen w-full
        bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
        flex items-center justify-center
        cursor-pointer select-none
        focus:outline-none
      "
      onClick={handleScreenTouch}
      onKeyDown={(e) => e.code === 'Space' && handleScreenTouch()}
      tabIndex={0}
      role="main"
      aria-label="Echo Wallet voice interaction interface"
    >
      {/* Primary waveform visualization */}
      <div className="relative w-full h-full max-w-4xl max-h-4xl aspect-square">
        <VoiceWaveform className="w-full h-full" />
        
        {/* Central hint text shown in specific states */}
        {!wallet && !voiceState.isListening && !voiceState.isProcessing && (
          <div className="
            absolute inset-0 
            flex flex-col items-center justify-center
            text-white/80 text-center
            pointer-events-none
          ">
            <h1 className="text-4xl md:text-6xl font-light mb-4 tracking-wide">
              Echo Wallet
            </h1>
            <p className="text-lg md:text-xl font-light mb-8">
              Voice-first Web3 wallet
            </p>
            <p className="text-sm md:text-base text-white/60 max-w-md">
              Press Space or tap the screen to start voice control
            </p>
          </div>
        )}

      {/* Wallet connection indicator */}
        {wallet && (
          <div className="
            absolute top-8 left-1/2 transform -translate-x-1/2
            bg-green-500/20 backdrop-blur-sm
            px-6 py-2 rounded-full
            text-green-100 text-sm font-medium
            border border-green-500/30
          ">
            Wallet connected
          </div>
        )}

      {/* Voice status indicator */}
        <div className="
          absolute bottom-8 left-1/2 transform -translate-x-1/2
          flex items-center space-x-4
          text-white/70 text-sm
        ">
          <div className={`
            w-3 h-3 rounded-full
            ${voiceState.isListening ? 'bg-green-500 animate-pulse' : ''}
            ${voiceState.isProcessing ? 'bg-yellow-500 animate-spin' : ''}
            ${!voiceState.isListening && !voiceState.isProcessing ? 'bg-blue-500' : ''}
          `} />
          <span>
            {voiceState.isListening && 'Listening...'}
            {voiceState.isProcessing && 'Processing...'}
            {!voiceState.isListening && !voiceState.isProcessing && 'Idle'}
          </span>
        </div>
      </div>

      {/* Voice feedback modal */}
      <VoiceFeedbackModal
        isVisible={showFeedback}
        message={feedbackMessage}
        onClose={() => setShowFeedback(false)}
        autoCloseDelay={4000}
      />

      {/* Hidden accessible content */}
      <div className="sr-only">
        <h1>Echo Wallet - Voice-first Web3 wallet</h1>
        <p>Ethereum wallet built for blind users with full voice control</p>
        <p>Current status: {
          voiceState.isListening ? 'Listening for voice input' :
          voiceState.isProcessing ? 'Processing voice command' :
          'Voice standby'
        }</p>
        {wallet && <p>Wallet connected, address: {wallet.address}</p>}
      </div>
    </div>
  )
}
