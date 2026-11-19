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
      onboarding_completed: true,
    })
    setBusy(false)
    if (error) setMessage(error.message)
    else onDone()
  }

  return (
    <section className="mx-auto max-w-md p-6">
      <h1 className="font-display text-3xl font-extrabold">Tell us about you</h1>
      <p className="mt-2 text-sm text-muted">
        Your first name is shown to your partner, your mentors and your pastor. Everything else stays private.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm">
          First name
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white p-3"
          />
        </label>
        <label className="block text-sm">
          Date of birth
          <input
            type="date"
            required
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white p-3"
          />
        </label>
        <label className="block text-sm">
          Gender (optional)
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white p-3"
          >
            <option value="">Prefer not to say</option>
            <option value="Woman">Woman</option>
            <option value="Man">Man</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-ink p-3 font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-muted" role="status">{message}</p>}
    </section>
  )
}
