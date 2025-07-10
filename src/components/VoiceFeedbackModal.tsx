/**
 * Echo Wallet - 语音反馈弹窗组件
 * 显示语音播报内容的文字转写
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
      
      // 自动关闭
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
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        aria-hidden="true"
      />
      
      {/* 弹窗内容 */}
      <div
        className="fixed inset-x-4 bottom-1/3 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-live="assertive"
        aria-labelledby="voice-feedback-content"
      >
        <div className="
          max-w-2xl w-full mx-auto
          bg-white/95 backdrop-blur-sm
          border-2 border-gray-200
          rounded-2xl shadow-2xl
          p-6 md:p-8
          transform transition-all duration-300 ease-out
          animate-in slide-in-from-bottom-4 fade-in-0
        ">
          {/* 状态指示器 */}
          <div className="flex items-center justify-center mb-4">
            <div className={`
              w-4 h-4 rounded-full mr-3
              ${voiceState.isListening ? 'bg-green-500 animate-pulse' : ''}
              ${voiceState.isProcessing ? 'bg-yellow-500 animate-spin' : ''}
              ${!voiceState.isListening && !voiceState.isProcessing ? 'bg-blue-500' : ''}
            `} />
            <span className="text-sm font-medium text-gray-600">
              {voiceState.isListening && '正在监听'}
              {voiceState.isProcessing && '处理中'}
              {!voiceState.isListening && !voiceState.isProcessing && '系统反馈'}
            </span>
          </div>

          {/* 主要消息内容 */}
          <div
            id="voice-feedback-content"
            className="
              text-center text-gray-900
              text-lg md:text-xl font-medium
              leading-relaxed
              focus:outline-none
            "
            tabIndex={0}
            autoFocus
          >
            {message}
          </div>

          {/* 操作提示 */}
          {!voiceState.isProcessing && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                语音命令：说"确认"、"取消"或"重试"
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}