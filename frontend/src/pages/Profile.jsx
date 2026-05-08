import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../api/auth.jsx'
import { computeBmi, bmiCategory } from '../api/profile'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({
    full_name: '', age: '', sex: '', height_cm: '', weight_kg: '',
  })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!user) return
    setForm({
      full_name: user.full_name ?? '',
      age: user.age ?? '',
      sex: user.sex ?? '',
      height_cm: user.height_cm ?? '',
      weight_kg: user.weight_kg ?? '',
    })
  }, [user])

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function onSave(e) {
    e.preventDefault()
    setBusy(true); setErr(''); setMsg(null)
    try {
      const patch = {
        full_name: form.full_name || null,
        age: form.age === '' ? null : parseInt(form.age, 10),
        sex: form.sex || null,
        height_cm: form.height_cm === '' ? null : parseFloat(form.height_cm),
        weight_kg: form.weight_kg === '' ? null : parseFloat(form.weight_kg),
      }
      await updateProfile(patch)
      setMsg('Profile updated.')
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Update failed')
    } finally { setBusy(false) }
  }

  if (!user) return null

  const bmi = computeBmi(form.height_cm, form.weight_kg)
  const cat = bmi ? bmiCategory(bmi) : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 animate-fade-in">
      {/* Left: profile form */}
      <div className="lg:col-span-3 card">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display">Your Profile</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          These details auto-fill into every prediction so you don't have to retype them.
        </p>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="label">Age</label>
              <input className="input" type="number" min="0" max="120" placeholder="years"
                value={form.age} onChange={(e) => set('age', e.target.value)} />
            </div>
            <div>
              <label className="label">Sex</label>
              <select className="input" value={form.sex} onChange={(e) => set('sex', e.target.value)}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="label">Height (cm)</label>
              <input className="input" type="number" step="any" min="30" max="260" placeholder="e.g. 170"
                value={form.height_cm} onChange={(e) => set('height_cm', e.target.value)} />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input className="input" type="number" step="any" min="2" max="400" placeholder="e.g. 65"
                value={form.weight_kg} onChange={(e) => set('weight_kg', e.target.value)} />
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-3 text-xs text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-700">Privacy:</span> your demographic data is stored only in your account and never shared. It's used to pre-fill the prediction form so you skip retyping age/sex/BMI for every disease.
          </div>

          {msg && (
            <div className="rounded-xl bg-mint-50 ring-1 ring-mint-200 px-4 py-3 text-sm text-mint-800">
              ✓ {msg}
            </div>
          )}
          {err && (
            <div className="rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{err}</div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button className="btn-primary flex-1 text-base py-3" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            <Link to="/predict" className="btn-secondary text-base py-3 text-center">
              Run a prediction →
            </Link>
          </div>
        </form>
      </div>

      {/* Right: BMI + sidebar info */}
      <div className="lg:col-span-2 space-y-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-gradient grid place-items-center text-white text-xl shadow-soft">
              👤
            </div>
            <div className="min-w-0">
              <div className="font-bold truncate">{user.full_name || user.email}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Field label="Age" value={form.age || '—'} />
            <Field label="Sex" value={form.sex || '—'} />
            <Field label="BMI" value={bmi ? bmi.toFixed(1) : '—'} />
          </div>
        </div>

        {bmi && (
          <div className="card">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <span className={cat.dot}></span> BMI {bmi.toFixed(1)} — {cat.label}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">{cat.description}</p>
            <div className="mt-4 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden relative">
              <div
                className="h-full rounded-full bg-brand-gradient transition-all"
                style={{ width: `${Math.min(((bmi - 14) / 26) * 100, 100)}%` }}
              />
            </div>
            <div className="mt-1.5 grid grid-cols-4 text-[10px] text-slate-400 font-medium">
              <span>18.5</span>
              <span className="text-center">25</span>
              <span className="text-center">30</span>
              <span className="text-right">40+</span>
            </div>
          </div>
        )}

        <div className="card">
          <h3 className="font-bold text-sm mb-2">What gets auto-filled?</h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li>• <b>Age</b> → every disease form</li>
            <li>• <b>Sex</b> → heart, liver, stroke, hypertension forms</li>
            <li>• <b>BMI</b> (from height + weight) → diabetes, stroke, hypertension forms</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 ring-1 ring-slate-200 p-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
      <div className="font-bold text-slate-900 mt-0.5 text-sm">{value}</div>
    </div>
  )
}
