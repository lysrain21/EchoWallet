/**
 * Echo Wallet - 语音识别测试演示组件
 * 专门用于测试和验证语音识别优化效果
 */

'use client'

import React, { useState, useEffect } from 'react'
import { AccessibleButton, AccessibleText } from './AccessibilityComponents'
import { voiceService } from '@/services/voiceService'
import { VoiceRecognitionOptimizer } from '@/services/voiceOptimizer'
import { contactsService } from '@/services/contactsService'

export function VoiceTestDemo() {
  const [isListening, setIsListening] = useState(false)
  const [lastResult, setLastResult] = useState('')
  const [optimizedResult, setOptimizedResult] = useState('')
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    // 移除自动初始化测试联系人
    // 用户需要手动点击按钮添加
  }, [])

  const startVoiceTest = () => {
    if (isListening) {
      voiceService.stopListening()
      setIsListening(false)
      return
    }

    setIsListening(true)
    voiceService.speak('请说话，我会显示识别和优化结果')

    voiceService.startListening(
      (command) => {
        console.log('🎯 收到命令:', command)
        setLastResult(command.parameters?.text || command.type)
        
        // 显示优化后的结果
        if (command.parameters?.text) {
          const optimized = VoiceRecognitionOptimizer.optimizeText(command.parameters.text)
          setOptimizedResult(optimized)
        }

        // 记录测试结果
        const result = `${new Date().toLocaleTimeString()}: ${command.type} - ${command.parameters?.text || ''}`
        setTestResults(prev => [result, ...prev.slice(0, 9)])
        
        setIsListening(false)
      },
      (error) => {
        console.error('语音识别错误:', error)
        setIsListening(false)
        voiceService.speak('识别失败，请重试')
      }
    )
  }

  const testSpecificCases = () => {
    const testCases = [
      '转账零点零零五以太给小明',
      '显示联系人',
      '查询余额',
      '转账0.1eth给老板',
      '快速转账0.05以太',
      '常用联系人'
    ]

    voiceService.speak('开始测试特定用例')
    
    testCases.forEach((testCase, index) => {
      setTimeout(() => {
        const optimized = VoiceRecognitionOptimizer.optimizeText(testCase)
        const result = `测试 ${index + 1}: "${testCase}" → "${optimized}"`
        setTestResults(prev => [result, ...prev.slice(0, 9)])
        voiceService.speak(`测试 ${index + 1}: ${optimized}`)
      }, index * 3000)
    })
  }

  const testContactDisplay = () => {
    voiceService.speak('正在测试联系人显示功能')
    
    const contacts = contactsService.getContacts()
    console.log('📞 当前联系人:', contacts)
    
    if (contacts.length === 0) {
      voiceService.speak('暂无保存的联系人，请先在联系人页面添加联系人')
      return
    }

    voiceService.speak(`您有 ${contacts.length} 个联系人`)
    
    contacts.slice(0, 5).forEach((contact, index) => {
      setTimeout(() => {
        voiceService.speak(`${index + 1}. ${contact.name}`)
      }, (index + 1) * 1500)
    })
  }

  const clearResults = () => {
    setTestResults([])
    setLastResult('')
    setOptimizedResult('')
    voiceService.speak('测试结果已清空')
  }

  return (
    <div className="space-y-6 p-6" role="region" aria-label="语音识别测试">
      <AccessibleText text="语音识别测试演示" level="h2" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 语音测试控制 */}
        <div className="space-y-4">
          <AccessibleText text="语音测试控制" level="h3" />
          
          <AccessibleButton
            onClick={startVoiceTest}
            className={`w-full p-4 rounded-lg text-white font-medium ${
              isListening 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            ariaLabel={isListening ? '停止语音识别' : '开始语音识别'}
          >
            {isListening ? '🛑 停止识别' : '🎤 开始语音测试'}
          </AccessibleButton>

          <AccessibleButton
            onClick={testSpecificCases}
            className="w-full p-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
            ariaLabel="测试特定语音场景"
          >
            🧪 测试特定场景
          </AccessibleButton>

          <AccessibleButton
            onClick={testContactDisplay}
            className="w-full p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            ariaLabel="测试联系人显示"
          >
            📞 测试联系人显示
          </AccessibleButton>

          <AccessibleButton
            onClick={clearResults}
            className="w-full p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            ariaLabel="清空测试结果"
          >
            🗑️ 清空结果
          </AccessibleButton>
        </div>

        {/* 识别结果显示 */}
        <div className="space-y-4">
          <AccessibleText text="识别结果" level="h3" />
          
          {lastResult && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                原始识别结果:
              </label>
              <p className="text-blue-800 break-words" aria-live="polite">
                {lastResult}
              </p>
            </div>
          )}

          {optimizedResult && (
            <div className="p-4 bg-green-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                优化后结果:
              </label>
              <p className="text-green-800 break-words" aria-live="polite">
                {optimizedResult}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 测试历史 */}
      {testResults.length > 0 && (
        <div className="space-y-2">
          <AccessibleText text="测试历史记录" level="h3" />
          <div 
            className="max-h-64 overflow-y-auto space-y-2 p-4 bg-gray-50 rounded-lg"
            role="log"
            aria-live="polite"
            aria-label="语音识别测试历史"
          >
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className="text-sm text-gray-700 p-2 bg-white rounded border-l-4 border-blue-300"
              >
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
        <AccessibleText text="测试说明" level="h3" />
        <ul className="mt-2 space-y-1 text-sm text-gray-700" role="list">
          <li>• 点击"开始语音测试"然后说话测试识别效果</li>
          <li>• 测试ETH识别：说"以太"、"eth"、"e t h"等</li>
          <li>• 测试数字识别：说"零点零零五"、"0.005"等</li>
          <li>• 测试联系人：说"显示联系人"、"转账给小明"等</li>
          <li>• 测试转账：说"转账0.1eth给小明"等</li>
        </ul>
      </div>
    </div>
  )
}
