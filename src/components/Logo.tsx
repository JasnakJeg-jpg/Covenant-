import { Link } from 'react-router-dom'

export function LogoMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M12 3v18M6 9h12M7 21c1.5-2 3-3 5-3s3.5 1 5 3" />
    </svg>
  )
}

export default function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 text-primary">
      <LogoMark />
      <span className="font-display text-xl font-semibold">Covenant</span>
    </Link>
  )
}
