import { useEffect, useState } from 'react'
import { api, type ApiEmployee } from '../lib/api'

export function useEmployees(refreshSignal: number) {
  const [employees, setEmployees] = useState<ApiEmployee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    function load() {
      api
        .getEmployees()
        .then(({ employees }) => {
          if (cancelled) return
          setEmployees(employees)
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
  }, [refreshSignal])

  return { employees, loading }
}
