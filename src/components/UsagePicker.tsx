import { Heart, User } from 'lucide-react'
import { CHANGE_LATER, usageOptions } from '../lib/usage'
import type { Usage } from '../lib/usage'

const icons = { solo: User, couple: Heart }

export default function UsagePicker({ value, onChange }: { value: Usage; onChange: (u: Usage) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">How will you use Covenant?</legend>
      <div className="mt-1.5 grid grid-cols-2 gap-3">
        {usageOptions.map((o) => {
          const Icon = icons[o.value]
          const selected = value === o.value
          return (
            <label
              key={o.value}
              className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
                selected ? 'border-primary bg-secondary' : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <input
                type="radio"
                name="usage"
                value={o.value}
                checked={selected}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
              <span className="mt-3 block text-sm font-medium">{o.title}</span>
              <span className="mt-1 block text-xs leading-snug text-muted-foreground">{o.text}</span>
            </label>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{CHANGE_LATER}</p>
    </fieldset>
  )
}
