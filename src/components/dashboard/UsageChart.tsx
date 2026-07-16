import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Skeleton from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import { BarChart3 } from 'lucide-react'
import type { UsageStat } from '../../lib/api'

interface UsageChartProps {
  loading: boolean
  data: UsageStat[]
  color: string
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: UsageStat }[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium shadow-soft dark:border-slate-700 dark:bg-slate-900 dark:text-white">
      {item.name}: <span className="font-bold">{item.minutes}m</span>
    </div>
  )
}

export default function UsageChart({ loading, data, color }: UsageChartProps) {
  if (loading) {
    return <Skeleton className="h-40 rounded-xl" />
  }

  if (data.length === 0) {
    return <EmptyState icon={<BarChart3 size={18} />} title="No data yet" />
  }

  return (
    <div className="h-[168px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={96}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-slate-500 dark:text-slate-400"
          />
          <Tooltip cursor={{ fill: 'currentColor', opacity: 0.05 }} content={<ChartTooltip />} />
          <Bar dataKey="minutes" radius={[0, 6, 6, 0]} barSize={14}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
