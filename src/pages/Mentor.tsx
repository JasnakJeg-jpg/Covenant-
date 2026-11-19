import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { daysUntil, fetchNames, useMeContext } from '../lib/data'
import type { Couple } from '../lib/data'
import { Card, Eyebrow, Loading, Pill, Screen, Title } from '../components/ui'
import { PrayerItem } from './Prayer'
import type { PrayerRequest } from './Prayer'

type SharedAnswer = {
  id: string
  couple_id: string
  user_id: string
  body: string
  questions: { prompt: string; position: number; sessions: { position: number; title: string } | null } | null
}

export default function Mentor() {
  const { me } = useMeContext()
  const [couples, setCouples] = useState<Couple[] | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})
  const [completedBy, setCompletedBy] = useState<Record<string, number>>({})
  const [shared, setShared] = useState<SharedAnswer[]>([])
  const [prayers, setPrayers] = useState<PrayerRequest[]>([])

  const load = useCallback(async () => {
    const { data: pairs } = await supabase
      .from('mentor_couples')
      .select('id')
      .or(`member_a.eq.${me.userId},member_b.eq.${me.userId}`)
    const pairIds = (pairs ?? []).map((p) => p.id as string)
    if (pairIds.length === 0) {
      setCouples([])
      return
    }
    const { data: cs } = await supabase
      .from('couples')
      .select('id, church_id, partner_a, partner_b, wedding_date, mentor_couple_id')
      .in('mentor_couple_id', pairIds)
      .order('wedding_date', { ascending: true })
    const list = (cs ?? []) as Couple[]
    setCouples(list)
    const ids = list.map((c) => c.id)
    if (ids.length === 0) return

    const [{ data: progress }, { data: answers }, { data: reqs }] = await Promise.all([
      supabase.from('session_progress').select('couple_id, completed_at').in('couple_id', ids),
      supabase
        .from('answers')
        .select('id, couple_id, user_id, body, questions(prompt, position, sessions(position, title))')
        .in('couple_id', ids)
        .eq('shared_with_mentor', true),
      supabase
        .from('prayer_requests')
        .select('id, couple_id, author_id, body, audience, answered, answered_note, created_at, prayer_acks(user_id)')
        .in('couple_id', ids)
        .eq('answered', false)
        .order('created_at', { ascending: false }),
    ])
    const counts: Record<string, number> = {}
    for (const p of progress ?? []) if (p.completed_at) counts[p.couple_id] = (counts[p.couple_id] ?? 0) + 1
    setCompletedBy(counts)
    setShared((answers ?? []) as unknown as SharedAnswer[])
    const prayerList = (reqs ?? []) as PrayerRequest[]
    setPrayers(prayerList)
    setNames(
      await fetchNames([
        ...list.flatMap((c) => [c.partner_a, c.partner_b]),
        ...prayerList.flatMap((r) => r.prayer_acks.map((a) => a.user_id)),
      ]),
    )
  }, [me.userId])

  useEffect(() => {
    load()
  }, [load])

  if (couples === null) return <Loading />

  return (
    <Screen>
      <Eyebrow>Mentoring</Eyebrow>
      <Title>Your couples</Title>

      {couples.length === 0 && (
        <Card>
          <p className="text-muted">Your pastor hasn't paired you with a couple yet. They'll appear here once they do.</p>
        </Card>
      )}

      {couples.map((c) => {
        const coupleName = [names[c.partner_a], c.partner_b ? names[c.partner_b] : null].filter(Boolean).join(' & ')
        const days = c.wedding_date ? daysUntil(c.wedding_date) : null
        const done = completedBy[c.id] ?? 0
        const theirShared = shared.filter((a) => a.couple_id === c.id)
        const theirPrayers = prayers.filter((p) => p.couple_id === c.id)
        return (
          <section key={c.id} className="space-y-3">
            <Card className="space-y-3">
              <div className="flex items-baseline justify-between">
                <p className="font-display text-lg font-bold">{coupleName || 'New couple'}</p>
                <span className="text-sm text-muted">{days !== null ? (days >= 0 ? `${days} days` : 'Married') : 'No date yet'}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-1.5 rounded-full bg-sage-700" style={{ width: `${Math.round((done / 8) * 100)}%` }} />
              </div>
              <p className="text-sm text-muted">{done} of 8 sessions complete</p>

              {theirShared.length > 0 && (
                <div className="space-y-2 border-t border-line pt-3">
                  <p className="text-sm font-semibold">Answers they've shared with you</p>
                  {theirShared.map((a) => (
                    <div key={a.id} className="rounded-xl bg-ground p-3">
                      <p className="text-xs text-muted">
                        {names[a.user_id] ?? 'Partner'} · Session {a.questions?.sessions?.position ?? ''}, question{' '}
                        {a.questions?.position ?? ''}
                      </p>
                      <p className="mt-1 text-sm font-medium">{a.questions?.prompt}</p>
                      <p className="mt-1 whitespace-pre-line text-sm">{a.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {theirPrayers.length > 0 && (
              <div className="space-y-2">
                <p className="px-1 text-sm font-semibold">Their prayer requests</p>
                {theirPrayers.map((p) => (
                  <PrayerItem key={p.id} request={p} names={names} onChange={load} />
                ))}
              </div>
            )}
          </section>
        )
      })}

      <Card className="space-y-2">
        <p className="text-sm font-semibold">Before each meeting</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-muted">
          <li>Check which session they're on and what they've shared.</li>
          <li>Ask each of them what surprised them in the reveal.</li>
          <li>Talk through any differences gently, without taking sides.</li>
          <li>Close by praying for them by name.</li>
        </ol>
        <p className="border-t border-line pt-2 text-xs leading-relaxed text-muted">
          <Pill tone="flag">Important</Pill> If anything suggests abuse, addiction or a serious mental health concern, pause and speak to your
          pastor.
        </p>
      </Card>
    </Screen>
  )
}
