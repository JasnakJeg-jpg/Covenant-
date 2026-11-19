import { Link } from 'react-router-dom'
import { BookOpen, Heart, Library, ShieldCheck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../lib/AuthContext'

const features: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: BookOpen, title: 'Scripture, daily', text: 'Read on your own or side by side with your partner.' },
  { icon: Library, title: 'Guided studies', text: 'Relationship topics grounded in the Bible, at your pace.' },
  { icon: Users, title: 'Community', text: 'Share and pray with others anonymously, in a gentle space.' },
  { icon: Heart, title: 'Your own space', text: 'A private place for the two of you to grow together.' },
]

export default function Landing() {
  const { session } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-[calc(72rem+2.5rem)] items-center justify-between p-5">
        <Logo />
        <nav className="flex items-center gap-2">
          {session ? (
            <Link to="/dashboard" className="btn-primary h-9 px-4 text-xs">Open Covenant</Link>
          ) : (
            <>
              <Link to="/sign-in" className="btn h-9 px-3 text-xs hover:bg-muted">Sign in</Link>
              <Link to="/sign-up" className="btn-primary h-9 px-4 text-xs">Get started</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="px-5 pb-16 pt-6 sm:pt-12">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-hero bg-hero px-6 py-14 text-primary-foreground shadow-soft sm:px-14 sm:py-24">
            <div className="max-w-2xl">
              <p className="eyebrow text-primary-foreground/80">For couples, and those preparing</p>
              <h1 className="mt-4 text-4xl leading-[1.08] sm:text-6xl">Grow closer to God and to one another</h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-primary-foreground/85">
                Bible studies, Scripture, prayer and conversation for married couples and couples preparing for marriage.
              </p>
              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Link to="/sign-up" className="btn h-12 bg-primary-foreground px-7 text-primary hover:bg-primary-foreground/90">
                  Create your account
                </Link>
                <Link to="/dashboard" className="btn h-12 px-7 text-primary-foreground hover:bg-white/10">
                  Look around first
                </Link>
              </div>
              <blockquote className="mt-12 max-w-md border-l border-primary-foreground/40 pl-4">
                <p className="font-display text-lg italic leading-relaxed">
                  “Two are better than one… A threefold cord is not quickly broken.”
                </p>
                <cite className="mt-1 block text-sm not-italic text-primary-foreground/70">Ecclesiastes 4:9, 12</cite>
              </blockquote>
            </div>
          </div>
        </section>

        <section className="px-5 pb-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl">Everything in one quiet place</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className="card p-6">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
                  <h3 className="mt-5 text-lg">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20">
          <div className="mx-auto flex max-w-6xl items-start gap-3 rounded-card bg-secondary p-6 text-secondary-foreground">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-sm leading-relaxed">
              Your details are private by default. You decide what to share — nothing is ever shared without your choice.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Covenant
      </footer>
    </div>
  )
}
