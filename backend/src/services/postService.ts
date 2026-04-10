import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class PostService {
  async getAllPosts(page: number = 1, limit: number = 20, tagId?: number, userId?: number, followingOnly: boolean = false) {
    const skip = (page - 1) * limit

    // 构建查询条件
    let where: any = {}
    if (tagId) {
      where.tags = { some: { id: tagId } }
    }
    if (followingOnly && userId) {
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      })
      const followingIds = follows.map(f => f.followingId)
      if (followingIds.length === 0) {
        return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } }
      }
      where.authorId = { in: followingIds }
    }

    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          authorId: true,
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
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ])

    // 获取每个帖子的点赞数
    const postsWithLikes = await Promise.all(
      posts.map(async (post) => {
        const likeCount = await prisma.reaction.count({
          where: { targetType: 'post', targetId: post.id, type: 'like' }
        })
        return { ...post, likeCount }
      })
    )

    return {
      data: postsWithLikes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getPostById(id: number) {
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
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
        _count: {
          select: {
            comments: true,
          },
        },
      },
    })

    if (!post) return null

    const likeCount = await prisma.reaction.count({
      where: { targetType: 'post', targetId: id, type: 'like' }
    })

    return { ...post, likeCount }
  }

  async createPost(data: { content: string; authorId: number; tagIds?: number[] }) {
    const { tagIds, ...postData } = data

    const post = await prisma.post.create({
      data: postData,
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
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
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          authorId: true,
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

  async updatePost(id: number, content: string, tagIds?: number[]) {
    // If tagIds provided, update tags relation
    if (tagIds !== undefined) {
      if (tagIds.length === 0) {
        // Clear all tags
        await prisma.post.update({
          where: { id },
          data: { tags: { set: [] } }
        })
      } else {
        // Set tags to the provided list
        await prisma.post.update({
          where: { id },
          data: {
            tags: {
              set: tagIds.map(id => ({ id })),
            },
          },
        })
      }
    }

    return await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
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

  async deletePost(id: number) {
    return await prisma.post.delete({
      where: { id },
    })
  }
}