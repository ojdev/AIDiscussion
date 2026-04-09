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
            select: {
              id: true,
              name: true,
              nickname: true,
              avatar: true,
              role: true,
            },
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
          select: {
            id: true,
            name: true,
            nickname: true,
            avatar: true,
            role: true,
          },
        },
        tags: true,
        comments: {
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
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  }

  async createPost(data: { content: string; authorId: number; tagIds?: number[] }) {
    let { tagIds, ...postData } = data

    const post = await prisma.post.create({
      data: postData,
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
      await prisma.post.update({
        where: { id: post.id },
        data: {
          tags: {
            connect: tagIds.map(id => ({ id })),
          },
        },
      })
      // Reload with tags
      return await prisma.post.findUnique({
        where: { id: post.id },
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

    return post
  }

  async deletePost(id: number) {
    return await prisma.post.delete({
      where: { id },
    })
  }

  async updatePost(id: number, content: string, tagIds?: number[]) {
    const updateData: any = { content }

    // If tagIds provided, update tags relation
    if (tagIds !== undefined) {
      // First set tags to empty (delete all existing connections)
      await prisma.post.update({
        where: { id },
        data: {
          tags: { disconnect: {}}, // clear all
        },
      })
      // Then connect new tags
      if (tagIds.length > 0) {
        await prisma.post.update({
          where: { id },
          data: {
            tags: {
              connect: tagIds.map(id => ({ id })),
            },
          },
        })
      }
    }

    return await prisma.post.findUnique({
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
        tags: true,
      },
    })
  }
}