import { Router } from 'express'
import { all, run, newId } from '../db.ts'
import { requireAuth, type AuthedRequest } from '../auth.ts'

const router = Router()

router.get('/', requireAuth, async (_req, res) => {
  const projects = await all('SELECT * FROM projects ORDER BY name')
  res.json({ projects })
})

router.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const { name, color } = req.body ?? {}
  if (!name) {
    res.status(400).json({ error: 'Project name is required.' })
    return
  }
  const project = { id: newId('p'), name, color: color || '#4b6fed' }
  await run('INSERT INTO projects (id, name, color) VALUES (?, ?, ?)', [project.id, project.name, project.color])
  res.status(201).json({ project })
})

export default router
