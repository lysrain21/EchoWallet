/**
 * Echo Wallet - Voice feedback modal
 * Displays textual transcription of spoken feedback.
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useVoiceState } from '@/store'

interface VoiceFeedbackModalProps {
  isVisible: boolean
  message: string
  onClose?: () => void
  autoCloseDelay?: number
}

export function VoiceFeedbackModal({ 
  isVisible, 
  message, 
  onClose,
  autoCloseDelay = 5000 
}: VoiceFeedbackModalProps) {
  const [show, setShow] = useState(false)
  const voiceState = useVoiceState()

  useEffect(() => {
    if (isVisible && message) {
      setShow(true)
      
      // Auto-dismiss when requested
      if (autoCloseDelay > 0) {
        const timer = setTimeout(() => {
          setShow(false)
          onClose?.()
        }, autoCloseDelay)
        
        return () => clearTimeout(timer)
      }
    } else {
      setShow(false)
    }
  }, [isVisible, message, autoCloseDelay, onClose])

  if (!show || !message) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        aria-hidden="true"
      />
      
      {/* Modal content */}
      <div
        className="fixed inset-x-4 bottom-1/3 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-live="assertive"
        aria-labelledby="voice-feedback-content"
      >
        <div className="
          max-w-2xl w-full mx-auto
          bg-slate-900/95 backdrop-blur-sm
          border-2 border-slate-600
          rounded-2xl shadow-2xl
          p-6 md:p-8
          transform transition-all duration-300 ease-out
          animate-in slide-in-from-bottom-4 fade-in-0
        ">
          {/* Status indicator */}
          <div className="flex items-center justify-center mb-4">
            <div className={`
              w-4 h-4 rounded-full mr-3
              ${voiceState.isListening ? 'bg-green-500 animate-pulse' : ''}
              ${voiceState.isProcessing ? 'bg-yellow-500 animate-spin' : ''}
              ${!voiceState.isListening && !voiceState.isProcessing ? 'bg-blue-500' : ''}
            `} />
            <span className="text-sm font-medium text-slate-300">
              {voiceState.isListening && 'Listening'}
              {voiceState.isProcessing && 'Processing'}
              {!voiceState.isListening && !voiceState.isProcessing && 'System feedback'}
            </span>
          </div>

          {/* Primary message */}
          <div
            id="voice-feedback-content"
            className="
              text-center text-slate-100
              text-lg md:text-xl font-medium
              leading-relaxed
              focus:outline-none
            "
            tabIndex={0}
            autoFocus
          >
            {message}
          </div>

          {/* Action hint */}
          {!voiceState.isProcessing && (
            <div className="mt-4 text-center">
              <p className="text-sm text-slate-400">
                Voice tip: say "confirm", "cancel", or "retry".
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
