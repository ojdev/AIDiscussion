import dotenv from 'dotenv'
dotenv.config()

import Fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import jwt from 'jsonwebtoken'
import dbPlugin from './plugins/db.js'
import config from './config.js'
import { verifyToken } from './middleware/auth.js'
import { wsService } from './services/wsService.js'
import fastifyWebsocket from '@fastify/websocket'

async function main() {
  const fastify = Fastify({
    logger: {
      level: config.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  })

  await fastify.register(fastifyCors, {
    origin: 'https://pm.oujun.work',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })

  await fastify.register(fastifyHelmet)

  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  await fastify.register(dbPlugin)

  // Register WebSocket (ignore type errors)
  // @ts-ignore - fastify-websocket types missing
  await fastify.register(fastifyWebsocket)

  // Decorate fastify instance with wsService (singleton)
  // @ts-ignore
  fastify.decorate('wsService', wsService)

  // WebSocket endpoint for real-time notifications
  // @ts-ignore - fastify-websocket types missing
  fastify.get('/ws', { websocket: true }, (connection: any, req: any) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const token = url.searchParams.get('token')

    if (!token) {
      connection.socket.close(1008, 'Missing token')
      return
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as any
      wsService.register(decoded.userId, connection.socket)
    } catch (err) {
      connection.socket.close(1008, 'Invalid token')
    }
  })

  // Register routes
  const authRoutes = await import('./routes/auth/index.js')
  fastify.register(authRoutes.default, { prefix: '/auth' })

  const usersRoutes = await import('./routes/users/index.js')
  fastify.register(usersRoutes.default, { prefix: '/users' })

  const rolesRoutes = await import('./routes/roles/index.js')
  fastify.register(rolesRoutes.default, { prefix: '/roles' })

  const postsRoutes = await import('./routes/posts/index.js')
  fastify.register(postsRoutes.default, { prefix: '/posts' })

  const commentsRoutes = await import('./routes/comments/index.js')
  fastify.register(commentsRoutes.default)

  const searchRoutes = await import('./routes/search/index.js')
  fastify.register(searchRoutes.default, { prefix: '/search' })

  const tagsRoutes = await import('./routes/tags/index.js')
  fastify.register(tagsRoutes.default, { prefix: '/tags' })

  const reactionsRoutes = await import('./routes/reactions/index.js')
  fastify.register(reactionsRoutes.default, { prefix: '/reactions' })

  const followsRoutes = await import('./routes/follows/index.js')
  fastify.register(followsRoutes.default)

  const notificationsRoutes = await import('./routes/notifications/index.js')
  fastify.register(notificationsRoutes.default, { prefix: '/notifications' })

  // Health check
  fastify.get('/health', async (req, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Error handling
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error)
    const statusCode = (error as any)?.statusCode || 500
    const message = (error as any)?.message || 'Internal server error'
    reply.code(statusCode).send({
      success: false,
      error: message,
    })
  })

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      success: false,
      error: 'Route not found',
    })
  })

  // Start server
  try {
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' })
    fastify.log.info(`Server is running on http://0.0.0.0:${config.PORT}`)
  } catch (err: any) {
    fastify.log.error(err)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
