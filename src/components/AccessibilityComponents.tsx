/**
 * Echo Wallet - 可访问性按钮组件
 * 专为盲人用户优化的语音交互按钮
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useWalletStore, useVoiceState } from '@/store'
import { commandService } from '@/services/commandService'

interface VoiceButtonProps {
  className?: string
  children?: React.ReactNode
}

export function VoiceButton({ className = '', children }: VoiceButtonProps) {
  const voiceState = useVoiceState()
  const [isPressed, setIsPressed] = useState(false)

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 空格键激活语音
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault()
        if (!voiceState.isListening && !voiceState.isProcessing) {
          setIsPressed(true)
          commandService.startListening()
        }
      }
      
      // Escape键停止语音
      if (event.code === 'Escape') {
        event.preventDefault()
        commandService.stopListening()
        setIsPressed(false)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsPressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [voiceState])

  const handleClick = () => {
    if (voiceState.isListening) {
      commandService.stopListening()
    } else if (!voiceState.isProcessing) {
      commandService.startListening()
    }
  }

  const getButtonText = () => {
    if (voiceState.isProcessing) return '处理中...'
    if (voiceState.isListening) return '正在听...'
    return '点击说话'
  }

  const getAriaLabel = () => {
    if (voiceState.isProcessing) return '正在处理语音命令，请稍候'
    if (voiceState.isListening) return '正在监听语音输入，按Escape键停止'
    return '按空格键或点击开始语音输入'
  }

  return (
    <button
      onClick={handleClick}
      disabled={voiceState.isProcessing}
      className={`
        relative min-h-[80px] min-w-[200px] 
        bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
        text-white font-bold text-lg
        border-4 border-blue-800 rounded-lg
        focus:outline-none focus:ring-4 focus:ring-blue-300
        transition-all duration-200
        ${isPressed ? 'scale-95 bg-blue-800' : ''}
        ${voiceState.isListening ? 'animate-pulse bg-green-600' : ''}
        ${className}
      `}
      aria-label={getAriaLabel()}
      aria-pressed={voiceState.isListening}
      aria-live="polite"
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-col items-center justify-center space-y-2">
        {/* 语音图标 */}
        <div className="text-2xl" aria-hidden="true">
          {voiceState.isProcessing ? '⏳' : voiceState.isListening ? '🎤' : '🗣️'}
        </div>
        
        {/* 按钮文字 */}
        <span>{children || getButtonText()}</span>
        
        {/* 状态指示器 */}
        {voiceState.isListening && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        )}
      </div>
    </button>
  )
}

/**
 * 可访问性文本显示组件
 */
interface AccessibleTextProps {
  text: string
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  live?: 'off' | 'polite' | 'assertive'
  className?: string
  id?: string
}

export function AccessibleText({ 
  text, 
  level = 'h2', 
  live = 'polite',
  className = '',
  id
}: AccessibleTextProps) {
  const Tag = level

  return (
    <Tag
      id={id}
      className={`
        text-2xl font-bold text-gray-900 
        focus:outline-none focus:ring-2 focus:ring-blue-500 
        ${className}
      `}
      aria-live={live}
      tabIndex={0}
    >
      {text}
    </Tag>
  )
}

/**
 * 可访问性状态显示组件
 */
export function WalletStatus() {
  const { wallet, balance, isLoading, error } = useWalletStore()
  const voiceState = useVoiceState()

  if (isLoading) {
    return (
      <div
        className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
        aria-live="polite"
        role="status"
      >
        <AccessibleText text="正在加载..." live="assertive" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="p-4 bg-red-50 border border-red-200 rounded-lg"
        aria-live="assertive"
        role="alert"
      >
        <AccessibleText text={`错误：${error}`} live="assertive" />
      </div>
    )
  }

  if (!wallet) {
    return (
      <div
        className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        aria-live="polite"
      >
        <AccessibleText text="请创建或导入钱包" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 钱包连接状态 */}
      <div
        className="p-4 bg-green-50 border border-green-200 rounded-lg"
        aria-live="polite"
      >
        <AccessibleText 
          text="钱包已连接，可以开始语音操作"
          level="h3"
        />
      </div>

      {/* 语音状态 */}
      {voiceState.isListening && (
        <div
          className="p-4 bg-purple-50 border border-purple-200 rounded-lg"
          aria-live="assertive"
          role="status"
        >
          <AccessibleText 
            text="正在监听语音输入..."
            live="assertive"
          />
        </div>
      )}
    </div>
  )
}

/**
 * 键盘快捷键帮助组件
 */
export function KeyboardHelp() {
  const shortcuts = [
    { key: '空格键', action: '开始语音输入' },
    { key: 'Escape键', action: '停止语音输入' }
  ]

  return (
    <div
      className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
      role="region"
      aria-labelledby="keyboard-help-title"
    >
      <AccessibleText 
        id="keyboard-help-title"
        text="键盘快捷键"
        level="h3"
      />
      
      <ul className="mt-4 space-y-2" role="list">
        {shortcuts.map((shortcut, index) => (
          <li 
            key={index}
            className="text-lg text-gray-700"
            tabIndex={0}
          >
            <strong>{shortcut.key}</strong>：{shortcut.action}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * 可访问性按钮组件
 */
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ariaLabel?: string
  variant?: 'primary' | 'secondary' | 'danger'
}

export function AccessibleButton({ 
  children, 
  ariaLabel, 
  variant = 'primary',
  className = '',
  onClick,
  ...props 
}: AccessibleButtonProps) {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
  
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500", 
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 语音反馈
    if (ariaLabel) {
      // 可以添加轻微的语音提示
    }
    onClick?.(e)
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      aria-label={ariaLabel}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}
