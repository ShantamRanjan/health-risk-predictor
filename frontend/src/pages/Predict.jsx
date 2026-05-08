import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import RiskResult from '../components/RiskResult.jsx'
import { pdfPatchForDisease } from '../api/labMapping'

const DISEASE_ICONS = {
  heart: '❤️', diabetes: '🩸', kidney: '🩺',
  liver: '🧬', stroke: '🧠', hypertension: '💢',
}

export default function Predict() {
  const [params, setParams] = useSearchParams()
  const initialDisease = params.get('disease') || ''

  const [meta, setMeta] = useState({})
  const [disease, setDisease] = useState(initialDisease)
  const [values, setValues] = useState({})
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')

  // PDF-derived state
  const [labValues, setLabValues] = useState({})
  const [labSources, setLabSources] = useState({})
  const [autoFilledFields, setAutoFilledFields] = useState(new Set())
  const [reportCount, setReportCount] = useState(0)

  // Load disease metadata + aggregated lab values once on mount
  useEffect(() => {
    api.get('/predict/diseases').then((r) => {
      const m = r.data.metadata?.diseases || {}
      setMeta(m)
      if (!initialDisease && Object.keys(m).length) setDisease(Object.keys(m)[0])
    })
    api.get('/reports/aggregated').then((r) => {
      setLabValues(r.data?.values || {})
      setLabSources(r.data?.sources || {})
    }).catch(() => {})
    api.get('/reports').then((r) => setReportCount((r.data || []).length)).catch(() => {})
  }, [])

  const features = useMemo(
    () => (disease && meta[disease] ? meta[disease].features : []),
    [disease, meta],
  )

  // Reset values whenever disease changes — apply PDF auto-fill if available
  useEffect(() => {
    const init = {}
    features.forEach((f) => {
      if (f.type === 'category') init[f.name] = f.options?.[0] || ''
      else init[f.name] = ''
    })

    // Apply PDF auto-fill
    const patch = pdfPatchForDisease(disease, labValues)
    const filled = new Set()
    Object.keys(patch).forEach((k) => {
      init[k] = patch[k]
      filled.add(k)
    })
    setValues(init)
    setAutoFilledFields(filled)
    setResult(null)
    setErr('')
  }, [disease, features.length, labValues])

  function setField(name, v) {
    setValues((prev) => ({ ...prev, [name]: v }))
    if (autoFilledFields.has(name)) {
      setAutoFilledFields((prev) => {
        const next = new Set(prev)
        next.delete(name)
        return next
      })
    }
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr(''); setResult(null)
    const inputs = { ...values }
    features.forEach((f) => {
      if (f.type === 'number') inputs[f.name] = parseFloat(inputs[f.name])
    })
    try {
      const r = await api.post('/predict', { disease, inputs })
      setResult(r.data)
      // smooth scroll to result on mobile
      setTimeout(() => document.getElementById('risk-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Prediction failed')
    } finally { setBusy(false) }
  }

  const autoFilledCount = autoFilledFields.size

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
      <div className="lg:col-span-3 space-y-4">
        <div className="card">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-bold font-display">Run a Risk Prediction</h1>
              <p className="text-sm text-slate-500 mt-1">
                Choose a condition and review your values. We auto-fill anything we found in your uploaded reports.
              </p>
            </div>
            <span className="text-3xl hidden sm:block">{DISEASE_ICONS[disease] || '⚕️'}</span>
          </div>

          {/* PDF banner */}
          {reportCount > 0 && autoFilledCount > 0 && (
            <div className="mt-4 rounded-xl bg-mint-50 ring-1 ring-mint-200 px-4 py-3 text-sm flex items-center gap-3 animate-fade-in">
              <span className="text-xl">📄</span>
              <div className="flex-1 text-mint-900">
                <span className="font-semibold">{autoFilledCount} field{autoFilledCount > 1 ? 's' : ''}</span> pre-filled from your uploaded reports.
                <span className="ml-1 text-mint-700">Edit any of them before submitting.</span>
              </div>
            </div>
          )}
          {reportCount === 0 && (
            <div className="mt-4 rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3 text-sm flex items-center gap-3">
              <span className="text-xl">💡</span>
              <div className="flex-1 text-amber-900">
                <span className="font-semibold">Tip:</span> upload a lab report and the form will auto-fill values like glucose, cholesterol, creatinine.
                <Link to="/reports" className="ml-1 underline font-medium hover:text-amber-700">Upload now →</Link>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="label">Condition</label>
            <select
              className="input"
              value={disease}
              onChange={(e) => { setDisease(e.target.value); setParams({ disease: e.target.value }) }}
            >
              {Object.entries(meta).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            {meta[disease]?.description && (
              <p className="text-xs text-slate-500 mt-2">{meta[disease].description}</p>
            )}
          </div>

          <form onSubmit={submit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => {
              const isAuto = autoFilledFields.has(f.name)
              const source = isAuto ? labSources[Object.entries(meta[disease]?.features || []).reduce(() => null, null) || ''] : null
              return (
                <div key={f.name}>
                  <label className="label flex items-center justify-between">
                    <span>
                      {f.label}
                      {f.unit ? <span className="ml-1 text-slate-400 normal-case font-normal">({f.unit})</span> : null}
                    </span>
                    {isAuto && (
                      <span className="chip bg-mint-50 text-mint-700 ring-mint-200 normal-case tracking-normal">
                        📄 from PDF
                      </span>
                    )}
                  </label>
                  {f.type === 'category' ? (
                    <select className="input" value={values[f.name] ?? ''} onChange={(e) => setField(f.name, e.target.value)}>
                      {f.options.map((opt) => (
                        <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={`input ${isAuto ? 'input-prefilled' : ''}`}
                      type="number"
                      step="any"
                      required
                      min={f.min ?? undefined}
                      max={f.max ?? undefined}
                      value={values[f.name] ?? ''}
                      onChange={(e) => setField(f.name, e.target.value)}
                    />
                  )}
                </div>
              )
            })}

            {err && (
              <div className="sm:col-span-2 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            )}
            <div className="sm:col-span-2">
              <button className="btn-primary w-full text-base py-3" disabled={busy}>
                {busy ? (
                  <>
                    <span className="animate-pulse-soft">●</span> Analyzing your data…
                  </>
                ) : (
                  <>◎ Predict risk</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2" id="risk-result">
        {result ? (
          <RiskResult result={result} />
        ) : (
          <div className="card h-full flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
            <div className="w-20 h-20 rounded-2xl bg-brand-gradient grid place-items-center text-4xl text-white shadow-card mb-4 animate-pulse-soft">
              ◎
            </div>
            <h3 className="font-bold text-slate-700">Awaiting your data</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-xs">
              Submit the form to see your AI-generated risk score, an explainable SHAP breakdown, and personalised lifestyle recommendations.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
