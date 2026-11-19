import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { MeProvider, useMe } from './lib/data'
import type { Me } from './lib/data'
import { Card, Loading, Screen, Title } from './components/ui'
import AuthPage from './AuthPage'
import ProfileSetup from './ProfileSetup'
import Welcome, { AcceptInvite } from './pages/Welcome'
import Home from './pages/Home'
import Sessions from './pages/Sessions'
import SessionDetail from './pages/SessionDetail'
import Prayer from './pages/Prayer'
import Mentor from './pages/Mentor'
import Pastor from './pages/Pastor'
import Account from './pages/Account'

type Tab = { to: string; label: string; icon: ReactNode }

const icon = (d: ReactNode) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)

const icons = {
  home: icon(<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />),
  sessions: icon(
    <>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 19V5" />
    </>,
  ),
  prayer: icon(<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />),
  mentors: icon(
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5M15 15c3 0 6 1.6 6 4.5" />
    </>,
  ),
  church: icon(
    <>
      <path d="M12 2v6M9 5h6" />
      <path d="M5 21V12l7-4 7 4v9z" />
      <path d="M10 21v-4h4v4" />
    </>,
  ),
  account: icon(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </>,
  ),
}

function tabsFor(me: Me): Tab[] {
  const tabs: Tab[] = []
  if (me.couple) {
    tabs.push({ to: '/', label: 'Home', icon: icons.home })
    tabs.push({ to: '/sessions', label: 'Sessions', icon: icons.sessions })
    tabs.push({ to: '/prayer', label: 'Prayer', icon: icons.prayer })
  }
  if (me.isMentor) tabs.push({ to: '/mentoring', label: 'Mentoring', icon: icons.mentors })
  if (me.pastorChurchId) tabs.push({ to: '/church', label: 'Church', icon: icons.church })
  tabs.push({ to: '/account', label: 'Account', icon: icons.account })
  return tabs
}

function homePath(me: Me) {
  if (me.couple) return '/'
  if (me.pastorChurchId) return '/church'
  if (me.isMentor) return '/mentoring'
  return '/account'
}

function JoinPage() {
  const code = new URLSearchParams(window.location.search).get('code') ?? ''
  return (
    <Screen>
      <Title>Accept your invite</Title>
      <Card>
        <AcceptInvite initialCode={code} />
      </Card>
    </Screen>
  )
}

function Shell({ me }: { me: Me }) {
  const tabs = tabsFor(me)
  const start = homePath(me)
  return (
    <div className="min-h-screen">
      <main>
        <Routes>
          <Route path="/" element={me.couple ? <Home /> : <Navigate to={start} replace />} />
          <Route path="/sessions" element={me.couple ? <Sessions /> : <Navigate to={start} replace />} />
          <Route path="/sessions/:position" element={me.couple ? <SessionDetail /> : <Navigate to={start} replace />} />
          <Route path="/prayer" element={me.couple ? <Prayer /> : <Navigate to={start} replace />} />
          <Route path="/mentoring" element={me.isMentor ? <Mentor /> : <Navigate to={start} replace />} />
          <Route path="/church" element={me.pastorChurchId ? <Pastor /> : <Navigate to={start} replace />} />
          <Route path="/account" element={<Account />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="*" element={<Navigate to={start} replace />} />
        </Routes>
      </main>

      <nav aria-label="Main" className="fixed bottom-0 left-0 right-0 border-t border-line bg-white/95 pb-2 backdrop-blur">
        <div className="mx-auto flex max-w-xl justify-around">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex min-h-[56px] min-w-[64px] flex-col items-center justify-center gap-0.5 text-[11px] ${
                  isActive ? 'font-semibold text-sage-700' : 'text-muted'
                }`
              }
            >
              {tab.icon}
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function SignedIn() {
  const { me, loading, reload } = useMe()
  if (loading || !me) return <Loading />
  return (
    <MeProvider value={{ me, reload }}>
      {!me.onboarded ? (
        <ProfileSetup onDone={reload} />
      ) : !me.couple && me.memberships.length === 0 ? (
        <Welcome />
      ) : (
        <Shell me={me} />
      )}
    </MeProvider>
  )
}

function Gate() {
  const { session, loading } = useAuth()
  if (loading) return <Loading />
  if (!session) return <AuthPage />
  return <SignedIn />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
