import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate, isUnlocked, opensOn, useMeContext } from '../lib/data'
import type { ProgrammeSession } from '../lib/data'
import { Eyebrow, Pill, Screen, Title } from '../components/ui'

export default function Sessions() {
  const { me } = useMeContext()
  const couple = me.couple!
  const [sessions, setSessions] = useState<ProgrammeSession[]>([])
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
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
        setCompleted(new Set((data ?? []).filter((r) => r.completed_at).map((r) => r.session_id as string))),
      )
  }, [couple.id])

  return (
    <Screen>
      <Eyebrow>Your programme</Eyebrow>
      <Title>Sessions</Title>
      <ol className="space-y-2">
        {sessions.map((s) => {
          const done = completed.has(s.id)
          const open = isUnlocked(s, sessions, completed, couple.wedding_date)
          const opens = couple.wedding_date ? opensOn(couple.wedding_date, s.weeks_before_wedding) : null
          const body = (
            <div className="flex items-center gap-4 rounded-2xl bg-white p-4">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  done ? 'bg-sage-700 text-white' : open ? 'border-2 border-sage-700 text-sage-700' : 'border-2 border-line text-muted'
                }`}
              >
                {done ? '✓' : s.position}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block font-semibold ${open ? '' : 'text-muted'}`}>{s.title}</span>
                <span className="block text-xs text-muted">
                  {done
                    ? 'Complete'
                    : open
                      ? `${s.weeks_before_wedding} weeks before the wedding`
                      : opens
                        ? `Opens ${formatDate(opens, false)}`
                        : 'Add your wedding date to schedule'}
                </span>
              </span>
              {open && !done && <Pill>Open</Pill>}
            </div>
          )
          return (
            <li key={s.id}>
              {open ? (
                <Link to={`/sessions/${s.position}`} className="block">
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          )
        })}
      </ol>
    </Screen>
  )
}
