import { FastifyInstance } from 'fastify'
import { NotificationService } from '../../services/notificationService.js'
import { verifyToken } from '../../middleware/auth.js'

export default async function notificationsRouter(fastify: FastifyInstance) {
  const notificationService = new NotificationService()

  // GET /notifications - 获取通知列表
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
        const limit = parseInt(req.query.limit as string) || 50
        const offset = (page - 1) * limit

        const result = await notificationService.getNotifications(userId, limit, offset)
        return { success: true, data: result.data, pagination: result.pagination }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // GET /notifications/unread-count - 获取未读数量
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
        return { success: true, data: { unreadCount: count } }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // PUT /notifications/:id/read - 标记单条为已读
  fastify.put(
    '/:id/read',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const userId = req.user?.userId
        if (!userId) {
          return reply.code(401).send({ success: false, error: 'Unauthorized' })
        }

        const notificationId = parseInt(req.params.id as string, 10)
        const notification = await notificationService.markAsRead(notificationId, userId)
        return { success: true, data: notification }
      } catch (error: any) {
        const status = error.message === 'Notification not found' ? 404 : 500
        return reply.status(status).send({ success: false, error: error.message })
      }
    }
  )

  // PUT /notifications/read-all - 标记全部为已读
  fastify.put(
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

  // DELETE /notifications/:id - 删除通知
  fastify.delete(
    '/:id',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const userId = req.user?.userId
        if (!userId) {
          return reply.code(401).send({ success: false, error: 'Unauthorized' })
        }

        const notificationId = parseInt(req.params.id as string, 10)
        await notificationService.deleteNotification(notificationId, userId)
        return { success: true, message: 'Notification deleted' }
      } catch (error: any) {
        const status = error.message === 'Notification not found' ? 404 : 500
        return reply.status(status).send({ success: false, error: error.message })
      }
    }
  )
}
