'use client'

import React, { useState } from 'react'
import { WalletInterface } from '@/components/WalletInterface'
import { MinimalVoiceWallet } from '@/components/MinimalVoiceWallet'
import Spline from '@splinetool/react-spline'
import Link from 'next/link'

export default function WalletPage() {
  const [useMinimalInterface, setUseMinimalInterface] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('echo-interface-mode')
      return savedMode ? savedMode === 'minimal' : true // 默认使用 minimal mode
    }
    return true // 默认使用 minimal mode
  })

  const toggleInterface = () => {
    const nextMode = !useMinimalInterface
    setUseMinimalInterface(nextMode)
    localStorage.setItem('echo-interface-mode', nextMode ? 'minimal' : 'standard')
  }

  const toggleButtonClass = useMinimalInterface
    ? 'fixed top-5 right-4 z-50 rounded-full border border-white/25 bg-slate-950/60 backdrop-blur-xl px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-white/40'
    : 'fixed top-5 right-4 z-50 rounded-full border border-blue-400/40 bg-slate-950/60 backdrop-blur-xl px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-blue-300/60'

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
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

      <div className="relative z-20">
        {useMinimalInterface ? <MinimalVoiceWallet /> : <WalletInterface />}
      </div>
      
      {/* Navigation and Toggle Buttons */}
      <Link
        href="/"
        className="fixed top-5 left-5 z-50 rounded-full border border-white/20 bg-slate-950/60 backdrop-blur-xl px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-white/40"
        aria-label="Back to home page"
      >
        ← Home
      </Link>
      
      <button
        type="button"
        onClick={toggleInterface}
        className={toggleButtonClass}
        aria-label={useMinimalInterface ? 'Switch to standard interface' : 'Switch to minimal interface'}
      >
        {useMinimalInterface ? 'STANDARD MODE' : 'MINIMAL MODE'}
      </button>
    </div>
  )
}
