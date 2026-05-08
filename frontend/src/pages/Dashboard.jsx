import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../api/auth.jsx'

const DISEASE_ICONS = {
  heart: '❤️',
  diabetes: '🩸',
  kidney: '🩺',
  liver: '🧬',
  stroke: '🧠',
  hypertension: '💢',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [diseases, setDiseases] = useState([])
  const [history, setHistory] = useState([])
  const [reports, setReports] = useState([])

  useEffect(() => {
    api.get('/predict/diseases').then((r) => {
      const meta = r.data.metadata?.diseases || {}
      setDiseases(Object.entries(meta).map(([k, v]) => ({ key: k, ...v })))
    })
    api.get('/predict/history').then((r) => setHistory(r.data || []))
    api.get('/reports').then((r) => setReports(r.data || []))
  }, [])

  const total = history.length
  const high = history.filter((h) => h.risk_level === 'high').length
  const moderate = history.filter((h) => h.risk_level === 'moderate').length
  const low = history.filter((h) => h.risk_level === 'low').length

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-gradient text-white p-8 sm:p-10 shadow-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_50%)] pointer-events-none" />
        <div className="relative">
          <div className="text-xs uppercase tracking-widest opacity-80 mb-2">Welcome back</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display">
            Hello{user?.full_name ? `, ${user.full_name}` : ''} 👋
          </h1>
          <p className="mt-2 max-w-xl text-white/90">
            Track your AI-driven health risk insights, upload lab reports for instant analysis, and chat with your nutrition coach.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/predict" className="bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl px-4 py-2 text-sm font-semibold transition-colors">
              ◎ New prediction
            </Link>
            <Link to="/reports" className="bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl px-4 py-2 text-sm font-semibold transition-colors">
              ⎙ Upload report
            </Link>
            <Link to="/chat" className="bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl px-4 py-2 text-sm font-semibold transition-colors">
              ✦ Ask MedAdvisor
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total predictions" value={total} accent="bg-slate-100 text-slate-700" />
        <Stat label="Low risk" value={low} accent="bg-mint-50 text-mint-600" />
        <Stat label="Moderate risk" value={moderate} accent="bg-amber-50 text-amber-600" />
        <Stat label="High risk" value={high} accent="bg-red-50 text-red-600" />
      </section>

      {/* Reports note */}
      {reports.length > 0 && (
        <section className="rounded-2xl bg-mint-50/60 ring-1 ring-mint-200 p-4 text-sm text-mint-900 flex items-center justify-between gap-4">
          <div>
            <span className="font-semibold">📄 {reports.length} health report{reports.length > 1 ? 's' : ''} uploaded.</span>
            <span className="ml-1 text-mint-800/80">
              The Predict form will auto-fill matching values from your latest reports.
            </span>
          </div>
          <Link to="/predict" className="btn-secondary text-xs">Run prediction →</Link>
        </section>
      )}

      {/* Diseases */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-bold">Risk models available</h2>
          <span className="text-xs text-slate-400">Powered by Gradient Boosting + SHAP</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {diseases.map((d, i) => (
            <Link
              key={d.key}
              to={`/predict?disease=${d.key}`}
              className="card card-hover relative overflow-hidden group animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="absolute -top-8 -right-8 text-7xl opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
                {DISEASE_ICONS[d.key] || '⚕'}
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{DISEASE_ICONS[d.key] || '⚕'}</span>
                  <h3 className="font-bold text-slate-900">{d.label}</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{d.description}</p>
                {d.metrics && (
                  <div className="mt-4 flex items-center gap-3 text-xs">
                    <span className="chip ring-brand-200 bg-brand-50 text-brand-700">
                      AUC {Number(d.metrics.auc).toFixed(2)}
                    </span>
                    <span className="chip ring-slate-200 bg-slate-50 text-slate-600">
                      Acc {(Number(d.metrics.accuracy) * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
          {diseases.length === 0 && (
            <div className="card text-sm text-slate-500 col-span-full">
              No models loaded yet. Run <code className="bg-slate-100 px-1.5 py-0.5 rounded text-brand-700">python -m ml_training.train</code> in the backend folder.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="card animate-count-up">
      <div className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${accent}`}>
        {label}
      </div>
      <div className="mt-2 text-3xl font-extrabold font-display text-slate-900">{value}</div>
    </div>
  )
}
