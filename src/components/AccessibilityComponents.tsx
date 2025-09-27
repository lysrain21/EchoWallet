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
    return 'Press to speak'
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
        bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 
        disabled:from-slate-800 disabled:to-slate-900 disabled:opacity-50
        text-white font-bold text-lg
        border border-slate-600 hover:border-slate-500 rounded-xl
        focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950
        transition-all duration-200 shadow-lg
        ${isPressed ? 'scale-95 from-slate-800 to-slate-900' : ''}
        ${voiceState.isListening ? 'animate-pulse from-emerald-600 to-emerald-700 border-emerald-500' : ''}
        ${className}
      `}
      aria-label={getAriaLabel()}
      aria-pressed={voiceState.isListening}
      aria-live="polite"
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-col items-center justify-center space-y-2">
        {/* Voice icon - using SVG instead of emoji */}
        <div className="text-2xl" aria-hidden="true">
          {voiceState.isProcessing ? (
            <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : voiceState.isListening ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </div>
        
        {/* Button label */}
        <span>{children || getButtonText()}</span>
        
        {/* Status indicator */}
        {voiceState.isListening && (
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
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
        text-2xl font-bold text-slate-100 dark:text-slate-100
        focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950
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
  const { wallet, isLoading, error } = useWalletStore()
  const voiceState = useVoiceState()

  if (isLoading) {
    return (
      <div
        className="p-4 bg-slate-800/50 border border-slate-600 rounded-lg"
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
        className="p-4 bg-red-900/30 border border-red-600 rounded-lg"
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
        className="p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg"
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
        className="p-4 bg-emerald-900/30 border border-emerald-600 rounded-lg"
        aria-live="polite"
      >
        <AccessibleText text="Wallet connected. Voice control ready." level="h3" />
      </div>

      {/* Voice status */}
      {voiceState.isListening && (
        <div
          className="p-4 bg-purple-900/30 border border-purple-600 rounded-lg"
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
    { key: 'Escape', action: 'Stop voice input' },
    { key: 'R', action: 'Repeat last command' },
    { key: 'F1', action: 'Show help' }
  ]

  return (
    <div
      role="region"
      aria-labelledby="keyboard-help-title"
    >
      <h3 id="keyboard-help-title" className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">
        Keyboard Shortcuts
      </h3>
      
      <ul className="space-y-1" role="list">
        {shortcuts.map((shortcut, index) => (
          <li 
            key={index}
            className="text-xs text-slate-300"
            tabIndex={0}
          >
            <strong className="text-white">{shortcut.key}</strong> – {shortcut.action}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Read for Me button component - matches landing page style
 */
export function ReadForMeButton() {
  const handleReadForMe = () => {
    // TODO: Implement screen reader functionality
    // This could integrate with voiceService to read page content
    console.log('Read for me functionality triggered')
  }

  return (
      <button 
        onClick={handleReadForMe}
        className="fixed bottom-4 right-4 z-50 px-6 py-3 bg-black/90 backdrop-blur-sm rounded-md shadow-2xl border border-white/10 flex items-center gap-3 hover:bg-black transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
      aria-label="Activate screen reader mode"
      title="Click to have the page content read aloud"
    >
      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
      </svg>
      <span className="text-white/90 text-sm font-medium">Read for me</span>
    </button>
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
    primary: "bg-slate-700 text-white hover:bg-slate-600 focus:ring-slate-400",
    secondary: "bg-slate-600 text-slate-100 hover:bg-slate-500 focus:ring-slate-400", 
    danger: "bg-red-700 text-white hover:bg-red-600 focus:ring-red-400"
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
