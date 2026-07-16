import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import Card from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import { api, type AiSummaryResponse } from '../../lib/api'

interface AiSummaryCardProps {
  employeeId: string | null
  range: string
}

export default function AiSummaryCard({ employeeId, range }: AiSummaryCardProps) {
  const [data, setData] = useState<AiSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employeeId) return
    let cancelled = false
    setLoading(true)
    api
      .getAiSummary(employeeId, range)
      .then((result) => {
        if (cancelled) return
        setData(result)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [employeeId, range])

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink dark:text-white">
        <Sparkles size={15} /> AI summary
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {data?.summary ?? 'No tracked activity yet for this range.'}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Focus score</span>
            <span className="text-lg font-bold text-brand-600 dark:text-brand-300">{data?.focusScore ?? 0}%</span>
          </div>
        </>
      )}
    </Card>
  )
}
