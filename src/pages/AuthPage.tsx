import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../lib/AuthContext'

export default function AuthPage({ mode }: { mode: 'signin' | 'signup' }) {
  const { session, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/my-space" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (password.length < 8) {
      setMessage('Please use a password of at least 8 characters.')
      return
    }
    setBusy(true)
    const error =
      mode === 'signup' ? await signUp(email, password, displayName.trim()) : await signIn(email, password)
    setBusy(false)
    if (error) setMessage(error)
    else if (mode === 'signup') setSent(true)
    else navigate('/my-space')
  }

  const isSignUp = mode === 'signup'

  return (
    <div className="flex min-h-screen flex-col items-center px-5 py-12">
      <Logo />
      <div className="card mt-10 w-full max-w-md p-6 sm:p-8">
        {sent ? (
          <>
            <h1 className="text-3xl">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We’ve sent a link to <strong className="text-foreground">{email}</strong>. Confirm your address, then sign in.
            </p>
            <Link to="/sign-in" className="btn-primary mt-6 h-11 w-full">Go to sign in</Link>
          </>
        ) : (
          <>
            <h1 className="text-3xl">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignUp ? 'Begin on your own — you can invite your partner later.' : 'Sign in to continue where you left off.'}
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              {isSignUp && (
                <label className="block text-sm font-medium">
                  Display name
                  <input
                    required
                    autoComplete="nickname"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input"
                  />
                </label>
              )}
              <label className="block text-sm font-medium">
                Email
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                />
              </label>
              <label className="block text-sm font-medium">
                Password
                <input
                  type="password"
                  required
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                />
              </label>
              <button type="submit" disabled={busy} className="btn-primary h-11 w-full">
                {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
              </button>
            </form>
            {message && (
              <p className="mt-4 text-sm text-destructive" role="alert">{message}</p>
            )}
          </>
        )}
      </div>
      {!sent && (
        <p className="mt-6 text-sm text-muted-foreground">
          {isSignUp ? (
            <>Already have an account? <Link to="/sign-in" className="text-primary hover:underline">Sign in</Link></>
          ) : (
            <>New here? <Link to="/sign-up" className="text-primary hover:underline">Create an account</Link></>
          )}
        </p>
      )}
    </div>
  )
}
