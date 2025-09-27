/**
 * Echo Wallet - Main wallet interface
 * Premium voice-first experience inspired by Apple Human Interface Guidelines.
 */

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  VoiceButton,
  AccessibleText,
  WalletStatus,
  KeyboardHelp,
  ReadForMeButton,
} from './AccessibilityComponents'
import { ContactManager } from './ContactManager'
import { voiceService } from '@/services/voiceService'
import { contactsService } from '@/services/contactsService'
import { useWalletStore, useVoiceState } from '@/store'
import type { Contact } from '@/types/contacts'
import type { WalletAccount, WalletBalance } from '@/types'
import Spline from '@splinetool/react-spline'

const VOICE_PROMPTS = [
  'Create wallet – generate a new wallet address',
  'Import wallet – recover using biometrics',
  'Check balance – hear your current balance',
  'Transfer 0.1 ETH to Alice – guided transfer with confirmation',
  'Show contacts – list your saved contacts'
]

const TRANSFER_STEPS = [
  {
    title: 'Recipient',
    description: 'Say the contact name or speak the full wallet address. Echo Wallet will confirm who you picked.'
  },
  {
    title: 'Amount',
    description: 'Speak the amount naturally – for example “zero point five” or “fifty milliether”. The optimiser translates it for you.'
  },
  {
    title: 'Review',
    description: 'Echo Wallet reads back the summary and waits for you to say “confirm” or “cancel”.'
  }
]

export function WalletInterface() {
  const voiceState = useVoiceState()
  const { wallet, balance, network, transactions, sharedAddress } = useWalletStore()

  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [topContact, setTopContact] = useState<Contact | null>(null)
  const [recentCommands, setRecentCommands] = useState<string[]>([])

  const primaryAddress = useMemo(() => sharedAddress || wallet?.address || '', [sharedAddress, wallet?.address])

  const shortAddress = useMemo(() => {
    if (!primaryAddress) return null
    return `${primaryAddress.slice(0, 6)}…${primaryAddress.slice(-4)}`
  }, [primaryAddress])

  useEffect(() => {
    setCopyState('idle')
  }, [primaryAddress])

  // 确保客户端渲染
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleCopyAddress = useCallback(async () => {
    if (!primaryAddress) return

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(primaryAddress)
        setCopyState('copied')
        voiceService.speak('Address copied to clipboard.')
      } else {
        throw new Error('Clipboard API unavailable')
      }
    } catch (error) {
      console.error('Copy address failed:', error)
      setCopyState('failed')
      voiceService.speak('Unable to copy the address automatically. Please copy it manually from the screen.')
    }
  }, [primaryAddress])

  // Welcome prompt + keyboard shortcut for replay
  useEffect(() => {
    if (!isClient) return

    const hasPlayedBefore = localStorage.getItem('echo-welcome-played') === 'true'

    if (!hasPlayedBefore && !hasPlayedWelcome) {
      const timeout = setTimeout(() => {
        voiceService.speak('Welcome to Echo Wallet, a fully voice-controlled Ethereum wallet.')
        setHasPlayedWelcome(true)
        localStorage.setItem('echo-welcome-played', 'true')
      }, 900)
      return () => clearTimeout(timeout)
    }
  }, [hasPlayedWelcome, isClient])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        if (voiceState.lastCommand?.parameters?.text) {
          voiceService.speak(`Repeating the last command: ${voiceState.lastCommand.parameters.text}`)
        } else if (voiceState.lastCommand) {
          voiceService.speak(`Repeating the last command: ${voiceState.lastCommand.type}`)
        } else {
          voiceService.speak('There is no command to repeat yet.')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [voiceState.lastCommand])

  // Contact highlight
  useEffect(() => {
    const contacts = contactsService.getContacts()
    if (contacts.length === 0) {
      setTopContact(null)
      return
    }
    const favourite = [...contacts]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0]
    setTopContact(favourite)
  }, [voiceState.lastCommand])

  // Recent commands log
  useEffect(() => {
    if (!voiceState.lastCommand) return
    const descriptor = typeof voiceState.lastCommand.parameters?.text === 'string'
      ? voiceState.lastCommand.parameters.text
      : voiceState.lastCommand.type

    setRecentCommands((prev) => {
      if (!descriptor || prev[0] === descriptor) return prev
      const updated = [descriptor, ...prev]
      return updated.slice(0, 4)
    })
  }, [voiceState.lastCommand])

  const voiceStateLabel = useMemo(() => {
    if (voiceState.isProcessing) return 'Processing…'
    if (voiceState.isListening) return 'Listening…'
    return 'Ready to listen'
  }, [voiceState.isListening, voiceState.isProcessing])

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Spline 3D Background */}
      <div className="fixed inset-0 z-0" aria-hidden>
        <Spline
          scene="https://prod.spline.design/sf2J4a8epSyBmnlL/scene.splinecode"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      {/* Original gradient overlays for subtle enhancement */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-[1]" aria-hidden>
        <div className="absolute -top-24 left-[-10%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(58,123,255,0.08),_transparent_60%)] blur-3xl" />
        <div className="absolute bottom-[-18%] right-[-12%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(100,234,132,0.08),_transparent_60%)] blur-3xl" />
      </div>

      <div className="pointer-events-none fixed right-4 top-4 z-40 flex justify-end">
        <div className="pointer-events-auto inline-flex max-w-full items-center gap-3 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-medium text-slate-100 backdrop-blur-xl sm:text-sm">
          <span className="hidden text-emerald-200/80 sm:inline">Current address</span>
          <span className="truncate text-white/90" aria-live="polite">
            {shortAddress ?? 'No wallet connected'}
          </span>
          <button
            type="button"
            onClick={handleCopyAddress}
            disabled={!primaryAddress}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.25em] text-emerald-100/80 transition-colors duration-200 hover:text-emerald-100 focus:outline-none disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-400"
          >
            <span className="hidden sm:inline">{copyState === 'copied' ? 'Copied' : 'Copy'}</span>
            <span className="sm:hidden">{copyState === 'copied' ? '✓' : '⧉'}</span>
          </button>
        </div>
      </div>
      <div className="relative z-20">
        <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-24 pt-16 sm:px-8 lg:pt-20">
        <HeroSection />
        <VoiceInteractionPanel
          voiceStateLabel={voiceStateLabel}
          recentCommands={recentCommands}
          lastCommand={voiceState.lastCommand}
        />
        <WalletStatusSection />
        <MissionControlGrid
          wallet={wallet}
          balance={balance}
          network={network}
          transactionsCount={transactions.length}
            topContact={topContact}
            recentCommands={recentCommands}
          />
          <TransferJourney />
          <SecurityAndHelp />
          <ContactSection />
        </main>
      </div>
      
      {/* Read for Me Button */}
      <ReadForMeButton />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

function HeroSection() {
  return (
    <section className="flex flex-col gap-8 rounded-[32px] border border-white/10 bg-slate-950/60 backdrop-blur-2xl shadow-[0_32px_120px_-60px_rgba(15,23,42,0.8)] p-10 md:flex-row md:items-center md:justify-between">
      <div className="max-w-xl space-y-4">
        <p className="text-sm uppercase tracking-[0.4em] text-slate-300/80">Voice-first Web3</p>
        <AccessibleText
          text="Echo Wallet"
          level="h1"
          className="text-4xl font-semibold text-white md:text-5xl"
        />
        <p className="text-lg text-slate-300/90">
          Speak naturally and Echo Wallet handles the rest—secure wallet creation, biometric recovery,
          transfers, and contact management without ever needing to look at a screen.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300/80">
          <Badge>Web Speech Optimiser</Badge>
          <Badge>WebAuthn Secure</Badge>
          <Badge>WCAG AA Ready</Badge>
        </div>
      </div>
      <div className="relative mx-auto w-full max-w-md">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/30 via-transparent to-transparent blur-2xl" aria-hidden />
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-8 backdrop-blur-xl">
          <AccessibleText text="Live Voice Waveform" level="h2" className="sr-only" />
          <div className="h-60 w-full rounded-2xl bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-transparent p-2">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-950/80">
              <span className="text-6xl text-blue-300/90" aria-hidden>
                <span className="animate-pulse">⏺</span>
              </span>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-slate-300/80">
            Say "create wallet" to begin. Echo Wallet guides you with subtle sound and voice prompts.
          </p>
        </div>
      </div>
    </section>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200/80">
      <span className="h-1.5 w-1.5 rounded-full bg-lime-300" aria-hidden />
      {children}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Voice Interaction                                                          */
/* -------------------------------------------------------------------------- */

interface VoiceInteractionPanelProps {
  voiceStateLabel: string
  recentCommands: string[]
  lastCommand: ReturnType<typeof useVoiceState>['lastCommand']
}

function VoiceInteractionPanel({ voiceStateLabel, recentCommands, lastCommand }: VoiceInteractionPanelProps) {
  const lastCommandDescription = typeof lastCommand?.parameters?.text === 'string'
    ? lastCommand.parameters.text
    : lastCommand?.type ?? '—'

  return (
    <section className="grid gap-6 rounded-[32px] border border-white/10 bg-slate-950/60 backdrop-blur-2xl shadow-[0_32px_120px_-60px_rgba(15,23,42,0.8)] p-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <AccessibleText text="Voice Control" level="h2" className="text-2xl font-semibold text-white" />
        <p className="text-slate-300/90">
          Hold the button or press Space to speak. Echo Wallet listens, confirms, and keeps you updated with voice prompts.
        </p>
        <VoiceButton className="w-full py-8 text-xl" />

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <StatusPill>{voiceStateLabel}</StatusPill>
          <StatusPill tone="emerald">Face ID ready</StatusPill>
          <StatusPill tone="blue">Sepolia {new Date().getFullYear()}</StatusPill>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-200">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recent commands</p>
        <ul className="mt-4 space-y-3">
          <li className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white">
            <span className="block text-xs uppercase tracking-wide text-slate-400">Now</span>
            <span className="font-medium">{lastCommandDescription}</span>
          </li>
          {recentCommands.map((entry, index) => (
            <li key={`${entry}-${index}`} className="rounded-xl border border-white/5 px-4 py-3 text-sm text-slate-200">
              {entry}
            </li>
          ))}
          {recentCommands.length === 0 && (
            <li className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-slate-400">
              Voice history appears here once you start talking to Echo Wallet.
            </li>
          )}
        </ul>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Wallet Status                                                             */
/* -------------------------------------------------------------------------- */

function WalletStatusSection() {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-2xl p-6 text-slate-100 shadow-[0_32px_120px_-60px_rgba(15,23,42,0.8)]">
      <WalletStatus />
    </section>
  )
}

function StatusPill({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'emerald' }) {
  const toneStyles = tone === 'emerald'
    ? 'text-emerald-200 bg-emerald-400/10 border-emerald-300/20'
    : 'text-blue-200 bg-blue-400/10 border-blue-300/20'
  return (
    <span className={`inline-flex items-center rounded-full border px-4 py-1 text-xs ${toneStyles}`}>
      {children}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Mission Control                                                            */
/* -------------------------------------------------------------------------- */

interface MissionControlGridProps {
  wallet: WalletAccount | null
  balance: WalletBalance
  network: 'mainnet' | 'sepolia' | 'polygon'
  transactionsCount: number
  topContact: Contact | null
  recentCommands: string[]
}

function MissionControlGrid({ wallet, balance, network, transactionsCount, topContact, recentCommands }: MissionControlGridProps) {
  return (
    <section className="space-y-6">
      <AccessibleText text="Mission Control" level="h2" className="text-2xl font-semibold text-white" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <GlassCard title="Wallet" caption="Encrypted with WebAuthn">
          {wallet ? (
            <div className="space-y-2">
              <p className="text-lg font-medium text-white">{wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}</p>
              <p className="text-sm text-slate-300">Balance • {balance.eth} ETH</p>
              <p className="text-xs text-slate-400">Transactions tracked • {transactionsCount}</p>
            </div>
          ) : (
            <Placeholder>Say “create wallet” to get started.</Placeholder>
          )}
        </GlassCard>

        <GlassCard title="Favourite contact" caption="Most recent interaction">
          {topContact ? (
            <div className="space-y-2 text-sm">
              <p className="text-base font-medium text-white">{topContact.name}</p>
              <p className="font-mono text-slate-300">{topContact.address.slice(0, 10)}…{topContact.address.slice(-6)}</p>
              <p className="text-xs text-slate-400">Used {topContact.usageCount} times</p>
            </div>
          ) : (
            <Placeholder>No contacts yet. Add one by saying “add contact”.</Placeholder>
          )}
        </GlassCard>

        <GlassCard title="Voice log" caption="Last recognised phrases">
          {recentCommands.length > 0 ? (
            <ul className="space-y-2 text-sm text-slate-200">
              {recentCommands.map((entry, index) => (
                <li key={`${entry}-${index}`} className="truncate">{entry}</li>
              ))}
            </ul>
          ) : (
            <Placeholder>Start speaking to build your activity log.</Placeholder>
          )}
        </GlassCard>

        <GlassCard title="Network" caption="Current chain">
          <div className="space-y-2 text-sm text-slate-200">
            <p className="text-lg font-medium text-white">{network === 'mainnet' ? 'Ethereum Mainnet' : 'Sepolia Testnet'}</p>
            <p className="text-xs text-slate-400">Switch by saying “switch to mainnet” or “switch to testnet”.</p>
          </div>
        </GlassCard>
      </div>
    </section>
  )
}

function GlassCard({ title, caption, children }: { title: string; caption: string; children: React.ReactNode }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-2xl p-6 text-slate-200 shadow-[0_32px_120px_-60px_rgba(15,23,42,0.8)]">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400/80">{caption}</p>
      <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4 text-sm">{children}</div>
    </article>
  )
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-400">{children}</p>
}

/* -------------------------------------------------------------------------- */
/*  Transfer Journey                                                           */
/* -------------------------------------------------------------------------- */

function TransferJourney() {
  return (
    <section className="space-y-6">
      <AccessibleText text="Guided transfer journey" level="h2" className="text-2xl font-semibold text-white" />
      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-full gap-4">
          {TRANSFER_STEPS.map((step) => (
            <article
              key={step.title}
              className="min-w-[280px] flex-1 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/70 to-slate-950/40 backdrop-blur-2xl p-6 text-slate-200 shadow-[0_32px_120px_-60px_rgba(15,23,42,0.8)]"
            >
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm text-slate-300">{step.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-6 text-slate-100 backdrop-blur">
        <h3 className="text-lg font-semibold text-white">Ready when you are</h3>
        <p className="mt-2 text-sm text-slate-200">
          Say “transfer” to start the flow. Echo Wallet captures the details, confirms the summary, and only proceeds when you say “confirm”.
        </p>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Security & Help                                                            */
/* -------------------------------------------------------------------------- */

function SecurityAndHelp() {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <article className="rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-2xl p-6 text-slate-200 shadow-[0_32px_120px_-60px_rgba(15,23,42,0.8)]">
        <h3 className="text-xl font-semibold text-white">Biometric security</h3>
        <p className="mt-3 text-sm text-slate-300/90">
          Echo Wallet encrypts mnemonics locally using WebAuthn. Face ID, Touch ID, Windows Hello, and security keys are all supported.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-300/85">
          <li>• Wallets are bound to your device and biometric signature.</li>
          <li>• Recovery is instant—just say "import wallet".</li>
          <li>• No sensitive data ever leaves your machine.</li>
        </ul>
      </article>

      <article className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-2xl p-6 text-slate-200 shadow-[0_32px_120px_-60px_rgba(15,23,42,0.8)]">
        <h3 className="text-xl font-semibold text-white">Voice cheat sheet</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          {VOICE_PROMPTS.map((prompt) => (
            <li key={prompt} className="rounded-2xl bg-white/5 px-4 py-3">{prompt}</li>
          ))}
        </ul>
        <div className="rounded-2xl bg-white/5 p-4">
          <KeyboardHelp />
        </div>
      </article>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Contacts                                                                   */
/* -------------------------------------------------------------------------- */

function ContactSection() {
  return (
    <section className="rounded-[32px] border border-white/10 bg-slate-950/60 backdrop-blur-2xl p-8 shadow-[0_32px_120px_-60px_rgba(15,23,42,0.8)]">
      <div className="mb-6">
        <AccessibleText text="Contacts" level="h2" className="text-2xl font-semibold text-white" />
        <p className="text-sm text-slate-300/90">Manage recurring recipients, nicknames, and quick transfers. Everything stays local to your device.</p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-6">
        <ContactManager />
      </div>
    </section>
  )
}
