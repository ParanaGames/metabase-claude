'use client'
import { useState, useRef, useEffect } from 'react'

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your data assistant. Ask me anything about your data — for example:\n\n• \"Show me total revenue by month this year\"\n• \"Which customers have the highest order count?\"\n• \"Compare sales this week vs last week\""
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [db, setDb] = useState('1')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage, databaseId: db })
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sql: data.sql,
        results: data.results,
        error: data.error
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        error: true
      }])
    }
    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ padding: '16px 0', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🔍 Ask Your Data</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Powered by Claude + Metabase</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#555' }}>Database:</label>
          <select
            value={db}
            onChange={e => setDb(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}
          >
            <option value="1">BigQuery</option>
            <option value="2">ClickHouse</option>
          </select>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
            <div style={{ maxWidth: '80%', background: msg.role === 'user' ? '#2563eb' : '#fff', color: msg.role === 'user' ? '#fff' : '#111', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {msg.content}
              {msg.sql && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Generated SQL:</div>
                  <pre style={{ background: '#1e1e2e', color: '#cdd6f4', padding: '10px 14px', borderRadius: 8, fontSize: 12, overflow: 'auto', margin: 0 }}>{msg.sql}</pre>
                </div>
              )}
              {msg.results && msg.results.rows && msg.results.rows.length > 0 && (
                <div style={{ marginTop: 12, overflowX: 'auto' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Results ({msg.results.rows.length} rows):</div>
                  <table style={{ bo
