import { useEffect, useRef, useState } from 'react'
import api from '../api/client'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    api.get('/chat/history').then((r) => setMessages(r.data || []))
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setBusy(true); setErr('')

    const newUserMsg = { role: 'user', content: text, id: `tmp-${Date.now()}` }
    const next = [...messages, newUserMsg]
    setMessages(next)
    setInput('')

    try {
      const history = next.slice(-12).map((m) => ({ role: m.role, content: m.content }))
      const r = await api.post('/chat', { message: text, history: history.slice(0, -1) })
      setMessages((cur) => [...cur, { role: 'assistant', content: r.data.reply, id: r.data.saved_id }])
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Chat failed')
    } finally { setBusy(false) }
  }

  async function clearAll() {
    if (!confirm('Clear all chat history?')) return
    await api.delete('/chat/history')
    setMessages([])
  }

  return (
    <div className="card flex flex-col h-[75vh]">
      <header className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold">MedAdvisor — your dietitian & health coach</h1>
          <p className="text-xs text-slate-500">Powered by Groq · Health, nutrition & wellness only</p>
        </div>
        <button className="btn-secondary text-xs" onClick={clearAll}>Clear history</button>
      </header>

      <div className="flex-1 overflow-y-auto bg-slate-50 rounded-lg p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-slate-500 text-center mt-12 px-6">
            <p className="mb-3 font-medium">Ask me anything about your health, diet, or fitness:</p>
            <ul className="space-y-1">
              <li>• Build a 7-day diabetic meal plan</li>
              <li>• How can I reduce my LDL cholesterol naturally?</li>
              <li>• Best beginner workout for high blood pressure</li>
              <li>• Explain my HbA1c result</li>
            </ul>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
              m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-800'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && <div className="text-xs text-slate-400">MedAdvisor is typing…</div>}
        <div ref={endRef} />
      </div>

      {err && <div className="text-sm text-red-600 mt-2">{err}</div>}

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Ask about diet, exercise, nutrition…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <button className="btn-primary" disabled={busy || !input.trim()}>Send</button>
      </form>
    </div>
  )
}
