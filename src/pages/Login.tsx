import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { isDemoMode } from '../lib/supabase'
import EarLogo from '../components/shared/EarLogo'
import Icon from '../components/shared/Icon'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) setError(error)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black p-4">
      {/* atmospheric depth — clean black with a faint gold glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-[#0c0c0d] to-[#141414] opacity-70" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-brand-gold/10 blur-3xl" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-gold/5 blur-3xl" />
      </div>

      <div className="w-full max-w-[380px] overflow-hidden rounded-xl bg-card shadow-2xl">
        <div className="px-8 pb-6 pt-10 text-center">
          <div className="mb-4 flex justify-center">
            <EarLogo className="h-12 w-auto text-[#9E814B]" />
          </div>
          <p className="micro-label text-muted">Sales Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 pb-8">
          {isDemoMode && (
            <div className="rounded-lg bg-amber-light px-3 py-2 text-xs text-amber">
              <strong>Demo mode</strong> — sample data, no live database.
              <br />
              rus@the-ear.com · coordinator@the-ear.com · pw <code>demo</code>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="micro-label block text-muted">
              Email address
            </label>
            <div className="relative flex items-center">
              <Icon name="mail" className="absolute left-3 text-muted" size={18} />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@the-ear.com"
                autoComplete="email"
                className="w-full rounded-lg border border-line bg-soft py-2.5 pl-10 pr-4 text-body-md text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="micro-label block text-muted">
              Password
            </label>
            <div className="relative flex items-center">
              <Icon name="lock" className="absolute left-3 text-muted" size={18} />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-lg border border-line bg-soft py-2.5 pl-10 pr-4 text-body-md text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>

          {error && <p className="text-body-sm text-red">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-chrome py-3 font-bold text-white transition-all hover:bg-[#0e1d2c] active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <Icon
                  name="arrow_forward"
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </button>
        </form>

        <div className="h-1 w-full bg-brand-gold opacity-80" />
      </div>
    </div>
  )
}
