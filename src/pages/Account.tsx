import { useAuth } from '../lib/AuthContext'
import { useMeContext } from '../lib/data'
import type { Role } from '../lib/data'
import { Card, Pill, Screen, Title, btnGhost } from '../components/ui'
import { AcceptInvite } from './Welcome'

const roleLabel: Record<Role, string> = { couple: 'Couple', mentor: 'Mentor', pastor: 'Pastor' }

export default function Account() {
  const { signOut } = useAuth()
  const { me } = useMeContext()

  return (
    <Screen>
      <Title>{me.firstName ? `${me.firstName}'s account` : 'Account'}</Title>
      <Card className="space-y-2">
        <p className="text-sm text-muted">Signed in as {me.email}</p>
        <div className="flex flex-wrap gap-2">
          {me.couple && <Pill>Preparing for marriage</Pill>}
          {me.memberships
            .filter((m) => m.role !== 'couple')
            .map((m) => (
              <Pill key={m.church_id + m.role} tone="grey">
                {roleLabel[m.role]}
              </Pill>
            ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="font-semibold">Have another invite?</p>
        <p className="text-sm text-muted">For example, if your church has asked you to be a mentor.</p>
        <AcceptInvite />
      </Card>

      <Card className="space-y-2">
        <p className="font-semibold">About Covenant</p>
        <p className="text-sm leading-relaxed text-muted">
          Covenant supports marriage preparation with your church. It isn't counselling. If you're struggling, please speak to your pastor or
          a qualified counsellor.
        </p>
      </Card>

      <button type="button" onClick={signOut} className={btnGhost}>
        Sign out
      </button>
    </Screen>
  )
}
