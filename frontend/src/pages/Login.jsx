import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../api/auth.jsx'
import api from '../api/client'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [slow, setSlow] = useState(false)

  // Warm the Render free-tier dyno the moment the page mounts, so by the time
  // the user submits, the cold start is already in progress (or done).
  useEffect(() => { api.get('/health').catch(() => {}) }, [])

  useEffect(() => {
    if (!busy) { setSlow(false); return }
    const t = setTimeout(() => setSlow(true), 4000)
    return () => clearTimeout(t)
  }, [busy])

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      await login(email, password)
      nav('/')
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Login failed')
    } finally { setBusy(false) }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto items-center mt-2 lg:mt-12 animate-fade-in">
      {/* Left: branding */}
      <div className="hidden lg:block space-y-6 pr-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-gradient grid place-items-center text-white text-2xl shadow-card">
          ✚
        </div>
        <h1 className="text-4xl font-extrabold font-display leading-tight">
          Your AI-powered <br />
          <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
            health companion
          </span>
        </h1>
        <p className="text-slate-600 leading-relaxed">
          Predict your risk for 6 chronic diseases, upload lab reports for instant analysis, and chat with a science-backed dietitian — all in one place.
        </p>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-center gap-2"><span className="text-mint-500">✓</span> 6 ML models with SHAP explainability</li>
          <li className="flex items-center gap-2"><span className="text-mint-500">✓</span> Auto-extract lab values from PDFs</li>
          <li className="flex items-center gap-2"><span className="text-mint-500">✓</span> Doctor-style PDF report download</li>
          <li className="flex items-center gap-2"><span className="text-mint-500">✓</span> Groq-powered nutrition assistant</li>
        </ul>
      </div>

      {/* Right: form */}
      <div className="card">
        <h2 className="text-2xl font-extrabold font-display mb-1">Welcome back</h2>
        <p className="text-sm text-slate-500 mb-6">Sign in to access your health dashboard.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                className="input pr-20"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          {err && (
            <div className="rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{err}</div>
          )}
          <button className="btn-primary w-full text-base py-3" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          {slow && (
            <p className="text-xs text-slate-500 text-center -mt-1">
              Server waking up — this can take up to 30 seconds on first visit. Hang tight…
            </p>
          )}
        </form>
        <p className="mt-5 text-sm text-slate-500 text-center">
          New here? <Link className="text-brand-600 hover:underline font-semibold" to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
