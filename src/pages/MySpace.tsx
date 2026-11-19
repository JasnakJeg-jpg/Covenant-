import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import ProfileSetup from './ProfileSetup'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

function Loading() {
  return <p className="text-muted-foreground">Loading…</p>
}

export default function MySpace() {
  const { session, loading } = useAuth()
  const [profileDone, setProfileDone] = useState<boolean | null>(null)
  const [firstName, setFirstName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setProfileDone(null)
    setError(null)
    if (!session) return
    supabase
      .from('profiles')
      .select('onboarding_completed, first_name')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
          return
        }
        setProfileDone(!!data?.onboarding_completed)
        setFirstName(data?.first_name ?? '')
      })
  }, [session])

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
        onDone={(name) => {
          setFirstName(name)
          setProfileDone(true)
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
    </div>
  )
}
