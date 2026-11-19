import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fetchNames, formatDate, isUnlocked, opensOn, partnerOf, useMeContext } from '../lib/data'
import type { Answer, ProgrammeSession, Question } from '../lib/data'
import { Card, Eyebrow, Loading, Pill, Screen, Status, Title, btn, fieldClass } from '../components/ui'

type Draft = { body: string; shared: boolean }

export default function SessionDetail() {
  const { position } = useParams()
  const { me } = useMeContext()
  const couple = me.couple!
  const partnerId = partnerOf(couple, me.userId)

  const [session, setSession] = useState<ProgrammeSession | null>(null)
  const [unlocked, setUnlocked] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [partnerName, setPartnerName] = useState('Your partner')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    const [{ data: all }, { data: progress }] = await Promise.all([
      supabase.from('sessions').select('*').order('position'),
      supabase.from('session_progress').select('session_id, completed_at').eq('couple_id', couple.id),
    ])
    const list = (all ?? []) as ProgrammeSession[]
    const s = list.find((x) => String(x.position) === position) ?? null
    if (!s) {
      setNotFound(true)
      return
    }
    const done = new Set<string>((progress ?? []).filter((r) => r.completed_at).map((r) => r.session_id as string))
    setSession(s)
    setUnlocked(isUnlocked(s, list, done, couple.wedding_date))
    setCompletedAt((progress ?? []).find((r) => r.session_id === s.id)?.completed_at ?? null)

    const { data: qs } = await supabase.from('questions').select('*').eq('session_id', s.id).order('position')
    const qList = (qs ?? []) as Question[]
    setQuestions(qList)

    if (qList.length) {
      const { data: ans } = await supabase
        .from('answers')
        .select('*')
        .eq('couple_id', couple.id)
        .in(
          'question_id',
          qList.map((q) => q.id),
        )
      const aList = (ans ?? []) as Answer[]
      setAnswers(aList)
      const next: Record<string, Draft> = {}
      for (const q of qList) {
        const mine = aList.find((a) => a.question_id === q.id && a.user_id === me.userId)
        next[q.id] = { body: mine?.body ?? '', shared: mine?.shared_with_mentor ?? false }
      }
      setDrafts(next)
    }
  }, [couple.id, couple.wedding_date, me.userId, position])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!partnerId) return
    fetchNames([partnerId]).then((n) => setPartnerName(n[partnerId] ?? 'Your partner'))
  }, [partnerId])

  async function saveAnswers() {
    setBusy(true)
    setMessage(null)
    const rows = questions
      .filter((q) => drafts[q.id]?.body.trim())
      .map((q) => ({
        question_id: q.id,
        couple_id: couple.id,
        user_id: me.userId,
        body: drafts[q.id].body.trim(),
        shared_with_mentor: drafts[q.id].shared,
        updated_at: new Date().toISOString(),
      }))
    if (rows.length === 0) {
      setBusy(false)
      setMessage('Answer at least one question first.')
      return
    }
    const { error } = await supabase.from('answers').upsert(rows, { onConflict: 'question_id,user_id' })
    if (!error && session) {
      await supabase
        .from('session_progress')
        .upsert({ couple_id: couple.id, session_id: session.id }, { onConflict: 'couple_id,session_id', ignoreDuplicates: true })
    }
    setBusy(false)
    if (error) setMessage(error.message)
    else {
      setMessage('Saved.')
      await load()
    }
  }

  async function markComplete() {
    if (!session) return
    setBusy(true)
    const { error } = await supabase
      .from('session_progress')
      .upsert(
        { couple_id: couple.id, session_id: session.id, completed_at: new Date().toISOString() },
        { onConflict: 'couple_id,session_id' },
      )
    setBusy(false)
    if (error) setMessage(error.message)
    else await load()
  }

  if (notFound) {
    return (
      <Screen>
        <Title>Session not found</Title>
        <Link to="/sessions" className="text-sage-700 underline">
          Back to sessions
        </Link>
      </Screen>
    )
  }
  if (!session) return <Loading />

  if (!unlocked) {
    const opens = couple.wedding_date ? opensOn(couple.wedding_date, session.weeks_before_wedding) : null
    return (
      <Screen>
        <Link to="/sessions" className="text-sm text-muted">
          ‹ Sessions
        </Link>
        <Title>{session.title}</Title>
        <Card>
          <p className="text-muted">
            {opens
              ? `This session opens on ${formatDate(opens)}, or sooner once you've finished the earlier sessions.`
              : 'Add your wedding date on the Home screen to schedule this session.'}
          </p>
        </Card>
      </Screen>
    )
  }

  const myAnswered = questions.filter((q) => answers.some((a) => a.question_id === q.id && a.user_id === me.userId))
  const allAnswered = questions.length > 0 && myAnswered.length === questions.length

  return (
    <Screen>
      <Link to="/sessions" className="text-sm text-muted">
        ‹ Sessions
      </Link>
      <div className="space-y-1">
        <Eyebrow>
          Session {session.position} · {session.weeks_before_wedding} weeks before the wedding
        </Eyebrow>
        <Title>{session.title}</Title>
      </div>

      {session.teaching ? (
        <Card className="space-y-2">
          <p className="text-sm font-semibold">Teaching</p>
          <p className="whitespace-pre-line text-[15px] leading-relaxed">{session.teaching}</p>
        </Card>
      ) : (
        <Card>
          <p className="text-muted">The content for this session is still being written.</p>
        </Card>
      )}

      {session.scripture_refs.length > 0 && (
        <Card className="space-y-2 bg-sage-100">
          <p className="text-sm font-semibold text-sage-900">Read together</p>
          <ul className="flex flex-wrap gap-2">
            {session.scripture_refs.map((r) => (
              <li key={r}>
                <Pill tone="grey">{r}</Pill>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {questions.length > 0 && (
        <section aria-label="Private questions" className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl bg-sage-100 p-3 text-sm text-sage-900">
            <span aria-hidden="true">🔒</span>
            Private. {partnerId ? partnerName : 'Your partner'} sees your answer only after answering the same question.
          </div>
          {questions.map((q) => {
            const d = drafts[q.id] ?? { body: '', shared: false }
            const setDraft = (patch: Partial<Draft>) => setDrafts({ ...drafts, [q.id]: { ...d, ...patch } })
            const max = q.options?.max ?? 5
            return (
              <Card key={q.id} className="space-y-3">
                <p className="text-xs text-muted">
                  Question {q.position} of {questions.length}
                </p>
                {q.kind === 'scale' ? (
                  <fieldset className="space-y-2">
                    <legend className="font-display text-lg font-bold leading-snug">{q.prompt}</legend>
                    <div className="flex gap-2">
                      {Array.from({ length: max }, (_, i) => String(i + 1)).map((v) => (
                        <label
                          key={v}
                          className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border-2 font-semibold ${
                            d.body === v ? 'border-sage-700 bg-sage-700 text-white' : 'border-line bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={v}
                            checked={d.body === v}
                            onChange={() => setDraft({ body: v })}
                            className="sr-only"
                          />
                          {v}
                        </label>
                      ))}
                    </div>
                    {q.options?.minLabel && (
                      <p className="text-xs text-muted">
                        1 = {q.options.minLabel} · {max} = {q.options.maxLabel}
                      </p>
                    )}
                  </fieldset>
                ) : (
                  <label className="block space-y-2">
                    <span className="block font-display text-lg font-bold leading-snug">{q.prompt}</span>
                    <textarea
                      value={d.body}
                      onChange={(e) => setDraft({ body: e.target.value })}
                      rows={4}
                      className={fieldClass}
                    />
                  </label>
                )}
                {couple.mentor_couple_id && (
                  <label className="flex min-h-[44px] items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={d.shared}
                      onChange={(e) => setDraft({ shared: e.target.checked })}
                      className="h-5 w-5 accent-sage-700"
                    />
                    Share this answer with our mentors
                  </label>
                )}
              </Card>
            )
          })}
          <button type="button" onClick={saveAnswers} disabled={busy} className={`${btn} w-full`}>
            {busy ? 'Saving…' : 'Save my answers'}
          </button>
          <Status message={message} />
        </section>
      )}

      {questions.length > 0 && (
        <section aria-label="The reveal" className="space-y-3">
          <Eyebrow>The reveal</Eyebrow>
          {!partnerId ? (
            <Card>
              <p className="text-muted">Invite your partner from the Home screen to compare answers.</p>
            </Card>
          ) : (
            questions.map((q) => {
              const mine = answers.find((a) => a.question_id === q.id && a.user_id === me.userId)
              const theirs = answers.find((a) => a.question_id === q.id && a.user_id === partnerId)
              const differ =
                q.kind === 'scale' && mine && theirs ? Math.abs(Number(mine.body) - Number(theirs.body)) >= 2 : null
              return (
                <Card key={q.id} className={`space-y-3 ${differ ? 'border-2 border-flag-line' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted">Question {q.position}</span>
                    {differ === true && <Pill tone="flag">Talk about this</Pill>}
                    {differ === false && <Pill>In step</Pill>}
                  </div>
                  <p className="font-semibold leading-snug">{q.prompt}</p>
                  {!mine ? (
                    <p className="text-sm text-muted">Answer this question to see {partnerName}'s answer.</p>
                  ) : !theirs ? (
                    <p className="text-sm text-muted">Waiting for {partnerName} to answer.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-ground p-3">
                        <p className="text-xs font-semibold text-sage-700">{me.firstName || 'You'}</p>
                        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{mine.body}</p>
                      </div>
                      <div className="rounded-xl bg-ground p-3">
                        <p className="text-xs font-semibold text-sage-700">{partnerName}</p>
                        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{theirs.body}</p>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </section>
      )}

      {session.exercise && (
        <Card className="space-y-1">
          <p className="text-sm font-semibold">This week's exercise</p>
          <p className="text-[15px] leading-relaxed">{session.exercise}</p>
        </Card>
      )}

      {session.prayer && (
        <Card className="space-y-1">
          <p className="text-sm font-semibold">Closing prayer</p>
          <p className="text-[15px] italic leading-relaxed">{session.prayer}</p>
        </Card>
      )}

      {completedAt ? (
        <Card className="bg-sage-100">
          <p className="font-semibold text-sage-900">Session complete</p>
        </Card>
      ) : (
        <button
          type="button"
          onClick={markComplete}
          disabled={busy || (questions.length > 0 && !allAnswered)}
          className={`${btn} w-full bg-sage-700`}
        >
          Mark session complete
        </button>
      )}
    </Screen>
  )
}
