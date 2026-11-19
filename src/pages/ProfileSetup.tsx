import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

function isAdult(dob: string) {
  const d = new Date(dob)
  const t = new Date()
  let age = t.getFullYear() - d.getFullYear()
  const m = t.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--
  return age >= 18
}

export default function ProfileSetup({ onDone }: { onDone: (firstName: string) => void }) {
  const { session } = useAuth()
  const [firstName, setFirstName] = useState<string>(session?.user.user_metadata?.display_name ?? '')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [intent, setIntent] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (!session) return
    if (!isAdult(dob)) {
      setMessage('Covenant is for adults aged 18 and over.')
      return
    }
    setBusy(true)
    const name = firstName.trim()
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      first_name: name,
      date_of_birth: dob,
      gender: gender || null,
      intent: intent || null,
      onboarding_completed: true,
    })
    setBusy(false)
    if (error) setMessage(error.message)
    else onDone(name)
  }

  return (
    <div className="card mx-auto max-w-md p-6 sm:p-8">
      <p className="eyebrow text-accent-foreground">Welcome</p>
      <h1 className="mt-2 text-3xl">Tell us about you</h1>
      <p className="mt-1 text-sm text-muted-foreground">This stays private. It is never shown to other members.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          First name
          <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" />
        </label>
        <label className="block text-sm font-medium">
          Date of birth
          <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)} className="input" />
        </label>
        <label className="block text-sm font-medium">
          Gender <span className="font-normal text-muted-foreground">(optional)</span>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="input">
            <option value="">Prefer not to say</option>
            <option value="Woman">Woman</option>
            <option value="Man">Man</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          What brings you to Covenant? <span className="font-normal text-muted-foreground">(optional)</span>
          <select value={intent} onChange={(e) => setIntent(e.target.value)} className="input">
            <option value="">Prefer not to say</option>
            <option value="married">I'm married</option>
            <option value="engaged">I'm engaged</option>
            <option value="preparing_single">I'm single and preparing for marriage</option>
            <option value="study_single">I'm single and here to study</option>
          </select>
        </label>
        <button type="submit" disabled={busy} className="btn-primary h-11 w-full">
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-destructive" role="alert">{message}</p>}
    </div>
  )
}
