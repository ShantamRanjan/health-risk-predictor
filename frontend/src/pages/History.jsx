import { useEffect, useState } from 'react'
import api from '../api/client'

const colors = {
  low: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
}

export default function History() {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({})

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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Prediction history</h1>
      <div className="card">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No predictions yet — head to the Predict tab to run your first one.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Date</th>
                <th>Condition</th>
                <th>Risk</th>
                <th>Level</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                  <td>{meta[r.disease]?.label || r.disease}</td>
                  <td className="font-semibold">{(r.risk_score * 100).toFixed(1)}%</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[r.risk_level] || ''}`}>
                      {r.risk_level}
                    </span>
                  </td>
                  <td className="text-right">
                    <button onClick={() => downloadPdf(r.id)} className="text-brand-600 hover:underline text-xs">PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
