import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class PostService {
  async getAllPosts(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit
    const [total, posts] = await Promise.all([
      prisma.post.count(),
      prisma.post.findMany({
        include: {
          author: {
            include: { role: true },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ])

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getPostById(id: number) {
    return await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          include: { role: true },
        },
        comments: {
          include: {
            author: {
              include: { role: true },
            },
            replies: {
              include: {
                author: {
                  include: { role: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  }

  async createPost(data: { content: string; authorId: number }) {
    return await prisma.post.create({
      data,
      include: {
        author: {
          include: { role: true },
        },
      },
    })
  }

  async deletePost(id: number) {
    return await prisma.post.delete({
      where: { id },
    })
  }

  async updatePost(id: number, content: string) {
    return await prisma.post.update({
      where: { id },
      data: { content },
      include: {
        author: {
          include: { role: true },
        },
      },
    })
  }
}