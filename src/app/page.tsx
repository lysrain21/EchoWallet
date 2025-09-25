/**
 * Echo Wallet - Main page
 * Allows switching between the standard and minimal voice interfaces.
 */

'use client'

import React, { useState } from 'react'
import { WalletInterface } from '@/components/WalletInterface'
import { MinimalVoiceWallet } from '@/components/MinimalVoiceWallet'

export default function HomePage() {
  const [useMinimalInterface, setUseMinimalInterface] = useState(() => {
    // Load user preference for interface mode
    if (typeof window !== 'undefined') {
      return localStorage.getItem('echo-interface-mode') === 'minimal'
    }
    return false
  })

  const toggleInterface = () => {
    const newMode = !useMinimalInterface
    setUseMinimalInterface(newMode)
    localStorage.setItem('echo-interface-mode', newMode ? 'minimal' : 'standard')
  }

  // Render minimal voice interface
  if (useMinimalInterface) {
    return (
      <>
        <MinimalVoiceWallet />
        
        {/* Toggle button in the corner */}
        <button
          onClick={toggleInterface}
          className="
            fixed top-4 right-4 z-50
            bg-gray-800/80 backdrop-blur-sm
            text-white text-sm px-3 py-2 rounded-lg
            hover:bg-gray-700/80 transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
          aria-label="Switch to standard interface"
        >
          Standard interface
        </button>
      </>
    )
  }

  // Render standard interface
  return (
    <>
      <WalletInterface />
      
      {/* Toggle button */}
      <button
        onClick={toggleInterface}
        className="
          fixed top-4 right-4 z-50
          bg-blue-600 text-white text-sm px-3 py-2 rounded-lg
          hover:bg-blue-700 transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-300
        "
        aria-label="Switch to minimal voice interface"
      >
        Minimal interface
      </button>
    </>
  )
}
