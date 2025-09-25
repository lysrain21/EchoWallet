/**
 * Echo Wallet - Voice waveform visualization
 * Central waveform animation optimised for blind users.
*/

'use client'

import React, { useEffect, useRef } from 'react'
import { useVoiceState } from '@/store'

interface VoiceWaveformProps {
  className?: string
}

export function VoiceWaveform({ className = '' }: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const voiceState = useVoiceState()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Waveform animation
    const animate = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      const centerX = width / 2
      const centerY = height / 2

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Adjust animation based on voice state
      const isActive = voiceState.isListening || voiceState.isProcessing
      const baseRadius = Math.min(width, height) * 0.15
      const time = Date.now() * 0.002

      // Draw layered waveform rings
      for (let i = 0; i < 5; i++) {
        const offset = i * 0.5
        const radius = baseRadius + Math.sin(time + offset) * (isActive ? 30 : 10)
        const opacity = isActive ? 0.8 - (i * 0.15) : 0.4 - (i * 0.08)

        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        
        // Colour based on current state
        if (voiceState.isListening) {
          ctx.strokeStyle = `rgba(76, 175, 80, ${opacity})` // 绿色 - 监听中
        } else if (voiceState.isProcessing) {
          ctx.strokeStyle = `rgba(255, 193, 7, ${opacity})` // 黄色 - 处理中
        } else {
          ctx.strokeStyle = `rgba(79, 195, 247, ${opacity})` // 蓝色 - 待机
        }
        
        ctx.lineWidth = isActive ? 3 : 2
        ctx.stroke()
      }

      // Central pulse indicator
      const pulseRadius = 8 + Math.sin(time * 2) * (isActive ? 4 : 2)
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
      
      if (voiceState.isListening) {
        ctx.fillStyle = `rgba(76, 175, 80, 0.9)`
      } else if (voiceState.isProcessing) {
        ctx.fillStyle = `rgba(255, 193, 7, 0.9)`
      } else {
        ctx.fillStyle = `rgba(79, 195, 247, 0.7)`
      }
      
      ctx.fill()

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [voiceState.isListening, voiceState.isProcessing])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
        aria-label={
          voiceState.isListening 
            ? 'Listening for voice input' 
            : voiceState.isProcessing 
            ? 'Processing your voice command' 
            : 'Voice standby'
        }
        role="img"
      />
      
      {/* Hidden status text for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {voiceState.isListening && 'Listening. Please speak now.'}
        {voiceState.isProcessing && 'Processing your voice command.'}
        {!voiceState.isListening && !voiceState.isProcessing && 'Voice standby. Press Space or tap to start.'}
      </div>
    </div>
  )
}
