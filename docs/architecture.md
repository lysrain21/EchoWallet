# Echo Wallet - 盲人专用 Web3 钱包

## 📋 项目概述

Echo Wallet 是一款专为盲人和视力障碍用户设计的 Web3 钱包，基于 ERC-4337 账户抽象标准，通过语音交互提供完整的钱包功能。

## 🏗️ 项目架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    用户交互层 (UI Layer)                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │   语音识别模块    │  │   语音播报模块    │  │  无障碍界面   │   │
│  │  Speech Input   │  │ Speech Output   │  │ Accessible UI│   │
│  └─────────────────┘  └─────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   业务逻辑层 (Business Layer)                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │   语音命令解析    │  │   钱包操作逻辑    │  │  状态管理     │   │
│  │ Command Parser  │  │ Wallet Logic    │  │ State Store  │   │
│  └─────────────────┘  └─────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   钱包抽象层 (Wallet Layer)                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │  ERC-4337 SDK   │  │   用户操作构建    │  │  签名管理     │   │
│  │ Account Abstract│  │ UserOperation   │  │ Signer Mgmt  │   │
│  └─────────────────┘  └─────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   区块链层 (Blockchain Layer)                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │  ZeroDev Bundle │  │ ZeroDev Paymaster│  │ Ethereum RPC │   │
│  │    Bundler      │  │   Gas Sponsor   │  │   Provider   │   │
│  └─────────────────┘  └─────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 技术架构分层

### 1. 用户交互层 (UI Layer)
**作用**: 处理用户输入和输出，提供无障碍的交互体验

**技术选型**:
- **前端框架**: Next.js 14 (App Router)
- **UI组件**: Radix UI (原生支持无障碍)
- **样式**: Tailwind CSS + 无障碍主题
- **语音识别**: Web Speech API / Whisper API
- **语音合成**: Web Speech Synthesis API
- **类型检查**: TypeScript

### 2. 业务逻辑层 (Business Layer)
**作用**: 处理语音命令解析、钱包业务逻辑和应用状态管理

**技术选型**:
- **状态管理**: Zustand
- **语音处理**: 自然语言处理 + 规则匹配
- **命令解析**: OpenAI GPT API (可选)
- **数据验证**: Zod
- **工具函数**: Lodash

### 3. 钱包抽象层 (Wallet Layer)
**作用**: 实现 ERC-4337 账户抽象，管理用户操作和签名

**技术选型**:
- **账户抽象**: @account-abstraction/sdk
- **区块链交互**: ethers.js v6
- **钱包连接**: ZeroDev SDK
- **智能合约**: Kernel Account (ZeroDev)
- **加密库**: @noble/secp256k1

### 4. 区块链层 (Blockchain Layer)
**作用**: 与以太坊网络交互，处理交易打包和gas代付

**技术选型**:
- **Bundler**: ZeroDev Bundler API
- **Paymaster**: ZeroDev Paymaster
- **RPC Provider**: ZeroDev RPC / Alchemy
- **网络**: Ethereum Mainnet / Sepolia Testnet

## 🔄 ERC-4337 钱包流程设计

### 1. 钱包创建流程
```
用户语音命令 → 生成助记词 → 创建 EOA → 部署 AA 钱包 → 语音确认
```

**详细步骤**:
1. 用户说："创建新钱包"
2. 系统生成12词助记词并语音播报
3. 用户确认助记词
4. 基于助记词创建 EOA (Externally Owned Account)
5. 通过 ZeroDev 创建 Smart Account
6. 保存钱包信息到本地存储
7. 语音播报钱包地址

### 2. 转账发起流程
```
语音命令 → 解析参数 → 构建 UserOperation → 签名 → 发送到 Bundler
```

**详细步骤**:
1. 用户说："转账 0.1 ETH 到 0x123..."
2. 语音识别和命令解析
3. 验证余额和地址格式
4. 构建 UserOperation 结构
5. 使用私钥签名 UserOperation
6. 发送到 ZeroDev Bundler

### 3. Bundler 打包流程
```
接收 UserOperation → 验证 → 打包 → 提交到链上 → 返回交易哈希
```

### 4. Paymaster 代付流程
```
检查代付条件 → 签名 UserOperation → 扣除代付额度 → 支付 gas 费用
```

### 5. 交易完成语音反馈
```
监听交易状态 → 确认上链 → 播报交易结果 → 更新余额显示
```

## 🎙️ 语音交互流程

### 1. 用户说话
- 语音激活检测 (Voice Activity Detection)
- 噪音过滤和预处理

### 2. 语音识别
- 使用 Web Speech API 实时识别
- 备用方案: Whisper API 离线识别
- 多语言支持 (中文/英文)

### 3. 语义解析
```javascript
// 语音命令解析示例
const commands = {
  "查询余额": () => getBalance(),
  "转账 {amount} {token} 到 {address}": (amount, token, address) => transfer(amount, token, address),
  "查看交易历史": () => getTransactionHistory(),
  "创建钱包": () => createWallet()
}
```

### 4. 钱包操作
- 执行对应的钱包功能
- 异步操作状态管理
- 错误处理和重试机制

### 5. 语音播报反馈
- 操作结果语音播报
- 进度状态实时反馈
- 错误信息清晰提示

## 📦 功能模块列表

### MVP 功能 (最小可行产品)
- [x] 基础项目架构
- [ ] 语音识别和播报
- [ ] 钱包创建/导入
- [ ] ETH 余额查询
- [ ] ETH 转账功能
- [ ] 交易状态查询
- [ ] 基础无障碍界面

### 扩展功能 (后续版本)
- [ ] ERC-20 代币支持
- [ ] 多链支持 (Polygon, BSC)
- [ ] NFT 查看和转移
- [ ] DeFi 协议集成
- [ ] 社交恢复功能
- [ ] 多重签名支持
- [ ] 交易历史导出
- [ ] 离线语音识别
- [ ] 自定义语音命令
- [ ] 钱包备份/恢复
- [ ] 生物识别解锁
- [ ] 硬件钱包支持

## 📁 目录结构建议

```
echo-wallet/
├── .github/                    # GitHub 配置
│   └── copilot-instructions.md
├── .next/                      # Next.js 构建文件
├── .vscode/                    # VS Code 配置
│   └── tasks.json
├── docs/                       # 项目文档
│   ├── architecture.md
│   ├── api.md
│   └── accessibility.md
├── public/                     # 静态资源
│   ├── icons/
│   └── sounds/                 # 语音提示音
├── src/                        # 源代码目录
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── wallet/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   └── api/                # API 路由
│   │       ├── wallet/
│   │       └── speech/
│   ├── components/             # React 组件
│   │   ├── ui/                 # 基础 UI 组件
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── dialog.tsx
│   │   ├── wallet/             # 钱包相关组件
│   │   │   ├── WalletCreate.tsx
│   │   │   ├── WalletBalance.tsx
│   │   │   ├── TransferForm.tsx
│   │   │   └── TransactionList.tsx
│   │   ├── speech/             # 语音相关组件
│   │   │   ├── VoiceInput.tsx
│   │   │   ├── VoiceOutput.tsx
│   │   │   └── CommandParser.tsx
│   │   └── accessibility/      # 无障碍组件
│   │       ├── ScreenReader.tsx
│   │       ├── KeyboardNav.tsx
│   │       └── FocusManager.tsx
│   ├── lib/                    # 工具库
│   │   ├── wallet/             # 钱包相关
│   │   │   ├── aa-wallet.ts    # Account Abstraction
│   │   │   ├── signer.ts       # 签名管理
│   │   │   ├── bundler.ts      # Bundler 接口
│   │   │   └── paymaster.ts    # Paymaster 接口
│   │   ├── speech/             # 语音处理
│   │   │   ├── recognition.ts  # 语音识别
│   │   │   ├── synthesis.ts    # 语音合成
│   │   │   └── commands.ts     # 命令解析
│   │   ├── crypto/             # 加密相关
│   │   │   ├── mnemonic.ts     # 助记词
│   │   │   ├── keys.ts         # 密钥管理
│   │   │   └── storage.ts      # 安全存储
│   │   └── utils/              # 通用工具
│   │       ├── constants.ts
│   │       ├── formatters.ts
│   │       └── validators.ts
│   ├── hooks/                  # React Hooks
│   │   ├── useWallet.ts
│   │   ├── useSpeech.ts
│   │   ├── useAccessibility.ts
│   │   └── useLocalStorage.ts
│   ├── store/                  # 状态管理
│   │   ├── index.ts
│   │   ├── walletStore.ts
│   │   ├── speechStore.ts
│   │   └── uiStore.ts
│   ├── types/                  # TypeScript 类型
│   │   ├── wallet.ts
│   │   ├── speech.ts
│   │   └── api.ts
│   └── styles/                 # 样式文件
│       ├── globals.css
│       └── accessibility.css
├── tests/                      # 测试文件
│   ├── __mocks__/
│   ├── components/
│   ├── lib/
│   └── accessibility/
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
├── jest.config.js
├── .env.local
├── .env.example
├── .gitignore
└── README.md
```

## 🚀 推荐的开发步骤

### 阶段一: 基础架构搭建 (1-2 周)
1. **项目初始化**
   - ✅ 创建 Next.js 项目
   - ✅ 配置 TypeScript 和 Tailwind
   - ✅ 设置项目目录结构
   - [ ] 配置 ESLint 和 Prettier

2. **依赖安装和配置**
   - [ ] 安装 ethers.js 和相关区块链库
   - [ ] 集成 ZeroDev SDK
   - [ ] 设置 Zustand 状态管理
   - [ ] 配置 Radix UI 组件

3. **基础组件开发**
   - [ ] 创建无障碍 UI 组件库
   - [ ] 实现键盘导航系统
   - [ ] 设置屏幕阅读器支持

### 阶段二: 语音交互功能 (2-3 周)
1. **语音识别模块**
   - [ ] 集成 Web Speech API
   - [ ] 实现语音激活检测
   - [ ] 添加噪音过滤和预处理

2. **语音合成模块**
   - [ ] 实现文本转语音功能
   - [ ] 设计语音反馈系统
   - [ ] 添加多语言支持

3. **命令解析系统**
   - [ ] 设计语音命令词典
   - [ ] 实现自然语言处理
   - [ ] 添加命令确认机制

### 阶段三: ERC-4337 钱包功能 (3-4 周)
1. **钱包基础功能**
   - [ ] 实现助记词生成和管理
   - [ ] 集成 Smart Account 创建
   - [ ] 实现安全存储机制

2. **Account Abstraction 集成**
   - [ ] 配置 ZeroDev Bundler
   - [ ] 实现 UserOperation 构建
   - [ ] 集成 Paymaster 代付功能

3. **交易功能**
   - [ ] 实现 ETH 转账功能
   - [ ] 添加余额查询功能
   - [ ] 实现交易状态监控

### 阶段四: 测试和优化 (2-3 周)
1. **功能测试**
   - [ ] 单元测试覆盖
   - [ ] 集成测试
   - [ ] 端到端测试

2. **无障碍测试**
   - [ ] 屏幕阅读器兼容性测试
   - [ ] 键盘导航测试
   - [ ] WCAG 2.1 合规性检查

3. **语音功能测试**
   - [ ] 不同环境下的语音识别测试
   - [ ] 语音命令准确性测试
   - [ ] 多语言支持测试

### 阶段五: 部署和文档 (1 周)
1. **部署准备**
   - [ ] 生产环境配置
   - [ ] 安全审计
   - [ ] 性能优化

2. **文档编写**
   - [ ] 用户使用手册
   - [ ] 开发者文档
   - [ ] API 文档

3. **发布和推广**
   - [ ] 测试网部署
   - [ ] 社区反馈收集
   - [ ] 黑客松提交

## 🔐 安全考虑

1. **私钥安全**
   - 使用 Web Crypto API 进行本地加密
   - 实现安全的密钥派生函数
   - 避免明文存储敏感信息

2. **交易安全**
   - 实现交易前确认机制
   - 添加转账限额保护
   - 使用 ERC-4337 的原生安全特性

3. **语音隐私**
   - 本地语音处理优先
   - 最小化云端数据传输
   - 实现语音数据即时删除

## 📊 成功指标

1. **可用性指标**
   - 语音命令识别准确率 > 95%
   - 交易成功率 > 99%
   - 页面加载时间 < 3 秒

2. **无障碍指标**
   - WCAG 2.1 AA 级别合规
   - 支持主流屏幕阅读器
   - 完全键盘可操作

3. **用户体验指标**
   - 用户完成首次转账时间 < 5 分钟
   - 用户满意度评分 > 4.5/5
   - 功能使用成功率 > 90%

---

**项目目标**: 为盲人用户提供安全、易用、完整的 Web3 钱包体验，推动区块链技术的无障碍普及。
