import { FastifyInstance } from 'fastify'
import { PostService } from '../../services/postService.js'
import { CommentService } from '../../services/commentService.js'

export default async function searchRouter(fastify: FastifyInstance) {
  const postService = new PostService()
  const commentService = new CommentService()

  // POST /search - 全文搜索（帖子 + 评论）
  fastify.post(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['query'],
          properties: {
            query: { type: 'string' },
            type: {
              type: 'string',
              enum: ['post', 'comment', 'all'],
              default: 'all',
            },
            page: { type: 'number', minimum: 1, default: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          },
        },
      },
    },
    async (req: any, reply: any) => {
      try {
        const { query, type, page, limit } = req.body
        const searchQuery = query.trim()
        if (!searchQuery) {
          return reply.code(400).send({
            success: false,
            error: 'Query is required',
          })
        }

        const skip = (page - 1) * limit
        let total = 0
        let posts: any[] = []
        let comments: any[] = []

        // Fetch posts if needed
        if (type === 'post' || type === 'all') {
          total += await fastify.prisma.post.count({
            where: { content: { contains: searchQuery } },
          })

          // For 'all', fetch more items to cover pagination after merge; for 'post' only, apply skip/limit
          const postsOptions: any = {
            where: { content: { contains: searchQuery } },
            include: {
              author: {
                include: { role: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          }

          if (type === 'post') {
            postsOptions.skip = skip
            postsOptions.take = limit
          } else {
            // 'all'
            postsOptions.take = skip + limit
          }

          posts = await fastify.prisma.post.findMany(postsOptions)
        }

        // Fetch comments if needed
        if (type === 'comment' || type === 'all') {
          total += await fastify.prisma.comment.count({
            where: { content: { contains: searchQuery } },
          })

          const commentsOptions: any = {
            where: { content: { contains: searchQuery } },
            include: {
              author: {
                include: { role: true },
              },
              post: {
                select: { id: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          }

          if (type === 'comment') {
            commentsOptions.skip = skip
            commentsOptions.take = limit
          } else {
            // 'all'
            commentsOptions.take = skip + limit
          }

          comments = await fastify.prisma.comment.findMany(commentsOptions)
        }

        // Transform into unified results
        const transformedPosts = posts.map((post: any) => ({
          type: 'post' as const,
          id: post.id,
          content: post.content,
          author: {
            id: post.author.id,
            name: post.author.name,
            role: post.author.role.name,
            avatar: post.author.avatar,
          },
          createdAt: post.createdAt,
        }))

        const transformedComments = comments.map((comment: any) => ({
          type: 'comment' as const,
          id: comment.id,
          content: comment.content,
          author: {
            id: comment.author.id,
            name: comment.author.name,
            role: comment.author.role.name,
            avatar: comment.author.avatar,
          },
          postId: comment.post.id,
          createdAt: comment.createdAt,
        }))

        // Merge and sort by createdAt descending
        const merged = [...transformedPosts, ...transformedComments].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        // Apply pagination slice
        const paginatedResults = merged.slice(skip, skip + limit)

        return {
          success: true,
          data: paginatedResults,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        }
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )
}
