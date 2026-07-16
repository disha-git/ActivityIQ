import { useEffect, useState } from 'react'
import PairPage from './pages/PairPage'
import TrackerPage from './pages/TrackerPage'
import type { AgentBroadcastState } from './agentTypes'

export default function App() {
  const [state, setState] = useState<AgentBroadcastState | null>(null)

  useEffect(() => {
    window.agent.getState().then(setState)
    const unsubscribe = window.agent.onStateChange(setState)
    return unsubscribe
  }, [])

  if (!state) {
    return <div className="screen loading">Loading…</div>
  }

  return state.paired ? <TrackerPage state={state} /> : <PairPage onPaired={setState} />
}
