/**
 * Echo Wallet - Wallet verification component
 * Displays wallet status and verification details.
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
      // 1. Basic validation
      const isValid = walletService.validateWallet(wallet)
      
      if (isValid) {
        details.push('✅ Wallet basics verified successfully')
        details.push('📍 Wallet address format is correct')
        details.push(`🔑 Private key length: ${wallet.privateKey.length} characters`)
        
        if (wallet.mnemonic) {
          const wordCount = wallet.mnemonic.split(' ').length
          details.push(`📝 Mnemonic: ${wordCount} words`)
        }
      } else {
        details.push('❌ Wallet basics verification failed')
      }

      // 2. Network connectivity test
      const networkTest = await walletService.testWalletConnection(wallet.address)
      
      if (networkTest) {
        details.push('🌐 Network connectivity test passed')
      } else {
        details.push('⚠️ Network connectivity test failed')
      }

      // 3. Balance query test
      try {
        const balanceValue = await walletService.getETHBalance(wallet.address)
        details.push(`💰 Balance query succeeded: ${balanceValue} ETH`)
      } catch (error) {
        console.error('Balance query failed:', error)
        details.push('❌ Balance query failed')
      }

      setVerificationResult({
        isValid,
        details,
        networkTest
      })

    } catch (error) {
      details.push(`❌ Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
        <AccessibleText text="No wallet information yet" level="h3" />
        <p className="mt-2 text-gray-600">Please create or import a wallet first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Wallet basics */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <AccessibleText text="Wallet Information" level="h3" className="mb-4" />
        
        <div className="space-y-2 text-sm">
          <div>
            <strong>Address status:</strong> 
            <span className="ml-2">Verified</span>
          </div>
          
          <div>
            <strong>Type:</strong> 
            <span className="ml-2">{wallet.isSmartWallet ? 'Smart wallet' : 'EOA wallet'}</span>
          </div>
          
          {wallet.mnemonic && (
            <div>
              <strong>Mnemonic:</strong> 
              <span className="ml-2">{wallet.mnemonic.split(' ').length} words</span>
            </div>
          )}
        </div>
      </div>

      {/* Verification button */}
      <div className="text-center">
        <button
          onClick={runVerification}
          disabled={isVerifying}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          aria-label="Run wallet verification"
        >
          {isVerifying ? 'Verifying...' : 'Verify wallet'}
        </button>
      </div>

      {/* Verification results */}
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
            text="Verification results" 
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

          {/* Overall status */}
          <div className="mt-4 p-3 rounded border-t">
            <div className={`font-bold ${
              verificationResult.isValid ? 'text-green-700' : 'text-red-700'
            }`}>
              Overall status: {verificationResult.isValid ? '✅ Verification passed' : '❌ Verification failed'}
            </div>
          </div>
        </div>
      )}

      {/* Usage notes */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AccessibleText text="Verification Notes" level="h4" className="mb-2" />
        <ul className="text-sm space-y-1 text-blue-800">
          <li>• Click "Verify wallet" to run the full verification.</li>
          <li>• Checks include address format, private key validity, and mnemonic completeness.</li>
          <li>• Network connectivity test ensures blockchain access.</li>
          <li>• See the browser console for detailed logs.</li>
        </ul>
      </div>
    </div>
  )
}
