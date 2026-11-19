import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchNames, useMeContext } from '../lib/data'
import { Card, Pill, Screen, Status, Title, btn, btnGhost, fieldClass, labelClass } from '../components/ui'

type Audience = 'partner' | 'mentors' | 'church'

export type PrayerRequest = {
  id: string
  couple_id: string
  author_id: string
  body: string
  audience: Audience
  answered: boolean
  answered_note: string | null
  created_at: string
  prayer_acks: { user_id: string }[]
}

const audienceLabel: Record<Audience, string> = {
  partner: 'Just us',
  mentors: 'Our mentors',
  church: 'Church prayer team',
}

export function PrayerItem({
  request,
  names,
  onChange,
}: {
  request: PrayerRequest
  names: Record<string, string>
  onChange: () => void
}) {
  const { me } = useMeContext()
  const [note, setNote] = useState('')
  const [answering, setAnswering] = useState(false)
  const mine = request.author_id === me.userId
  const iPrayed = request.prayer_acks.some((a) => a.user_id === me.userId)
  const prayedBy = request.prayer_acks
    .filter((a) => a.user_id !== request.author_id)
    .map((a) => (a.user_id === me.userId ? 'You' : names[a.user_id] ?? 'Someone'))

  async function togglePrayed() {
    if (iPrayed) {
      await supabase.from('prayer_acks').delete().eq('prayer_request_id', request.id).eq('user_id', me.userId)
    } else {
      await supabase.from('prayer_acks').insert({ prayer_request_id: request.id, user_id: me.userId })
    }
    onChange()
  }

  async function markAnswered(e: React.FormEvent) {
    e.preventDefault()
    await supabase
      .from('prayer_requests')
      .update({ answered: true, answered_note: note.trim() || null, answered_at: new Date().toISOString() })
      .eq('id', request.id)
    setAnswering(false)
    onChange()
  }

  return (
    <Card className={`space-y-2 ${request.answered ? 'border border-sage-300' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">
          {mine ? 'You' : names[request.author_id] ?? 'Someone'} ·{' '}
          {new Date(request.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
        {request.answered ? <Pill tone="solid">Answered</Pill> : <Pill tone="grey">{audienceLabel[request.audience]}</Pill>}
      </div>
      <p className="whitespace-pre-line leading-relaxed">{request.body}</p>
      {request.answered_note && <p className="text-sm italic text-muted">"{request.answered_note}"</p>}
      {prayedBy.length > 0 && <p className="text-sm font-semibold text-sage-700">{prayedBy.join(', ')} prayed for this</p>}
      <div className="flex flex-wrap gap-2">
        {!mine && !request.answered && (
          <button type="button" onClick={togglePrayed} className={btnGhost} aria-pressed={iPrayed}>
            {iPrayed ? 'You prayed for this' : 'I prayed for this'}
          </button>
        )}
        {mine && !request.answered && !answering && (
          <button type="button" onClick={() => setAnswering(true)} className={btnGhost}>
            Mark as answered
          </button>
        )}
      </div>
      {answering && (
        <form onSubmit={markAnswered} className="space-y-2">
          <label className={labelClass}>
            How was it answered? (optional)
            <input value={note} onChange={(e) => setNote(e.target.value)} className={fieldClass} />
          </label>
          <button type="submit" className={btn}>
            Save
          </button>
        </form>
      )}
    </Card>
  )
}

export default function Prayer() {
  const { me } = useMeContext()
  const couple = me.couple!
  const [requests, setRequests] = useState<PrayerRequest[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [prayerTeam, setPrayerTeam] = useState(false)
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<Audience>('partner')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('prayer_requests')
      .select('id, couple_id, author_id, body, audience, answered, answered_note, created_at, prayer_acks(user_id)')
      .eq('couple_id', couple.id)
      .order('answered', { ascending: true })
      .order('created_at', { ascending: false })
    const list = (data ?? []) as PrayerRequest[]
    setRequests(list)
    setNames(await fetchNames(list.flatMap((r) => [r.author_id, ...r.prayer_acks.map((a) => a.user_id)])))
  }, [couple.id])

  useEffect(() => {
    load()
    if (couple.church_id) {
      supabase
        .from('churches')
        .select('prayer_team_enabled')
        .eq('id', couple.church_id)
        .maybeSingle()
        .then(({ data }) => setPrayerTeam(!!data?.prayer_team_enabled))
    }
  }, [load, couple.church_id])

  const options: { id: Audience; hint: string }[] = [
    { id: 'partner', hint: 'Only the two of you will see this.' },
    ...(couple.mentor_couple_id ? [{ id: 'mentors' as Audience, hint: 'The two of you and your mentor couple will see this.' }] : []),
    ...(prayerTeam ? [{ id: 'church' as Audience, hint: 'Your mentors and your church prayer team will see this.' }] : []),
  ]

  async function share(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const { error } = await supabase
      .from('prayer_requests')
      .insert({ couple_id: couple.id, author_id: me.userId, body: body.trim(), audience })
    setBusy(false)
    if (error) setMessage(error.message)
    else {
      setBody('')
      await load()
    }
  }

  return (
    <Screen>
      <Title>Prayer</Title>
      <Card>
        <form onSubmit={share} className="space-y-3">
          <label className={labelClass}>
            Ask for prayer
            <textarea
              required
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What would you like prayer for?"
              className={fieldClass}
            />
          </label>
          <fieldset className="space-y-2">
            <legend className="text-sm text-muted">Who can see this?</legend>
            <div className="flex flex-wrap gap-2">
              {options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setAudience(o.id)}
                  aria-pressed={audience === o.id}
                  className={`min-h-[44px] rounded-full border px-4 text-sm ${
                    audience === o.id ? 'border-sage-700 bg-sage-700 font-semibold text-white' : 'border-line bg-white'
                  }`}
                >
                  {audienceLabel[o.id]}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted">{options.find((o) => o.id === audience)?.hint}</p>
          </fieldset>
          <button type="submit" disabled={busy} className={`${btn} w-full`}>
            {busy ? 'Sharing…' : 'Share request'}
          </button>
          <Status message={message} />
        </form>
      </Card>

      {requests.length === 0 ? (
        <p className="text-center text-sm text-muted">No prayer requests yet.</p>
      ) : (
        requests.map((r) => <PrayerItem key={r.id} request={r} names={names} onChange={load} />)
      )}
    </Screen>
  )
}
