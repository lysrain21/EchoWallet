/**
 * Echo Wallet - 极简语音钱包界面
 * 专为盲人用户设计的纯语音交互界面
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useWalletStore, useVoiceState } from '@/store'
import { VoiceWaveform } from './VoiceWaveform'
import { VoiceFeedbackModal } from './VoiceFeedbackModal'
import { commandService } from '@/services/commandService'
import { voiceService } from '@/services/voiceService'

export function MinimalVoiceWallet() {
  const { wallet } = useWalletStore()
  const voiceState = useVoiceState()
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false)

  // 语音反馈处理
  const handleVoiceFeedback = useCallback((message: string) => {
    setFeedbackMessage(message)
    setShowFeedback(true)
  }, [])

  // 初始化语音服务和欢迎消息
  useEffect(() => {
    const hasPlayedBefore = localStorage.getItem('echo-welcome-played')
    
    if (!hasPlayedBefore && !hasPlayedWelcome) {
      setTimeout(() => {
        const welcomeMessage = '欢迎使用Echo钱包，这是一款专为视障用户设计的Web3钱包。按空格键或轻触屏幕开始语音操作。'
        voiceService.speak(welcomeMessage)
        handleVoiceFeedback(welcomeMessage)
        setHasPlayedWelcome(true)
        localStorage.setItem('echo-welcome-played', 'true')
      }, 1000)
    }

    // 监听语音服务的反馈消息
    const originalSpeak = voiceService.speak.bind(voiceService)
    voiceService.speak = (text: string, options?: any) => {
      originalSpeak(text, options)
      handleVoiceFeedback(text)
    }

    // 全局键盘事件
    const handleKeyDown = (event: KeyboardEvent) => {
      // 空格键激活语音
      if (event.code === 'Space' && !voiceState.isListening && !voiceState.isProcessing) {
        event.preventDefault()
        startVoiceInteraction()
      }
      
      // Escape键停止语音
      if (event.key === 'Escape' && voiceState.isListening) {
        event.preventDefault()
        commandService.stopListening()
        handleVoiceFeedback('语音监听已停止')
      }

      // R键重复上次命令
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault()
        if (voiceState.lastCommand) {
          const message = `重复上次命令：${voiceState.lastCommand.parameters?.text || '未知命令'}`
          voiceService.speak(message)
          handleVoiceFeedback(message)
        } else {
          const message = '没有可重复的命令'
          voiceService.speak(message)
          handleVoiceFeedback(message)
        }
      }

      // F1键帮助
      if (event.key === 'F1') {
        event.preventDefault()
        showHelp()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [voiceState, hasPlayedWelcome, handleVoiceFeedback])

  // 启动语音交互
  const startVoiceInteraction = useCallback(() => {
    if (voiceState.isProcessing) {
      handleVoiceFeedback('系统正在处理中，请稍候')
      return
    }

    if (voiceState.isListening) {
      handleVoiceFeedback('正在监听中，请说话')
      return
    }

    commandService.startListening()
    handleVoiceFeedback('开始语音监听，请说出您的指令')
  }, [voiceState, handleVoiceFeedback])

  // 显示帮助信息
  const showHelp = useCallback(() => {
    const helpMessage = `
      Echo钱包语音命令：
      创建钱包 - 生成新的钱包地址
      导入钱包 - 通过生物识别导入已有钱包  
      查询余额 - 查看当前余额
      转账 - 开始转账流程
      查询交易 - 查看交易状态
      
      键盘快捷键：
      空格键 - 开始语音输入
      Escape键 - 停止语音监听
      R键 - 重复上次命令
      F1键 - 显示此帮助
    `
    voiceService.speak(helpMessage)
    handleVoiceFeedback(helpMessage)
  }, [handleVoiceFeedback])

  // 处理点击事件（触屏支持）
  const handleScreenTouch = useCallback(() => {
    if (!voiceState.isListening && !voiceState.isProcessing) {
      startVoiceInteraction()
    }
  }, [voiceState, startVoiceInteraction])

  return (
    <div 
      className="
        min-h-screen w-full
        bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
        flex items-center justify-center
        cursor-pointer select-none
        focus:outline-none
      "
      onClick={handleScreenTouch}
      onKeyDown={(e) => e.code === 'Space' && handleScreenTouch()}
      tabIndex={0}
      role="main"
      aria-label="Echo钱包语音交互界面"
    >
      {/* 主要声波可视化区域 */}
      <div className="relative w-full h-full max-w-4xl max-h-4xl aspect-square">
        <VoiceWaveform className="w-full h-full" />
        
        {/* 中心提示文字 - 仅在特定情况下显示 */}
        {!wallet && !voiceState.isListening && !voiceState.isProcessing && (
          <div className="
            absolute inset-0 
            flex flex-col items-center justify-center
            text-white/80 text-center
            pointer-events-none
          ">
            <h1 className="text-4xl md:text-6xl font-light mb-4 tracking-wide">
              Echo Wallet
            </h1>
            <p className="text-lg md:text-xl font-light mb-8">
              语音Web3钱包
            </p>
            <p className="text-sm md:text-base text-white/60 max-w-md">
              按空格键或轻触屏幕开始语音操作
            </p>
          </div>
        )}

        {/* 钱包连接状态指示 */}
        {wallet && (
          <div className="
            absolute top-8 left-1/2 transform -translate-x-1/2
            bg-green-500/20 backdrop-blur-sm
            px-6 py-2 rounded-full
            text-green-100 text-sm font-medium
            border border-green-500/30
          ">
            钱包已连接
          </div>
        )}

        {/* 语音状态指示 */}
        <div className="
          absolute bottom-8 left-1/2 transform -translate-x-1/2
          flex items-center space-x-4
          text-white/70 text-sm
        ">
          <div className={`
            w-3 h-3 rounded-full
            ${voiceState.isListening ? 'bg-green-500 animate-pulse' : ''}
            ${voiceState.isProcessing ? 'bg-yellow-500 animate-spin' : ''}
            ${!voiceState.isListening && !voiceState.isProcessing ? 'bg-blue-500' : ''}
          `} />
          <span>
            {voiceState.isListening && '正在监听...'}
            {voiceState.isProcessing && '处理中...'}
            {!voiceState.isListening && !voiceState.isProcessing && '待机中'}
          </span>
        </div>
      </div>

      {/* 语音反馈弹窗 */}
      <VoiceFeedbackModal
        isVisible={showFeedback}
        message={feedbackMessage}
        onClose={() => setShowFeedback(false)}
        autoCloseDelay={4000}
      />

      {/* 隐藏的无障碍信息 */}
      <div className="sr-only">
        <h1>Echo Wallet - 语音Web3钱包</h1>
        <p>专为视障用户设计的以太坊钱包，完全支持语音操作</p>
        <p>当前状态：{
          voiceState.isListening ? '正在监听语音输入' :
          voiceState.isProcessing ? '正在处理语音命令' :
          '语音待机状态'
        }</p>
        {wallet && <p>钱包已连接，地址：{wallet.address}</p>}
      </div>
    </div>
  )
}