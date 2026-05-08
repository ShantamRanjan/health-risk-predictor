import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/client'
import RiskResult from '../components/RiskResult.jsx'

export default function Predict() {
  const [params, setParams] = useSearchParams()
  const initialDisease = params.get('disease') || ''

  const [meta, setMeta] = useState({})
  const [disease, setDisease] = useState(initialDisease)
  const [values, setValues] = useState({})
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    api.get('/predict/diseases').then((r) => {
      const m = r.data.metadata?.diseases || {}
      setMeta(m)
      if (!initialDisease && Object.keys(m).length) {
        setDisease(Object.keys(m)[0])
      }
    })
  }, [])

  const features = useMemo(
    () => (disease && meta[disease] ? meta[disease].features : []),
    [disease, meta],
  )

  // Reset values whenever disease changes
  useEffect(() => {
    const init = {}
    features.forEach((f) => {
      if (f.type === 'category') init[f.name] = f.options?.[0] || ''
      else init[f.name] = ''
    })
    setValues(init)
    setResult(null)
    setErr('')
  }, [disease, features.length])

  function setField(name, v) {
    setValues((prev) => ({ ...prev, [name]: v }))
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr(''); setResult(null)

    // Convert numeric strings to numbers
    const inputs = { ...values }
    features.forEach((f) => {
      if (f.type === 'number') inputs[f.name] = parseFloat(inputs[f.name])
    })

    try {
      const r = await api.post('/predict', { disease, inputs })
      setResult(r.data)
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Prediction failed')
    } finally { setBusy(false) }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 card">
        <h1 className="text-2xl font-bold mb-1">Run a Risk Prediction</h1>
        <p className="text-slate-500 text-sm mb-6">Choose a condition and enter your values. SHAP explanations show what drives the score.</p>

        <div className="mb-6">
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
            <p className="text-xs text-slate-500 mt-1">{meta[disease].description}</p>
          )}
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.name}>
              <label className="label">
                {f.label}
                {f.unit ? <span className="text-slate-400 font-normal"> ({f.unit})</span> : null}
              </label>
              {f.type === 'category' ? (
                <select className="input" value={values[f.name] ?? ''} onChange={(e) => setField(f.name, e.target.value)}>
                  {f.options.map((opt) => (
                    <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
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
          ))}

          {err && <div className="sm:col-span-2 text-sm text-red-600">{err}</div>}
          <div className="sm:col-span-2">
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? 'Analyzing…' : 'Predict risk'}
            </button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-2">
        {result ? <RiskResult result={result} /> : (
          <div className="card text-sm text-slate-500">
            Submit the form to see your AI-generated risk score, explainable feature breakdown, and lifestyle suggestions.
          </div>
        )}
      </div>
    </div>
  )
}
