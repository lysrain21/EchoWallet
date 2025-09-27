'use client'

import React, { useState, useEffect } from 'react'
import { WalletInterface } from '@/components/WalletInterface'
import { MinimalVoiceWallet } from '@/components/MinimalVoiceWallet'
import Spline from '@splinetool/react-spline'
import Link from 'next/link'

export default function WalletPage() {
  const [useMinimalInterface, setUseMinimalInterface] = useState(true) // 默认使用 minimal mode
  const [isClient, setIsClient] = useState(false)

  // 确保客户端渲染
  useEffect(() => {
    setIsClient(true)
    // 从 localStorage 读取保存的模式
    const savedMode = localStorage.getItem('echo-interface-mode')
    if (savedMode) {
      setUseMinimalInterface(savedMode === 'minimal')
    }
  }, [])

  const toggleInterface = () => {
    const nextMode = !useMinimalInterface
    setUseMinimalInterface(nextMode)
    if (isClient) {
      localStorage.setItem('echo-interface-mode', nextMode ? 'minimal' : 'standard')
    }
  }

  const toggleButtonClass = useMinimalInterface
    ? 'rounded-full border border-white/20 bg-slate-950/50 backdrop-blur-xl px-4 py-2 text-[11px] font-medium uppercase tracking-[0.35em] text-white/90 transition-colors duration-200 hover:text-white focus:outline-none'
    : 'rounded-full border border-blue-400/30 bg-slate-950/50 backdrop-blur-xl px-4 py-2 text-[11px] font-medium uppercase tracking-[0.35em] text-white/90 transition-colors duration-200 hover:text-white focus:outline-none'

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
      <div className="fixed top-5 left-5 z-50 flex gap-3">
        <Link
          href="/"
          className="rounded-full border border-white/20 bg-slate-950/50 backdrop-blur-xl px-4 py-2 text-[11px] font-medium uppercase tracking-[0.35em] text-white/90 transition-colors duration-200 hover:text-white focus:outline-none"
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
    </div>
  )
}
