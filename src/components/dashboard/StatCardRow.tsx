import { motion } from 'framer-motion'
import { Clock, CalendarDays, CalendarRange, Radio } from 'lucide-react'
import Card from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import { formatDuration } from '../../lib/format'

interface StatCardRowProps {
  loading: boolean
  rangeLabel: string
  rangeSeconds: number
  weekSeconds: number
  monthSeconds: number
  status: 'online' | 'offline'
}

export default function StatCardRow({ loading, rangeLabel, rangeSeconds, weekSeconds, monthSeconds, status }: StatCardRowProps) {
  const cards = [
    { icon: Clock, label: rangeLabel, value: formatDuration(rangeSeconds), tone: 'brand' as const },
    { icon: CalendarDays, label: 'This week', value: formatDuration(weekSeconds), tone: 'plain' as const },
    { icon: CalendarRange, label: 'This month', value: formatDuration(monthSeconds), tone: 'plain' as const },
    {
      icon: Radio,
      label: 'Status',
      value: status === 'online' ? 'Tracking now' : 'Offline',
      tone: status === 'online' ? ('success' as const) : ('plain' as const),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
      {cards.map((card, i) =>
        loading ? (
          <Skeleton key={card.label} className="h-[92px] rounded-2xl" />
        ) : (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
          >
            <Card
              className={`p-4 sm:p-5 ${card.tone === 'brand' ? 'bg-gradient-to-br from-brand-600 to-accent-600 text-white' : ''}`}
            >
              <div className={`flex items-center gap-1.5 text-xs font-medium ${card.tone === 'brand' ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
                <card.icon size={13} />
                {card.label}
              </div>
              <div
                className={`mt-2 text-xl font-bold sm:text-2xl ${
                  card.tone === 'brand' ? 'text-white' : card.tone === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink dark:text-white'
                }`}
              >
                {card.value}
              </div>
            </Card>
          </motion.div>
        ),
      )}
    </div>
  )
}
