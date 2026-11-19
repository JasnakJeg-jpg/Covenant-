import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import ProfileSetup from './ProfileSetup'
import UsagePicker from '../components/UsagePicker'
import PartnerLink from '../components/PartnerLink'
import { intentOptions } from '../lib/usage'
import type { Usage } from '../lib/usage'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

function UsageSettings({ userId, initialUsage, initialIntent }: { userId: string; initialUsage: Usage; initialIntent: string }) {
  const [usage, setUsage] = useState<Usage>(initialUsage)
  const [intent, setIntent] = useState(initialIntent)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState({ usage: initialUsage, intent: initialIntent })
  const dirty = usage !== saved.usage || intent !== saved.intent

  async function save() {
    setBusy(true)
    setStatus(null)
    const { error } = await supabase.from('profiles').update({ usage, intent: intent || null }).eq('id', userId)
    setBusy(false)
    if (error) setStatus(error.message)
    else {
      setSaved({ usage, intent })
      setStatus('Saved')
    }
  }

  return (
    <div className="space-y-4">
      <UsagePicker value={usage} onChange={(u) => { setUsage(u); setIntent(''); setStatus(null) }} />
      <label className="block text-sm font-medium">
        Which describes you best? <span className="font-normal text-muted-foreground">(optional)</span>
        <select value={intent} onChange={(e) => { setIntent(e.target.value); setStatus(null) }} className="input">
          <option value="">Prefer not to say</option>
          {intentOptions[usage].map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy || !dirty} className="btn-primary h-10 px-5 text-sm">
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        {status && <span className="text-sm text-muted-foreground" role="status">{status}</span>}
      </div>
    </div>
  )
}

function Loading() {
  return <p className="text-muted-foreground">Loading…</p>
}

export default function MySpace() {
  const { session, loading } = useAuth()
  const [profileDone, setProfileDone] = useState<boolean | null>(null)
  const [firstName, setFirstName] = useState('')
  const [usage, setUsage] = useState<Usage>('solo')
  const [intent, setIntent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    setProfileDone(null)
    setError(null)
    if (!session) return
    supabase
      .from('profiles')
      .select('onboarding_completed, first_name, usage, intent')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
          return
        }
        setProfileDone(!!data?.onboarding_completed)
        setFirstName(data?.first_name ?? '')
        setUsage(data?.usage === 'couple' ? 'couple' : 'solo')
        setIntent(data?.intent ?? '')
      })
  }, [session, reload])

  if (loading) return <Loading />

  if (!session) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="My Space" title="Your private space" text="A place for your profile, your notes and, soon, your partner." />
        <section className="card p-6">
          <p className="text-muted-foreground">Sign in or create an account to get started.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/sign-in" className="btn-primary h-10 px-5 text-sm">Sign in</Link>
            <Link to="/sign-up" className="btn-outline h-10 px-5 text-sm">Create an account</Link>
          </div>
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6">
        <h1 className="text-2xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">We couldn’t load your profile: {error}</p>
      </div>
    )
  }
  if (profileDone === null) return <Loading />
  if (!profileDone) {
    return (
      <ProfileSetup
        onDone={() => {
          setProfileDone(null)
          setReload((n) => n + 1)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="My Space" title={firstName ? `Hello, ${firstName}` : 'My Space'} />
      <section className="card p-6">
        <h2 className="text-xl">Your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">Signed in as {session.user.email}</p>
      </section>
      <section className="card p-6">
        <h2 className="text-xl">How you use Covenant</h2>
        <div className="mt-4">
          <UsageSettings key={`${usage}-${intent}-${reload}`} userId={session.user.id} initialUsage={usage} initialIntent={intent} />
        </div>
      </section>
      <section className="card p-6">
        <h2 className="text-xl">Your partner</h2>
        <p className="mt-1 text-sm text-muted-foreground">Link accounts to share studies and prayers. Your private notes stay private.</p>
        <div className="mt-5">
          <PartnerLink onLinked={() => setReload((n) => n + 1)} />
        </div>
      </section>
    </div>
  )
}
