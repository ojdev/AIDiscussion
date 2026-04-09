import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class CommentService {
  async getCommentsByPostId(postId: number) {
    return await prisma.comment.findMany({
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
  }

  async createComment(data: { content: string; postId: number; authorId: number; parentId?: number }) {
    return await prisma.comment.create({
      data,
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
  }

  async deleteComment(id: number) {
    return await prisma.comment.delete({
      where: { id },
    })
  }

  async getCommentById(id: number) {
    return await prisma.comment.findUnique({
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
      },
    })
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
      },
    })
  }
}