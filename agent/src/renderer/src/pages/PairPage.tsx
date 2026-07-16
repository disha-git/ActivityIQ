import { useState, type FormEvent } from 'react'
import type { AgentBroadcastState } from '../agentTypes'

interface Props {
  onPaired: (state: AgentBroadcastState) => void
}

export default function PairPage({ onPaired }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length < 4) return
    setBusy(true)
    setError(null)
    try {
      const state = await window.agent.pair(trimmed)
      onPaired(state)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pairing failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen pair-page">
      <h1>ActivityIQ Agent</h1>
      <p className="hint">Enter the pairing code from Settings → Desktop Agent on the web dashboard.</p>
      <form onSubmit={handleSubmit}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ABC123"
          maxLength={8}
          autoFocus
        />
        <button type="submit" disabled={busy || code.trim().length < 4}>
          {busy ? 'Pairing…' : 'Pair device'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
