import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useMeContext } from '../lib/data'
import { Card, Eyebrow, Screen, Status, Title, btn, fieldClass, labelClass } from '../components/ui'

// Accepts an invite code from a pastor or partner. Used on the welcome screen and the Account page.
export function AcceptInvite({ initialCode = '' }: { initialCode?: string }) {
  const { reload } = useMeContext()
  const navigate = useNavigate()
  const [code, setCode] = useState(initialCode)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function accept(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const cleaned = code.trim().replace(/.*code=/, '')
    const { error } = await supabase.rpc('accept_invite', { p_code: cleaned })
    setBusy(false)
    if (error) {
      setMessage(error.message)
      return
    }
    await reload()
    navigate('/', { replace: true })
  }

  return (
    <form onSubmit={accept} className="space-y-3">
      <label className={labelClass}>
        Invite code or link
        <input required value={code} onChange={(e) => setCode(e.target.value)} className={fieldClass} />
      </label>
      <button type="submit" disabled={busy} className={`${btn} w-full`}>
        {busy ? 'Joining…' : 'Join'}
      </button>
      <Status message={message} />
    </form>
  )
}

type Path = 'invite' | 'self' | 'pastor'

export default function Welcome() {
  const { me, reload } = useMeContext()
  const [params] = useSearchParams()
  const codeFromLink = params.get('code') ?? ''
  const [path, setPath] = useState<Path>('invite')
  const [weddingDate, setWeddingDate] = useState('')
  const [churchName, setChurchName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function startSelfGuided(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const { error } = await supabase
      .from('couples')
      .insert({ partner_a: me.userId, wedding_date: weddingDate || null })
    setBusy(false)
    if (error) setMessage(error.message)
    else await reload()
  }

  async function createChurch(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const { error } = await supabase.rpc('create_church', { p_name: churchName })
    setBusy(false)
    if (error) setMessage(error.message)
    else await reload()
  }

  const options: { id: Path; title: string; text: string }[] = [
    { id: 'invite', title: 'I have an invite', text: 'From your church, your mentors or your partner.' },
    { id: 'self', title: "We're preparing on our own", text: 'Work through the sessions as a couple, without a church programme.' },
    { id: 'pastor', title: "I'm a pastor or marriage lead", text: 'Set up your church and invite couples and mentors.' },
  ]

  return (
    <Screen>
      <Eyebrow>Welcome{me.firstName ? `, ${me.firstName}` : ''}</Eyebrow>
      <Title>How are you joining Covenant?</Title>

      <div role="radiogroup" aria-label="How are you joining" className="space-y-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={path === o.id}
            onClick={() => {
              setPath(o.id)
              setMessage(null)
            }}
            className={`block w-full rounded-2xl border-2 bg-white p-4 text-left ${
              path === o.id ? 'border-sage-700' : 'border-transparent'
            }`}
          >
            <span className="block font-semibold">{o.title}</span>
            <span className="mt-1 block text-sm text-muted">{o.text}</span>
          </button>
        ))}
      </div>

      <Card>
        {path === 'invite' && <AcceptInvite initialCode={codeFromLink} />}

        {path === 'self' && (
          <form onSubmit={startSelfGuided} className="space-y-3">
            <label className={labelClass}>
              Wedding date (you can add this later)
              <input type="date" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} className={fieldClass} />
            </label>
            <button type="submit" disabled={busy} className={`${btn} w-full`}>
              {busy ? 'Setting up…' : 'Start preparing'}
            </button>
            <p className="text-sm text-muted">You'll be able to invite your partner on the next screen.</p>
          </form>
        )}

        {path === 'pastor' && (
          <form onSubmit={createChurch} className="space-y-3">
            <label className={labelClass}>
              Church name
              <input required value={churchName} onChange={(e) => setChurchName(e.target.value)} className={fieldClass} />
            </label>
            <button type="submit" disabled={busy} className={`${btn} w-full`}>
              {busy ? 'Creating…' : 'Create church'}
            </button>
          </form>
        )}
        <div className="mt-3">
          <Status message={message} />
        </div>
      </Card>
    </Screen>
  )
}
