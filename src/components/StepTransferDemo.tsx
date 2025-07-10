/**
 * Echo Wallet - 分步转账演示组件
 * 演示新的分步转账流程
 */

'use client'

import React, { useState } from 'react'
import { AccessibleButton, AccessibleText } from './AccessibilityComponents'
import { voiceService } from '@/services/voiceService'
import { commandService } from '@/services/commandService'
import { contactsService } from '@/services/contactsService'

export function StepTransferDemo() {
  const [currentDemo, setCurrentDemo] = useState<string | null>(null)
  const [demoSteps, setDemoSteps] = useState<string[]>([])

  const demoScenarios = [
    {
      id: 'contact_transfer',
      title: '联系人转账',
      description: '向已保存的联系人转账',
      steps: [
        '1. 说"转账"开始流程',
        '2. 说"小明"指定收款人',
        '3. 说"0.1 ETH"指定金额',
        '4. 说"确认"完成转账'
      ]
    },
    {
      id: 'address_transfer',
      title: '地址转账',
      description: '向钱包地址转账',
      steps: [
        '1. 说"转账"开始流程',
        '2. 说出完整钱包地址',
        '3. 说"零点零五"指定金额',
        '4. 说"USDC"指定代币',
        '5. 说"确认"完成转账'
      ]
    },
    {
      id: 'quick_transfer',
      title: '快速转账',
      description: '一句话完成转账',
      steps: [
        '1. 说"转账0.1ETH给小明"',
        '2. 系统自动识别并确认',
        '3. 说"确认"完成转账'
      ]
    }
  ]

  const startDemo = (scenarioId: string) => {
    const scenario = demoScenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    setCurrentDemo(scenarioId)
    setDemoSteps(scenario.steps)
    
    voiceService.speak(`开始演示：${scenario.title}。${scenario.description}`)
    
    // 延迟开始演示
    setTimeout(() => {
      voiceService.speak('请按照步骤操作，您可以随时说"取消"退出演示')
    }, 2000)
  }

  const stopDemo = () => {
    setCurrentDemo(null)
    setDemoSteps([])
    voiceService.speak('演示已停止')
  }

  const startVoiceTransfer = () => {
    voiceService.speak('正在启动转账流程，请稍候')
    setTimeout(() => {
      commandService.startListening()
    }, 1000)
  }

  const initTestContacts = () => {
    try {
      const testContacts = [
        { name: '小明', address: '0x742d35Cc1234567890123456789012345678901A' },
        { name: '老板', address: '0x742d35Cc2345678901234567890123456789012B' },
        { name: '朋友', address: '0x742d35Cc3456789012345678901234567890123C' },
      ]
      
      let addedCount = 0
      testContacts.forEach(contact => {
        try {
          contactsService.addContact(contact)
          addedCount++
        } catch (e) {
          // 联系人可能已存在，忽略错误
          console.log(`联系人 ${contact.name} 已存在`)
        }
      })
      
      if (addedCount > 0) {
        voiceService.speak(`已添加 ${addedCount} 个测试联系人`)
      } else {
        voiceService.speak('测试联系人已存在，无需重复添加')
      }
    } catch (error) {
      voiceService.speak('添加测试联系人失败')
    }
  }

  return (
    <div className="space-y-6 p-6" role="region" aria-label="分步转账演示">
      <AccessibleText text="分步转账演示" level="h2" />
      
      {/* 功能介绍 */}
      <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
        <AccessibleText text="新功能介绍" level="h3" />
        <div className="mt-2 space-y-2 text-sm text-gray-700">
          <p>• <strong>分步引导：</strong>系统会逐步询问转账信息</p>
          <p>• <strong>智能识别：</strong>支持联系人姓名和钱包地址</p>
          <p>• <strong>安全确认：</strong>详细确认信息后才执行转账</p>
          <p>• <strong>容错处理：</strong>识别失败时提供重试机会</p>
          <p>• <strong>随时取消：</strong>任何步骤都可以说"取消"退出</p>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <AccessibleText text="快速操作" level="h3" />
          
          <AccessibleButton
            onClick={startVoiceTransfer}
            className="w-full p-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
            ariaLabel="开始语音转账"
          >
            🎤 开始语音转账
          </AccessibleButton>

          <AccessibleButton
            onClick={initTestContacts}
            className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            ariaLabel="添加测试联系人"
          >
            👥 添加测试联系人
          </AccessibleButton>

          {currentDemo && (
            <AccessibleButton
              onClick={stopDemo}
              className="w-full p-4 bg-red-600 text-white rounded-lg hover:bg-red-700"
              ariaLabel="停止当前演示"
            >
              🛑 停止演示
            </AccessibleButton>
          )}
        </div>

        {/* 当前演示状态 */}
        {currentDemo && (
          <div className="space-y-4">
            <AccessibleText text="当前演示步骤" level="h3" />
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <div className="space-y-2">
                {demoSteps.map((step, index) => (
                  <div key={index} className="text-sm text-gray-700">
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 演示场景 */}
      <div className="space-y-4">
        <AccessibleText text="演示场景" level="h3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demoScenarios.map((scenario) => (
            <div key={scenario.id} className="p-4 bg-white rounded-lg border shadow-sm">
              <h4 className="font-medium text-gray-900 mb-2">{scenario.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
              
              <AccessibleButton
                onClick={() => startDemo(scenario.id)}
                className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                ariaLabel={`开始${scenario.title}演示`}
                disabled={currentDemo === scenario.id}
              >
                {currentDemo === scenario.id ? '进行中...' : '开始演示'}
              </AccessibleButton>
            </div>
          ))}
        </div>
      </div>

      {/* 使用说明 */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <AccessibleText text="使用说明" level="h3" />
        <div className="mt-2 space-y-2 text-sm text-gray-700" role="list">
          <div role="listitem">
            <strong>启动转账：</strong>点击"开始语音转账"或直接说"转账"
          </div>
          <div role="listitem">
            <strong>指定收款人：</strong>说联系人姓名（如"小明"）或完整钱包地址
          </div>
          <div role="listitem">
            <strong>指定金额：</strong>说数字金额（如"零点一"、"0.1"）
          </div>
          <div role="listitem">
            <strong>指定代币：</strong>说代币类型（如"ETH"、"USDC"）或直接确认使用ETH
          </div>
          <div role="listitem">
            <strong>最终确认：</strong>仔细听取转账摘要，说"确认"执行或"取消"退出
          </div>
          <div role="listitem">
            <strong>取消操作：</strong>任何步骤都可以说"取消"或"退出"中止转账
          </div>
        </div>
      </div>

      {/* 语音命令参考 */}
      <div className="p-4 bg-green-50 rounded-lg">
        <AccessibleText text="语音命令参考" level="h3" />
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">基础命令</h5>
            <ul className="space-y-1 text-gray-700" role="list">
              <li>• "转账" - 开始转账流程</li>
              <li>• "取消" - 取消当前操作</li>
              <li>• "确认" - 确认操作</li>
              <li>• "重新开始" - 重新开始流程</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-2">金额表达</h5>
            <ul className="space-y-1 text-gray-700" role="list">
              <li>• "零点一" = 0.1</li>
              <li>• "零点零五" = 0.05</li>
              <li>• "五毫" = 0.005</li>
              <li>• "一ETH" = 1 ETH</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
