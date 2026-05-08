import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../api/auth.jsx'

export default function Signup() {
  const { signup } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      await signup(form.email, form.password, form.full_name)
      nav('/')
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Sign up failed')
    } finally { setBusy(false) }
  }

  return (
    <div className="max-w-md mx-auto card mt-12">
      <h1 className="text-2xl font-bold mb-6">Create your account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div>
          <label className="label">Password (min 6 chars)</label>
          <input className="input" type="password" required minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        Already have an account? <Link className="text-brand-600 hover:underline" to="/login">Sign in</Link>
      </p>
    </div>
  )
}
