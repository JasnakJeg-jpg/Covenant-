import { useState } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './lib/AuthContext'

function isAdult(dob: string) {
  const d = new Date(dob)
  const t = new Date()
  let age = t.getFullYear() - d.getFullYear()
  const m = t.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--
  return age >= 18
}

export default function ProfileSetup({ onDone }: { onDone: () => void }) {
  const { session } = useAuth()
  const [firstName, setFirstName] = useState('')
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
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      first_name: firstName.trim(),
      date_of_birth: dob,
      gender: gender || null,
      intent: intent || null,
      onboarding_completed: true,
    })
    setBusy(false)
    if (error) setMessage(error.message)
    else onDone()
  }

  return (
    <section className="mx-auto max-w-md p-6">
      <h1 className="font-serif text-3xl text-sage-900">Tell us about you</h1>
      <p className="mt-2 text-sm text-ink/70">
        This stays private. It is never shown to other members.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm">
          First name
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sage-300 bg-white p-3"
          />
        </label>
        <label className="block text-sm">
          Date of birth
          <input
            type="date"
            required
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sage-300 bg-white p-3"
          />
        </label>
        <label className="block text-sm">
          Gender (optional)
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sage-300 bg-white p-3"
          >
            <option value="">Prefer not to say</option>
            <option value="Woman">Woman</option>
            <option value="Man">Man</option>
          </select>
        </label>
        <label className="block text-sm">
          What brings you to Covenant? (optional)
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sage-300 bg-white p-3"
          >
            <option value="">Prefer not to say</option>
            <option value="married">I'm married</option>
            <option value="engaged">I'm engaged</option>
            <option value="preparing_single">I'm single and preparing for marriage</option>
            <option value="study_single">I'm single and here to study</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-sage-700 p-3 text-white disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-ink/80" role="status">{message}</p>}
    </section>
  )
}
