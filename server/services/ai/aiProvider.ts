export interface SummaryInput {
  employeeName: string
  rangeLabel: string
  totalMinutes: number
  focusScore: number
  topProject: string | null
  topApp: string | null
  entryCount: number
}

/** Pluggable summary generator. The default export is a rule-based provider
 * computed entirely from real tracked data — no external API calls. Swap in a
 * real LLM-backed implementation later by providing an object with the same shape. */
export interface AiProvider {
  generateSummary(input: SummaryInput): string
}
