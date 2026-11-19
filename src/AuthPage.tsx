import { useState } from 'react'
import { ALREADY_REGISTERED, useAuth } from './lib/AuthContext'

export default function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (password.length < 8) {
      setMessage('Please use a password of at least 8 characters.')
      return
    }
    setBusy(true)
    const error = mode === 'signup' ? await signUp(email, password) : await signIn(email, password)
    setBusy(false)
    if (error === ALREADY_REGISTERED) {
      setMode('signin')
      setMessage('This email already has an account. Sign in with your password below, or use "Forgot password?".')
    } else if (error === 'Invalid login credentials') {
      setMessage('That email and password don\u2019t match. Check them, or use "Forgot password?" below.')
    } else if (error === 'Email not confirmed') {
      setMessage('Please confirm your email first. Check your inbox (and junk folder) for the link we sent.')
    } else if (error) setMessage(error)
    else if (mode === 'signup') setMessage('Almost there. Please check your email and confirm your address, then sign in.')
  }

  async function forgot() {
    setMessage(null)
    if (!email) {
      setMessage('Enter your email above first, then press "Forgot password?" again.')
      return
    }
    setBusy(true)
    const error = await resetPassword(email)
    setBusy(false)
    setMessage(error ?? 'If that email has an account, we\u2019ve sent a link to reset your password.')
  }

  return (
    <section className="mx-auto max-w-md p-6">
      <p className="font-display text-sm font-extrabold tracking-widest text-sage-700">COVENANT</p>
      <p className="mt-1 text-sm text-muted">Marriage preparation with your church.</p>
      <h1 className="mt-6 font-display text-3xl font-extrabold">
        {mode === 'signin' ? 'Welcome back' : 'Create your account'}
      </h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white p-3"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white p-3"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-ink p-3 font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-muted" role="status">{message}</p>}
      {mode === 'signin' && (
        <button type="button" onClick={forgot} disabled={busy} className="mt-4 block text-sm text-muted underline">
          Forgot password?
        </button>
      )}
      <button
        type="button"
        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(null) }}
        className="mt-4 block text-sm text-sage-700 underline"
      >
        {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
      </button>
    </section>
  )
}

export function NewPasswordPage() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setMessage('Please use a password of at least 8 characters.')
      return
    }
    setBusy(true)
    const error = await updatePassword(password)
    setBusy(false)
    if (error) setMessage(error)
  }

  return (
    <section className="mx-auto max-w-md p-6">
      <p className="font-display text-sm font-extrabold tracking-widest text-sage-700">COVENANT</p>
      <h1 className="mt-6 font-display text-3xl font-extrabold">Choose a new password</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm">
          New password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white p-3"
          />
        </label>
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-ink p-3 font-semibold text-white disabled:opacity-60">
          {busy ? 'Saving…' : 'Save password'}
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-muted" role="status">{message}</p>}
    </section>
  )
}
