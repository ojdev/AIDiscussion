import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class PostService {
  async getAllPosts() {
    return await prisma.post.findMany({
      include: {
        author: {
          include: { role: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
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