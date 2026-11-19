import { useState } from 'react'
import type { ReactNode } from 'react'

export function Screen({ children }: { children: ReactNode }) {
  return <section className="mx-auto max-w-xl space-y-4 px-5 pb-28 pt-6">{children}</section>
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white p-5 ${className}`}>{children}</div>
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-sage-700">{children}</p>
}

export function Title({ children }: { children: ReactNode }) {
  return <h1 className="font-display text-2xl font-extrabold leading-tight">{children}</h1>
}

export function Pill({ children, tone = 'sage' }: { children: ReactNode; tone?: 'sage' | 'flag' | 'grey' | 'solid' }) {
  const tones = {
    sage: 'bg-sage-100 text-sage-900',
    flag: 'bg-flag-bg text-flag-ink',
    grey: 'bg-ground text-ink',
    solid: 'bg-sage-700 text-white',
  }
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

export function Loading() {
  return (
    <Screen>
      <p className="text-muted">Loading…</p>
    </Screen>
  )
}

export function Status({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className="text-sm text-muted" role="status">
      {message}
    </p>
  )
}

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="flex items-center gap-2">
      <input readOnly value={url} aria-label="Invite link" className="min-w-0 flex-1 rounded-xl border border-line bg-ground p-3 text-sm" />
      <button type="button" onClick={copy} className={btnGhost}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export const btn =
  'inline-flex min-h-[48px] items-center justify-center rounded-xl bg-ink px-5 font-semibold text-white disabled:opacity-60'
export const btnGhost =
  'inline-flex min-h-[44px] items-center justify-center rounded-xl border border-line bg-white px-4 font-semibold text-ink disabled:opacity-60'
export const fieldClass = 'mt-1 w-full rounded-xl border border-line bg-white p-3 text-base'
export const labelClass = 'block text-sm font-medium'
