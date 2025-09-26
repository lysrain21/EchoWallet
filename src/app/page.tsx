'use client'

import React, { useState } from 'react'
import { WalletInterface } from '@/components/WalletInterface'
import { MinimalVoiceWallet } from '@/components/MinimalVoiceWallet'

export default function HomePage() {
  const [useMinimalInterface, setUseMinimalInterface] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('echo-interface-mode') === 'minimal'
    }
    return false
  })

  const toggleInterface = () => {
    const nextMode = !useMinimalInterface
    setUseMinimalInterface(nextMode)
    localStorage.setItem('echo-interface-mode', nextMode ? 'minimal' : 'standard')
  }

  const toggleButtonClass = useMinimalInterface
    ? 'fixed top-5 right-5 z-50 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white backdrop-blur-xl transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/40'
    : 'fixed top-5 right-5 z-50 rounded-full border border-blue-400/40 bg-blue-500/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white backdrop-blur-xl transition hover:bg-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-300/60'

  return (
    <>
      {useMinimalInterface ? <MinimalVoiceWallet /> : <WalletInterface />}
      <button
        type="button"
        onClick={toggleInterface}
        className={toggleButtonClass}
        aria-label={useMinimalInterface ? 'Switch to standard interface' : 'Switch to minimal interface'}
      >
        {useMinimalInterface ? 'STANDARD MODE' : 'MINIMAL MODE'}
      </button>
    </>
  )
}
