/**
 * Echo Wallet - Accessibility components
 * Voice-first controls optimized for blind and low-vision users.
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Space starts listening
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault()
        if (!voiceState.isListening && !voiceState.isProcessing) {
          setIsPressed(true)
          commandService.startListening()
        }
      }
      
      // Escape stops listening
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
    if (voiceState.isProcessing) return 'Processing...'
    if (voiceState.isListening) return 'Listening...'
    return 'Click to speak'
  }

  const getAriaLabel = () => {
    if (voiceState.isProcessing) return 'Processing your voice command, please wait.'
    if (voiceState.isListening) return 'Listening for voice input. Press Escape to stop.'
    return 'Press Space or click to start voice input.'
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
        {/* Voice icon */}
        <div className="text-2xl" aria-hidden="true">
          {voiceState.isProcessing ? '⏳' : voiceState.isListening ? '🎤' : '🗣️'}
        </div>
        
        {/* Button label */}
        <span>{children || getButtonText()}</span>
        
        {/* Status indicator */}
        {voiceState.isListening && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        )}
      </div>
    </button>
  )
}

/**
 * Accessible text display component
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
 * Accessible wallet status component
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
        <AccessibleText text="Loading..." live="assertive" />
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
        <AccessibleText text={`Error: ${error}`} live="assertive" />
      </div>
    )
  }

  if (!wallet) {
    return (
      <div
        className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        aria-live="polite"
      >
        <AccessibleText text="Please create or import a wallet." />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Wallet connection state */}
      <div
        className="p-4 bg-green-50 border border-green-200 rounded-lg"
        aria-live="polite"
      >
        <AccessibleText text="Wallet connected. Voice control ready." level="h3" />
      </div>

      {/* Voice status */}
      {voiceState.isListening && (
        <div
          className="p-4 bg-purple-50 border border-purple-200 rounded-lg"
          aria-live="assertive"
          role="status"
        >
          <AccessibleText text="Listening for voice input..." live="assertive" />
        </div>
      )}
    </div>
  )
}

/**
 * Keyboard shortcut helper
 */
export function KeyboardHelp() {
  const shortcuts = [
    { key: 'Space', action: 'Start voice input' },
    { key: 'Escape', action: 'Stop voice input' }
  ]

  return (
    <div
      className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
      role="region"
      aria-labelledby="keyboard-help-title"
    >
      <AccessibleText id="keyboard-help-title" text="Keyboard Shortcuts" level="h3" />
      
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
 * Accessible button component
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
    // Optional voice feedback
    if (ariaLabel) {
      // Hook for adding light auditory feedback
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
