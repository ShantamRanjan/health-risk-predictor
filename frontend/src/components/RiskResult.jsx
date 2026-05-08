import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api from '../api/client'

const colors = {
  low: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  moderate: 'bg-amber-100 text-amber-700 ring-amber-200',
  high: 'bg-red-100 text-red-700 ring-red-200',
}

export default function RiskResult({ result }) {
  const top = (result.explanation || []).slice(0, 8)
  const data = top.map((c) => ({
    feature: c.feature,
    shap: Number(c.shap_value.toFixed(3)),
  }))

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
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Risk score</div>
            <div className="text-4xl font-bold">{(result.risk_score * 100).toFixed(1)}%</div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${colors[result.risk_level] || ''}`}>
            {result.risk_level.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Why this score? (SHAP)</h3>
        <p className="text-xs text-slate-500 mb-3">Bars to the right raise risk; bars to the left lower it.</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" />
              <YAxis dataKey="feature" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="shap">
                {data.map((d, i) => (
                  <Cell key={i} fill={d.shap >= 0 ? '#ef4444' : '#22c55e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Personalised suggestions</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          {(result.suggestions || []).map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-brand-600">•</span><span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={downloadPdf} className="btn-primary w-full">
        Download doctor-style PDF report
      </button>
    </div>
  )
}
