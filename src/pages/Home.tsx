import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  daysUntil,
  fetchNames,
  formatDate,
  inviteLink,
  isUnlocked,
  parseDate,
  partnerOf,
  useMeContext,
} from '../lib/data'
import type { Couple, ProgrammeSession } from '../lib/data'
import { Card, CopyLink, Eyebrow, Pill, Screen, Status, btn, fieldClass, labelClass } from '../components/ui'

function WeddingDateForm({ couple }: { couple: Couple }) {
  const { reload } = useMeContext()
  const [date, setDate] = useState(couple.wedding_date ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('couples').update({ wedding_date: date || null }).eq('id', couple.id)
    setBusy(false)
    if (error) setMessage(error.message)
    else await reload()
  }

  return (
    <Card>
      <form onSubmit={save} className="space-y-3">
        <p className="font-display text-lg font-bold">When's the wedding?</p>
        <p className="text-sm text-muted">Your sessions are timed to your wedding date, starting 16 weeks before.</p>
        <label className={labelClass}>
          Wedding date
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
        </label>
        <button type="submit" disabled={busy} className={`${btn} w-full`}>
          {busy ? 'Saving…' : 'Save date'}
        </button>
        <Status message={message} />
      </form>
    </Card>
  )
}

function InvitePartner({ couple }: { couple: Couple }) {
  const { me } = useMeContext()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('invites')
      .select('code')
      .eq('couple_id', couple.id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setCode(data?.code ?? null))
  }, [couple.id])

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const { data, error } = await supabase
      .from('invites')
      .insert({ couple_id: couple.id, email: email.trim().toLowerCase(), role: 'couple', created_by: me.userId })
      .select('code')
      .single()
    setBusy(false)
    if (error) setMessage(error.message)
    else setCode(data.code)
  }

  return (
    <Card className="space-y-3">
      <p className="font-display text-lg font-bold">Invite your partner</p>
      {code ? (
        <>
          <p className="text-sm text-muted">Send your partner this link. They'll sign up with the email you entered and join you automatically.</p>
          <CopyLink url={inviteLink(code)} />
        </>
      ) : (
        <form onSubmit={invite} className="space-y-3">
          <p className="text-sm text-muted">Covenant works best with both of you. Each of you answers privately, then you compare.</p>
          <label className={labelClass}>
            Your partner's email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
          </label>
          <button type="submit" disabled={busy} className={`${btn} w-full`}>
            {busy ? 'Creating…' : 'Create invite link'}
          </button>
          <Status message={message} />
        </form>
      )}
    </Card>
  )
}

export default function Home() {
  const { me } = useMeContext()
  const couple = me.couple!
  const [partnerName, setPartnerName] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ProgrammeSession[]>([])
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [answeredCount, setAnsweredCount] = useState(0)
  const [questionCount, setQuestionCount] = useState(0)
  const [tip, setTip] = useState<string | null>(null)
  const [openPrayers, setOpenPrayers] = useState(0)

  const days = couple.wedding_date ? daysUntil(couple.wedding_date) : null
  const weeksLeft = days !== null ? Math.max(0, Math.floor(days / 7)) : null
  const partnerId = partnerOf(couple, me.userId)

  useEffect(() => {
    fetchNames([partnerId]).then((n) => setPartnerName(partnerId ? n[partnerId] ?? null : null))
    supabase
      .from('sessions')
      .select('*')
      .order('position')
      .then(({ data }) => setSessions((data ?? []) as ProgrammeSession[]))
    supabase
      .from('session_progress')
      .select('session_id, completed_at')
      .eq('couple_id', couple.id)
      .then(({ data }) =>
        setCompleted(new Set<string>((data ?? []).filter((r) => r.completed_at).map((r) => r.session_id as string))),
      )
    supabase
      .from('prayer_requests')
      .select('id', { count: 'exact', head: true })
      .eq('couple_id', couple.id)
      .eq('answered', false)
      .then(({ count }) => setOpenPrayers(count ?? 0))
  }, [couple.id, partnerId])

  useEffect(() => {
    let query = supabase.from('tips').select('body, weeks_before_wedding').order('weeks_before_wedding', { ascending: true })
    if (weeksLeft !== null) query = query.gte('weeks_before_wedding', weeksLeft)
    query.limit(1).maybeSingle().then(({ data }) => setTip(data?.body ?? null))
  }, [weeksLeft])

  const current =
    sessions.find((s) => !completed.has(s.id) && isUnlocked(s, sessions, completed, couple.wedding_date)) ?? null

  useEffect(() => {
    if (!current) return
    supabase
      .from('questions')
      .select('id')
      .eq('session_id', current.id)
      .then(async ({ data }) => {
        const ids = (data ?? []).map((q) => q.id as string)
        setQuestionCount(ids.length)
        if (ids.length === 0) {
          setAnsweredCount(0)
          return
        }
        const { count } = await supabase
          .from('answers')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', me.userId)
          .in('question_id', ids)
        setAnsweredCount(count ?? 0)
      })
  }, [current, me.userId])

  const progressPct = sessions.length ? Math.round((completed.size / sessions.length) * 100) : 0

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Welcome back</p>
          <p className="font-display text-xl font-extrabold">
            {me.firstName}
            {partnerName ? ` & ${partnerName}` : ''}
          </p>
        </div>
        <span className="font-display text-sm font-extrabold tracking-widest text-sage-700">COVENANT</span>
      </div>

      {!couple.wedding_date ? (
        <WeddingDateForm couple={couple} />
      ) : (
        <section aria-label="Wedding countdown" className="space-y-2 rounded-3xl bg-sage-700 p-6 text-white">
          <p className="text-sm opacity-90">Your wedding</p>
          {days !== null && days >= 0 ? (
            <p className="flex items-baseline gap-3">
              <span className="font-display text-6xl font-extrabold leading-none">{days}</span>
              <span className="text-lg font-semibold">{days === 1 ? 'day to go' : 'days to go'}</span>
            </p>
          ) : (
            <p className="font-display text-2xl font-extrabold">Married! Welcome to your first year.</p>
          )}
          <p className="text-sm opacity-95">{formatDate(parseDate(couple.wedding_date))}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/25">
            <div className="h-1.5 rounded-full bg-white" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-xs opacity-90">
            {completed.size} of {sessions.length || 8} sessions complete
          </p>
        </section>
      )}

      {!partnerId && <InvitePartner couple={couple} />}

      {current && (
        <Card className="space-y-3">
          <Eyebrow>
            This week{weeksLeft !== null ? ` · ${weeksLeft} weeks to go` : ''}
          </Eyebrow>
          <p className="font-display text-lg font-bold">
            Session {current.position}: {current.title}
          </p>
          {current.summary && <p className="text-sm leading-relaxed text-muted">{current.summary}</p>}
          {questionCount > 0 && (
            <Pill>
              You: {answeredCount} of {questionCount} answered
            </Pill>
          )}
          <Link to={`/sessions/${current.position}`} className={`${btn} w-full`}>
            {answeredCount > 0 ? 'Continue session' : 'Start session'}
          </Link>
        </Card>
      )}

      {tip && (
        <Card className="space-y-1">
          <p className="text-sm font-semibold">Tip for this stage</p>
          <p className="text-sm leading-relaxed text-muted">{tip}</p>
        </Card>
      )}

      <Link to="/prayer" className="flex items-center justify-between rounded-2xl bg-white p-5">
        <span>
          <span className="block text-sm font-semibold">Prayer</span>
          <span className="block text-sm text-muted">
            {openPrayers === 0 ? 'No open requests' : `${openPrayers} open ${openPrayers === 1 ? 'request' : 'requests'}`}
          </span>
        </span>
        <span aria-hidden="true" className="text-muted">
          ›
        </span>
      </Link>
    </Screen>
  )
}
