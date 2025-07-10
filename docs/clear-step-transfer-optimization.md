# 转账流程优化 - 清晰的分步交互

## 问题描述
用户反馈当前的转账流程不够清晰：
- 说"转账"后系统提示太复杂
- 语音解析容易失败
- 流程步骤不够明确

## 解决方案

### 核心改进
将转账流程重新设计为两种清晰的模式：

#### 模式1：分步转账（推荐）
```
用户: "转账"
系统: "开始转账流程。请说出联系人姓名"
用户: "小明"
系统: "收款人：小明。现在请说明转账金额"
用户: "零点零零一"
系统: "转账金额：0.001 ETH"
系统: "请确认转账信息：转账 0.001 ETH 给 小明。请说'确认'执行转账，或说'取消'退出"
用户: "确认"
系统: 执行转账
```

#### 模式2：完整转账
```
用户: "转账给小明零点零零一"
系统: "确认转账信息：转账 0.001 ETH 给 小明"
用户: "确认"
系统: 执行转账
```

### 技术实现

#### 1. voiceService.ts 优化
- **智能命令识别**: 区分简单转账命令和完整转账命令
- **标记机制**: 添加 `isComplete` 标记区分不同类型的转账命令

```typescript
// 检查是否为完整的转账命令（包含联系人和金额）
const transferInfo = this.parseSimpleTransfer(transcript)
if (transferInfo && transferInfo.contactName && transferInfo.amount) {
  // 完整转账命令
  return { 
    type: 'transfer', 
    parameters: { 
      text: transcript, 
      ...transferInfo,
      token: 'eth',
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
```

#### 2. commandService.ts 重构

##### 新增方法：
- `startStepByStepTransferFlow()`: 启动清晰的分步转账流程
- 优化的 `handleCompleteTransferCommand()`: 处理完整转账命令
- 简化的 `handleRecipientInput()`: 更直接的联系人识别

##### 流程控制：
```typescript
case 'transfer':
  if (this.transferSteps.isActive) {
    await this.handleTransferStepInput(command.parameters?.text || '')
  } else {
    if (command.parameters?.isComplete) {
      // 完整转账命令
      await this.handleCompleteTransferCommand(command.parameters)
    } else {
      // 简单转账命令，开始分步流程
      await this.startStepByStepTransferFlow()
    }
  }
  break
```

### 用户体验改进

#### 1. 更清晰的步骤分离
- **第一步**: 只询问联系人姓名
- **第二步**: 只询问转账金额
- **第三步**: 确认转账信息

#### 2. 简化的语音提示
- 去除冗余的说明文字
- 每步只关注一个信息点
- 提示更简洁明了

#### 3. 智能错误处理
- **联系人不存在**: 提供添加联系人的指导，并允许重新输入
- **no-speech错误**: 不计入失败次数，智能重试
- **其他错误**: 友好的错误提示和恢复机制

#### 4. 灵活的输入方式
- 支持单独说"转账"进入分步流程
- 支持完整命令"转账给小明零点零零一"
- 两种方式都有良好的用户体验

### 对比分析

| 功能 | 优化前 | 优化后 |
|------|---------|---------|
| 初始提示 | "请告诉我转账给谁？您可以说联系人姓名或说出钱包地址" | "开始转账流程。请说出联系人姓名" |
| 步骤清晰度 | 模糊，用户不知道需要几步 | 明确的三步流程 |
| 错误处理 | 容易因解析失败而中断 | 智能重试和恢复 |
| 联系人识别 | 复杂的正则匹配，容易失败 | 简化的直接匹配 |
| 语音提示 | 冗长复杂 | 简洁明了 |

### 使用场景

#### 适合分步转账的情况：
- 用户不确定完整语法
- 需要思考金额
- 希望有清晰的步骤指导

#### 适合完整转账的情况：
- 熟练用户
- 信息明确
- 希望快速完成

## 测试验证

运行测试文件 `stepByStepTransferTest.ts` 中的测试场景来验证优化效果。

## 总结

这次优化大幅提升了转账流程的用户体验：
- **清晰性**: 明确的步骤分离，用户知道每步要做什么
- **简洁性**: 语音提示更简洁，减少认知负担
- **可靠性**: 更好的错误处理和恢复机制
- **灵活性**: 支持两种输入方式，满足不同用户需求

特别适合盲人用户，提供了清晰、简洁、可靠的语音转账体验。
