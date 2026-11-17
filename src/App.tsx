import { NavLink, Route, Routes } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Home' },
  { to: '/bible', label: 'Bible' },
  { to: '/studies', label: 'Studies' },
  { to: '/community', label: 'Community' },
  { to: '/my-space', label: 'My Space' },
]

function Page({ title, text }: { title: string; text: string }) {
  return (
    <section className="mx-auto max-w-2xl p-6">
      <h1 className="font-serif text-3xl text-sage-900">{title}</h1>
      <p className="mt-3 text-ink/80">{text}</p>
    </section>
  )
}

export default function App() {
  return (
    <div className="min-h-screen pb-20">
      <main>
        <Routes>
          <Route path="/" element={<Page title="Welcome to Covenant" text="Grow in faith and in your relationships." />} />
          <Route path="/bible" element={<Page title="Bible" text="Scripture library and reading plans will live here." />} />
          <Route path="/studies" element={<Page title="Studies" text="Guided couples Bible studies will live here." />} />
          <Route path="/community" element={<Page title="Community" text="The anonymous community will live here." />} />
          <Route path="/my-space" element={<Page title="My Space" text="Your prayers, notes and settings will live here." />} />
        </Routes>
      </main>

      <nav
        aria-label="Main"
        className="fixed bottom-0 left-0 right-0 flex justify-around border-t border-sage-100 bg-white/95 py-2"
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `px-3 py-2 text-sm ${isActive ? 'font-semibold text-sage-700' : 'text-ink/60'}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
