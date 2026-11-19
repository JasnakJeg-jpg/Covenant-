import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import AppShell from './components/AppShell'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import MySpace from './pages/MySpace'
import ComingSoon from './pages/ComingSoon'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sign-in" element={<AuthPage mode="signin" />} />
        <Route path="/sign-up" element={<AuthPage mode="signup" />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/bible"
            element={<ComingSoon eyebrow="Bible" title="Scripture" text="The Scripture library and reading plans will live here." />}
          />
          <Route
            path="/studies"
            element={<ComingSoon eyebrow="Studies" title="Guided studies" text="Guided couples Bible studies will live here." />}
          />
          <Route
            path="/community"
            element={<ComingSoon eyebrow="Community" title="Community" text="The anonymous community will live here." />}
          />
          <Route path="/my-space" element={<MySpace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
