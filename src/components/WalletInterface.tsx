/**
 * Echo Wallet - Main wallet interface
 * Voice-first experience designed for blind and low-vision users.
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useVoiceState } from '@/store'
import { 
  VoiceButton, 
  AccessibleText, 
  WalletStatus, 
  KeyboardHelp,
  AccessibleButton 
} from './AccessibilityComponents'
import { ContactManager } from './ContactManager'
import { voiceService } from '@/services/voiceService'

export function WalletInterface() {
  const voiceState = useVoiceState()
  const [activeTab, setActiveTab] = useState<'wallet' | 'contacts'>('wallet')
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false)

  // Initialize voice service side effects
  useEffect(() => {
    const hasPlayedBefore = localStorage.getItem('echo-welcome-played')

    if (!hasPlayedBefore && !hasPlayedWelcome) {
      setTimeout(() => {
        voiceService.speak('Welcome to Echo Wallet, a fully voice-controlled Ethereum wallet.')
        setHasPlayedWelcome(true)
        localStorage.setItem('echo-welcome-played', 'true')
      }, 1000)
    }

    // Replay last spoken command with the R key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault()
        if (voiceState.lastCommand) {
          voiceService.speak('Repeating the last command.')
        } else {
          voiceService.speak('There is no command to repeat yet.')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [voiceState.lastCommand, hasPlayedWelcome])

  // Voice command descriptions
  return (
    <div className="min-h-screen bg-gray-50 p-4" role="main">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page heading */}
        <header className="text-center">
          <AccessibleText 
            text="EchoWallet – Web3 Wallet" 
            level="h1" 
            className="text-3xl font-bold text-gray-900 mb-2"
          />
          <p className="text-gray-600">Fully voice driven, powered by ERC-4337 account abstraction.</p>
        </header>

        {/* Tabs */}
        <nav className="flex space-x-1 bg-white rounded-lg p-1" role="tablist">
          <AccessibleButton
            variant={activeTab === 'wallet' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('wallet')}
            className="flex-1 py-3"
            ariaLabel="Wallet overview"
            role="tab"
            aria-selected={activeTab === 'wallet'}
          >
            Wallet
          </AccessibleButton>
          
          <AccessibleButton
            variant={activeTab === 'contacts' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('contacts')}
            className="flex-1 py-3"
            ariaLabel="Contacts"
            role="tab"
            aria-selected={activeTab === 'contacts'}
          >
            Contacts
          </AccessibleButton>
        </nav>

        {/* Tab content */}
        <div role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          {activeTab === 'wallet' && (
            <WalletMainPanel voiceState={voiceState} />
          )}
          
          {activeTab === 'contacts' && (
            <ContactManager />
          )}
        </div>
      </div>
    </div>
  )
}

// Wallet main panel component
function WalletMainPanel({ voiceState }: { voiceState: ReturnType<typeof useVoiceState> }) {
  const lastCommandDescription = typeof voiceState.lastCommand?.parameters?.text === 'string'
    ? voiceState.lastCommand.parameters.text
    : voiceState.lastCommand?.type ?? null

  return (
    <div className="space-y-6">
      {/* Voice control */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <AccessibleText text="Voice Control" level="h2" className="mb-4" />
        <VoiceButton className="w-full py-6 text-lg">
          {voiceState.isListening ? 'Listening...' : 
           voiceState.isProcessing ? 'Processing...' : 
           'Hold Space or click to start speaking'}
        </VoiceButton>

        {voiceState.lastCommand && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Last command: {lastCommandDescription ?? 'Unknown'}
            </p>
          </div>
        )}
      </div>

      {/* Wallet status */}
      <WalletStatus />



      {/* Voice command tips */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <AccessibleText text="Voice Command Examples" level="h3" className="mb-3" />
        <ul className="space-y-2 text-sm text-green-800">
          <li>• "Create wallet" – generate a new wallet</li>
          <li>• "Import wallet" – sign in with biometrics</li>
          <li>• "Check balance" – hear the current balance</li>
          <li>• "Transfer" – send funds to a contact</li>
          <li>• "Show contacts" – list saved contacts</li>
        </ul>
      </div>

      {/* Keyboard shortcut helper */}
      <KeyboardHelp />
    </div>
  )
}
