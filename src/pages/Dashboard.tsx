import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { navItems } from '../components/AppShell'
import { useAuth } from '../lib/AuthContext'

const tiles = [
  { label: 'Open the Bible', to: '/bible' },
  { label: 'Browse studies', to: '/studies' },
  { label: 'Community', to: '/community' },
  { label: 'My Space', to: '/my-space' },
].map((t) => ({ ...t, icon: navItems.find((n) => n.to === t.to)!.icon }))

export default function Dashboard() {
  const { session } = useAuth()

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Home" title="Peace be with you" text="A quiet place to begin your day with God and each other." />

      <section className="rounded-[28px] bg-hero p-6 text-primary-foreground shadow-soft sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow text-primary-foreground/80">Verse for today</p>
          <span className="rounded-full bg-preview px-2.5 py-0.5 text-xs text-preview-foreground">Preview content</span>
        </div>
        <p className="mt-4 font-display text-2xl italic leading-snug">
          “Two are better than one… A threefold cord is not quickly broken.”
        </p>
        <p className="mt-3 text-sm text-primary-foreground/75">Ecclesiastes 4:9, 12</p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ label, to, icon: Icon }) => (
          <Link key={to} to={to} className="card p-4 transition-colors hover:bg-muted sm:p-5">
            <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
            <span className="mt-4 block text-sm font-medium">{label}</span>
          </Link>
        ))}
      </div>

      <section className="card p-6">
        <h2 className="text-xl">Your progress</h2>
        {session ? (
          <p className="mt-1 text-sm text-muted-foreground">Reading and study tracking are coming soon.</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to keep track of your reading and studies.</p>
            <Link to="/sign-in" className="btn-outline mt-4 h-10 px-5 text-sm">Sign in</Link>
          </>
        )}
      </section>
    </div>
  )
}
