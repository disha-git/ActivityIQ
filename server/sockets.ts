import type { Server as HttpServer } from 'node:http'
import { Server as SocketIoServer } from 'socket.io'
import { verifyAgentToken } from './jwt.ts'
import { getUserFromRequestCookies } from './auth.ts'

let io: SocketIoServer | null = null

export function initSockets(httpServer: HttpServer): SocketIoServer {
  io = new SocketIoServer(httpServer, {
    cors: { origin: true, credentials: true },
  })

  io.use((socket, next) => {
    const bearer = socket.handshake.auth?.token as string | undefined
    if (bearer) {
      const payload = verifyAgentToken(bearer)
      if (payload) {
        socket.data.employeeId = payload.employeeId
        next()
        return
      }
    }

    const cookieHeader = socket.handshake.headers.cookie
    getUserFromRequestCookies(cookieHeader)
      .then((user) => {
        if (user) {
          socket.data.userId = user.id
          next()
          return
        }
        next(new Error('unauthorized'))
      })
      .catch(() => next(new Error('unauthorized')))
  })

  io.on('connection', (socket) => {
    socket.join('activity-feed')
    socket.on('disconnect', () => {})
  })

  return io
}

export function emitToAll(event: string, payload: unknown): void {
  io?.to('activity-feed').emit(event, payload)
}
