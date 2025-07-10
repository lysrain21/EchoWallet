/**
 * Echo Wallet - 语音识别服务 (重构版)
 * 处理语音输入和语音输出，支持优化的语音识别
 */

import { VoiceCommand } from '@/types'
import { TTS_TEMPLATES, WALLET_CONFIG } from '@/config'
import { VoiceRecognitionOptimizer } from './voiceOptimizer'

// 语音识别类型声明
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

class VoiceService {
  private recognition: any = null
  private synthesis: SpeechSynthesis | null = null
  private isListening = false
  private onCommandCallback?: (command: VoiceCommand) => void
  private onErrorCallback?: (error: string) => void

  constructor() {
    this.initSpeechRecognition()
    this.initSpeechSynthesis()
  }

  /**
   * 初始化语音识别
   */
  private initSpeechRecognition() {
    if (typeof window === 'undefined') return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.warn('此浏览器不支持语音识别')
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.lang = WALLET_CONFIG.SPEECH_CONFIG.DEFAULT_LANGUAGE
    this.recognition.continuous = false
    this.recognition.interimResults = false
    this.recognition.maxAlternatives = WALLET_CONFIG.SPEECH_CONFIG.MAX_ALTERNATIVES

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0]
      if (result.isFinal && result[0].confidence > WALLET_CONFIG.SPEECH_CONFIG.CONFIDENCE_THRESHOLD) {
        const rawTranscript = result[0].transcript.trim()
        
        // 🔧 使用优化器处理语音结果
        const optimizedTranscript = VoiceRecognitionOptimizer.optimizeText(rawTranscript)
        
        console.log(`🎤 原始识别: "${rawTranscript}"`)
        console.log(`✨ 优化结果: "${optimizedTranscript}"`)
        
        this.processVoiceInput(optimizedTranscript, result[0].confidence)
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('语音识别错误:', event.error)
      
      let errorMessage = '语音识别失败，请重试'
      
      // 根据不同错误类型提供友好的提示
      switch (event.error) {
        case 'no-speech':
          // 对于 no-speech 错误，只记录日志，不播报错误
          console.log('🔇 没有检测到语音输入，等待用户重新说话')
          this.isListening = false
          // 传递友好的错误信息给回调，但不播报
          this.onErrorCallback?.('没有检测到语音')
          return
        case 'audio-capture':
          errorMessage = '无法访问麦克风，请检查麦克风是否正常连接并允许网页使用麦克风'
          break
        case 'not-allowed':
          errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许此网站使用麦克风'
          break
        case 'network':
          errorMessage = '网络连接问题，请检查网络连接后重试'
          break
        case 'aborted':
          // 用户主动停止，不需要错误提示
          this.isListening = false
          return
        case 'bad-grammar':
          errorMessage = '语音识别出现语法错误，请重新清晰地说出您的指令'
          break
        case 'service-not-allowed':
          errorMessage = '语音识别服务不可用，请稍后重试'
          break
        default:
          errorMessage = `语音识别遇到问题：${event.error}，请重试`
      }
      
      // 播报错误信息并传递给回调
      this.speak(errorMessage)
      this.onErrorCallback?.(errorMessage)
      this.isListening = false
    }

    this.recognition.onend = () => {
      this.isListening = false
    }
  }

  /**
   * 初始化语音合成
   */
  private initSpeechSynthesis() {
    if (typeof window === 'undefined') return
    this.synthesis = window.speechSynthesis
  }

  /**
   * 开始监听语音输入
   */
  startListening(onCommand: (command: VoiceCommand) => void, onError?: (error: string) => void) {
    if (!this.recognition) {
      onError?.('语音识别不可用')
      return
    }

    if (this.isListening) {
      this.stopListening()
    }

    this.onCommandCallback = onCommand
    this.onErrorCallback = onError
    this.isListening = true

    try {
      this.recognition.start()
    } catch (error) {
      this.isListening = false
      onError?.('无法启动语音识别')
    }
  }

  /**
   * 开始监听语音输入 - 原始文本模式（用于转账流程中的步骤输入）
   */
  startListeningForText(onText: (text: string) => void, onError?: (error: string) => void) {
    if (!this.recognition) {
      onError?.('语音识别不可用')
      return
    }

    if (this.isListening) {
      this.stopListening()
    }

    // 设置临时回调，直接传递文本而不解析命令
    this.onCommandCallback = (command) => {
      // 如果有参数文本，直接传递；否则传递命令类型
      const text = command.parameters?.text || command.type
      onText(text)
    }
    this.onErrorCallback = onError
    this.isListening = true

    try {
      this.recognition.start()
    } catch (error) {
      this.isListening = false
      onError?.('无法启动语音识别')
    }
  }

  /**
   * 停止监听
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  /**
   * 语音播报
   */
  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }) {
    if (!this.synthesis) {
      console.warn('语音合成不可用')
      return
    }

    // 停止当前播报
    this.synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = WALLET_CONFIG.SPEECH_CONFIG.DEFAULT_LANGUAGE
    utterance.rate = options?.rate || 1
    utterance.pitch = options?.pitch || 1
    utterance.volume = options?.volume || 1

    console.log(`🔊 语音播报: "${text}"`)
    this.synthesis.speak(utterance)
  }

  /**
   * 使用模板播报
   */
  speakTemplate(template: keyof typeof TTS_TEMPLATES, variables?: Record<string, string>) {
    let text = TTS_TEMPLATES[template]
    
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        text = text.replace(`{${key}}`, value)
      })
    }

    this.speak(text)
  }

  /**
   * 处理语音输入 - 增强版
   */
  private processVoiceInput(transcript: string, confidence: number) {
    console.log('🎤 处理语音输入:', transcript, '置信度:', confidence)

    // 检查是否是直接文本模式（转账流程中）
    // 如果回调函数期望原始文本，创建一个包含文本的伪命令
    const command = this.parseCommand(transcript)
    if (command) {
      command.confidence = confidence
      this.onCommandCallback?.(command)
    } else {
      // 如果无法解析为命令，可能是转账流程中的步骤输入
      // 创建一个通用的文本命令
      const textCommand: VoiceCommand = {
        type: 'text_input',
        parameters: { text: transcript },
        confidence: confidence
      }
      this.onCommandCallback?.(textCommand)
    }
  }

  /**
   * 解析语音命令 - 增强版
   */
  private parseCommand(transcript: string): VoiceCommand | null {
    const text = transcript.toLowerCase()

    // 创建钱包
    if (text.includes('创建钱包') || text.includes('新建钱包') || text.includes('新钱包')) {
      return { type: 'create_wallet', confidence: 0 }
    }

    // 导入钱包（生物识别登录）
    if (text.includes('导入钱包') || text.includes('恢复钱包') || text.includes('登录钱包') || 
        text.includes('生物识别') || text.includes('指纹登录') || text.includes('面部识别')) {
      return { type: 'import_wallet', confidence: 0 }
    }

    // 查询余额
    if (text.includes('查询余额') || text.includes('检查余额') || text.includes('余额')) {
      return { type: 'balance', confidence: 0 }
    }

    // 联系人管理命令
    if (text.includes('联系人') || text.includes('通讯录') || 
        text.includes('显示联系人') || text.includes('查看联系人') ||
        text.includes('常用联系人') || text.includes('联系人列表')) {
      console.log('🔍 识别到联系人命令:', transcript)
      return {
        type: 'contacts',
        parameters: { text: transcript },
        confidence: 0
      }
    }

    // 转账命令解析 - 简化版，只支持ETH
    if (text.includes('转账') || text.includes('发送') || text.includes('转账给') || 
        (text.includes('给') && text.includes('转'))) {
      
      // 检查是否为完整的转账命令（包含联系人和金额）
      const transferInfo = this.parseSimpleTransfer(transcript)
      if (transferInfo && transferInfo.contactName && transferInfo.amount) {
        // 完整转账命令，包含所有信息
        return { 
          type: 'transfer', 
          parameters: { 
            text: transcript, 
            ...transferInfo,
            token: 'eth', // 固定为ETH
            isComplete: true // 标记为完整命令
          },
          confidence: 0 
        }
      } else {
        // 简单转账命令（如"转账"），进入分步流程
        return {
          type: 'transfer',
          parameters: { 
            text: transcript,
            isComplete: false // 标记为需要分步处理
          },
          confidence: 0
        }
      }
    }

    // 交易状态查询
    if (text.includes('交易状态') || text.includes('查询交易')) {
      const hash = this.extractTransactionHash(text)
      return { 
        type: 'transaction_status', 
        parameters: { hash },
        confidence: 0 
      }
    }

    // 网络切换
    if (text.includes('切换网络') || text.includes('主网') || text.includes('测试网')) {
      return {
        type: 'switch_network',
        parameters: { text: transcript },
        confidence: 0
      }
    }

    return null
  }

  /**
   * 提取交易哈希
   */
  private extractTransactionHash(text: string): string | undefined {
    const hashPattern = /(0x[a-fA-F0-9]{64})/
    const match = text.match(hashPattern)
    return match?.[0]
  }

  /**
   * 简化的转账命令解析 - 只支持ETH
   */
  private parseSimpleTransfer(transcript: string): any {
    // 使用优化器处理文本
    const optimizedText = VoiceRecognitionOptimizer.optimizeText(transcript)
    console.log(`🔍 解析简化转账命令: "${optimizedText}"`)

    // 支持的模式：
    // 1. "给小明转账0.001" 或 "给小明转0.001" 
    // 2. "转账0.001给小明" 或 "转0.001给小明"
    // 3. "转账给小明0.001" 或 "转给小明0.001"

    const patterns = [
      // 给XX转(账)XX模式
      /给\s*([^0-9\s]+)\s*转(?:账)?\s*([0-9.]+)/i,
      // 转(账)XX给XX模式
      /转(?:账)?\s*([0-9.]+)\s*给\s*([^0-9\s]+)/i,
      // 转(账)给XXXX模式
      /转(?:账)?\s*给\s*([^0-9\s]+)\s*([0-9.]+)/i
    ]

    for (const pattern of patterns) {
      const match = optimizedText.match(pattern)
      if (match) {
        let contactName, amount
        
        // 根据不同模式提取参数
        if (pattern.source.includes('给\\s*([^0-9\\s]+)\\s*转')) {
          // "给XX转XX"模式
          [, contactName, amount] = match
        } else if (pattern.source.includes('转(?:账)?\\s*([0-9.]+)\\s*给')) {
          // "转XX给XX"模式
          [, amount, contactName] = match
        } else {
          // "转给XXXX"模式
          [, contactName, amount] = match
        }

        // 验证金额格式
        const validation = VoiceRecognitionOptimizer.validateAmount(amount)
        if (!validation.isValid) {
          console.log(`❌ 金额验证失败: ${validation.message}`)
          return null
        }

        console.log(`✅ 解析成功: 收款人=${contactName}, 金额=${validation.corrected}ETH`)
        
        return {
          type: 'contact',
          contactName: contactName?.trim(),
          amount: validation.corrected,
          token: 'eth' // 固定为ETH，不再从语音中提取
        }
      }
    }

    // 如果没有匹配到完整信息，尝试只提取金额
    const amountMatch = optimizedText.match(/([0-9.]+)/i)
    if (amountMatch) {
      const validation = VoiceRecognitionOptimizer.validateAmount(amountMatch[1])
      if (validation.isValid) {
        console.log(`✅ 仅解析到金额: ${validation.corrected}ETH`)
        return {
          type: 'amount_only',
          amount: validation.corrected,
          token: 'eth' // 固定为ETH
        }
      }
    }

    console.log(`❌ 转账命令解析失败`)
    return null
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      isListening: this.isListening,
      isSupported: !!this.recognition && !!this.synthesis
    }
  }
}

// 单例实例
export const voiceService = new VoiceService()

// 全局类型声明
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}
