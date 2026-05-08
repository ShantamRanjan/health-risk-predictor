import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import RiskResult from '../components/RiskResult.jsx'
import { LAB_LABELS, pdfPatchForDisease, recommendDisease } from '../api/labMapping'
import { profilePatchForDisease } from '../api/profile'
import { useAuth } from '../api/auth.jsx'

const DISEASE_ICONS = {
  heart: '❤️', diabetes: '🩸', kidney: '🩺',
  liver: '🧬', stroke: '🧠', hypertension: '💢',
}

export default function Predict() {
  const [params, setParams] = useSearchParams()
  const initialDisease = params.get('disease') || ''
  const { user } = useAuth()

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
  const [profileFilledFields, setProfileFilledFields] = useState(new Set())
  const [reportCount, setReportCount] = useState(0)
  const [autoPicked, setAutoPicked] = useState(null)  // disease key auto-selected from PDF
  const [refreshing, setRefreshing] = useState(false)

  async function loadFromBackend() {
    setRefreshing(true)
    try {
      const [diseasesRes, aggRes, repRes] = await Promise.all([
        api.get('/predict/diseases'),
        api.get('/reports/aggregated').catch(() => ({ data: { values: {}, sources: {} } })),
        api.get('/reports').catch(() => ({ data: [] })),
      ])
      const m = diseasesRes.data.metadata?.diseases || {}
      setMeta(m)
      const labs = aggRes.data?.values || {}
      setLabValues(labs)
      setLabSources(aggRes.data?.sources || {})
      setReportCount((repRes.data || []).length)

      // Auto-pick disease ONLY if user hasn't chosen one via URL
      if (!initialDisease && Object.keys(m).length) {
        const rec = recommendDisease(labs)
        if (rec) {
          setDisease(rec.disease)
          setAutoPicked(rec)
        } else {
          setDisease(Object.keys(m)[0])
        }
      } else if (initialDisease) {
        setDisease(initialDisease)
      }
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => { loadFromBackend() }, [])  // eslint-disable-line

  const features = useMemo(
    () => (disease && meta[disease] ? meta[disease].features : []),
    [disease, meta],
  )

  // Apply patches whenever disease, labs, or user profile change
  useEffect(() => {
    const init = {}
    features.forEach((f) => {
      if (f.type === 'category') init[f.name] = f.options?.[0] || ''
      else init[f.name] = ''
    })

    // 1. Profile patch (age, sex, BMI)
    const profilePatch = profilePatchForDisease(user, disease)
    const profileFilled = new Set()
    Object.keys(profilePatch).forEach((k) => {
      if (k in init) {
        init[k] = profilePatch[k]
        profileFilled.add(k)
      }
    })

    // 2. PDF patch — overrides profile if both have a value
    const pdfPatch = pdfPatchForDisease(disease, labValues)
    const pdfFilled = new Set()
    Object.keys(pdfPatch).forEach((k) => {
      if (k in init) {
        init[k] = pdfPatch[k]
        pdfFilled.add(k)
        profileFilled.delete(k)  // PDF wins, drop the profile badge
      }
    })

    setValues(init)
    setAutoFilledFields(pdfFilled)
    setProfileFilledFields(profileFilled)
    setResult(null); setErr('')
  }, [disease, features.length, labValues, user])

  function setField(name, v) {
    setValues((prev) => ({ ...prev, [name]: v }))
    if (autoFilledFields.has(name)) {
      setAutoFilledFields((prev) => {
        const next = new Set(prev); next.delete(name); return next
      })
    }
    if (profileFilledFields.has(name)) {
      setProfileFilledFields((prev) => {
        const next = new Set(prev); next.delete(name); return next
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
      setTimeout(() => document.getElementById('risk-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Prediction failed')
    } finally { setBusy(false) }
  }

  const labCount = Object.keys(labValues).length
  const autoFilledCount = autoFilledFields.size

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 animate-fade-in">
      <div className="lg:col-span-3 space-y-4 min-w-0">
        {/* PDF SUMMARY PANEL */}
        {labCount > 0 && (
          <div className="card bg-gradient-to-br from-mint-50/80 to-brand-50/40 ring-mint-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📄</span>
                  <h3 className="font-bold text-slate-900">From your reports</h3>
                  <span className="chip bg-white text-mint-700 ring-mint-200">{labCount} values</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  These values were extracted from your uploaded PDFs and used to pre-fill the form below.
                </p>
              </div>
              <button onClick={loadFromBackend} disabled={refreshing} className="btn-ghost text-xs disabled:opacity-50">
                {refreshing ? '⏳ Refreshing…' : '🔄 Refresh'}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(labValues).map(([k, v]) => (
                <div key={k} className="bg-white/80 backdrop-blur rounded-lg p-2 ring-1 ring-mint-200">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold truncate">
                    {LAB_LABELS[k] || k.replace(/_/g, ' ')}
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

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

          {/* AUTO-PICKED BANNER */}
          {autoPicked && autoPicked.disease === disease && (
            <div className="mt-4 rounded-xl bg-brand-50 ring-1 ring-brand-200 px-4 py-3 text-sm flex items-center gap-3">
              <span className="text-xl">✨</span>
              <div className="flex-1 text-brand-900">
                <span className="font-semibold">Auto-selected {meta[autoPicked.disease]?.label}</span> based on
                your reports ({autoPicked.matchCount} matching field{autoPicked.matchCount > 1 ? 's' : ''}).
                <span className="ml-1 text-brand-700">Use the dropdown below to switch.</span>
              </div>
            </div>
          )}

          {/* AUTO-FILL STATUS BANNER */}
          {reportCount > 0 && autoFilledCount > 0 && !autoPicked && (
            <div className="mt-4 rounded-xl bg-mint-50 ring-1 ring-mint-200 px-4 py-3 text-sm flex items-center gap-3">
              <span className="text-xl">✓</span>
              <div className="flex-1 text-mint-900">
                <span className="font-semibold">{autoFilledCount} field{autoFilledCount > 1 ? 's' : ''}</span> pre-filled from your uploaded reports.
                <span className="ml-1 text-mint-700">Edit any of them before submitting.</span>
              </div>
            </div>
          )}
          {reportCount > 0 && autoFilledCount === 0 && (
            <div className="mt-4 rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3 text-sm">
              <span className="font-semibold">⚠️ No fields matched this disease.</span> Try a different condition above
              {reportCount > 0 && labCount === 0 && (
                <> — or click <Link to="/reports" className="underline">Reports</Link> and hit <b>🔄 Re-extract</b> on your file to pull values with the upgraded parser.</>
              )}
            </div>
          )}
          {reportCount === 0 && (
            <div className="mt-4 rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3 text-sm flex items-center gap-3">
              <span className="text-xl">💡</span>
              <div className="flex-1 text-amber-900">
                <span className="font-semibold">Tip:</span> upload a lab report and the form will auto-fill values, plus we'll auto-select the most relevant disease.
                <Link to="/reports" className="ml-1 underline font-medium hover:text-amber-700">Upload now →</Link>
              </div>
            </div>
          )}
          {user && (!user.age || !user.sex) && (
            <div className="mt-4 rounded-xl bg-brand-50 ring-1 ring-brand-200 px-4 py-3 text-sm flex items-center gap-3">
              <span className="text-xl">👤</span>
              <div className="flex-1 text-brand-900">
                <span className="font-semibold">Save time:</span> add your age and sex once in your profile and we'll auto-fill them in every prediction.
                <Link to="/profile" className="ml-1 underline font-medium hover:text-brand-700">Complete profile →</Link>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="label">Condition</label>
            <select
              className="input"
              value={disease}
              onChange={(e) => {
                setDisease(e.target.value)
                setParams({ disease: e.target.value })
                setAutoPicked(null)  // user manually changed it
              }}
            >
              {Object.entries(meta).map(([k, v]) => {
                const matchCount = Object.keys(pdfPatchForDisease(k, labValues)).length
                return (
                  <option key={k} value={k}>
                    {v.label}{matchCount > 0 ? `  •  ${matchCount} field${matchCount > 1 ? 's' : ''} from PDF` : ''}
                  </option>
                )
              })}
            </select>
            {meta[disease]?.description && (
              <p className="text-xs text-slate-500 mt-2">{meta[disease].description}</p>
            )}
          </div>

          <form onSubmit={submit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => {
              const isPdf = autoFilledFields.has(f.name)
              const isProfile = profileFilledFields.has(f.name)
              const isAuto = isPdf || isProfile
              return (
                <div key={f.name}>
                  <label className="label flex items-center justify-between gap-2">
                    <span className="truncate">
                      {f.label}
                      {f.unit ? <span className="ml-1 text-slate-400 normal-case font-normal">({f.unit})</span> : null}
                    </span>
                    {isPdf && (
                      <span className="chip bg-mint-50 text-mint-700 ring-mint-200 normal-case tracking-normal flex-shrink-0">
                        📄 from PDF
                      </span>
                    )}
                    {isProfile && !isPdf && (
                      <span className="chip bg-brand-50 text-brand-700 ring-brand-200 normal-case tracking-normal flex-shrink-0">
                        👤 from profile
                      </span>
                    )}
                  </label>
                  {f.type === 'category' ? (
                    <select
                      className={`input ${isAuto ? 'input-prefilled' : ''}`}
                      value={values[f.name] ?? ''}
                      onChange={(e) => setField(f.name, e.target.value)}
                    >
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
                      placeholder={f.min != null && f.max != null ? `${f.min}–${f.max}` : 'Enter value'}
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
                  <><span className="animate-pulse-soft">●</span> Analyzing your data…</>
                ) : (
                  <>◎ Predict risk</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 min-w-0" id="risk-result">
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
