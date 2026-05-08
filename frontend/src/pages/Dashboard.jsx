import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../api/auth.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const [diseases, setDiseases] = useState([])
  const [history, setHistory] = useState([])

  useEffect(() => {
    api.get('/predict/diseases').then((r) => {
      const meta = r.data.metadata?.diseases || {}
      setDiseases(Object.entries(meta).map(([k, v]) => ({ key: k, ...v })))
    })
    api.get('/predict/history').then((r) => setHistory(r.data || []))
  }, [])

  const total = history.length
  const high = history.filter((h) => h.risk_level === 'high').length
  const moderate = history.filter((h) => h.risk_level === 'moderate').length

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Hello{user?.full_name ? `, ${user.full_name}` : ''} 👋</h1>
        <p className="text-slate-500 mt-1">Track your AI-driven health risk insights and chat with your nutrition coach.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Predictions made" value={total} color="text-slate-900" />
        <Stat label="High-risk results" value={high} color="text-red-600" />
        <Stat label="Moderate-risk results" value={moderate} color="text-amber-600" />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Available risk models</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {diseases.map((d) => (
            <Link key={d.key} to={`/predict?disease=${d.key}`} className="card hover:shadow-md transition-shadow">
              <div className="font-semibold">{d.label}</div>
              <p className="text-sm text-slate-500 mt-1">{d.description}</p>
              {d.metrics && (
                <div className="mt-3 text-xs text-slate-400">
                  AUC {Number(d.metrics.auc).toFixed(2)} · Acc {Number(d.metrics.accuracy).toFixed(2)}
                </div>
              )}
            </Link>
          ))}
          {diseases.length === 0 && (
            <div className="card text-sm text-slate-500">
              No models loaded yet. Run <code className="bg-slate-100 px-1 rounded">python -m ml_training.train</code> in the backend folder.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="card">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${color}`}>{value}</div>
    </div>
  )
}
