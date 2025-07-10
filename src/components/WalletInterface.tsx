/**
 * Echo Wallet - 主钱包界面
 * 专为盲人用户设计的语音交互钱包界面
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useWalletStore, useVoiceState } from '@/store'
import { 
  VoiceButton, 
  AccessibleText, 
  WalletStatus, 
  KeyboardHelp,
  AccessibleButton 
} from './AccessibilityComponents'
import { ContactManager } from './ContactManager'
import { commandService } from '@/services/commandService'
import { voiceService } from '@/services/voiceService'

export function WalletInterface() {
  const { wallet, transactions } = useWalletStore()
  const voiceState = useVoiceState()
  const [activeTab, setActiveTab] = useState<'wallet' | 'contacts'>('wallet')
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false)

  // 初始化语音服务
  useEffect(() => {
    // 检查是否已经播放过欢迎语音
    const hasPlayedBefore = localStorage.getItem('echo-welcome-played')
    
    // 只在首次使用时播放欢迎语音
    if (!hasPlayedBefore && !hasPlayedWelcome) {
      setTimeout(() => {
        voiceService.speak('欢迎使用Web3钱包，这是一款完全通过语音操作的以太坊钱包')
        setHasPlayedWelcome(true)
        localStorage.setItem('echo-welcome-played', 'true')
      }, 1000)
    }

    // 添加全局键盘事件
    const handleKeyDown = (event: KeyboardEvent) => {
      // R键重复上次语音播报
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault()
        if (voiceState.lastCommand) {
          voiceService.speak('重复上次命令')
        } else {
          voiceService.speak('没有可重复的命令')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [voiceState.lastCommand, hasPlayedWelcome])

  // 语音命令说明
  const voiceCommands = [
    '创建钱包 - 生成新的钱包地址',
    '导入钱包 - 通过生物识别登录已有钱包',
    '查询余额 - 查看ETH余额',
    '转账 - 开始分步转账流程',
    '显示联系人 - 查看保存的联系人列表',
    '查询交易 - 查看交易状态'
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4" role="main">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 页面标题 */}
        <header className="text-center">
          <AccessibleText 
            text="EchoWallet - Web3钱包" 
            level="h1" 
            className="text-3xl font-bold text-gray-900 mb-2"
          />
          <p className="text-gray-600">完全语音操作，支持ERC-4337账户抽象</p>
        </header>

        {/* 标签页导航 */}
        <nav className="flex space-x-1 bg-white rounded-lg p-1" role="tablist">
          <AccessibleButton
            variant={activeTab === 'wallet' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('wallet')}
            className="flex-1 py-3"
            ariaLabel="钱包主页"
            role="tab"
            aria-selected={activeTab === 'wallet'}
          >
            钱包
          </AccessibleButton>
          
          <AccessibleButton
            variant={activeTab === 'contacts' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('contacts')}
            className="flex-1 py-3"
            ariaLabel="联系人管理"
            role="tab"
            aria-selected={activeTab === 'contacts'}
          >
            联系人
          </AccessibleButton>
        </nav>

        {/* 标签页内容 */}
        <div role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          {activeTab === 'wallet' && (
            <WalletMainPanel wallet={wallet} voiceState={voiceState} transactions={transactions} />
          )}
          
          {activeTab === 'contacts' && (
            <ContactManager />
          )}
        </div>
      </div>
    </div>
  )
}

// 钱包主面板组件
function WalletMainPanel({ wallet, voiceState, transactions }: any) {
  return (
    <div className="space-y-6">
      {/* 语音控制按钮 */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <AccessibleText text="语音控制" level="h2" className="mb-4" />
        <VoiceButton className="w-full py-6 text-lg">
          {voiceState.isListening ? '正在监听...' : 
           voiceState.isProcessing ? '处理中...' : 
           '按住空格键或点击开始语音输入'}
        </VoiceButton>
        
        {voiceState.lastCommand && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              上次命令: {voiceState.lastCommand.parameters?.text || '未知'}
            </p>
          </div>
        )}
      </div>

      {/* 钱包状态 */}
      <WalletStatus />



      {/* 语音命令提示 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <AccessibleText text="语音命令示例" level="h3" className="mb-3" />
        <ul className="space-y-2 text-sm text-green-800">
          <li>• "创建钱包" - 生成新钱包</li>
          <li>• "导入钱包" - 生物识别登录</li>
          <li>• "查询余额" - 检查当前余额</li>
          <li>• "转账" - 给联系人转账</li>
          <li>• "显示联系人" - 播报所有联系人</li>
        </ul>
      </div>

      {/* 键盘快捷键帮助 */}
      <KeyboardHelp />
    </div>
  )
}
