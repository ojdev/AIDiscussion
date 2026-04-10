import { PrismaClient } from '@prisma/client'
import { wsService } from './wsService.js'

const prisma = new PrismaClient()

export class NotificationService {
  /**
   * 创建通知
   */
  async createNotification(data: {
    receiverId: number
    type: 'follow' | 'like_post' | 'like_comment' | 'reply_comment'
    actorId: number
    targetId?: number
    postId?: number
  }) {
    // 不要给自己发通知
    if (data.receiverId === data.actorId) {
      return null
    }

    const notification = await prisma.notification.create({
      data,
      include: {
        actor: {
          select: { id: true, name: true, nickname: true, avatar: true }
        },
        receiver: {
          select: { id: true, name: true, nickname: true, avatar: true }
        }
      }
    })

    // Broadcast via WebSocket if receiver is online
    try {
      wsService.broadcastToUser(data.receiverId, { type: 'notification', payload: notification })
    } catch {
      // ignore WS errors; fallback polling remains
    }

    return notification
  }

  /**
   * 获取用户的通知列表（按未读优先、时间倒序）
   */
  async getNotifications(userId: number, limit: number = 50, offset: number = 0) {
    const [total, notifications] = await Promise.all([
      prisma.notification.count({
        where: { receiverId: userId }
      }),
      prisma.notification.findMany({
        where: { receiverId: userId },
        orderBy: [
          { read: 'asc' }, // 未读优先
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset,
        include: {
          actor: {
            select: { id: true, name: true, nickname: true, avatar: true }
          }
        }
      })
    ])

    return {
      data: notifications,
      pagination: {
        total,
        limit,
        offset,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(userId: number): Promise<number> {
    return await prisma.notification.count({
      where: { receiverId: userId, read: false }
    })
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId: number, userId: number) {
    const notif = await prisma.notification.findFirst({
      where: { id: notificationId, receiverId: userId }
    })

    if (!notif) {
      throw new Error('Notification not found')
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    })
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId: number) {
    return await prisma.notification.updateMany({
      where: { receiverId: userId, read: false },
      data: { read: true }
    })
  }

  /**
   * 删除通知
   */
  async deleteNotification(notificationId: number, userId: number) {
    const notif = await prisma.notification.findFirst({
      where: { id: notificationId, receiverId: userId }
    })

    if (!notif) {
      throw new Error('Notification not found')
    }

    return await prisma.notification.delete({
      where: { id: notificationId }
    })
  }
}
