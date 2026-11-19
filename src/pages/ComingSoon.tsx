import PageHeader from '../components/PageHeader'

export default function ComingSoon({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} />
      <section className="card p-6">
        <span className="rounded-full bg-preview px-2.5 py-0.5 text-xs text-preview-foreground">Coming soon</span>
        <p className="mt-3 text-muted-foreground">{text}</p>
      </section>
    </div>
  )
}
