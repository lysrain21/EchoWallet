# 转账流程步骤输入修复

## 问题描述
用户反馈在转账流程中，当系统提示"请说出联系人姓名"后，用户说"小明"时系统回复"抱歉，我没有理解您的命令，请重试"，导致转账流程无法正常进行。

## 问题分析
### 根本原因
转账流程中的步骤输入（如联系人姓名"小明"）被错误地当作新的语音命令处理，而"小明"无法被解析为有效的语音命令，导致系统报错。

### 问题流程
```
1. 用户: "转账"
2. 系统: "开始转账流程。请说出联系人姓名" 
3. 用户: "小明"
4. 系统尝试将"小明"解析为语音命令 → 失败
5. 系统: "抱歉，我没有理解您的命令，请重试" ❌
```

## 解决方案

### 核心修复
引入专门的文本输入处理机制，区分主界面的命令监听和转账流程中的步骤输入。

### 1. 类型系统扩展
在 `types/index.ts` 中扩展 VoiceCommand 类型：
```typescript
export interface VoiceCommand {
  type: 'create_wallet' | 'transfer' | 'balance' | 'import_wallet' | 
        'transaction_status' | 'contacts' | 'switch_network' | 'text_input'
  parameters?: Record<string, any>
  confidence: number
}
```

### 2. VoiceService 增强
在 `voiceService.ts` 中新增专门的文本监听方法：

#### 新方法：startListeningForText()
```typescript
startListeningForText(onText: (text: string) => void, onError?: (error: string) => void)
```
- 专门用于转账流程中的步骤输入
- 直接传递原始文本，不解析为命令
- 简化了转账流程的输入处理

#### 智能 processVoiceInput()
```typescript
private processVoiceInput(transcript: string, confidence: number) {
  const command = this.parseCommand(transcript)
  if (command) {
    // 成功解析为命令
    command.confidence = confidence
    this.onCommandCallback?.(command)
  } else {
    // 无法解析为命令时，创建文本输入命令
    const textCommand: VoiceCommand = {
      type: 'text_input',
      parameters: { text: transcript },
      confidence: confidence
    }
    this.onCommandCallback?.(textCommand)
  }
}
```

### 3. CommandService 处理增强
在 `commandService.ts` 中添加对 `text_input` 的处理：

```typescript
case 'text_input':
  // 处理转账流程中的文本输入
  if (this.transferSteps.isActive) {
    await this.handleTransferStepInput(command.parameters?.text || '')
  } else {
    voiceService.speak('抱歉，我不理解这个命令')
  }
  break
```

### 4. 转账流程优化
所有转账步骤的语音监听都改用 `startListeningForText()`：

- `waitForRecipientInput()` - 等待联系人输入
- `waitForAmountInput()` - 等待金额输入  
- `waitForConfirmation()` - 等待确认输入

## 修复效果

### 修复后的流程
```
1. 用户: "转账"
2. 系统: "开始转账流程。请说出联系人姓名"
3. 用户: "小明"
4. 系统: "收款人：小明。现在请说明转账金额" ✅
5. 用户: "零点零零一"
6. 系统: "转账金额：0.001 ETH" ✅
7. 系统: "请确认转账信息：转账 0.001 ETH 给 小明"
8. 用户: "确认"
9. 系统: 执行转账 ✅
```

### 用户体验改进
- ✅ 转账流程中不再出现"无法识别命令"错误
- ✅ 步骤输入被正确处理为文本而不是命令
- ✅ 流程更加顺畅和直观
- ✅ 保持了原有命令处理的完整功能

### 技术优势
- **向后兼容**: 不影响现有的语音命令功能
- **清晰分离**: 主界面命令和转账步骤输入分别处理
- **错误恢复**: 保持了原有的错误处理机制
- **扩展性**: 为未来其他流程输入提供了模式

## 使用场景对比

### 主界面语音监听 (startListening)
- 适用场景：用户说出完整的语音命令
- 处理方式：解析为具体的命令类型
- 示例：
  - "转账" → transfer 命令
  - "查询余额" → balance 命令
  - "联系人" → contacts 命令

### 转账流程语音监听 (startListeningForText)
- 适用场景：转账流程中的步骤输入
- 处理方式：直接传递原始文本
- 示例：
  - "小明" → 联系人姓名
  - "零点零零一" → 转账金额
  - "确认" → 确认操作

## 测试验证

运行测试文件 `transferStepInputFixTest.ts` 中的测试场景来验证修复效果。

### 测试步骤
1. 说"转账"进入转账流程
2. 说"小明"（应该被正确识别为联系人姓名）
3. 说"零点零零一"（应该被正确识别为转账金额）
4. 说"确认"（应该执行转账）
5. 整个流程应该顺畅无误

## 总结

这次修复彻底解决了转账流程中步骤输入被误解为命令的问题：

- **问题根源**: 缺乏对不同语音输入场景的区分处理
- **解决核心**: 引入专门的文本输入处理机制
- **修复效果**: 转账流程现在能正确处理所有步骤输入
- **用户体验**: 显著提升，特别对盲人用户更友好

修复后的系统能够智能区分主界面的语音命令和转账流程中的步骤输入，为用户提供了流畅、直观的转账体验。
