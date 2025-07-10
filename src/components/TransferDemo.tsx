/**
 * Echo Wallet - 转账演示组件
 * 展示优化后的转账流程
 */

'use client'

import React, { useState } from 'react'
import { AccessibleText, AccessibleButton } from './AccessibilityComponents'
import { voiceService } from '@/services/voiceService'
import { contactsService } from '@/services/contactsService'

export function TransferDemo() {
  const [step, setStep] = useState<'input' | 'confirm' | 'processing' | 'success'>('input')
  const [transferData, setTransferData] = useState({
    amount: '',
    recipient: '',
    method: 'contact' as 'contact' | 'quick' | 'address'
  })

  const mockContacts = [
    { name: '小明', address: '0x742d35Cc6634C0532925a3b8D38D5A86b3C3E123' },
    { name: '老板', address: '0x123d35Cc6634C0532925a3b8D38D5A86b3C3E456' },
    { name: '朋友', address: '0x456d35Cc6634C0532925a3b8D38D5A86b3C3E789' }
  ]

  const handleVoiceTransfer = (command: string) => {
    voiceService.speak(`识别到命令: ${command}`)
    
    // 模拟解析不同类型的转账命令
    if (command.includes('给') && command.includes('转')) {
      // 联系人转账：转账0.1ETH给小明
      const amountMatch = command.match(/(\d+\.?\d*)/)?.[1]
      const nameMatch = command.match(/给(.+?)转|转.*给(.+)/)?.[1] || command.match(/给(.+)/)?.[1]
      
      if (amountMatch && nameMatch) {
        setTransferData({
          amount: amountMatch,
          recipient: nameMatch.trim(),
          method: 'contact'
        })
        setStep('confirm')
        voiceService.speak(`准备向${nameMatch}转账${amountMatch}ETH，请确认`)
      }
    } else if (command.includes('快速转账')) {
      // 快速转账：快速转账0.05ETH
      const amountMatch = command.match(/(\d+\.?\d*)/)?.[1]
      if (amountMatch) {
        setTransferData({
          amount: amountMatch,
          recipient: '小明', // 模拟最近联系人
          method: 'quick'
        })
        setStep('confirm')
        voiceService.speak(`快速转账${amountMatch}ETH给最近联系人小明，请确认`)
      }
    }
  }

  const handleConfirm = () => {
    setStep('processing')
    voiceService.speak('正在处理转账...')
    
    // 模拟转账处理
    setTimeout(() => {
      setStep('success')
      voiceService.speak('转账成功！交易已提交到区块链')
    }, 3000)
  }

  const handleReset = () => {
    setStep('input')
    setTransferData({ amount: '', recipient: '', method: 'contact' })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <AccessibleText text="转账功能演示" level="h2" />
      
      {/* 步骤指示器 */}
      <div className="flex justify-between items-center p-4 bg-white rounded-lg">
        <div className={`flex items-center space-x-2 ${step === 'input' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="w-8 h-8 rounded-full bg-current text-white flex items-center justify-center text-sm">1</span>
          <span>语音输入</span>
        </div>
        <div className={`flex items-center space-x-2 ${step === 'confirm' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="w-8 h-8 rounded-full bg-current text-white flex items-center justify-center text-sm">2</span>
          <span>确认转账</span>
        </div>
        <div className={`flex items-center space-x-2 ${step === 'processing' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="w-8 h-8 rounded-full bg-current text-white flex items-center justify-center text-sm">3</span>
          <span>处理中</span>
        </div>
        <div className={`flex items-center space-x-2 ${step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
          <span className="w-8 h-8 rounded-full bg-current text-white flex items-center justify-center text-sm">4</span>
          <span>完成</span>
        </div>
      </div>

      {/* 步骤1：语音输入 */}
      {step === 'input' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg">
            <AccessibleText text="选择转账方式" level="h3" className="mb-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <AccessibleButton
                onClick={() => handleVoiceTransfer('转账0.1ETH给小明')}
                className="p-4 text-left"
                ariaLabel="联系人转账示例"
              >
                <div className="font-medium">联系人转账</div>
                <div className="text-sm text-gray-600 mt-1">
                  "转账0.1ETH给小明"
                </div>
              </AccessibleButton>
              
              <AccessibleButton
                onClick={() => handleVoiceTransfer('快速转账0.05ETH')}
                className="p-4 text-left"
                variant="secondary"
                ariaLabel="快速转账示例"
              >
                <div className="font-medium">快速转账</div>
                <div className="text-sm text-gray-600 mt-1">
                  "快速转账0.05ETH"
                </div>
              </AccessibleButton>
              
              <AccessibleButton
                onClick={() => voiceService.speak('地址转账需要说出完整的42位地址，建议使用联系人功能')}
                className="p-4 text-left"
                variant="secondary"
                ariaLabel="地址转账说明"
              >
                <div className="font-medium">地址转账</div>
                <div className="text-sm text-gray-600 mt-1">
                  不推荐使用
                </div>
              </AccessibleButton>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">语音命令优化</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ "转账0.1ETH给小明" - 简单直接</li>
                <li>✅ "快速转账0.05ETH" - 使用最近联系人</li>
                <li>✅ "给老板转0.2ETH" - 自然语言</li>
                <li>❌ "转账0.1ETH给0x742d35..." - 过于复杂</li>
              </ul>
            </div>
          </div>

          {/* 联系人列表 */}
          <div className="bg-white p-6 rounded-lg">
            <AccessibleText text="当前联系人" level="h3" className="mb-4" />
            <div className="space-y-2">
              {mockContacts.map((contact, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-gray-600 font-mono">
                      {contact.address.slice(0, 10)}...{contact.address.slice(-6)}
                    </div>
                  </div>
                  <AccessibleButton
                    onClick={() => handleVoiceTransfer(`转账0.1ETH给${contact.name}`)}
                    variant="secondary"
                    className="text-sm"
                  >
                    转账示例
                  </AccessibleButton>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 步骤2：确认转账 */}
      {step === 'confirm' && (
        <div className="bg-white p-6 rounded-lg">
          <AccessibleText text="确认转账信息" level="h3" className="mb-4" />
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">转账方式:</span>
              <span className="font-medium">
                {transferData.method === 'contact' ? '联系人转账' : 
                 transferData.method === 'quick' ? '快速转账' : '地址转账'}
              </span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">收款人:</span>
              <span className="font-medium">{transferData.recipient}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">金额:</span>
              <span className="font-medium">{transferData.amount} ETH</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">预估手续费:</span>
              <span className="font-medium">0.001 ETH</span>
            </div>
          </div>

          <div className="flex space-x-4">
            <AccessibleButton
              onClick={handleConfirm}
              className="flex-1 py-3"
              ariaLabel="确认转账"
            >
              确认转账
            </AccessibleButton>
            
            <AccessibleButton
              onClick={handleReset}
              variant="secondary"
              className="flex-1 py-3"
              ariaLabel="取消转账"
            >
              取消
            </AccessibleButton>
          </div>
        </div>
      )}

      {/* 步骤3：处理中 */}
      {step === 'processing' && (
        <div className="bg-white p-6 rounded-lg text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <AccessibleText text="转账处理中..." level="h3" />
          <p className="text-gray-600 mt-2">正在广播交易到区块链网络</p>
        </div>
      )}

      {/* 步骤4：成功 */}
      {step === 'success' && (
        <div className="bg-white p-6 rounded-lg text-center">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          
          <AccessibleText text="转账成功！" level="h3" className="text-green-600" />
          
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="text-sm space-y-1">
              <div>交易哈希: 0x1234...5678</div>
              <div>状态: 已确认</div>
              <div>区块: 12,345,678</div>
            </div>
          </div>

          <AccessibleButton
            onClick={handleReset}
            className="mt-4"
            ariaLabel="开始新的转账"
          >
            开始新转账
          </AccessibleButton>
        </div>
      )}

      {/* 优化说明 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">转账优化亮点</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>🎯 <strong>联系人系统</strong>: 无需记忆复杂地址</li>
          <li>⚡ <strong>快速转账</strong>: 一句话完成常用转账</li>
          <li>🔊 <strong>语音确认</strong>: 详细播报转账信息</li>
          <li>🛡️ <strong>多重验证</strong>: 地址验证 + 用户确认</li>
          <li>📝 <strong>智能解析</strong>: 支持多种自然语言表达</li>
        </ul>
      </div>
    </div>
  )
}
