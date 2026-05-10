import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../api/auth.jsx'
import api from '../api/client'

export default function Signup() {
  const { signup } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({
    email: '', password: '', full_name: '',
    age: '', sex: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [slow, setSlow] = useState(false)

  // Pre-warm Render free-tier dyno while the user fills the form.
  useEffect(() => { api.get('/health').catch(() => {}) }, [])

  useEffect(() => {
    if (!busy) { setSlow(false); return }
    const t = setTimeout(() => setSlow(true), 4000)
    return () => clearTimeout(t)
  }, [busy])

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const payload = {
        email: form.email,
        password: form.password,
        full_name: form.full_name || null,
      }
      // Only include profile fields if filled — backend treats them as optional
      if (form.age) payload.age = parseInt(form.age, 10)
      if (form.sex) payload.sex = form.sex
      await signup(payload)
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
          {[['❤️','Heart'],['🩸','Diabetes'],['🧠','Stroke'],['🩺','Kidney'],['🧬','Liver'],['💢','BP']].map(([icon,name]) => (
            <div key={name} className="text-center p-3 rounded-xl bg-white ring-1 ring-slate-200">
              <div className="text-2xl">{icon}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">{name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-extrabold font-display mb-1">Create your account</h2>
        <p className="text-sm text-slate-500 mb-6">Free, 30 seconds. Filling age & sex now means we'll auto-fill them in every prediction.</p>
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
            <div className="relative">
              <input
                className="input pr-20"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-3 my-auto h-7 px-2 text-xs font-semibold text-brand-600 hover:text-brand-700"
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Optional demographic fields */}
          <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-3 sm:p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Optional · saves time later
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Age</label>
                <input
                  className="input" type="number" min="0" max="120"
                  placeholder="e.g. 32"
                  value={form.age} onChange={(e) => set('age', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Sex</label>
                <select className="input" value={form.sex} onChange={(e) => set('sex', e.target.value)}>
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              You can always add height, weight, and edit any of this from your <span className="text-brand-600 font-medium">Profile</span> page later.
            </p>
          </div>

          {err && <div className="rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{err}</div>}
          <button className="btn-primary w-full text-base py-3" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
          {slow && (
            <p className="text-xs text-slate-500 text-center -mt-1">
              Server waking up — this can take up to 30 seconds on first visit. Hang tight…
            </p>
          )}
        </form>
        <p className="mt-5 text-sm text-slate-500 text-center">
          Already have an account? <Link className="text-brand-600 hover:underline font-semibold" to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
