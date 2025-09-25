# Echo Wallet 🎤

Accessible, voice-first Ethereum wallet designed for blind and low-vision users.

## Highlights

- **Hands-free control** – create wallets, check balances, manage contacts, and confirm transfers entirely by voice.
- **Built-in biometric security** – WebAuthn integration stores encrypted mnemonics locally and allows passwordless recovery.
- **Screen-reader friendly UI** – semantic markup, ARIA roles, and keyboard navigation ensure WCAG compliance.
- **Optimised speech pipeline** – custom text normalisation improves recognition of numbers, contacts, and transfer commands.

## Tech Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Zustand · Web Speech API · WebAuthn · ethers.js v5.

## Getting Started

### Prerequisites
- Node.js 18+
- Modern browser with Web Speech API (Chrome, Edge, Safari)
- Biometric hardware (Touch ID, Face ID, Windows Hello) for WebAuthn demos

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
# Visit http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_INFURA_KEY` | Optional | Infura project key. When omitted, the app falls back to public RPC endpoints (Sepolia: `ethereum-sepolia-rpc.publicnode.com`, Mainnet: `cloudflare-eth.com`). |
| `NEXT_PUBLIC_ZERODEV_PROJECT_ID` | Recommended | Enables ZeroDev bundler/paymaster integrations for account abstraction demos. |

Create a `.env.local` file if you need to store these values locally.

## Voice Commands

| Intent | Sample Phrase | Result |
|--------|----------------|--------|
| Create wallet | “create wallet” | Generates a new account and offers biometric storage. |
| Import wallet | “import wallet” | Restores the most recent WebAuthn-secured wallet. |
| Check balance | “check balance” | Speaks the current ETH balance. |
| Transfer | “transfer 0.1 eth to Alice” | Starts the guided transfer flow with confirmation. |
| Contacts | “show contacts” | Reads stored contacts in order of last use. |
| Cancel | “cancel” / “exit” | Aborts the active voice workflow. |

## Project Structure
```
src/
├── app/                # Next.js App Router
├── components/         # Voice-first UI components
├── services/           # Speech, wallet, WebAuthn services
├── store/              # Zustand global state
├── types/              # Shared TypeScript types
└── config/             # Runtime configuration
```

## Troubleshooting

- **React error 418 (objects as React children)** – sanitised in `commandService` and `voiceService` by normalising voice command payloads before rendering.
- **HTTP 401 from Infura** – add `NEXT_PUBLIC_INFURA_KEY` or rely on the built-in public RPC fallbacks (see Environment Variables). Errors now log a clear warning without breaking the UI.
- **Speech recognition missing** – ensure the browser grants microphone permission and supports the Web Speech API.

## Accessibility Principles

- Every interactive element is reachable via keyboard.
- Voice prompts mirror on-screen messages for parity between sighted and non-sighted users.
- Components expose ARIA labels, roles, and polite live regions for screen readers.

## Roadmap

- ERC-20 token support and transaction history playback.
- Multi-network deployments (Polygon, Arbitrum).
- PWA packaging for offline-capable mobile usage.

## License

MIT © Echo Wallet contributors.

