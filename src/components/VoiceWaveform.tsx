/**
 * Echo Wallet - 语音声波可视化组件
 * 专为盲人用户设计的中心声波动画
 */

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useVoiceState } from '@/store'

interface VoiceWaveformProps {
  className?: string
}

export function VoiceWaveform({ className = '' }: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const voiceState = useVoiceState()
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布尺寸
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 声波动画
    const animate = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      const centerX = width / 2
      const centerY = height / 2

      // 清除画布
      ctx.clearRect(0, 0, width, height)

      // 根据语音状态调整动画
      const isActive = voiceState.isListening || voiceState.isProcessing
      const baseRadius = Math.min(width, height) * 0.15
      const time = Date.now() * 0.002

      // 绘制多层声波圆环
      for (let i = 0; i < 5; i++) {
        const offset = i * 0.5
        const radius = baseRadius + Math.sin(time + offset) * (isActive ? 30 : 10)
        const opacity = isActive ? 0.8 - (i * 0.15) : 0.4 - (i * 0.08)

        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        
        // 根据状态设置颜色
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

      // 中心脉冲点
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
            ? '正在监听语音输入' 
            : voiceState.isProcessing 
            ? '正在处理语音命令' 
            : '语音待机状态'
        }
        role="img"
      />
      
      {/* 状态文字提示 - 隐藏但可被屏幕阅读器读取 */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {voiceState.isListening && '语音监听中，请说话'}
        {voiceState.isProcessing && '正在处理您的语音命令'}
        {!voiceState.isListening && !voiceState.isProcessing && '语音待机中，按空格键或点击开始'}
      </div>
    </div>
  )
}