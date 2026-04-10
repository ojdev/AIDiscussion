import { PrismaClient } from '@prisma/client'
import { NotificationService } from './notificationService.js'
import { wsService } from './wsService.js'

const prisma = new PrismaClient()
const notificationService = new NotificationService()

export class CommentService {
  async getCommentsByPostId(postId: number) {
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatar: true,
            role: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                nickname: true,
                avatar: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
    // Append like counts for each comment and their replies
    await Promise.all(
      comments.map(async (comment) => {
        // @ts-ignore - dynamically add likeCount
        comment.likeCount = await prisma.reaction.count({
          where: { targetType: 'comment', targetId: comment.id, type: 'like' }
        })
        if (comment.replies) {
          await Promise.all(
            comment.replies.map(async (reply) => {
              // @ts-ignore
              reply.likeCount = await prisma.reaction.count({
                where: { targetType: 'comment', targetId: reply.id, type: 'like' }
              })
            })
          )
        }
      })
    )
    return comments
  }

  async createComment(data: { content: string; postId: number; authorId: number; parentId?: number; tagIds?: number[] }) {
    const { tagIds, ...commentData } = data
    const comment = await prisma.comment.create({
      data: commentData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatar: true,
            role: true,
          },
        },
      },
    })

    // Create reply notification if this is a reply to another comment
    if (data.parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: data.parentId }, select: { authorId: true } })
      if (parent && parent.authorId !== data.authorId) {
        await notificationService.createNotification({
          receiverId: parent.authorId,
          type: 'reply_comment',
          actorId: data.authorId,
          targetId: comment.id,
          postId: data.postId
        })
      }
    }

    if (tagIds && tagIds.length > 0) {
      await prisma.comment.update({
        where: { id: comment.id },
        data: {
          tags: {
            connect: tagIds.map(id => ({ id })),
          },
        },
      })
      // Reload with tags
      return await prisma.comment.findUnique({
        where: { id: comment.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              nickname: true,
              avatar: true,
              role: true,
            },
          },
          tags: true,
        },
      })
    }

    return comment
  }

  async deleteComment(id: number) {
    return await prisma.comment.delete({
      where: { id },
    })
  }

  async getCommentById(id: number) {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatar: true,
            role: true,
          },
        },
        post: true,
        tags: true,
      },
    })
    if (comment) {
      // @ts-ignore
      comment.likeCount = await prisma.reaction.count({
        where: { targetType: 'comment', targetId: id, type: 'like' }
      })
    }
    return comment
  }

  async updateComment(id: number, content: string) {
    return await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatar: true,
            role: true,
          },
        },
        tags: true,
      },
    })
  }
}
