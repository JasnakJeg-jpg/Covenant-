import { Link, NavLink, Outlet } from 'react-router-dom'
import { BookOpen, Heart, Home, Library, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../lib/AuthContext'

export const navItems: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/bible', label: 'Bible', icon: BookOpen },
  { to: '/studies', label: 'Studies', icon: Library },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/my-space', label: 'My Space', icon: Heart },
]

export default function AppShell() {
  const { session, signOut } = useAuth()

  return (
    <div className="min-h-screen md:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-card focus:px-4 focus:py-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card px-4 py-6 md:flex">
        <div className="px-3"><Logo to="/dashboard" /></div>
        <nav aria-label="Main" className="mt-8 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-secondary font-medium text-secondary-foreground' : 'text-foreground/75 hover:bg-muted'
                }`
              }
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-6 px-3">
          {session ? (
            <button onClick={signOut} className="text-sm text-foreground/75 hover:text-foreground">Sign out</button>
          ) : (
            <Link to="/sign-in" className="text-sm font-medium hover:underline">Sign in</Link>
          )}
          <p className="font-display text-xs italic leading-relaxed text-muted-foreground">
            “Above all, love each other deeply.” 1 Peter 4:8
          </p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <Logo to="/dashboard" />
          {session ? (
            <button onClick={signOut} className="text-sm text-foreground/75">Sign out</button>
          ) : (
            <Link to="/sign-in" className="text-sm font-medium">Sign in</Link>
          )}
        </header>

        <main id="main" className="mx-auto max-w-4xl px-4 pb-28 pt-8 sm:px-8 md:pb-12 md:pt-12">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border bg-card/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
      >
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="flex flex-1 flex-col items-center gap-1 text-[11px]">
            {({ isActive }) => (
              <>
                <span className={`flex h-8 w-12 items-center justify-center rounded-full ${isActive ? 'bg-secondary text-secondary-foreground' : 'text-foreground/60'}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className={isActive ? 'font-medium text-foreground' : 'text-foreground/60'}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
