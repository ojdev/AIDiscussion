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
        tags: true,
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
            tags: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  async createComment(data: { content: string; postId: number; authorId: number; parentId?: number; tagIds?: number[] }) {
    // 分离 tagIds
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
        tags: true,
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
        tags: true,
      },
    })
  }
}