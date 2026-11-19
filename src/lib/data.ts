import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'

export type Role = 'pastor' | 'mentor' | 'couple'

export type Membership = { church_id: string; role: Role }

export type Couple = {
  id: string
  church_id: string | null
  partner_a: string
  partner_b: string | null
  wedding_date: string | null
  mentor_couple_id: string | null
}

export type ProgrammeSession = {
  id: string
  position: number
  title: string
  summary: string | null
  weeks_before_wedding: number
  teaching: string | null
  scripture_refs: string[]
  exercise: string | null
  prayer: string | null
}

export type Question = {
  id: string
  session_id: string
  position: number
  prompt: string
  kind: 'text' | 'scale' | 'choice'
  options: { min?: number; max?: number; minLabel?: string; maxLabel?: string } | null
}

export type Answer = {
  id: string
  question_id: string
  couple_id: string
  user_id: string
  body: string
  shared_with_mentor: boolean
}

export type Me = {
  userId: string
  email: string
  firstName: string
  onboarded: boolean
  couple: Couple | null
  memberships: Membership[]
  isMentor: boolean
  pastorChurchId: string | null
}

// Loads who the signed-in person is: their profile, their couple and their church roles.
export function useMe() {
  const { session } = useAuth()
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!session) {
      setMe(null)
      setLoading(false)
      return
    }
    const uid = session.user.id
    const [profile, couple, members] = await Promise.all([
      supabase.from('profiles').select('first_name, onboarding_completed').eq('id', uid).maybeSingle(),
      supabase
        .from('couples')
        .select('id, church_id, partner_a, partner_b, wedding_date, mentor_couple_id')
        .or(`partner_a.eq.${uid},partner_b.eq.${uid}`)
        .limit(1)
        .maybeSingle(),
      supabase.from('church_members').select('church_id, role').eq('user_id', uid),
    ])
    const memberships = (members.data ?? []) as Membership[]
    setMe({
      userId: uid,
      email: session.user.email ?? '',
      firstName: profile.data?.first_name ?? '',
      onboarded: !!profile.data?.onboarding_completed,
      couple: (couple.data as Couple | null) ?? null,
      memberships,
      isMentor: memberships.some((m) => m.role === 'mentor'),
      pastorChurchId: memberships.find((m) => m.role === 'pastor')?.church_id ?? null,
    })
    setLoading(false)
  }, [session])

  useEffect(() => {
    load()
  }, [load])

  return { me, loading, reload: load }
}

type MeContextValue = { me: Me; reload: () => Promise<void> }

const MeContext = createContext<MeContextValue | null>(null)

export const MeProvider = MeContext.Provider

export function useMeContext() {
  const value = useContext(MeContext)
  if (!value) throw new Error('useMeContext must be used inside MeProvider')
  return value
}

// ----- Small helpers -----

export function partnerOf(couple: Couple, uid: string) {
  return couple.partner_a === uid ? couple.partner_b : couple.partner_a
}

export function parseDate(isoDate: string) {
  return new Date(isoDate + 'T00:00:00')
}

export function today() {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

export function daysUntil(isoDate: string) {
  return Math.round((parseDate(isoDate).getTime() - today().getTime()) / 86400000)
}

export function opensOn(weddingDate: string, weeksBefore: number) {
  const d = parseDate(weddingDate)
  d.setDate(d.getDate() - weeksBefore * 7)
  return d
}

export function formatDate(d: Date, withWeekday = true) {
  return d.toLocaleDateString('en-GB', {
    weekday: withWeekday ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// A session is open once its date arrives, or as soon as every earlier session is complete,
// so couples with a short engagement can work ahead.
export function isUnlocked(
  s: ProgrammeSession,
  all: ProgrammeSession[],
  completedIds: Set<string>,
  weddingDate: string | null,
) {
  if (s.position === 1) return true
  const earlierDone = all.filter((x) => x.position < s.position).every((x) => completedIds.has(x.id))
  if (earlierDone) return true
  if (!weddingDate) return false
  return opensOn(weddingDate, s.weeks_before_wedding) <= today()
}

// First names of connected people (partner, mentors, couples, pastor). Other profile fields stay private.
export async function fetchNames(ids: (string | null | undefined)[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(ids.filter((x): x is string => !!x)))
  if (unique.length === 0) return {}
  const { data } = await supabase.rpc('people_names', { p_ids: unique })
  const out: Record<string, string> = {}
  for (const row of (data ?? []) as { id: string; first_name: string | null }[]) {
    out[row.id] = row.first_name || 'Someone'
  }
  return out
}

export function inviteLink(code: string) {
  return `${window.location.origin}/join?code=${code}`
}
