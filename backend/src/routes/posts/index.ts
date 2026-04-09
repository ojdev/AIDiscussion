import { FastifyInstance } from 'fastify'
import { PostService } from '../../services/postService.js'
import { verifyToken } from '../../middleware/auth.js'

export default async function postsRouter(fastify: FastifyInstance) {
  const postService = new PostService()

  // GET /posts - 获取所有帖子（分页）
  fastify.get(
    '/',
    async (req: any, reply: any) => {
      try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 20
        const result = await postService.getAllPosts(page, limit)
        return { success: true, data: result.data, pagination: result.pagination }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // GET /posts/:id - 获取单个帖子及评论
  fastify.get(
    '/:id',
    async (req: any, reply: any) => {
      try {
        const id = parseInt(req.params.id as string, 10)
        const post = await postService.getPostById(id)
        if (!post) {
          return reply.code(404).send({ success: false, error: 'Post not found' })
        }
        return { success: true, data: post }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // POST /posts - 创建帖子（登录用户）
  fastify.post(
    '/',
    {
      onRequest: verifyToken,
      schema: {
        body: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string' },
            tagIds: { type: 'array', items: { type: 'number' } },
          },
        },
      },
    },
    async (req: any, reply: any) => {
      try {
        const authorId = req.user?.userId
        if (!authorId) {
          return reply.code(401).send({ success: false, error: 'Unauthorized' })
        }

        const post = await postService.createPost({
          content: req.body.content,
          authorId,
          tagIds: req.body.tagIds,
        })
        return { success: true, data: post }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // DELETE /posts/:id - 删除帖子（管理员或作者）
  fastify.delete(
    '/:id',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const id = parseInt(req.params.id as string, 10)
        const post = await postService.getPostById(id)
        if (!post) {
          return reply.code(404).send({ success: false, error: 'Post not found' })
        }

        const isAdmin = req.user?.role === 'admin'
        const isAuthor = post.authorId === req.user?.userId

        if (!isAdmin && !isAuthor) {
          return reply.code(403).send({ success: false, error: 'Forbidden' })
        }

        await postService.deletePost(id)
        return { success: true, message: 'Post deleted' }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // PUT /posts/:id - 编辑帖子（管理员或作者）
  fastify.put(
    '/:id',
    {
      onRequest: verifyToken,
      schema: {
        body: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string' },
            tagIds: { type: 'array', items: { type: 'number' } },
          },
        },
      },
    },
    async (req: any, reply: any) => {
      try {
        const id = parseInt(req.params.id as string, 10)
        const post = await postService.getPostById(id)
        if (!post) {
          return reply.code(404).send({ success: false, error: 'Post not found' })
        }

        const isAdmin = req.user?.role === 'admin'
        const isAuthor = post.authorId === req.user?.userId

        if (!isAdmin && !isAuthor) {
          return reply.code(403).send({ success: false, error: 'Forbidden' })
        }

        const updatedPost = await postService.updatePost(id, req.body.content, req.body.tagIds)
        return { success: true, data: updatedPost }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )
}