export default function PageHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <header>
      <p className="eyebrow text-accent-foreground">{eyebrow}</p>
      <h1 className="mt-2 text-4xl">{title}</h1>
      {text && <p className="mt-2 text-lg text-muted-foreground">{text}</p>}
    </header>
  )
}
