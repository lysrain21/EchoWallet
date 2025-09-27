'use client'

import Link from 'next/link'
import { useEffect, useRef, useId, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import Spline from '@splinetool/react-spline'

const missionStatement = 'The first Ethereum wallet built to be heard, not seen.'

// 滚动动画Hook - 支持双向动画
function useScrollAnimation<T extends HTMLElement = HTMLElement>(animationType = 'slide-up') {
  const ref = useRef<T>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        const animationClasses = {
          'slide-up': {
            in: 'animate-slide-up',
            out: 'animate-slide-down-out'
          },
          'slide-left': {
            in: 'animate-slide-in-left',
            out: 'animate-slide-out-right'
          },
          'slide-right': {
            in: 'animate-slide-in-right',
            out: 'animate-slide-out-left'
          },
          'scale': {
            in: 'animate-scale-in',
            out: 'animate-scale-out'
          },
          'fade-up': {
            in: 'animate-fade-in-up',
            out: 'animate-fade-out-down'
          }
        }
        
        const classes = animationClasses[animationType as keyof typeof animationClasses] || animationClasses['slide-up']
        
        // 清除之前的延迟
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        if (entry.isIntersecting) {
          // 进入视口 - 移除退出动画，添加进入动画
          element.classList.remove(classes.out)
          // 获取元素的延迟时间
          const delay = parseFloat(getComputedStyle(element).animationDelay) * 1000 || 0
          
          if (delay > 0) {
            timeoutRef.current = setTimeout(() => {
              element.classList.remove(classes.in)
              requestAnimationFrame(() => {
                element.classList.add(classes.in)
              })
            }, delay)
          } else {
            element.classList.remove(classes.in)
            requestAnimationFrame(() => {
              element.classList.add(classes.in)
            })
          }
        } else {
          // 离开视口 - 立即执行退出动画（不考虑延迟）
          element.classList.remove(classes.in)
          element.classList.add(classes.out)
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
      }
    )
    
    observer.observe(element)
    return () => {
      observer.disconnect()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [animationType])
  
  return ref
}


const journeySteps = [
  {
    title: 'Onboarding',
    caption: 'Say “Create wallet” and Echo spins up a secure account instantly.',
    icon: '🆕',
  },
  {
    title: 'Daily use',
    caption: 'Ask “What’s my balance?” or “What changed today?” and hear every detail.',
    icon: '📊',
  },
  {
    title: 'Transfers',
    caption: 'Speak transfer instructions in natural language, confirm by voice, and send safely.',
    icon: '💸',
  },
  {
    title: 'Confidence',
    caption: 'Every step is read aloud and mirrored on screen so supporters can follow along.',
    icon: '✅',
  },
]

const featureSections = [
  {
    id: 'feature-voice-creation',
    title: 'Create Your Wallet by Voice',
    command: '“Create wallet”',
    result: '“New Ethereum account generated”',
    description: 'Skip mnemonic typing. Echo guides you through every step with audio prompts and tactile cues.',
  },
  {
    id: 'feature-balance-query',
    title: 'Check Your Balance Instantly',
    command: '“Check balance”',
    result: '“Your balance is 0.42 ETH”',
    description: 'Real-time Sepolia queries read aloud immediately, with transcripts accessible from the keyboard.',
  },
  {
    id: 'feature-transfers',
    title: 'Send ETH by Speaking Naturally',
    command: '“Transfer 0.1 ETH to Alice”',
    result: '“Confirm / Cancel”',
    description: 'Dual confirmation and haptic-ready cues prevent errors while keeping the flow fully hands-free.',
  },
  {
    id: 'feature-tracking',
    title: 'Track Transaction Status',
    command: '“Check transaction 0x…”',
    result: '“Transaction confirmed on Sepolia testnet”',
    description: 'Stay informed about pending and completed transfers with voice summaries and on-screen parity.',
  },
]

const faqItems = [
  {
    question: 'How is mnemonic storage handled securely?',
    answer: 'Mnemonic phrases never leave the device. Echo encrypts sensitive data using WebAuthn-bound keys and guides recovery entirely through audio prompts.',
  },
  {
    question: 'Is Echo Wallet compatible with screen readers?',
    answer: 'Every interaction is mirrored with ARIA-labelled content and real-time announcements, making it compatible with NVDA, JAWS, and VoiceOver.',
  },
  {
    question: 'Can Echo Wallet be used without a microphone?',
    answer: 'Yes. Full keyboard navigation and type-to-command fallback ensure parity for users who can\'t access a microphone.',
  },
  {
    question: 'Is the project open source? How can I contribute?',
    answer: 'Echo Wallet is open source on GitHub at https://github.com/lysrain21/EchoWallet. Contributors can open issues, submit PRs, or join our accessibility feedback sessions.',
  },
]

const statsCards = [
  { label: 'Blind & low-vision users worldwide', value: '85M+' },
  { label: 'Rely primarily on mobile access', value: '70%' },
  { label: 'Voice-guided steps to transfer', value: '3' },
]

export default function Home() {
  const heroRadiantId = useId()

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
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

      <div className="relative z-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <HeroSection heroRadiantId={heroRadiantId} />
        </div>
        <UserJourney />
        <div className="mx-auto flex max-w-6xl flex-col gap-24 px-5 py-24 sm:px-10">
          <FeatureStack />
          <SocialImpact />
          <FaqSection />
          <FooterCta />
        </div>
      </div>
      
      {/* Read for Me Button */}
      <button 
        className="fixed bottom-4 right-4 z-50 px-6 py-3 bg-black/90 backdrop-blur-sm rounded-md shadow-2xl border border-white/10 flex items-center gap-3 hover:bg-black transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
        aria-label="Activate screen reader mode"
        title="Click to have the page content read aloud"
      >
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
        <span className="text-white/90 text-sm font-medium">Read for me</span>
      </button>
    </div>
  )
}

function HeroSection({ heroRadiantId }: { heroRadiantId: string }) {
  return (
    <section className="min-h-screen flex items-center">
      <div className="w-full grid gap-12 rounded-[32px] border border-white/10 bg-slate-950/60 backdrop-blur-2xl shadow-[0_32px_120px_-60px_rgba(15,23,42,0.8)] p-8 md:p-12 lg:p-16 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-300/80">Voice-first Ethereum Wallet</p>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
            <span className="text-white">Echo Wallet</span><br />
            <span className="text-blue-300/90">Voice-first Ethereum Wallet</span>
          </h1>
          <p className="max-w-xl text-lg text-slate-300/90">{missionStatement}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <PrimaryButton href="/wallet" ariaLabel="Try the Echo Wallet demo">
            Try Demo
          </PrimaryButton>
          <SecondaryButton href="https://github.com/lysrain21/EchoWallet" ariaLabel="View Echo Wallet on GitHub">
            View GitHub
          </SecondaryButton>
          <WatchDemoDialog />
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-300/80">
          <Chip>ERC-4337 Ready</Chip>
          <Chip>Screen Reader Native</Chip>
          <Chip>Voice + Haptics</Chip>
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-md justify-center">
        <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-blue-500/30 via-transparent to-transparent blur-2xl" aria-hidden />
        <div className="relative w-full rounded-[28px] border border-white/10 bg-slate-900/60 p-9 backdrop-blur-xl">
          <VisuallyHidden asChild>
            <h2>Voice preview module</h2>
          </VisuallyHidden>
          <div className="flex flex-col items-center gap-6">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-slate-950/90">
              <div className="absolute inset-0 rounded-full border border-white/10" aria-hidden />
              <div className="absolute h-[116%] w-[116%] rounded-full bg-gradient-to-br from-blue-400/25 to-blue-500/15 blur-xl" aria-hidden />
              <EthereumLogo />
            </div>
            <div className="flex w-full flex-col items-center gap-3">
              <div className="flex h-16 w-full items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4">
                <span className="mr-3 inline-flex h-3 w-3 animate-pulse rounded-full bg-lime-300" aria-hidden />
                <span className="text-sm font-medium tracking-widest text-blue-100/90 uppercase">Press to Speak</span>
              </div>
              <SoundWavePattern id={heroRadiantId} />
            </div>
            <p className="text-center text-xs text-slate-300/80">
              Live speech visualisation with haptic mirroring keeps low-vision users informed at every turn.
            </p>
          </div>
        </div>
      </div>
    </div>
    </section>
  )
}

function PrimaryButton({ href, children, ariaLabel }: { href: string; children: ReactNode; ariaLabel: string }) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/20 px-6 py-3 text-sm font-semibold text-blue-100 backdrop-blur transition hover:border-blue-400/60 hover:bg-blue-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
    >
      {children}
      <span aria-hidden>↗︎</span>
    </Link>
  )
}

function SecondaryButton({ href, children, ariaLabel }: { href: string; children: ReactNode; ariaLabel: string }) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/35 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
    >
      {children}
    </Link>
  )
}

function WatchDemoDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/25 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          Watch Demo
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-4 top-1/2 z-50 mx-auto w-full max-w-3xl -translate-y-1/2 rounded-3xl border border-white/15 bg-slate-900/95 p-8 shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between gap-8">
            <Dialog.Title className="text-xl font-semibold text-white">Echo Wallet demo</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-200 transition hover:border-white/25 hover:bg-white/10"
              >
                Close
              </button>
            </Dialog.Close>
          </div>
          <p className="mt-2 text-sm text-slate-300/85">
            Experience the full voice-driven flow—from wallet creation to confident transfers. Captioned for screen readers.
          </p>
          <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80">
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Demo video placeholder
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200/80">
      <span className="h-1.5 w-1.5 rounded-full bg-lime-300" aria-hidden />
      {children}
    </span>
  )
}

// 预计算声波高度以避免hydration不匹配
const soundWaveHeights = [
  12, 35.76, 54.48, 60, 51.12, 30.24, 12, 12,
  35.76, 54.48, 60, 51.12, 30.24, 12, 12, 35.76,
  54.48, 60, 51.12, 30.24, 12, 12, 35.76, 54.48,
  60, 51.12, 30.24, 12
]

function SoundWavePattern({ id }: { id: string }) {
  return (
    <svg
      role="img"
      aria-labelledby={id}
      className="h-28 w-full"
      viewBox="0 0 400 120"
      fill="none"
    >
      <title id={id}>Animated soundwave preview</title>
      <rect width="400" height="120" rx="24" className="fill-slate-950/80" />
      {soundWaveHeights.map((baseHeight, index) => {
        const x = 14 + index * 14
        
        return (
          <rect
            key={index}
            x={x}
            y={60 - baseHeight / 2}
            width="6"
            height={baseHeight}
            rx="3"
            className="fill-blue-400/60 soundwave-bar"
            style={{
              animationDelay: `${index * 0.1}s`
            }}
          />
        )
      })}
    </svg>
  )
}


function UserJourney() {
  const headerRef = useScrollAnimation<HTMLElement>('slide-up')
  const stepRefs = [
    useScrollAnimation<HTMLLIElement>('slide-left'),
    useScrollAnimation<HTMLLIElement>('slide-left'),
    useScrollAnimation<HTMLLIElement>('slide-left'),
    useScrollAnimation<HTMLLIElement>('slide-left')
  ]

  return (
    <section className="min-h-screen flex items-center py-20">
      <div className="w-full max-w-5xl mx-auto px-6 sm:px-8">
        {/* 头部（弱化PPT感，左对齐小标题） */}
        <header ref={headerRef} className="mb-12 space-y-2 scroll-animate">
          <p className="text-xs uppercase tracking-[0.35em] text-blue-200/70">User Journey</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-white">A journey designed for blind and low-vision users</h2>
          <p className="max-w-3xl text-base md:text-lg text-slate-300/85">
            Speak, hear, confirm, succeed — each state mirrors audio, haptics and accessible summaries.
          </p>
        </header>

        {/* 纵向时间线 */}
        <div className="relative">
          {/* 时间轴主线 */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/10 to-transparent" aria-hidden />

          <ol className="space-y-10">
            {journeySteps.map((step, index) => (
              <li key={step.title} ref={stepRefs[index]} className="relative pl-16 scroll-animate-left" style={{ animationDelay: `${index * 0.15}s` }}>
                {/* 节点与图标 */}
                <div className="absolute left-0 top-0 flex items-center justify-center h-10 w-10 rounded-full border border-white/15 bg-slate-950/70 backdrop-blur-md">
                  <JourneyIcon index={index} />
                </div>

                {/* 内容卡片（更信息密度，降低装饰感） */}
                <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-blue-400/30 transition-colors">
                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-slate-400/80">
                    <span className="inline-flex h-2 w-2 rounded-full bg-blue-400/80" aria-hidden />
                    Step {index + 1}
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-300/85 leading-relaxed">{step.caption}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function FeatureStack() {
  const sectionRef = useScrollAnimation<HTMLElement>('fade-up')
  const contentRefs = [
    useScrollAnimation<HTMLDivElement>('fade-up'),
    useScrollAnimation<HTMLDivElement>('fade-up'),
    useScrollAnimation<HTMLDivElement>('fade-up'),
    useScrollAnimation<HTMLDivElement>('fade-up')
  ]
  const transcriptRefs = [
    useScrollAnimation<HTMLDivElement>('scale'),
    useScrollAnimation<HTMLDivElement>('scale'),
    useScrollAnimation<HTMLDivElement>('scale'),
    useScrollAnimation<HTMLDivElement>('scale')
  ]
  
  return (
    <section ref={sectionRef} className="space-y-16 scroll-animate-fade-up">
      {featureSections.map((feature, index) => {
        const contentRef = contentRefs[index]
        const transcriptRef = transcriptRefs[index]
        
        return (
          <article
            key={feature.id}
            id={feature.id}
            className={`grid gap-10 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.08] via-slate-950/40 to-slate-950/60 p-8 md:grid-cols-[1.05fr_1fr] md:items-center`}
          >
          <div ref={contentRef} className="space-y-6 scroll-animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <h3 className="text-2xl font-semibold text-white">{feature.title}</h3>
            <p className="text-base text-slate-300/85">{feature.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <CommandChip label="Voice command" value={feature.command} />
              <CommandChip label="Result" value={feature.result} tone="emerald" />
            </div>
          </div>
          <div ref={transcriptRef} className="relative h-full rounded-3xl border border-white/15 bg-slate-950/50 backdrop-blur-2xl backdrop-saturate-110 p-8 scroll-animate-scale" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-300/12 via-emerald-400/8 to-transparent blur-3xl" aria-hidden />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <p className="text-xs uppercase tracking-[0.3em] text-blue-100/70">Echo Transcript</p>
              <ul className="space-y-4 text-sm text-slate-200/90">
                <li>
                  <span className="block text-xs uppercase tracking-[0.25em] text-slate-400/80">Command</span>
                  {feature.command.replace(/"|"/g, '')}
                </li>
                <li>
                  <span className="block text-xs uppercase tracking-[0.25em] text-slate-400/80">System reply</span>
                  {feature.result.replace(/"|"/g, '')}
                </li>
                <li>
                  <span className="block text-xs uppercase tracking-[0.25em] text-slate-400/80">Status</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-xs font-semibold text-lime-200">
                    <span className="h-2 w-2 rounded-full bg-lime-300" aria-hidden />
                    Success
                  </span>
                </li>
              </ul>
              <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-4 text-xs text-slate-300/75">
                Echo reads every step aloud while mirroring the transcript for co-pilots and caretakers.
              </div>
            </div>
          </div>
        </article>
        )
      })}
    </section>
  )
}

function CommandChip({ label, value, tone = 'blue' }: { label: string; value: string; tone?: 'blue' | 'emerald' }) {
  const toneStyles = tone === 'emerald'
    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
    : 'border-blue-400/30 bg-blue-500/10 text-blue-100'

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${toneStyles}`}>
      <span className="h-2 w-2 rounded-full bg-white/70" aria-hidden />
      <span className="uppercase tracking-[0.3em] text-[10px] text-white/60">{label}</span>
      <span>{value}</span>
    </span>
  )
}

function SocialImpact() {
  const animationRef = useScrollAnimation<HTMLElement>('slide-up')
  const statsCardRefs = [
    useScrollAnimation<HTMLDivElement>('scale'),
    useScrollAnimation<HTMLDivElement>('scale'),
    useScrollAnimation<HTMLDivElement>('scale')
  ]
  const testimonialRef = useScrollAnimation<HTMLDivElement>('slide-right')
  
  return (
    <section ref={animationRef} className="grid gap-10 rounded-[32px] border border-white/10 bg-white/5 p-10 backdrop-blur-xl md:grid-cols-[1.15fr_1fr] md:items-center scroll-animate">
      <div className="space-y-6">
        <h2 className="text-3xl font-semibold text-white">Opening Web3 to 85M+ visually impaired users</h2>
        <p className="text-lg text-slate-300/85">The future of blockchain should speak the language of accessibility. Echo Wallet is built with blind community feedback from day one.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {statsCards.map((stat, index) => (
            <div 
              key={stat.label} 
              ref={statsCardRefs[index]}
              className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 scroll-animate-scale"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <p className="text-2xl font-semibold text-white">{stat.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.25em] text-slate-300/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div ref={testimonialRef} className="relative rounded-[28px] border border-white/10 bg-slate-950/70 p-8 scroll-animate-right" style={{ animationDelay: '0.3s' }}>
        <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-emerald-400/10 to-transparent blur-2xl" aria-hidden />
        <div className="relative space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Testimonial</p>
          <blockquote className="space-y-4">
            <p className="text-lg text-slate-100/90">
              "For the first time, I can use Ethereum without sight."
            </p>
            <cite className="block text-sm text-slate-300/80">— Beta tester</cite>
          </blockquote>
          <p className="text-xs text-slate-300/70">
            Built in partnership with accessibility advocates to ensure feature parity for blind and low-vision communities.
          </p>
        </div>
      </div>
    </section>
  )
}

function FaqSection() {
  const headerRef = useScrollAnimation<HTMLElement>('slide-up')
  const faqItemRefs = [
    useScrollAnimation<HTMLDetailsElement>('slide-up'),
    useScrollAnimation<HTMLDetailsElement>('slide-up'),
    useScrollAnimation<HTMLDetailsElement>('slide-up'),
    useScrollAnimation<HTMLDetailsElement>('slide-up')
  ]
  
  return (
    <section className="space-y-8">
      <header ref={headerRef} className="space-y-2 scroll-animate">
        <h2 className="text-3xl font-semibold text-white">Frequently Asked Questions</h2>
        <p className="max-w-3xl text-lg text-slate-300/85">Everything teams need to know before building the next accessible, voice-driven Web3 experience.</p>
      </header>
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <details
            key={item.question}
            ref={faqItemRefs[index]}
            className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-blue-400/30 scroll-animate"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-semibold text-white">
              {item.question}
              <span className="transition group-open:rotate-45" aria-hidden>+</span>
            </summary>
            <p className="mt-4 text-sm leading-relaxed text-slate-300/85">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function FooterCta() {
  const animationRef = useScrollAnimation<HTMLElement>('scale')
  
  return (
    <footer ref={animationRef} className="space-y-10 rounded-[32px] border border-white/10 bg-gradient-to-br from-blue-500/10 via-slate-950/70 to-slate-950/85 p-10 text-center scroll-animate-scale">
      <div className="space-y-3">
        <h2 className="text-3xl font-semibold text-white">
          <span className="text-white">Echo Wallet</span><br />
          <span className="text-blue-300/90">Let Web3 Speak</span>
        </h2>
        <p className="text-lg text-slate-300/85">
          Try the guided demo, explore the codebase, or watch the prototype walkthrough. Accessibility is our first class feature.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <PrimaryButton href="/wallet" ariaLabel="Launch the Echo Wallet demo">
          Try the Demo
        </PrimaryButton>
        <SecondaryButton href="https://github.com/lysrain21/EchoWallet" ariaLabel="Open GitHub repository">
          View on GitHub
        </SecondaryButton>
        <WatchDemoDialog />
      </div>
      <nav className="flex flex-wrap justify-center gap-6 text-sm text-slate-300/80">
        <Link className="transition hover:text-slate-100" href="/docs">
          Docs
        </Link>
        <Link className="transition hover:text-slate-100" href="/docs/technical">
          Technical Guide
        </Link>
        <Link className="transition hover:text-slate-100" href="/docs/accessibility">
          Accessibility Statement
        </Link>
        <Link className="transition hover:text-slate-100" href="/privacy">
          Privacy
        </Link>
      </nav>
    </footer>
  )
}

function EthereumLogo() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 256 417"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ethereum logo"
      className="drop-shadow-lg"
    >
      <path
        fill="url(#ethGradient1)"
        d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"
      />
      <path
        fill="url(#ethGradient2)"
        d="M127.962 0L0 212.32l127.962 75.639V154.158z"
      />
      <path
        fill="url(#ethGradient3)"
        d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z"
      />
      <path
        fill="url(#ethGradient4)"
        d="M127.962 416.905v-104.72L0 236.585z"
      />
      <path
        fill="url(#ethGradient5)"
        d="M127.961 287.958l127.96-75.637-127.96-58.162z"
      />
      <path
        fill="url(#ethGradient6)"
        d="M0 212.32l127.96 75.638V154.159z"
      />
      <defs>
        <linearGradient id="ethGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#627eea" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="ethGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="ethGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#627eea" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="ethGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="ethGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="ethGradient6" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function JourneyIcon({ index }: { index: number }) {
  const common = {
    className: 'w-10 h-10 text-blue-200 group-hover:text-blue-100 transition-colors',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    viewBox: '0 0 24 24',
    'aria-hidden': 'true' as const,
  }

  if (index === 0) {
    // Onboarding: user with plus
    return (
      <svg {...common as any}>
        <path d="M16 21v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1" />
        <circle cx="9.5" cy="7.5" r="3" />
        <path d="M20 8v6" />
        <path d="M17 11h6" />
      </svg>
    )
  }

  if (index === 1) {
    // Daily use: analytics line chart
    return (
      <svg {...common as any}>
        <path d="M3 3v18h18" />
        <path d="M6 15l4-5 4 3 4-7" />
        <circle cx="10" cy="10" r="0.8" />
        <circle cx="14" cy="13" r="0.8" />
        <circle cx="18" cy="6" r="0.8" />
      </svg>
    )
  }

  if (index === 2) {
    // Transfers: send arrow
    return (
      <svg {...common as any}>
        <path d="M4 12h13" />
        <path d="M12 5l7 7-7 7" />
        <path d="M4 12l8-7v14z" />
      </svg>
    )
  }

  // Confidence: shield check
  return (
    <svg {...common as any}>
      <path d="M12 3l7 3v6c0 5.25-3.5 9.25-7 10-3.5-.75-7-4.75-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}
