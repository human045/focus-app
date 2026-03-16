'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

type Tab = 'signin' | 'signup'

export default function AuthPage() {
  const supabase = createClient()
  const [tab, setTab]           = useState<Tab>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  function resetMessages() { setError(''); setSuccess('') }

  async function handleEmail() {
    resetMessages()
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)

    if (tab === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      })
      if (error) setError(error.message)
      else setSuccess('Account created! Check your email for a confirmation link.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  async function handleGoogle() {
    resetMessages()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm animate-fadeUp">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-3"
               style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            <span className="font-mono text-lg font-medium">F</span>
          </div>
          <p className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--muted)' }}>
            Focus
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Your personal pomodoro space
          </p>
        </div>

        <div className="rounded-3xl border p-7"
             style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

          {/* Tabs */}
          <div className="flex mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
            {(['signin', 'signup'] as Tab[]).map(t => (
              <button key={t}
                onClick={() => { setTab(t); resetMessages() }}
                className="flex-1 pb-3 font-mono text-xs tracking-widest uppercase transition-all duration-200"
                style={{
                  borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                  color: tab === t ? 'var(--accent)' : 'var(--muted)',
                  marginBottom: '-1px',
                }}>
                {t === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          {/* Email + Password */}
          <div className="space-y-3 mb-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              onEnter={handleEmail}
            />
          </div>

          {/* Error / success messages */}
          {error   && <p className="text-xs mb-3 text-center" style={{ color: '#e87070' }}>{error}</p>}
          {success && <p className="text-xs mb-3 text-center" style={{ color: '#70c99a' }}>{success}</p>}

          {/* Submit button */}
          <button
            onClick={handleEmail}
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl font-mono text-xs font-medium tracking-wider
                       transition-all duration-200 hover:opacity-90 active:scale-[0.98]
                       disabled:opacity-40 disabled:cursor-not-allowed mb-5"
            style={{ background: 'var(--accent)', color: '#0f0f0f' }}>
            {loading ? 'Please wait...' : tab === 'signin' ? 'Sign in' : 'Create account'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl
                       text-sm font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
            style={{
              background: 'var(--surface2)',
              border: '0.5px solid var(--border)',
              color: 'var(--text)',
            }}>
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-center text-xs mt-5" style={{ color: 'var(--muted)' }}>
            Your data is private and only visible to you.
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, type, value, onChange, placeholder, onEnter,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  onEnter?: () => void
}) {
  return (
    <div>
      <label
        className="block font-mono text-[10px] tracking-wider uppercase mb-1.5"
        style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors"
        style={{ background: 'var(--surface2)', border: '0.5px solid var(--border)', color: 'var(--text)' }}
        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
