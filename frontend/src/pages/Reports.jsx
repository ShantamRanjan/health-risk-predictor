import { useEffect, useRef, useState } from 'react'
import api from '../api/client'

export default function Reports() {
  const [reports, setReports] = useState([])
  const [busy, setBusy] = useState(false)
  const [latest, setLatest] = useState(null)
  const [err, setErr] = useState('')
  const fileRef = useRef(null)

  async function refresh() {
    const r = await api.get('/reports')
    setReports(r.data || [])
  }
  useEffect(() => { refresh() }, [])

  async function onUpload(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setBusy(true); setErr(''); setLatest(null)
    const form = new FormData()
    form.append('file', f)
    try {
      const r = await api.post('/reports/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setLatest(r.data)
      await refresh()
    } catch (err) {
      setErr(err?.response?.data?.detail || 'Upload failed')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function onDelete(id) {
    if (!confirm('Delete this report?')) return
    await api.delete(`/reports/${id}`)
    refresh()
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Health Reports</h1>
        <p className="text-slate-500 text-sm mt-1">Upload your lab PDFs — we extract values like glucose, cholesterol, creatinine and more.</p>
      </header>

      <div className="card">
        <label className="label">Upload a PDF (max 10 MB)</label>
        <input ref={fileRef} type="file" accept="application/pdf" onChange={onUpload} disabled={busy} className="block text-sm" />
        {busy && <p className="text-sm text-slate-500 mt-2">Parsing…</p>}
        {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
        {latest && (
          <div className="mt-4 rounded-lg bg-emerald-50 ring-1 ring-emerald-200 p-4 text-sm">
            <div className="font-semibold text-emerald-800">Extracted values from "{latest.filename}"</div>
            {Object.keys(latest.extracted_values || {}).length === 0 ? (
              <p className="text-emerald-700 mt-1">No standard lab values detected — you can still see the raw text below.</p>
            ) : (
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-emerald-900">
                {Object.entries(latest.extracted_values).map(([k, v]) => (
                  <li key={k}><span className="font-medium">{k}:</span> {String(v)}</li>
                ))}
              </ul>
            )}
            {latest.text_preview && (
              <details className="mt-3">
                <summary className="cursor-pointer text-emerald-700">Show raw text preview</summary>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs bg-white p-3 rounded">{latest.text_preview}</pre>
              </details>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Your uploaded reports</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-slate-500">No reports uploaded yet.</p>
        ) : (
          <div className="divide-y">
            {reports.map((r) => (
              <div key={r.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{r.filename}</div>
                  <div className="text-xs text-slate-500">{new Date(r.uploaded_at).toLocaleString()}</div>
                  {r.extracted_values && Object.keys(r.extracted_values).length > 0 && (
                    <div className="mt-1 text-xs text-slate-600">
                      {Object.entries(r.extracted_values).slice(0, 6).map(([k, v]) => (
                        <span key={k} className="inline-block mr-3">{k}: <b>{v}</b></span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => onDelete(r.id)} className="text-xs text-red-600 hover:underline">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
