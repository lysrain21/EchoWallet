/**
 * Echo Wallet - Speech recognition test demo
 * Designed to test and validate speech optimization.
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
    // Test contacts are no longer auto-initialized; they must be added manually
  }, [])

  const startVoiceTest = () => {
    if (isListening) {
      voiceService.stopListening()
      setIsListening(false)
      return
    }

    setIsListening(true)
    voiceService.speak('Please speak and I will display both the raw and optimized results.')

    voiceService.startListening(
      (command) => {
        console.log('🎯 Received command:', command)
        const transcript = typeof command.parameters?.text === 'string'
          ? command.parameters.text
          : command.type
        setLastResult(transcript)

        // Display the optimized result
        if (typeof command.parameters?.text === 'string') {
          const optimized = VoiceRecognitionOptimizer.optimizeText(command.parameters.text)
          setOptimizedResult(optimized)
        }

        // Record the result for history
        const result = `${new Date().toLocaleTimeString()}: ${command.type} - ${typeof command.parameters?.text === 'string' ? command.parameters.text : ''}`
        setTestResults(prev => [result, ...prev.slice(0, 9)])

        setIsListening(false)
      },
      (error) => {
        console.error('Speech recognition error:', error)
        setIsListening(false)
        voiceService.speak('Recognition failed. Please try again.')
      }
    )
  }

  const testSpecificCases = () => {
    const testCases = [
      'transfer zero point zero zero five ether to Alice',
      'show contacts',
      'check balance',
      'transfer 0.1 eth to boss',
      'quick transfer 0.05 ether',
      'frequent contacts'
    ]

    voiceService.speak('Testing specific voice scenarios.')
    
    testCases.forEach((testCase, index) => {
      setTimeout(() => {
        const optimized = VoiceRecognitionOptimizer.optimizeText(testCase)
        const result = `Test ${index + 1}: "${testCase}" → "${optimized}"`
        setTestResults(prev => [result, ...prev.slice(0, 9)])
        voiceService.speak(`Test ${index + 1}: ${optimized}`)
      }, index * 3000)
    })
  }

  const testContactDisplay = () => {
    voiceService.speak('Testing contact announcement.')
    
    const contacts = contactsService.getContacts()
    console.log('📞 Current contacts:', contacts)
    
    if (contacts.length === 0) {
      voiceService.speak('No contacts saved yet. Please add contacts from the contacts page.')
      return
    }

    voiceService.speak(`You have ${contacts.length} contacts`)
    
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
    voiceService.speak('Test results cleared.')
  }

  return (
    <div className="space-y-6 p-6" role="region" aria-label="Speech recognition test">
      <AccessibleText text="Speech Recognition Test Demo" level="h2" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Voice Test Controls */}
        <div className="space-y-4">
          <AccessibleText text="Voice Test Controls" level="h3" />
          
          <AccessibleButton
            onClick={startVoiceTest}
            className={`w-full p-4 rounded-lg text-white font-medium ${
              isListening 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            ariaLabel={isListening ? 'Stop speech recognition' : 'Start speech recognition'}
          >
            {isListening ? '🛑 Stop listening' : '🎤 Start voice test'}
          </AccessibleButton>

          <AccessibleButton
            onClick={testSpecificCases}
            className="w-full p-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
            ariaLabel="Test specific voice scenarios"
          >
            🧪 Test specific scenarios
          </AccessibleButton>

          <AccessibleButton
            onClick={testContactDisplay}
            className="w-full p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            ariaLabel="Test contact announcements"
          >
            📞 Test contact announcements
          </AccessibleButton>

          <AccessibleButton
            onClick={clearResults}
            className="w-full p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            ariaLabel="Clear test results"
          >
            🗑️ Clear results
          </AccessibleButton>
        </div>

        {/* Recognition output */}
        <div className="space-y-4">
          <AccessibleText text="Recognition Results" level="h3" />
          
          {lastResult && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raw recognition:
              </label>
              <p className="text-blue-800 break-words" aria-live="polite">
                {lastResult}
              </p>
            </div>
          )}

          {optimizedResult && (
            <div className="p-4 bg-green-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Optimized result:
              </label>
              <p className="text-green-800 break-words" aria-live="polite">
                {optimizedResult}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Test history */}
      {testResults.length > 0 && (
        <div className="space-y-2">
          <AccessibleText text="Test History" level="h3" />
          <div 
            className="max-h-64 overflow-y-auto space-y-2 p-4 bg-gray-50 rounded-lg"
            role="log"
            aria-live="polite"
            aria-label="Speech recognition test log"
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

      {/* Testing notes */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
        <AccessibleText text="Testing Notes" level="h3" />
        <ul className="mt-2 space-y-1 text-sm text-gray-700" role="list">
          <li>• Click "Start voice test" and speak to evaluate recognition.</li>
          <li>• Test ETH recognition: say "ether", "eth", or "e t h".</li>
          <li>• Test number recognition: say "zero point zero zero five" or "0.005".</li>
          <li>• Test contacts: say "show contacts" or "transfer to Alice".</li>
          <li>• Test transfers: say "transfer 0.1 eth to Alice".</li>
        </ul>
      </div>
    </div>
  )
}
