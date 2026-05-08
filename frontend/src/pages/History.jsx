import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

const DISEASE_ICONS = {
  heart: '❤️', diabetes: '🩸', kidney: '🩺',
  liver: '🧬', stroke: '🧠', hypertension: '💢',
}

const RISK_COLORS = {
  low:      'bg-mint-50 text-mint-700 ring-mint-200',
  moderate: 'bg-amber-50 text-amber-700 ring-amber-200',
  high:     'bg-red-50 text-red-700 ring-red-200',
}

export default function History() {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({})
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/predict/history').then((r) => setRows(r.data || []))
    api.get('/predict/diseases').then((r) => setMeta(r.data.metadata?.diseases || {}))
  }, [])

  async function downloadPdf(id) {
    const r = await api.get(`/pdf/prediction/${id}`, { responseType: 'blob' })
    const url = URL.createObjectURL(r.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `health_report_${id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.risk_level === filter)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold font-display">Prediction history</h1>
          <p className="text-slate-500 mt-1">Every prediction you've made — securely saved to your account.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-white ring-1 ring-slate-200 p-1">
          {['all', 'low', 'moderate', 'high'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize ${
                filter === f ? 'bg-brand-gradient text-white shadow-soft' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-3 opacity-40">⌚</div>
          <p className="text-slate-500 mb-4">
            {rows.length === 0 ? 'No predictions yet.' : `No ${filter}-risk predictions.`}
          </p>
          <Link to="/predict" className="btn-primary inline-flex">
            ◎ Run your first prediction
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((r, i) => (
            <div
              key={r.id}
              className="card card-hover animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{DISEASE_ICONS[r.disease] || '⚕'}</span>
                    <h3 className="font-bold truncate">{meta[r.disease]?.label || r.disease}</h3>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <span className={`chip text-xs capitalize ${RISK_COLORS[r.risk_level] || ''}`}>
                  {r.risk_level}
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Risk score</div>
                  <div className="text-2xl font-extrabold font-display">{(r.risk_score * 100).toFixed(1)}%</div>
                </div>
                <button onClick={() => downloadPdf(r.id)} className="btn-secondary text-xs">
                  ⎙ PDF
                </button>
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    r.risk_level === 'high' ? 'bg-red-500' :
                    r.risk_level === 'moderate' ? 'bg-amber-500' : 'bg-mint-500'
                  }`}
                  style={{ width: `${Math.min(r.risk_score * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
