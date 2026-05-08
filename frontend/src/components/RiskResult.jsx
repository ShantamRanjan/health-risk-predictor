import { useEffect, useState } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api from '../api/client'

const RISK = {
  low: {
    label: 'Low risk',
    bg: 'bg-mint-50',
    ring: 'ring-mint-200',
    text: 'text-mint-700',
    bar: 'bg-mint-500',
    glow: 'shadow-[0_0_30px_-6px_rgb(16_185_129_/_0.4)]',
    icon: '✓',
  },
  moderate: {
    label: 'Moderate risk',
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
    text: 'text-amber-700',
    bar: 'bg-amber-500',
    glow: 'shadow-[0_0_30px_-6px_rgb(245_158_11_/_0.4)]',
    icon: '!',
  },
  high: {
    label: 'High risk',
    bg: 'bg-red-50',
    ring: 'ring-red-200',
    text: 'text-red-700',
    bar: 'bg-red-500',
    glow: 'shadow-[0_0_30px_-6px_rgb(239_68_68_/_0.4)]',
    icon: '⚠',
  },
}

export default function RiskResult({ result }) {
  const r = RISK[result.risk_level] || RISK.moderate
  const pct = result.risk_score * 100
  const top = (result.explanation || []).slice(0, 8)
  const data = top.map((c) => ({
    feature: c.feature.replace(/_/g, ' '),
    shap: Number(c.shap_value.toFixed(3)),
  }))

  // Adjust chart Y-axis label width for narrow screens
  const [yWidth, setYWidth] = useState(110)
  useEffect(() => {
    const update = () => setYWidth(window.innerWidth < 380 ? 70 : window.innerWidth < 640 ? 85 : 110)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  async function downloadPdf() {
    if (!result.id) return
    const r = await api.get(`/pdf/prediction/${result.id}`, { responseType: 'blob' })
    const url = URL.createObjectURL(r.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `health_report_${result.id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Risk score card */}
      <div className={`card relative overflow-hidden ${r.glow}`}>
        <div className={`absolute inset-0 ${r.bg} opacity-40 pointer-events-none`} />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Risk score</div>
              <div className="mt-1 text-5xl font-extrabold font-display text-slate-900 animate-count-up">
                {pct.toFixed(1)}<span className="text-2xl text-slate-500">%</span>
              </div>
            </div>
            <span className={`chip ${r.bg} ${r.text} ${r.ring} text-sm px-3 py-1.5`}>
              <span>{r.icon}</span>
              {r.label}
            </span>
          </div>
          {/* Risk meter */}
          <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${r.bar} transition-all duration-700 ease-out`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-400 font-medium">
            <span>0%</span><span>30%</span><span>60%</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* SHAP */}
      <div className="card">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold flex items-center gap-2">
            <span className="text-brand-600">⚡</span> Why this score?
          </h3>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">SHAP</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1"></span> raises risk &nbsp;
          <span className="inline-block w-2 h-2 rounded-full bg-mint-500 mr-1"></span> lowers risk
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 5, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis dataKey="feature" type="category" width={yWidth} tick={{ fontSize: 11, fill: '#475569' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(v) => [v, 'SHAP impact']}
              />
              <Bar dataKey="shap" radius={[0, 6, 6, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.shap >= 0 ? '#ef4444' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Suggestions */}
      <div className="card">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <span className="text-brand-600">✦</span> Personalised recommendations
        </h3>
        <ul className="space-y-2.5 text-sm text-slate-700">
          {(result.suggestions || []).map((s, i) => (
            <li key={i} className="flex gap-2.5 leading-relaxed animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-brand-50 text-brand-600 grid place-items-center text-xs font-bold">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={downloadPdf} className="btn-primary w-full">
        ⎙ Download doctor-style PDF report
      </button>
    </div>
  )
}
