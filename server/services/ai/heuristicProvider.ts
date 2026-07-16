import type { AiProvider, SummaryInput } from './aiProvider.ts'

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

function focusDescriptor(score: number): string {
  if (score >= 85) return 'excellent focus'
  if (score >= 70) return 'solid focus'
  if (score >= 50) return 'moderate focus'
  if (score > 0) return 'scattered focus'
  return 'no measurable focus data'
}

export const heuristicProvider: AiProvider = {
  generateSummary(input: SummaryInput): string {
    const { employeeName, rangeLabel, totalMinutes, focusScore, topProject, topApp, entryCount } = input

    if (entryCount === 0) {
      return `${employeeName} has no tracked activity for ${rangeLabel.toLowerCase()} yet.`
    }

    const parts: string[] = [
      `${employeeName} logged ${formatDuration(totalMinutes)} across ${entryCount} session${entryCount === 1 ? '' : 's'} ${rangeLabel.toLowerCase()}`,
    ]

    if (topProject) parts.push(`mostly on ${topProject}`)
    if (topApp) parts.push(`primarily in ${topApp}`)

    const sentence1 = parts.join(', ') + '.'
    const sentence2 = `Average focus score was ${focusScore}% — ${focusDescriptor(focusScore)}.`

    return `${sentence1} ${sentence2}`
  },
}
