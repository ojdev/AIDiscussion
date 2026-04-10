import { PrismaClient } from '@prisma/client'
import { NotificationService } from './notificationService.js'
import { wsService } from './wsService.js'

const prisma = new PrismaClient()

export class ReactionService {
  constructor(private notificationService = new NotificationService()) {}

  async toggleLikePost(userId: number, postId: number) {
    // Check if already liked
    const existing = await prisma.reaction.findFirst({
      where: { userId, targetType: 'post', targetId: postId, type: 'like' }
    })

    let liked = false
    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } })
      liked = false
    } else {
      await prisma.reaction.create({
        data: { userId, targetType: 'post', targetId: postId, type: 'like' }
      })
      liked = true
    }

    const count = await prisma.reaction.count({
      where: { targetType: 'post', targetId: postId, type: 'like' }
    })

    // Notification: like someone's post
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } })
    if (liked && post && post.authorId !== userId) {
      await this.notificationService.createNotification({
        receiverId: post.authorId,
        actorId: userId,
        type: 'like_post',
        postId
      })
    }

    // WebSocket broadcast to post author
    if (post?.authorId) {
      wsService.broadcastToUser(post.authorId, {
        type: 'like',
        targetType: 'post',
        targetId: postId,
        liked,
        count
      })
    }

    return { liked, count }
  }

  async toggleLikeComment(userId: number, commentId: number) {
    const existing = await prisma.reaction.findFirst({
      where: { userId, targetType: 'comment', targetId: commentId, type: 'like' }
    })

    let liked = false
    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } })
      liked = false
    } else {
      await prisma.reaction.create({
        data: { userId, targetType: 'comment', targetId: commentId, type: 'like' }
      })
      liked = true
    }

    const count = await prisma.reaction.count({
      where: { targetType: 'comment', targetId: commentId, type: 'like' }
    })

    // Notification: like someone's comment
    const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { authorId: true } })
    if (liked && comment && comment.authorId !== userId) {
      await this.notificationService.createNotification({
        receiverId: comment.authorId,
        actorId: userId,
        type: 'like_comment',
        targetId: commentId
      })
    }

    // WebSocket broadcast to comment author
    if (comment?.authorId) {
      wsService.broadcastToUser(comment.authorId, {
        type: 'like',
        targetType: 'comment',
        targetId: commentId,
        liked,
        count
      })
    }

    return { liked, count }
  }

  async hasLiked(userId: number, targetType: 'post' | 'comment', targetId: number): Promise<boolean> {
    const existing = await prisma.reaction.findFirst({
      where: { userId, targetType, targetId, type: 'like' }
    })
    return !!existing
  }
}
