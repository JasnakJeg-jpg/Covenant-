import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { daysUntil, fetchNames, inviteLink, useMeContext } from '../lib/data'
import type { Couple, Role } from '../lib/data'
import { Card, CopyLink, Eyebrow, Loading, Pill, Screen, Status, Title, btn, btnGhost, fieldClass, labelClass } from '../components/ui'

type Church = {
  id: string
  name: string
  prayer_team_enabled: boolean
  safeguarding_lead: string | null
  welcome_message: string | null
}
type Member = { user_id: string; role: Role }
type MentorCouple = { id: string; member_a: string; member_b: string | null }
type Invite = { id: string; email: string; role: Role; code: string; expires_at: string }

const roleLabel: Record<Role, string> = { couple: 'Engaged couple', mentor: 'Mentor', pastor: 'Pastor / leader' }

export default function Pastor() {
  const { me } = useMeContext()
  const churchId = me.pastorChurchId!
  const [church, setChurch] = useState<Church | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [mentorCouples, setMentorCouples] = useState<MentorCouple[]>([])
  const [couples, setCouples] = useState<Couple[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [completedBy, setCompletedBy] = useState<Record<string, number>>({})
  const [names, setNames] = useState<Record<string, string>>({})

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('couple')
  const [mentorA, setMentorA] = useState('')
  const [mentorB, setMentorB] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [ch, mem, mc, cs, inv] = await Promise.all([
      supabase.from('churches').select('id, name, prayer_team_enabled, safeguarding_lead, welcome_message').eq('id', churchId).maybeSingle(),
      supabase.from('church_members').select('user_id, role').eq('church_id', churchId),
      supabase.from('mentor_couples').select('id, member_a, member_b').eq('church_id', churchId),
      supabase
        .from('couples')
        .select('id, church_id, partner_a, partner_b, wedding_date, mentor_couple_id')
        .eq('church_id', churchId)
        .order('wedding_date', { ascending: true }),
      supabase
        .from('invites')
        .select('id, email, role, code, expires_at')
        .eq('church_id', churchId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false }),
    ])
    setChurch(ch.data as Church | null)
    const memberList = (mem.data ?? []) as Member[]
    const coupleList = (cs.data ?? []) as Couple[]
    setMembers(memberList)
    setMentorCouples((mc.data ?? []) as MentorCouple[])
    setCouples(coupleList)
    setInvites((inv.data ?? []) as Invite[])
    if (coupleList.length) {
      const { data: progress } = await supabase
        .from('session_progress')
        .select('couple_id, completed_at')
        .in(
          'couple_id',
          coupleList.map((c) => c.id),
        )
      const counts: Record<string, number> = {}
      for (const p of progress ?? []) if (p.completed_at) counts[p.couple_id] = (counts[p.couple_id] ?? 0) + 1
      setCompletedBy(counts)
    }
    setNames(await fetchNames(memberList.map((m) => m.user_id)))
  }, [churchId])

  useEffect(() => {
    load()
  }, [load])

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    if (!church) return
    const { error } = await supabase
      .from('churches')
      .update({
        name: church.name,
        prayer_team_enabled: church.prayer_team_enabled,
        safeguarding_lead: church.safeguarding_lead,
        welcome_message: church.welcome_message,
      })
      .eq('id', church.id)
    setSettingsMessage(error ? error.message : 'Saved.')
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    const { error } = await supabase
      .from('invites')
      .insert({ church_id: churchId, email: inviteEmail.trim().toLowerCase(), role: inviteRole, created_by: me.userId })
    if (error) setMessage(error.message)
    else {
      setInviteEmail('')
      setMessage('Invite created. Copy the link below and send it to them.')
      await load()
    }
  }

  async function cancelInvite(id: string) {
    await supabase.from('invites').delete().eq('id', id)
    await load()
  }

  async function createMentorCouple(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    const { error } = await supabase
      .from('mentor_couples')
      .insert({ church_id: churchId, member_a: mentorA, member_b: mentorB || null })
    if (error) setMessage(error.message)
    else {
      setMentorA('')
      setMentorB('')
      await load()
    }
  }

  async function assign(coupleId: string, mentorCoupleId: string) {
    const { error } = await supabase.rpc('assign_mentor', { p_couple: coupleId, p_mentor_couple: mentorCoupleId || null })
    if (error) setMessage(error.message)
    await load()
  }

  if (!church) return <Loading />

  const mentors = members.filter((m) => m.role === 'mentor')
  const pairName = (mc: MentorCouple) =>
    [names[mc.member_a], mc.member_b ? names[mc.member_b] : null].filter(Boolean).join(' & ') || 'Mentors'

  return (
    <Screen>
      <Eyebrow>Church dashboard</Eyebrow>
      <Title>{church.name}</Title>

      <section aria-label="Couples" className="space-y-2">
        <p className="px-1 font-display text-lg font-bold">Couples ({couples.length})</p>
        {couples.length === 0 && (
          <Card>
            <p className="text-muted">No couples yet. Invite your first couple below.</p>
          </Card>
        )}
        {couples.map((c) => {
          const days = c.wedding_date ? daysUntil(c.wedding_date) : null
          const done = completedBy[c.id] ?? 0
          return (
            <Card key={c.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {[names[c.partner_a], c.partner_b ? names[c.partner_b] : null].filter(Boolean).join(' & ') || 'New couple'}
                  {!c.partner_b && <span className="ml-2 text-xs font-normal text-muted">(partner not joined)</span>}
                </p>
                <span className="text-sm text-muted">{days !== null ? (days >= 0 ? `${days} days` : 'Married') : 'No date'}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-1.5 rounded-full bg-sage-700" style={{ width: `${Math.round((done / 8) * 100)}%` }} />
              </div>
              <p className="text-xs text-muted">{done} of 8 sessions complete</p>
              <label className={labelClass}>
                Mentor couple
                <select value={c.mentor_couple_id ?? ''} onChange={(e) => assign(c.id, e.target.value)} className={fieldClass}>
                  <option value="">Not assigned</option>
                  {mentorCouples.map((mc) => (
                    <option key={mc.id} value={mc.id}>
                      {pairName(mc)}
                    </option>
                  ))}
                </select>
              </label>
            </Card>
          )
        })}
      </section>

      <Card className="space-y-3">
        <p className="font-display text-lg font-bold">Invite someone</p>
        <form onSubmit={sendInvite} className="space-y-3">
          <label className={labelClass}>
            Email
            <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className={fieldClass} />
          </label>
          <label className={labelClass}>
            Joining as
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)} className={fieldClass}>
              <option value="couple">{roleLabel.couple} (invite one partner; they invite the other)</option>
              <option value="mentor">{roleLabel.mentor}</option>
              <option value="pastor">{roleLabel.pastor}</option>
            </select>
          </label>
          <button type="submit" className={`${btn} w-full`}>
            Create invite link
          </button>
        </form>
        <Status message={message} />
        {invites.length > 0 && (
          <div className="space-y-3 border-t border-line pt-3">
            <p className="text-sm font-semibold">Waiting to join</p>
            {invites.map((i) => (
              <div key={i.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">
                    {i.email} · <Pill tone="grey">{roleLabel[i.role]}</Pill>
                  </span>
                  <button type="button" onClick={() => cancelInvite(i.id)} className="text-sm text-muted underline">
                    Cancel
                  </button>
                </div>
                <CopyLink url={inviteLink(i.code)} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <p className="font-display text-lg font-bold">Mentor couples ({mentorCouples.length})</p>
        {mentorCouples.map((mc) => (
          <p key={mc.id} className="text-sm">
            {pairName(mc)} · {couples.filter((c) => c.mentor_couple_id === mc.id).length} couples
          </p>
        ))}
        {mentors.length === 0 ? (
          <p className="text-sm text-muted">Invite mentors first, then pair them up here.</p>
        ) : (
          <form onSubmit={createMentorCouple} className="space-y-3 border-t border-line pt-3">
            <p className="text-sm font-semibold">Pair two mentors</p>
            <label className={labelClass}>
              First mentor
              <select required value={mentorA} onChange={(e) => setMentorA(e.target.value)} className={fieldClass}>
                <option value="">Choose…</option>
                {mentors.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {names[m.user_id] ?? 'Mentor'}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Their spouse (optional)
              <select value={mentorB} onChange={(e) => setMentorB(e.target.value)} className={fieldClass}>
                <option value="">None</option>
                {mentors
                  .filter((m) => m.user_id !== mentorA)
                  .map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {names[m.user_id] ?? 'Mentor'}
                    </option>
                  ))}
              </select>
            </label>
            <button type="submit" className={btnGhost}>
              Create mentor couple
            </button>
          </form>
        )}
      </Card>

      <Card>
        <form onSubmit={saveSettings} className="space-y-3">
          <p className="font-display text-lg font-bold">Church settings</p>
          <label className={labelClass}>
            Church name
            <input required value={church.name} onChange={(e) => setChurch({ ...church, name: e.target.value })} className={fieldClass} />
          </label>
          <label className={labelClass}>
            Safeguarding lead
            <input
              value={church.safeguarding_lead ?? ''}
              onChange={(e) => setChurch({ ...church, safeguarding_lead: e.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="flex min-h-[44px] items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={church.prayer_team_enabled}
              onChange={(e) => setChurch({ ...church, prayer_team_enabled: e.target.checked })}
              className="h-5 w-5 accent-sage-700"
            />
            Let couples share prayer requests with the church prayer team
          </label>
          <button type="submit" className={btnGhost}>
            Save settings
          </button>
          <Status message={settingsMessage} />
        </form>
      </Card>
    </Screen>
  )
}
