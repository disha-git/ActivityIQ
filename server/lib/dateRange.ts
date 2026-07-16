export type RangeKey = 'today' | 'yesterday' | 'week' | 'month'

export function getRangeBounds(range: string): { start: Date; end: Date } {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  if (range === 'yesterday') {
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000)
    return { start: yesterdayStart, end: todayStart }
  }
  if (range === 'week') {
    return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now }
  }
  if (range === 'month') {
    return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now }
  }
  return { start: todayStart, end: now }
}

export function rangeLabel(range: string): string {
  switch (range) {
    case 'yesterday':
      return 'Yesterday'
    case 'week':
      return 'This week'
    case 'month':
      return 'This month'
    default:
      return 'Today'
  }
}
