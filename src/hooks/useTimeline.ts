import { useEffect, useState } from 'react'
import { api, type TimelineResponse } from '../lib/api'

export function useTimeline(employeeId: string | null, range: string, refreshSignal: number) {
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employeeId) return
    let cancelled = false
    setLoading(true)

    function load() {
      api
        .getTimeline(employeeId!, range)
        .then((data) => {
          if (cancelled) return
          setTimeline(data)
          setLoading(false)
        })
        .catch(() => {})
    }

    load()
    const interval = window.setInterval(load, 5000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [employeeId, range, refreshSignal])

  return { timeline, loading }
}
