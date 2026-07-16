import type { NextFunction, Request, Response } from 'express'
import { verifyAgentToken } from '../jwt.ts'
import { get } from '../db.ts'
import type { EmployeeRow } from '../auth.ts'

export interface AgentAuthedRequest extends Request {
  employee?: EmployeeRow
}

export async function requireAgentAuth(req: AgentAuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  const payload = token ? verifyAgentToken(token) : null

  if (!payload) {
    res.status(401).json({ error: 'Invalid or missing agent token.' })
    return
  }

  const employee = await get<EmployeeRow>('SELECT * FROM employees WHERE id = ?', [payload.employeeId])

  if (!employee) {
    res.status(401).json({ error: 'Agent token refers to an unknown employee.' })
    return
  }

  req.employee = employee
  next()
}
