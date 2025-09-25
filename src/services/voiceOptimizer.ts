/**
 * Echo Wallet - Voice Recognition Optimizer
 * Normalizes English speech transcripts for numbers, tokens, and common phrases.
 */

export class VoiceRecognitionOptimizer {
  private static readonly NUMBER_WORD_MAP: Record<string, string> = {
    zero: '0',
    oh: '0',
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
    ten: '10'
  }

  private static readonly FRACTION_MAP: Record<string, string> = {
    half: '0.5',
    'one half': '0.5',
    quarter: '0.25',
    'one quarter': '0.25',
    tenth: '0.1',
    'one tenth': '0.1'
  }

  private static readonly TOKEN_MAP: Record<string, string> = {
    eth: 'eth',
    ethereum: 'eth',
    ether: 'eth',
    'e t h': 'eth',
    'e-th': 'eth',
    'e t': 'eth',
    'ee th': 'eth',
    'eth token': 'eth'
  }

  private static readonly COMMON_REPLACEMENTS: Array<{ pattern: RegExp; value: string }> = [
    { pattern: /\btransfor\b/g, value: 'transfer' },
    { pattern: /\btranser\b/g, value: 'transfer' },
    { pattern: /\bquik\b/g, value: 'quick' },
    { pattern: /\bquick send\b/g, value: 'quick transfer' },
    { pattern: /\bsend it\b/g, value: 'send eth' },
    { pattern: /\bbalancee\b/g, value: 'balance' },
    { pattern: /\bwalet\b/g, value: 'wallet' }
  ]

  /**
   * Optimize speech recognition result.
   */
  static optimizeText(text: string): string {
    if (!text) return text

    let optimized = text.trim().toLowerCase()

    optimized = this.normalizeNumbers(optimized)
    optimized = this.normalizeTokens(optimized)
    optimized = this.fixCommonMisrecognitions(optimized)

    console.log(`🎤 Voice optimizer: "${text}" → "${optimized}"`)

    return optimized
  }

  /**
   * Normalize number expressions such as "zero point zero one".
   */
  private static normalizeNumbers(text: string): string {
    let result = this.enhanceDecimalRecognition(text)

    Object.entries(this.FRACTION_MAP).forEach(([phrase, value]) => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'g')
      result = result.replace(regex, value)
    })

    Object.entries(this.NUMBER_WORD_MAP).forEach(([word, digit]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g')
      result = result.replace(regex, digit)
    })

    // Convert patterns like "0 point 0 5" → "0.05"
    result = result.replace(/(\d+)\s*(?:point|dot)\s*([0-9\s]+)/g, (_, whole: string, decimals: string) => {
      const normalizedDecimals = decimals.replace(/\s+/g, '')
      return `${whole}.${normalizedDecimals}`
    })

    // Convert patterns like "point 5" → "0.5"
    result = result.replace(/\b(?:point|dot)\s*([0-9\s]+)/g, (_, decimals: string) => {
      const normalizedDecimals = decimals.replace(/\s+/g, '')
      return normalizedDecimals ? `0.${normalizedDecimals}` : '0.'
    })

    // Clean up filler words that often appear between digits
    result = result.replace(/\band(?=\s+\d)/g, '')

    return result.replace(/\s{2,}/g, ' ').trim()
  }

  /**
   * Normalize token names to their canonical values.
   */
  private static normalizeTokens(text: string): string {
    let result = text

    Object.entries(this.TOKEN_MAP).forEach(([variant, standard]) => {
      const regex = new RegExp(`\\b${variant}\\b`, 'g')
      result = result.replace(regex, standard)
    })

    return result
  }

  /**
   * Fix common misrecognitions that appear in English transcripts.
   */
  private static fixCommonMisrecognitions(text: string): string {
    let result = text

    this.COMMON_REPLACEMENTS.forEach(({ pattern, value }) => {
      result = result.replace(pattern, value)
    })

    return result
  }

  /**
   * Parse transfer commands and extract recipients and amounts.
   */
  static parseTransferCommand(optimizedText: string) {
    if (!optimizedText) return null

    const text = optimizedText.trim()

    const contactPatterns: Array<{
      pattern: RegExp
      extract: (match: RegExpMatchArray) => { amount: string; contactName: string }
    }> = [
      {
        pattern: /\b(?:transfer|send)\s*([0-9.]+)\s*(?:eth|ether|ethereum)?\s*to\s*([a-z][a-z\s]+)/i,
        extract: (match) => ({ amount: match[1], contactName: match[2] })
      },
      {
        pattern: /\b(?:transfer|send)\s*to\s*([a-z][a-z\s]+)\s*([0-9.]+)\s*(?:eth|ether|ethereum)?/i,
        extract: (match) => ({ contactName: match[1], amount: match[2] })
      },
      {
        pattern: /\b(?:give|pay)\s*([a-z][a-z\s]+)\s*([0-9.]+)\s*(?:eth|ether|ethereum)?/i,
        extract: (match) => ({ contactName: match[1], amount: match[2] })
      }
    ]

    const addressPatterns: Array<{
      pattern: RegExp
      extract: (match: RegExpMatchArray) => { amount: string; address: string }
    }> = [
      {
        pattern: /\b(?:transfer|send)\s*([0-9.]+)\s*(?:eth|ether|ethereum)?\s*to\s*(0x[a-f0-9]{6,})/i,
        extract: (match) => ({ amount: match[1], address: match[2] })
      },
      {
        pattern: /\b(?:transfer|send)\s*to\s*(0x[a-f0-9]{6,})\s*([0-9.]+)\s*(?:eth|ether|ethereum)?/i,
        extract: (match) => ({ address: match[1], amount: match[2] })
      }
    ]

    const quickPatterns: Array<{ pattern: RegExp; extract: (match: RegExpMatchArray) => string }> = [
      {
        pattern: /\bquick\s*(?:transfer|send)\s*([0-9.]+)/i,
        extract: (match) => match[1]
      },
      {
        pattern: /\b(?:transfer|send)\s*([0-9.]+)$/i,
        extract: (match) => match[1]
      }
    ]

    for (const { pattern, extract } of contactPatterns) {
      const match = text.match(pattern)
      if (match) {
        const { amount, contactName } = extract(match)

        console.log(`✅ Parsed contact transfer → recipient=${contactName}, amount=${amount} ETH`)

        return {
          type: 'contact',
          amount,
          token: 'eth',
          contactName: contactName.trim()
        }
      }
    }

    for (const { pattern, extract } of addressPatterns) {
      const match = text.match(pattern)
      if (match) {
        const { amount, address } = extract(match)

        console.log(`✅ Parsed address transfer → address=${address}, amount=${amount} ETH`)

        return {
          type: 'address',
          amount,
          token: 'eth',
          to: address.trim()
        }
      }
    }

    for (const { pattern, extract } of quickPatterns) {
      const match = text.match(pattern)
      if (match) {
        const amount = extract(match)
        console.log(`✅ Parsed quick transfer → amount=${amount} ETH`)

        return {
          type: 'quick',
          amount,
          token: 'eth'
        }
      }
    }

    console.log('❌ Failed to parse transfer command')
    return null
  }

  /**
   * Validate and sanitize amount strings.
   */
  static validateAmount(amount: string): { isValid: boolean; corrected: string; message: string } {
    if (!amount) {
      return { isValid: false, corrected: '', message: 'Please specify the transfer amount.' }
    }

    let corrected = amount.replace(/[^\d.]/g, '')

    const num = parseFloat(corrected)
    if (isNaN(num) || num <= 0) {
      return { isValid: false, corrected: '', message: 'Invalid amount format. Please repeat the amount.' }
    }

    const decimalPlaces = corrected.split('.')[1]?.length || 0
    if (decimalPlaces > 6) {
      corrected = num.toFixed(6)
    }

    if (num > 1000) {
      return { isValid: false, corrected: '', message: 'The transfer amount is too large. Please confirm.' }
    }

    if (num < 0.000001) {
      return { isValid: false, corrected: '', message: 'The transfer amount is too small. Please confirm.' }
    }

    return {
      isValid: true,
      corrected,
      message: `Transfer amount: ${corrected}`
    }
  }

  /**
   * Enhance decimal recognition for common spoken patterns.
   */
  private static enhanceDecimalRecognition(text: string): string {
    let result = text

    const decimalMappings = [
      { pattern: /\bzero\s+(?:point|dot)\s+zero\s+zero\s+zero\s+one\b/g, value: '0.0001' },
      { pattern: /\bzero\s+(?:point|dot)\s+zero\s+zero\s+one\b/g, value: '0.001' },
      { pattern: /\bzero\s+(?:point|dot)\s+zero\s+one\b/g, value: '0.01' },
      { pattern: /\bzero\s+(?:point|dot)\s+one\b/g, value: '0.1' },
      { pattern: /\bzero\s+(?:point|dot)\s+zero\s+zero\s+zero\s+five\b/g, value: '0.0005' },
      { pattern: /\bzero\s+(?:point|dot)\s+zero\s+zero\s+five\b/g, value: '0.005' },
      { pattern: /\bzero\s+(?:point|dot)\s+zero\s+five\b/g, value: '0.05' },
      { pattern: /\bzero\s+(?:point|dot)\s+five\b/g, value: '0.5' }
    ]

    decimalMappings.forEach(({ pattern, value }) => {
      result = result.replace(pattern, value)
    })

    console.log(`🔢 Decimal enhancement: "${text}" → "${result}"`)
    return result
  }
}
