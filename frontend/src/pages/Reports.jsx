import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

export default function Reports() {
  const [reports, setReports] = useState([])
  const [busy, setBusy] = useState(false)
  const [latest, setLatest] = useState(null)
  const [err, setErr] = useState('')
  const [drag, setDrag] = useState(false)
  const fileRef = useRef(null)

  async function refresh() {
    const r = await api.get('/reports')
    setReports(r.data || [])
  }
  useEffect(() => { refresh() }, [])

  async function uploadFile(f) {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setErr('Only PDF files are accepted.')
      return
    }
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

  function onDrop(e) {
    e.preventDefault(); setDrag(false)
    if (e.dataTransfer.files?.[0]) uploadFile(e.dataTransfer.files[0])
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-extrabold font-display">Health Reports</h1>
        <p className="text-slate-500 mt-1">
          Upload your lab PDFs — we extract values like glucose, cholesterol, creatinine, and use them to auto-fill predictions.
        </p>
      </header>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`card transition-all ${drag ? 'ring-2 ring-brand-400 bg-brand-50/50' : ''}`}
      >
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient grid place-items-center text-3xl text-white shadow-card mb-3">
            ⎙
          </div>
          <h3 className="font-bold text-slate-700">Drop a lab report PDF here</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md">
            We'll automatically extract glucose, lipid panel, kidney/liver markers, blood pressure, and more.
          </p>
          <label className="mt-4 btn-primary cursor-pointer">
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => uploadFile(e.target.files?.[0])}
              disabled={busy}
            />
            {busy ? '⏳ Parsing…' : '📁 Choose a PDF (max 10 MB)'}
          </label>
        </div>

        {err && (
          <div className="mt-4 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {latest && (
          <div className="mt-4 rounded-xl bg-mint-50 ring-1 ring-mint-200 p-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-xl">✓</span>
              <div className="font-semibold text-mint-900">Successfully parsed "{latest.filename}"</div>
            </div>
            {Object.keys(latest.extracted_values || {}).length === 0 ? (
              <p className="text-sm text-mint-800 mt-2">No standard lab values detected — see raw text below.</p>
            ) : (
              <>
                <div className="text-xs uppercase tracking-wider text-mint-700 font-bold mt-3 mb-2">
                  {Object.keys(latest.extracted_values).length} values extracted
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(latest.extracted_values).map(([k, v]) => (
                    <div key={k} className="bg-white rounded-lg p-2 ring-1 ring-mint-200">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{k.replace(/_/g, ' ')}</div>
                      <div className="font-semibold text-slate-900">{String(v)}</div>
                    </div>
                  ))}
                </div>
                <Link to="/predict" className="mt-3 inline-block text-xs font-semibold text-mint-700 hover:underline">
                  → Run a prediction with these values
                </Link>
              </>
            )}
            {latest.text_preview && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-mint-700 hover:underline">Show raw text preview</summary>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs bg-white p-3 rounded-lg ring-1 ring-mint-100">{latest.text_preview}</pre>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Saved reports */}
      <div className="card">
        <h2 className="font-bold mb-4 flex items-center justify-between">
          <span>Your uploaded reports</span>
          <span className="chip ring-slate-200 bg-slate-50 text-slate-600">{reports.length} saved</span>
        </h2>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">
            <div className="text-4xl mb-2 opacity-40">📂</div>
            No reports uploaded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 p-3 hover:border-brand-200 hover:bg-brand-50/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl">📄</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{r.filename}</div>
                      <div className="text-xs text-slate-500">{new Date(r.uploaded_at).toLocaleString()}</div>
                      {r.extracted_values && Object.keys(r.extracted_values).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(r.extracted_values).slice(0, 8).map(([k, v]) => (
                            <span key={k} className="chip bg-slate-50 text-slate-600 ring-slate-200 text-[10px]">
                              {k.replace(/_/g, ' ')}: <b className="text-slate-900 ml-0.5">{v}</b>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => onDelete(r.id)} className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
