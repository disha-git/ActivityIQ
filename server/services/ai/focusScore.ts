import { all } from '../../db.ts'

export interface FocusScoreResult {
  score: number
  sampleCount: number
  totalMinutes: number
}

/**
 * Real (not simulated) focus score: the duration-weighted average of the
 * `activity` field already recorded on each activity_samples row for the
 * employee's entries within [start, end).
 */
export async function computeFocusScore(employeeId: string, start: Date, end: Date): Promise<FocusScoreResult> {
  const samples = await all<{ activity: number; duration_minutes: number }>(
    `SELECT s.activity, s.duration_minutes
       FROM activity_samples s
       JOIN time_entries t ON t.id = s.entry_id
       WHERE t.employee_id = ? AND t.started_at >= ? AND t.started_at < ?`,
    [employeeId, start.toISOString(), end.toISOString()],
  )

  if (samples.length === 0) {
    return { score: 0, sampleCount: 0, totalMinutes: 0 }
  }

  const totalMinutes = samples.reduce((sum, s) => sum + s.duration_minutes, 0)
  const weightedActivity = samples.reduce((sum, s) => sum + s.activity * s.duration_minutes, 0)
  const score = totalMinutes > 0 ? Math.round(weightedActivity / totalMinutes) : 0

  return { score, sampleCount: samples.length, totalMinutes }
}
