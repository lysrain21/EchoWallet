/**
 * Echo Wallet - 主页面
 * 提供标准界面和极简语音界面的切换
 */

'use client'

import React, { useState } from 'react'
import { WalletInterface } from '@/components/WalletInterface'
import { MinimalVoiceWallet } from '@/components/MinimalVoiceWallet'

export default function HomePage() {
  const [useMinimalInterface, setUseMinimalInterface] = useState(() => {
    // 检查用户偏好设置
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

  // 渲染极简语音界面
  if (useMinimalInterface) {
    return (
      <>
        <MinimalVoiceWallet />
        
        {/* 界面切换按钮 - 位于角落，不干扰主要交互 */}
        <button
          onClick={toggleInterface}
          className="
            fixed top-4 right-4 z-50
            bg-gray-800/80 backdrop-blur-sm
            text-white text-sm px-3 py-2 rounded-lg
            hover:bg-gray-700/80 transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
          aria-label="切换到标准界面"
        >
          标准界面
        </button>
      </>
    )
  }

  // 渲染标准界面
  return (
    <>
      <WalletInterface />
      
      {/* 界面切换按钮 */}
      <button
        onClick={toggleInterface}
        className="
          fixed top-4 right-4 z-50
          bg-blue-600 text-white text-sm px-3 py-2 rounded-lg
          hover:bg-blue-700 transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-300
        "
        aria-label="切换到极简语音界面"
      >
        极简界面
      </button>
    </>
  )
}
