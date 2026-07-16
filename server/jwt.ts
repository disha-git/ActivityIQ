import jwt from 'jsonwebtoken'

// Dev-only fallback secret. Set JWT_SECRET in the environment for any real deployment.
const JWT_SECRET = process.env.JWT_SECRET || 'activityiq-dev-only-insecure-secret-change-in-production'
const AGENT_TOKEN_EXPIRY = '180d'

export interface AgentTokenPayload {
  employeeId: string
}

export function signAgentToken(employeeId: string): string {
  return jwt.sign({ employeeId } satisfies AgentTokenPayload, JWT_SECRET, { expiresIn: AGENT_TOKEN_EXPIRY })
}

export function verifyAgentToken(token: string): AgentTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (typeof decoded === 'object' && decoded && 'employeeId' in decoded) {
      return { employeeId: String((decoded as Record<string, unknown>).employeeId) }
    }
    return null
  } catch {
    return null
  }
}
