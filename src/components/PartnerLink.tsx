import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { forgetInvite, recalledInvite } from '../lib/usage'

type Partner = { id: string; first_name: string | null }

/**
 * Shows the linked partner, or lets the member share an invite code / enter their partner's code.
 */
export default function PartnerLink({ onLinked }: { onLinked?: (name: string) => void }) {
  const [partner, setPartner] = useState<Partner | null | undefined>(undefined)
  const [myCode, setMyCode] = useState<string | null>(null)
  const [theirCode, setTheirCode] = useState(recalledInvite())
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function load() {
    const [{ data: p }, { data: inv }] = await Promise.all([
      supabase.rpc('get_partner'),
      supabase.from('partner_invites').select('code, expires_at').gt('expires_at', new Date().toISOString()).maybeSingle(),
    ])
    setPartner((p as Partner[] | null)?.[0] ?? null)
    setMyCode(inv?.code ?? null)
  }

  useEffect(() => {
    load()
  }, [])

  async function createCode() {
    setBusy(true)
    setMessage(null)
    const { data, error } = await supabase.rpc('create_partner_invite')
    setBusy(false)
    if (error) setMessage(error.message)
    else setMyCode(data as string)
  }

  async function acceptCode(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const { data, error } = await supabase.rpc('accept_partner_invite', { invite_code: theirCode })
    setBusy(false)
    if (error) {
      setMessage(error.message)
      return
    }
    forgetInvite()
    await load()
    onLinked?.((data as string) ?? '')
  }

  async function unlink() {
    if (!confirm('Unlink your partner? You can link again at any time.')) return
    setBusy(true)
    const { error } = await supabase.rpc('unlink_partner')
    setBusy(false)
    if (error) setMessage(error.message)
    else await load()
  }

  async function copyInvite() {
    if (!myCode) return
    const link = `${window.location.origin}/sign-up?invite=${myCode}`
    const text = `Join me on Covenant: ${link}\nOr enter my code when you set up: ${myCode}`
    try {
      if (navigator.share) await navigator.share({ title: 'Join me on Covenant', text })
      else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      /* share cancelled */
    }
  }

  if (partner === undefined) return <p className="text-sm text-muted-foreground">Loading…</p>

  if (partner) {
    return (
      <div>
        <p className="text-sm">
          You’re linked with <strong>{partner.first_name || 'your partner'}</strong>.
        </p>
        <button onClick={unlink} disabled={busy} className="mt-3 text-sm text-muted-foreground underline hover:text-foreground">
          Unlink partner
        </button>
        {message && <p className="mt-3 text-sm text-destructive" role="alert">{message}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-sans text-sm font-medium">Invite your partner</h3>
        <p className="mt-1 text-sm text-muted-foreground">Share a code. It works for 7 days.</p>
        {myCode ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-dashed border-primary/50 bg-background px-4 py-2 font-mono text-lg tracking-[0.25em]">
              {myCode}
            </span>
            <button type="button" onClick={copyInvite} className="btn-outline h-10 px-4 text-sm">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Share invite'}
            </button>
            <button type="button" onClick={load} className="text-sm text-muted-foreground underline">
              Check if they’ve joined
            </button>
          </div>
        ) : (
          <button type="button" onClick={createCode} disabled={busy} className="btn-primary mt-3 h-10 px-5 text-sm">
            Create invite code
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={acceptCode}>
        <label className="block text-sm font-medium">
          Have a code from your partner?
          <div className="mt-1.5 flex gap-2">
            <input
              value={theirCode}
              onChange={(e) => setTheirCode(e.target.value.toUpperCase())}
              placeholder="ABCD2345"
              maxLength={12}
              autoCapitalize="characters"
              className="input mt-0 font-mono tracking-[0.2em]"
            />
            <button type="submit" disabled={busy || theirCode.trim().length < 8} className="btn-primary h-auto shrink-0 px-5 text-sm">
              Link
            </button>
          </div>
        </label>
      </form>

      {message && <p className="text-sm text-destructive" role="alert">{message}</p>}
    </div>
  )
}
