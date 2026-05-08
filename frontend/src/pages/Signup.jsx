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
    <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto items-center mt-2 lg:mt-12 animate-fade-in">
      <div className="hidden lg:block space-y-6 pr-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-gradient grid place-items-center text-white text-2xl shadow-card">
          ✚
        </div>
        <h1 className="text-4xl font-extrabold font-display leading-tight">
          Start your <br />
          <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
            health journey
          </span>
        </h1>
        <p className="text-slate-600 leading-relaxed">
          Create your free account to unlock 6 disease risk models, AI-powered nutrition coaching, and secure storage for your lab reports.
        </p>
        <div className="grid grid-cols-3 gap-3 max-w-xs">
          <div className="text-center p-3 rounded-xl bg-white ring-1 ring-slate-200">
            <div className="text-2xl">❤️</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Heart</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white ring-1 ring-slate-200">
            <div className="text-2xl">🩸</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Diabetes</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white ring-1 ring-slate-200">
            <div className="text-2xl">🧠</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Stroke</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white ring-1 ring-slate-200">
            <div className="text-2xl">🩺</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Kidney</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white ring-1 ring-slate-200">
            <div className="text-2xl">🧬</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Liver</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white ring-1 ring-slate-200">
            <div className="text-2xl">💢</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">BP</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-extrabold font-display mb-1">Create your account</h2>
        <p className="text-sm text-slate-500 mb-6">It's free, takes 30 seconds, and your data is yours alone.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" placeholder="Jane Doe" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required placeholder="you@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required minLength={6} placeholder="At least 6 characters" value={form.password} onChange={(e) => set('password', e.target.value)} />
          </div>
          {err && <div className="rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{err}</div>}
          <button className="btn-primary w-full text-base py-3" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="mt-5 text-sm text-slate-500 text-center">
          Already have an account? <Link className="text-brand-600 hover:underline font-semibold" to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
