# 语音转账简化 - 仅支持ETH

## 变更概述

本次更新将语音转账功能简化为仅支持ETH货币，用户可以通过语音命令如"给小明转账0.001"来直接转账0.001个ETH，无需指定币种。

## 主要变更

### 1. 语音服务 (voiceService.ts)

#### 转账命令解析简化
- 移除了对多种代币的支持
- `parseSimpleTransfer` 方法现在固定返回 `token: 'eth'`
- 支持的语音模式：
  - "给小明转账0.001"
  - "给小明转0.001"
  - "转账0.001给小明"
  - "转0.001给小明"
  - "转给小明0.001"

#### 关键代码变更
```typescript
// 转账命令解析 - 简化版，只支持ETH
if (text.includes('转账') || text.includes('发送') || text.includes('转') || 
    (text.includes('给') && text.includes('转'))) {
  // 提取转账信息：金额和收款人
  const transferInfo = this.parseSimpleTransfer(transcript)
  if (transferInfo) {
    return { 
      type: 'transfer', 
      parameters: { 
        text: transcript, 
        ...transferInfo,
        token: 'eth' // 固定为ETH
      },
      confidence: 0 
    }
  }
}
```

### 2. 语音优化器 (voiceOptimizer.ts)

#### 代币映射简化
- 移除了USDC、USDT等代币的识别映射
- 只保留ETH相关的各种语音识别变体
- 简化了转账命令解析逻辑

#### 转账解析优化
```typescript
// 联系人转账模式 - 只支持ETH的正则
const contactPatterns = [
  /转账\s*([0-9.]+)\s*给\s*([^0x\s]+)/i,
  /发送\s*([0-9.]+)\s*到\s*([^0x\s]+)/i,
  /给\s*([^0x\s]+)\s*转\s*([0-9.]+)/i,
  /转\s*([0-9.]+)\s*给\s*([^0x\s]+)/i,
  /给\s*([^0x\s]+)\s*转\s*([0-9.]+)/i
]
```

### 3. 命令服务 (commandService.ts)

#### 转账流程简化
- 移除了代币选择步骤
- 分步转账状态管理中移除了代币相关字段
- 金额输入处理不再提取代币信息

#### 执行转账优化
```typescript
// 执行转账 - 简化版，只支持ETH
private async executeTransfer(request: TransferRequest, privateKey: string) {
  // 只处理ETH转账
  const txHash = await walletService.transferETH(request, privateKey)
  // ...
}
```

#### 金额输入处理
```typescript
// 提取金额 - 简化版，不再提取代币类型
const amountMatch = optimizedInput.match(/([0-9.]+)/i)
```

### 4. 分步转账流程简化

转账流程现在只包含三个步骤：
1. **收款人确认** - 识别联系人姓名或钱包地址
2. **金额确认** - 输入ETH数量
3. **最终确认** - 确认转账信息

不再包含：
- 代币选择步骤
- 代币类型验证
- 多币种支持逻辑

## 用户体验改进

### 语音命令示例
```
用户: "给小明转账0.001"
系统: "确认转账信息：转账 0.001 ETH 给 小明"
用户: "确认"
系统: "正在执行转账..."
```

### 分步引导示例
```
用户: "转账"
系统: "请告诉我转账给谁？"
用户: "小明"
系统: "现在请说明转账金额"
用户: "0.001"
系统: "转账金额：0.001 ETH"
系统: "请确认转账信息：转账 0.001 ETH 给 小明"
用户: "确认"
系统: "正在执行转账..."
```

## 技术优势

1. **简化用户体验** - 用户无需选择币种，直接说出金额即可
2. **减少错误** - 避免了代币选择相关的语音识别错误
3. **提高效率** - 减少了交互步骤，加快转账流程
4. **更符合现实** - 对于盲人用户，ETH作为主要货币更实用

## 兼容性

- 现有的联系人系统完全兼容
- 钱包服务的ETH转账功能正常工作
- 语音识别的数字和金额处理逻辑保持不变

## 后续扩展

如果将来需要支持多币种，可以：
1. 在语音命令中添加代币识别
2. 恢复代币选择步骤
3. 扩展TOKEN_MAP映射表
4. 修改转账执行逻辑

但目前的简化版本更适合盲人用户的日常使用需求。
