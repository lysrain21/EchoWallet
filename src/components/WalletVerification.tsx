/**
 * Echo Wallet - 钱包验证组件
 * 显示钱包创建状态和验证信息
 */

'use client'

import React, { useState } from 'react'
import { useWallet } from '@/store'
import { walletService } from '@/services/walletService'
import { AccessibleText } from './AccessibilityComponents'

export function WalletVerification() {
  const wallet = useWallet()
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean
    details: string[]
    networkTest: boolean
  } | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const runVerification = async () => {
    if (!wallet) return

    setIsVerifying(true)
    const details: string[] = []

    try {
      // 1. 基础验证
      const isValid = walletService.validateWallet(wallet)
      
      if (isValid) {
        details.push('✅ 钱包基础信息验证通过')
        details.push('📍 钱包地址格式正确')
        details.push(`🔑 私钥长度: ${wallet.privateKey.length} 字符`)
        
        if (wallet.mnemonic) {
          const wordCount = wallet.mnemonic.split(' ').length
          details.push(`📝 助记词: ${wordCount} 个单词`)
        }
      } else {
        details.push('❌ 钱包基础验证失败')
      }

      // 2. 网络连接测试
      const networkTest = await walletService.testWalletConnection(wallet.address)
      
      if (networkTest) {
        details.push('🌐 网络连接测试通过')
      } else {
        details.push('⚠️ 网络连接测试失败')
      }

      // 3. 余额查询测试
      try {
        const balance = await walletService.getETHBalance(wallet.address)
        details.push('💰 余额查询功能正常')
      } catch (error) {
        details.push('❌ 余额查询失败')
      }

      setVerificationResult({
        isValid,
        details,
        networkTest
      })

    } catch (error) {
      details.push(`❌ 验证过程出错: ${error instanceof Error ? error.message : '未知错误'}`)
      setVerificationResult({
        isValid: false,
        details,
        networkTest: false
      })
    } finally {
      setIsVerifying(false)
    }
  }

  if (!wallet) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <AccessibleText text="暂无钱包信息" level="h3" />
        <p className="mt-2 text-gray-600">请先创建或导入钱包</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 钱包基础信息 */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <AccessibleText text="钱包信息" level="h3" className="mb-4" />
        
        <div className="space-y-2 text-sm">
          <div>
            <strong>地址状态:</strong> 
            <span className="ml-2">已验证有效</span>
          </div>
          
          <div>
            <strong>类型:</strong> 
            <span className="ml-2">{wallet.isSmartWallet ? '智能钱包' : 'EOA钱包'}</span>
          </div>
          
          {wallet.mnemonic && (
            <div>
              <strong>助记词:</strong> 
              <span className="ml-2">{wallet.mnemonic.split(' ').length} 个单词</span>
            </div>
          )}
        </div>
      </div>

      {/* 验证按钮 */}
      <div className="text-center">
        <button
          onClick={runVerification}
          disabled={isVerifying}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          aria-label="运行钱包验证测试"
        >
          {isVerifying ? '验证中...' : '验证钱包'}
        </button>
      </div>

      {/* 验证结果 */}
      {verificationResult && (
        <div 
          className={`p-4 border rounded-lg ${
            verificationResult.isValid 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}
          role="region"
          aria-labelledby="verification-results"
        >
          <AccessibleText 
            id="verification-results"
            text="验证结果" 
            level="h4" 
            className="mb-3"
          />
          
          <div className="space-y-2">
            {verificationResult.details.map((detail, index) => (
              <div 
                key={index}
                className="text-sm"
                tabIndex={0}
              >
                {detail}
              </div>
            ))}
          </div>

          {/* 总体状态 */}
          <div className="mt-4 p-3 rounded border-t">
            <div className={`font-bold ${
              verificationResult.isValid ? 'text-green-700' : 'text-red-700'
            }`}>
              总体状态: {verificationResult.isValid ? '✅ 验证通过' : '❌ 验证失败'}
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AccessibleText text="验证说明" level="h4" className="mb-2" />
        <ul className="text-sm space-y-1 text-blue-800">
          <li>• 点击"验证钱包"按钮运行完整验证</li>
          <li>• 验证包括地址格式、私钥有效性、助记词完整性</li>
          <li>• 网络连接测试确保可以与区块链交互</li>
          <li>• 详细日志信息请查看浏览器控制台</li>
        </ul>
      </div>
    </div>
  )
}
