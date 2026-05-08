import { useEffect, useRef, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../api/auth.jsx'
import MarkdownMessage from '../components/MarkdownMessage.jsx'

const SUGGESTED = [
  'Build a 7-day diabetic meal plan',
  'How can I lower LDL cholesterol naturally?',
  'Beginner workout for high blood pressure',
  'Explain my HbA1c result of 6.2',
  'Foods to avoid with kidney disease',
  'Mediterranean diet basics',
]

export default function Chat() {
  const { user } = useAuth()
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
  }, [messages, busy])

  async function send(text) {
    text = text.trim()
    if (!text || busy) return
    setBusy(true); setErr('')

    const userTurn = { role: 'user', content: text, id: `tmp-${Date.now()}` }
    const next = [...messages, userTurn]
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

  const userInitial = (user?.full_name || user?.email || '?')[0].toUpperCase()

  return (
    <div className="card flex flex-col h-[78vh] p-0 overflow-hidden animate-fade-in">
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200/60 bg-white/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mint-gradient grid place-items-center text-xl shadow-soft">
            ✦
          </div>
          <div>
            <h1 className="text-lg font-bold font-display">MedAdvisor</h1>
            <p className="text-xs text-slate-500">Your AI dietitian & health coach · Powered by Groq</p>
          </div>
        </div>
        <button className="btn-ghost text-xs" onClick={clearAll}>Clear history</button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gradient-to-b from-slate-50/30 to-transparent">
        {messages.length === 0 && (
          <div className="max-w-md mx-auto text-center mt-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-mint-gradient grid place-items-center text-3xl shadow-card mb-4 animate-pulse-soft">
              ✦
            </div>
            <h3 className="font-bold text-slate-700 text-lg">Ask me anything about your health</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              I'm strictly limited to nutrition, fitness, and wellness topics.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:border-brand-300 hover:bg-brand-50/50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 animate-fade-in ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-mint-gradient grid place-items-center text-sm shadow-soft">
                ✦
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-brand-gradient text-white rounded-br-md shadow-soft whitespace-pre-wrap'
                  : 'bg-white ring-1 ring-slate-200 text-slate-800 rounded-bl-md'
              }`}
            >
              {m.role === 'assistant'
                ? <MarkdownMessage>{m.content}</MarkdownMessage>
                : m.content}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-slate-200 grid place-items-center text-xs font-bold text-slate-700">
                {userInitial}
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="flex gap-2 animate-fade-in">
            <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-mint-gradient grid place-items-center text-sm shadow-soft">
              ✦
            </div>
            <div className="bg-white ring-1 ring-slate-200 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-mint-500 animate-pulse-soft"></span>
              <span className="w-2 h-2 rounded-full bg-mint-500 animate-pulse-soft" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 rounded-full bg-mint-500 animate-pulse-soft" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {err && (
        <div className="px-6 py-2 bg-red-50 ring-1 ring-red-200 text-sm text-red-700">
          {err}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="px-6 py-4 border-t border-slate-200/60 bg-white/60 backdrop-blur">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Ask about diet, exercise, lab results…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <button className="btn-primary" disabled={busy || !input.trim()}>
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
