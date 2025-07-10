/**
 * Echo Wallet - 语音识别优化模块
 * 处理中文环境下的数字、英文和特殊词汇识别
 */

export class VoiceRecognitionOptimizer {
  
  /**
   * 数字转换映射表 - 处理中文数字识别
   */
  private static readonly NUMBER_MAP: Record<string, string> = {
    // 中文数字转阿拉伯数字
    '零': '0', '一': '1', '二': '2', '三': '3', '四': '4',
    '五': '5', '六': '6', '七': '7', '八': '8', '九': '9',
    '十': '10', '百': '100', '千': '1000', '万': '10000',
    
    // 小数点相关 - 扩展版
    '点': '.', '点零': '.0', '点五': '.5',
    '零点': '0.', '零点零': '0.0', '零点一': '0.1',
    '零点五': '0.5', '零点零一': '0.01', '零点零五': '0.05',
    '零点零零五': '0.005', '零点零零一': '0.001',
    '零点零零零五': '0.0005', '零点零零零一': '0.0001',
    
    // 常见小数表达
    '五分': '0.5', '一分': '0.1', '五厘': '0.05', '一厘': '0.01',
    '五毫': '0.005', '一毫': '0.001', '半毫': '0.0005',
    
    // 英文数字混合
    '零点zero zero五': '0.005',
    '零点zero zero一': '0.001',
    '零点zero五': '0.05',
    '零点zero一': '0.01',
    
    // 常见误识别修正
    '灵点': '0.',
    '令点': '0.',
    '零点点': '0.',
    '领点': '0.',
    '另点': '0.'
  }

  /**
   * 代币名称映射表 - 简化版，只支持ETH
   */
  private static readonly TOKEN_MAP: Record<string, string> = {
    // ETH的各种可能识别结果 - 扩展版
    'eth': 'eth', 'ETH': 'eth', 'e t h': 'eth', 'e-t-h': 'eth',
    'e th': 'eth', 'et h': 'eth', 'e  t  h': 'eth',
    '以太': 'eth', '以太币': 'eth', '以太坊': 'eth', '以太方': 'eth',
    'e太': 'eth', 'e太币': 'eth', '易太': 'eth', '意太': 'eth',
    '一太': 'eth', '乙太': 'eth', '医太': 'eth', '伊太': 'eth',
    '依太': 'eth', '艺太': 'eth', '宜太': 'eth', '翼太': 'eth',
    '额头': 'eth', '恶头': 'eth', '鹅头': 'eth', '饿头': 'eth',
    'eth币': 'eth', 'eth坊': 'eth', 'eth方': 'eth'
  }

  /**
   * 优化语音识别结果
   */
  static optimizeText(text: string): string {
    if (!text) return text

    let optimized = text.trim().toLowerCase()
    
    // 1. 处理数字识别
    optimized = this.normalizeNumbers(optimized)
    
    // 2. 处理代币名称
    optimized = this.normalizeTokens(optimized)
    
    // 3. 处理常见误识别
    optimized = this.fixCommonMisrecognitions(optimized)
    
    console.log(`🎤 语音优化: "${text}" → "${optimized}"`)
    
    return optimized
  }

  /**
   * 规范化数字表达
   */
  private static normalizeNumbers(text: string): string {
    let result = text

    // 处理中文数字映射
    Object.entries(this.NUMBER_MAP).forEach(([chinese, arabic]) => {
      const regex = new RegExp(chinese, 'g')
      result = result.replace(regex, arabic)
    })

    // 增强小数表达处理 - 修复 0.001 识别问题
    result = result.replace(/零点零零一/g, '0.001')
    result = result.replace(/零点零一/g, '0.01')
    result = result.replace(/零点一/g, '0.1')
    result = result.replace(/零点零零零一/g, '0.0001')
    
    // 处理更多小数变体
    result = result.replace(/零点零零(\d)/g, '0.00$1')
    result = result.replace(/零点零(\d)/g, '0.0$1')
    result = result.replace(/零点(\d)/g, '0.$1')
    
    // 处理"点"作为小数点
    result = result.replace(/(\d)点(\d)/g, '$1.$2')
    
    return result
  }

  /**
   * 规范化代币名称
   */
  private static normalizeTokens(text: string): string {
    let result = text

    Object.entries(this.TOKEN_MAP).forEach(([variant, standard]) => {
      const regex = new RegExp(`\\b${variant}\\b`, 'gi')
      result = result.replace(regex, standard)
    })

    return result
  }

  /**
   * 修复常见误识别
   */
  private static fixCommonMisrecognitions(text: string): string {
    let result = text

    // 转账相关的修复
    result = result.replace(/专章|转帐|传账|砖账|赚账/g, '转账')
    result = result.replace(/发送到|发送给|法松到|法松给/g, '发送')
    
    // 钱包相关的修复
    result = result.replace(/钱宝|前包|签包|千包|欠包/g, '钱包')
    result = result.replace(/余额|鱼儿|余饿|余俄|鱼饿/g, '余额')
    
    // 导入钱包相关的修复
    result = result.replace(/导入钱宝|导入前包|导入签包/g, '导入钱包')
    result = result.replace(/生物识别|生物时别|生物是别|声纹识别/g, '生物识别')
    result = result.replace(/指纹识别|指纹时别|指纹是别/g, '指纹识别')
    result = result.replace(/面部识别|面部时别|脸部识别/g, '面部识别')
    
    // 确认相关的修复
    result = result.replace(/确人|确认|去人|取人|却人/g, '确认')
    result = result.replace(/取消|去消|曲消|却消/g, '取消')

    // 联系人相关的修复
    result = result.replace(/联系任|连系人|链系人|练习人/g, '联系人')
    result = result.replace(/显示联系任|显示连系人|显示链系人/g, '显示联系人')
    result = result.replace(/查看联系任|查看连系人|查看链系人/g, '查看联系人')

    return result
  }

  /**
   * 解析转账命令
   */
  static parseTransferCommand(optimizedText: string) {
    if (!optimizedText) return null

    // 联系人转账模式 - 只支持ETH的正则
    const contactPatterns = [
      // 标准格式：转账 [金额] 给 [联系人] (不再匹配代币)
      /转账\s*([0-9.]+)\s*给\s*([^0x\s]+)/i,
      /发送\s*([0-9.]+)\s*到\s*([^0x\s]+)/i,
      /给\s*([^0x\s]+)\s*转\s*([0-9.]+)/i,
      
      // 简化格式：转 [金额] 给 [联系人]
      /转\s*([0-9.]+)\s*给\s*([^0x\s]+)/i,
      /给\s*([^0x\s]+)\s*转\s*([0-9.]+)/i
    ]

    // 快速转账模式 - 只支持ETH
    const quickPatterns = [
      /快速转账\s*([0-9.]+)/i,
      /转账\s*([0-9.]+)$/i,
      /转\s*([0-9.]+)$/i
    ]

    // 检查联系人转账
    for (const pattern of contactPatterns) {
      const match = optimizedText.match(pattern)
      if (match) {
        // 处理不同的匹配组
        let amount, contactName
        
        if (pattern.source.includes('给\\s*([^0x\\s]+)\\s*转')) {
          // "给XX转XX"格式
          [, contactName, amount] = match
        } else {
          // "转账XX给XX"格式
          [, amount, contactName] = match
        }

        console.log(`✅ 联系人转账解析: 收款人=${contactName}, 金额=${amount}ETH`)
        
        return {
          type: 'contact',
          amount: amount,
          token: 'eth', // 固定为ETH
          contactName: contactName?.trim()
        }
      }
    }

    // 检查快速转账
    for (const pattern of quickPatterns) {
      const match = optimizedText.match(pattern)
      if (match) {
        const [, amount] = match
        console.log(`✅ 快速转账解析: 金额=${amount}ETH`)
        
        return {
          type: 'quick',
          amount: amount,
          token: 'eth' // 固定为ETH
        }
      }
    }

    console.log(`❌ 转账命令解析失败`)
    return null
  }

  /**
   * 验证和修正金额格式
   */
  static validateAmount(amount: string): { isValid: boolean; corrected: string; message: string } {
    if (!amount) {
      return { isValid: false, corrected: '', message: '请说明转账金额' }
    }

    // 移除多余的空格和特殊字符
    let corrected = amount.replace(/[^\d.]/g, '')
    
    // 检查是否为有效数字
    const num = parseFloat(corrected)
    if (isNaN(num) || num <= 0) {
      return { isValid: false, corrected: '', message: '金额格式不正确，请重新说明' }
    }

    // 检查小数位数（最多18位，实际建议6位）
    const decimalPlaces = corrected.split('.')[1]?.length || 0
    if (decimalPlaces > 6) {
      corrected = num.toFixed(6)
    }

    // 检查金额范围（可配置）
    if (num > 1000) {
      return { isValid: false, corrected: '', message: '转账金额过大，请确认' }
    }

    if (num < 0.000001) {
      return { isValid: false, corrected: '', message: '转账金额过小，请确认' }
    }

    return { 
      isValid: true, 
      corrected: corrected,
      message: `转账金额：${corrected}`
    }
  }

  /**
   * 增强小数识别 - 专门处理常见的加密货币金额
   */
  private static enhanceDecimalRecognition(text: string): string {
    let result = text

    // 常见的加密货币金额表达
    const decimalMappings = [
      // 0.001 的各种表达方式
      { pattern: /零点零零一|0点零零一|零点00一|0点00一/g, value: '0.001' },
      { pattern: /零点零零0一|零点零零○一/g, value: '0.001' },
      
      // 0.01 的各种表达方式  
      { pattern: /零点零一|0点零一|零点0一|0点0一/g, value: '0.01' },
      { pattern: /零点零○一|零点○一/g, value: '0.01' },
      
      // 0.1 的各种表达方式
      { pattern: /零点一|0点一/g, value: '0.1' },
      
      // 0.0001 的各种表达方式
      { pattern: /零点零零零一|0点零零零一/g, value: '0.0001' },
    ]

    decimalMappings.forEach(({ pattern, value }) => {
      result = result.replace(pattern, value)
    })

    console.log(`🔢 小数识别增强: "${text}" → "${result}"`)
    return result
  }
}
