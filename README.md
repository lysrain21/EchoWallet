# Echo Wallet 🎤

**专为视力障碍用户设计的Web3钱包 - 完全语音操作的以太坊钱包**

## 🧑‍🦯 项目简介

Echo Wallet 是一款专为视力障碍用户设计的Web3钱包，通过语音识别和语音播报实现完全无视觉界面的以太坊钱包操作。项目集成了WebAuthn生物识别技术，支持安全的钱包创建和恢复，为盲人用户提供安全、便捷的去中心化金融体验。

## ✨ 核心特性

### 🎤 完全语音操作
- **语音创建钱包**: "创建钱包" - 生成新钱包并自动通过生物识别保存
- **语音导入钱包**: "导入钱包" - 通过生物识别快速恢复钱包
- **语音查询余额**: "查询余额" - 获取ETH余额信息
- **语音转账**: "转账" - 通过联系人或地址发送ETH
- **语音联系人管理**: "显示联系人" - 管理和查看联系人列表

### 🔐 生物识别安全
- **WebAuthn集成**: 支持指纹、面部识别、Windows Hello等
- **安全存储**: 钱包助记词通过生物识别加密存储在本地
- **一键恢复**: 通过生物识别验证即可快速恢复钱包
- **无助记词导入**: 导入钱包只需生物识别，无需手动输入助记词

### ♿ 无障碍设计
- **屏幕阅读器兼容**: 支持NVDA、JAWS、VoiceOver等
- **语音反馈**: 所有操作都有详细的语音播报
- **键盘导航**: 完整的键盘访问支持
- **ARIA标准**: 符合WCAG 2.1 AA标准
- **语音优化**: 智能处理"没有检测到语音"等常见问题

### � 智能转账
- **分步转账**: 引导式语音转账流程
- **联系人支持**: 通过姓名快速转账给联系人
- **智能识别**: 自动识别金额和收款人信息
- **确认机制**: 多重语音确认确保转账安全

## �🏗️ 技术架构

```
语音交互层: Web Speech API + 语音优化器
    ↓
生物识别层: WebAuthn + 本地加密存储
    ↓
应用逻辑层: Next.js 15 + React 19 + TypeScript
    ↓
状态管理层: Zustand + 持久化存储
    ↓
钱包服务层: ethers.js v5 + 钱包管理
    ↓
区块链层: 以太坊 + Sepolia测试网
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- 支持Web Speech API的现代浏览器（Chrome、Edge、Safari）
- 支持WebAuthn的设备（指纹识别、面部识别等）
- 屏幕阅读器（推荐NVDA）

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
# 或使用VS Code任务
# Ctrl+Shift+P -> "Tasks: Run Task" -> "Start Echo Wallet Dev Server"
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用。

## 🎯 语音命令列表

| 命令类型 | 语音指令示例 | 功能说明 |
|---------|-------------|----------|
| 钱包管理 | "创建钱包" | 生成新钱包并保存到生物识别 |
| 钱包导入 | "导入钱包" | 通过生物识别恢复钱包 |
| 余额查询 | "查询余额"、"我有多少钱" | 查看ETH余额 |
| 转账操作 | "转账" | 发送ETH到联系人或地址 |
| 联系人 | "显示联系人"、"联系人列表" | 查看和管理联系人 |
| 取消操作 | "取消"、"退出" | 取消当前操作 |

## ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `空格键` | 开始语音输入 |
| `Escape` | 停止语音输入 |

## 🔧 项目结构

```
src/
├── app/                      # Next.js 15应用路由
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 根布局
│   └── page.tsx             # 主页面
├── components/              # React组件
│   ├── AccessibilityComponents.tsx  # 无障碍组件库
│   ├── WalletInterface.tsx          # 主钱包界面
│   ├── ContactManager.tsx           # 联系人管理
│   ├── StepTransferDemo.tsx         # 分步转账演示
│   └── VoiceTestDemo.tsx            # 语音测试组件
├── services/                # 业务服务层
│   ├── voiceService.ts      # 语音识别和合成
│   ├── voiceOptimizer.ts    # 语音识别优化器
│   ├── walletService.ts     # 钱包操作服务
│   ├── webAuthnService.ts   # 生物识别服务
│   ├── commandService.ts    # 语音命令处理
│   └── contactsService.ts   # 联系人管理服务
├── store/                   # 状态管理
│   └── index.ts            # Zustand store配置
├── types/                   # TypeScript类型定义
│   ├── index.ts            # 基础类型
│   ├── contacts.ts         # 联系人类型
│   └── webauthn.ts         # WebAuthn类型
├── config/                  # 配置文件
│   ├── index.ts            # 主配置
│   └── webauthn.ts         # WebAuthn配置
└── docs/                    # 项目文档
    ├── architecture.md      # 架构说明
    ├── development.md       # 开发文档
    └── project-summary.md   # 项目总结
```

## 🔐 生物识别安全特性

### 支持的身份验证方式
- **指纹识别**: 适用于支持Touch ID的设备
- **面部识别**: 适用于支持Face ID的设备  
- **Windows Hello**: 适用于Windows设备
- **PIN码**: 备选身份验证方式

### 安全机制
- **本地加密**: 助记词使用WebAuthn公钥在本地加密
- **无服务器存储**: 所有敏感信息仅存储在用户设备
- **设备绑定**: 钱包与特定设备的生物识别绑定
- **自动过期**: 凭证会自动更新使用时间

## 🌐 网络支持

### 当前支持
- **Sepolia测试网**: 主要开发和测试环境
- **以太坊主网**: 生产环境支持

### 代币支持
- **ETH**: 原生以太坊代币
- **未来版本**: 将支持主流ERC-20代币

## 🎪 演示功能

项目包含多个演示组件用于测试和展示：

- **语音测试演示**: 测试语音识别准确性
- **转账演示**: 展示转账流程
- **分步转账演示**: 演示引导式转账
- **联系人调试工具**: 开发者调试联系人功能

## 🤝 贡献指南

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

### 开发规范
- 遵循TypeScript严格模式
- 所有组件必须支持无障碍访问
- 添加适当的ARIA标签和角色
- 编写语音友好的错误信息
- 优先考虑盲人用户体验

### 无障碍开发原则
- 所有交互元素必须可通过键盘访问
- 提供清晰的语音反馈
- 使用语义化HTML元素
- 确保屏幕阅读器兼容性

## 📋 开发路线图

### V1.0 当前版本 ✅
- [x] 语音钱包创建和导入
- [x] WebAuthn生物识别集成
- [x] 语音余额查询
- [x] 智能分步转账
- [x] 联系人管理系统
- [x] 无障碍界面设计
- [x] 语音识别优化

### V1.1 规划中 🔄
- [ ] 交易历史查询
- [ ] 网络切换支持
- [ ] 批量转账功能
- [ ] 导出钱包备份
- [ ] 多钱包管理

### V2.0 未来版本 🔮
- [ ] ERC-4337账户抽象集成
- [ ] 多链支持（Polygon、Arbitrum）
- [ ] ERC-20代币支持
- [ ] 硬件钱包集成
- [ ] 移动端PWA版本

## 🛠️ 开发工具

- **Next.js 15**: React框架，支持Turbopack
- **React 19**: 最新React版本
- **TypeScript 5**: 严格类型检查
- **Tailwind CSS 4**: 实用CSS框架
- **ethers.js v5**: 以太坊交互库
- **Zustand**: 轻量级状态管理
- **Radix UI**: 无障碍组件库

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- **Ethereum Foundation**: 以太坊生态系统支持
- **Web Speech API**: 提供语音识别基础
- **WebAuthn标准**: 提供生物识别认证标准
- **无障碍社区**: 为产品设计提供宝贵反馈
- **所有贡献者**: 感谢每一位为项目贡献的开发者

## 📞 联系我们

- **项目主页**: [GitHub Repository](https://github.com/lcc-star/echo-wallet)
- **问题反馈**: [GitHub Issues](https://github.com/lcc-star/echo-wallet/issues)
- **技术讨论**: [GitHub Discussions](https://github.com/lcc-star/echo-wallet/discussions)

**让Web3对每个人都可访问** 🌟

*Echo Wallet - 为视力障碍用户打造的去中心化金融入口*
