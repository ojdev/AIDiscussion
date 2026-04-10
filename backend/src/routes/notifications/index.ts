import { FastifyInstance } from 'fastify'
import { NotificationService } from '../../services/notificationService.js'
import { verifyToken } from '../../middleware/auth.js'

export default async function notificationsRouter(fastify: FastifyInstance) {
  const notificationService = new NotificationService()

  // GET /notifications - 获取当前用户的通知（分页）
  fastify.get(
    '/',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const userId = req.user?.userId
        if (!userId) {
          return reply.code(401).send({ success: false, error: 'Unauthorized' })
        }

        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 20
        const offset = (page - 1) * limit

        const result = await notificationService.getNotifications(userId, limit, offset)
        return { success: true, data: result.data, pagination: result.pagination }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // POST /notifications/:id/read - 标记单个通知为已读
  fastify.post(
    '/:id/read',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const userId = req.user?.userId
        if (!userId) {
          return reply.code(401).send({ success: false, error: 'Unauthorized' })
        }

        const notificationId = parseInt(req.params.id as string, 10)
        await notificationService.markAsRead(notificationId, userId)
        return { success: true, message: 'Notification marked as read' }
      } catch (error: any) {
        if (error.message === 'Notification not found or unauthorized') {
          return reply.code(404).send({ success: false, error: error.message })
        }
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // POST /notifications/read-all - 标记所有通知为已读
  fastify.post(
    '/read-all',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const userId = req.user?.userId
        if (!userId) {
          return reply.code(401).send({ success: false, error: 'Unauthorized' })
        }

        await notificationService.markAllAsRead(userId)
        return { success: true, message: 'All notifications marked as read' }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // GET /notifications/unread-count - 获取未读通知数量
  fastify.get(
    '/unread-count',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const userId = req.user?.userId
        if (!userId) {
          return reply.code(401).send({ success: false, error: 'Unauthorized' })
        }

        const count = await notificationService.getUnreadCount(userId)
        return { success: true, data: { count } }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )
}
