/**
 * Echo Wallet - Minimal voice-first wallet interface
 * Pure voice experience tailored for blind and low-vision users.
 */

'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useWalletStore, useVoiceState } from '@/store'
import { VoiceFeedbackModal } from './VoiceFeedbackModal'
import { commandService } from '@/services/commandService'
import { voiceService } from '@/services/voiceService'
import { AccessibleText, KeyboardHelp, ReadForMeButton } from './AccessibilityComponents'
import Spline from '@splinetool/react-spline'

export function MinimalVoiceWallet() {
  const { wallet, sharedAddress } = useWalletStore()
  const voiceState = useVoiceState()
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  // Handle voice feedback events
  const handleVoiceFeedback = useCallback((message: string) => {
    setFeedbackMessage(message)
    setShowFeedback(true)
  }, [])

  const { isListening, isProcessing, lastCommand } = voiceState

  useEffect(() => {
    setCopyState('idle')
  }, [sharedAddress])

  useEffect(() => {
    if (copyState === 'copied') {
      const timer = window.setTimeout(() => setCopyState('idle'), 2400)
      return () => window.clearTimeout(timer)
    }
  }, [copyState])

  const startVoiceInteraction = useCallback(() => {
    if (isProcessing) {
      handleVoiceFeedback('The system is processing, please wait.')
      return
    }

    if (isListening) {
      handleVoiceFeedback('Listening, please speak.')
      return
    }

    commandService.startListening()
    handleVoiceFeedback('Listening started. Please say your command.')
  }, [handleVoiceFeedback, isListening, isProcessing])

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
  }, [])

  const handleScreenTouch = useCallback(() => {
    if (!isListening && !isProcessing) {
      startVoiceInteraction()
    }
  }, [isListening, isProcessing, startVoiceInteraction])

  type SpeakOptions = { rate?: number; pitch?: number; volume?: number }

  const formattedSharedAddress = useMemo(() => {
    if (!sharedAddress) return ''
    const normalized = sharedAddress.trim()
    const prefix = normalized.startsWith('0x') ? '0x' : ''
    const body = normalized.startsWith('0x') ? normalized.slice(2) : normalized
    const grouped = body.toUpperCase().match(/.{1,4}/g)?.join(' ') ?? body.toUpperCase()
    return prefix ? `${prefix} ${grouped}` : grouped
  }, [sharedAddress])

  const handleCopyAddress = useCallback(async () => {
    if (!sharedAddress) return

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(sharedAddress)
        setCopyState('copied')
        voiceService.speak('Address copied to clipboard.')
      } else {
        throw new Error('Clipboard API unavailable')
      }
    } catch (error) {
      console.error('Copy address failed:', error)
      setCopyState('failed')
      voiceService.speak('Unable to copy the address automatically. Please copy it manually from the screen.')
    }
  }, [sharedAddress])

  // Initialize voice service and welcome message
  useEffect(() => {
    const originalSpeak = voiceService.speak.bind(voiceService) as typeof voiceService.speak
    voiceService.speak = (text: string, options?: SpeakOptions) => {
      originalSpeak(text, options)
      handleVoiceFeedback(text)
    }

    const hasPlayedBefore = localStorage.getItem('echo-welcome-played')
    
    if (!hasPlayedBefore && !hasPlayedWelcome) {
      setTimeout(() => {
        const welcomeMessage = 'Welcome to Echo Wallet, a Web3 wallet built for blind and low-vision users. Press Space or tap the screen to start voice control.'
        voiceService.speak(welcomeMessage)
        setHasPlayedWelcome(true)
        localStorage.setItem('echo-welcome-played', 'true')
      }, 1000)
    }

    // Global keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
      // Space starts listening
      if (event.code === 'Space' && !isListening && !isProcessing) {
        event.preventDefault()
        startVoiceInteraction()
      }
      
      // Escape stops listening
      if (event.key === 'Escape' && isListening) {
        event.preventDefault()
        commandService.stopListening()
        handleVoiceFeedback('Voice listening stopped.')
      }

      // R repeats the last command
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault()
        if (lastCommand) {
          const message = `Repeating last command: ${lastCommand.parameters?.text || 'unknown command'}`
          voiceService.speak(message)
        } else {
          voiceService.speak('No command available to repeat.')
        }
      }

      // F1 displays help
      if (event.key === 'F1') {
        event.preventDefault()
        showHelp()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      voiceService.speak = originalSpeak
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleVoiceFeedback, hasPlayedWelcome, isListening, isProcessing, lastCommand, showHelp, startVoiceInteraction])

  const lastCommandDescription = useMemo(() => {
    if (typeof lastCommand?.parameters?.text === 'string') {
      return lastCommand.parameters.text
    }
    if (lastCommand?.type) return lastCommand.type
    return 'No voice command yet'
  }, [lastCommand])

  const primaryStatus = useMemo(() => {
    if (isProcessing) return 'Processing your request…'
    if (isListening) return 'Listening…'
    return 'Tap or press Space to speak'
  }, [isListening, isProcessing])

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Spline 3D Background */}
      <div className="fixed inset-0 z-0" aria-hidden>
        <Spline
          scene="https://prod.spline.design/sf2J4a8epSyBmnlL/scene.splinecode"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      {/* Original gradient overlays for subtle enhancement */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-[1]" aria-hidden>
        <div className="absolute -top-24 left-[-10%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(58,123,255,0.08),_transparent_60%)] blur-3xl" />
        <div className="absolute bottom-[-18%] right-[-12%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(100,234,132,0.08),_transparent_60%)] blur-3xl" />
      </div>

      <main
        className="relative z-20 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center"
        role="main"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.code === 'Space') {
            event.preventDefault()
            handleScreenTouch()
          }
        }}
        aria-label="Echo Wallet minimal voice interface"
      >
        <AccessibleText text="Echo Wallet" level="h1" className="text-4xl font-light text-white md:text-5xl" />
        <p className="mt-3 max-w-xl text-sm text-slate-300">
          Minimal mode focuses entirely on voice. When you’re ready, say “create wallet”, “check balance”, or any supported command—Echo Wallet listens and responds instantly.
        </p>

        <button
          type="button"
          onClick={handleScreenTouch}
          className={`relative mt-10 flex h-56 w-56 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-medium uppercase tracking-[0.35em] backdrop-blur-xl transition focus:outline-none focus:ring-4 focus:ring-blue-300/40 md:h-64 md:w-64 ${isListening ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''}`}
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/40 to-transparent blur-2xl" aria-hidden />
          <span className="absolute inset-4 rounded-full bg-slate-950/60" aria-hidden />
          <span className="relative text-base font-semibold text-white">
            {primaryStatus}
          </span>
          {isListening && (
            <span className="absolute inset-0 rounded-full border border-emerald-400/60" aria-hidden />
          )}
          {isProcessing && (
            <span className="absolute inset-0 rounded-full border border-amber-400/60 animate-spin" aria-hidden />
          )}
        </button>

        <div className="mt-8 w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-6 text-left text-sm text-slate-200">
          <h2 className="text-xs uppercase tracking-[0.3em] text-slate-400">Recent command</h2>
          <p className="mt-2 text-base text-white">{lastCommandDescription}</p>
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">Quick prompts</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• “Create wallet”</li>
            <li>• “Import wallet”</li>
            <li>• “Transfer 0.1 eth to Alice”</li>
            <li>• “Show contacts”</li>
            <li>• “Read the address”</li>
          </ul>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
            <KeyboardHelp />
          </div>
        </div>

        {sharedAddress && (
          <div className="mt-6 w-full max-w-lg rounded-3xl border border-emerald-300/40 bg-emerald-500/10 p-6 text-left text-slate-100 shadow-[0_12px_45px_rgba(16,185,129,0.25)]">
            <h2 className="text-xs uppercase tracking-[0.35em] text-emerald-100/80">Shareable address</h2>
            <p className="mt-4 text-xl font-semibold tracking-[0.4em] text-white/90">
              <span className="block break-words">{formattedSharedAddress}</span>
            </p>
            <p className="mt-3 text-xs text-emerald-100/75">
              Ask a friend to copy this line or scan it into their wallet app for a transfer.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCopyAddress}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-400/10 px-5 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/20 focus:outline-none focus:ring-4 focus:ring-emerald-300/40"
              >
                <span>{copyState === 'copied' ? 'Copied!' : copyState === 'failed' ? 'Copy failed' : 'Copy address'}</span>
              </button>
              <span className="text-xs text-emerald-100/70" aria-live="polite">
                {copyState === 'copied' && 'Address copied to clipboard.'}
                {copyState === 'failed' && 'Please copy manually.'}
              </span>
            </div>
          </div>
        )}
      </main>

      <VoiceFeedbackModal
        isVisible={showFeedback}
        message={feedbackMessage}
        onClose={() => setShowFeedback(false)}
        autoCloseDelay={4000}
      />

      {/* Read for Me Button */}
      <ReadForMeButton />

      <div className="sr-only">
        <h1>Echo Wallet - Voice-first Web3 wallet</h1>
        <p>Ethereum wallet built for blind users with full voice control</p>
        <p>Current status: {isListening ? 'Listening for voice input' : isProcessing ? 'Processing voice command' : 'Voice standby'}</p>
        {wallet && <p>Wallet connected, address: {wallet.address}</p>}
      </div>
    </div>
  )
}
