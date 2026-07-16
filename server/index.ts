import express from 'express'
import cookieParser from 'cookie-parser'
import { createServer } from 'node:http'
import { initDb } from './db.ts'
import { seedIfEmpty } from './seed.ts'
import { initSockets } from './sockets.ts'
import authRouter from './routes/auth.ts'
import projectsRouter from './routes/projects.ts'
import employeesRouter from './routes/employees.ts'
import trackingRouter from './routes/tracking.ts'
import agentRouter from './routes/agent.ts'
import aiRouter from './routes/ai.ts'
import screenshotsRouter from './routes/screenshots.ts'

const app = express()
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/employees', employeesRouter)
app.use('/api/tracking', trackingRouter)
app.use('/api/agent', agentRouter)
app.use('/api/ai', aiRouter)
app.use('/api/screenshots', screenshotsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

const httpServer = createServer(app)
initSockets(httpServer)

const PORT = Number(process.env.PORT) || 4000

async function main() {
  await initDb()
  await seedIfEmpty()
  httpServer.listen(PORT, () => {
    console.log(`ActivityIQ API listening on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
