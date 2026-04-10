import { FastifyInstance } from 'fastify'
import { CommentService } from '../../services/commentService.js'
import { verifyToken } from '../../middleware/auth.js'

export default async function commentsRouter(fastify: FastifyInstance) {
  const commentService = new CommentService()

  // GET /posts/:postId/comments
  fastify.get('/posts/:postId/comments', async (req: any, reply: any) => {
    try {
      const postId = parseInt(req.params.postId as string, 10)
      const comments = await commentService.getCommentsByPostId(postId)
      return { success: true, data: comments }
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message })
    }
  })

  // POST /posts/:postId/comments
  fastify.post(
    '/posts/:postId/comments',
    {
      onRequest: verifyToken,
      schema: {
        body: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string' },
            parentId: { type: 'number' },
            tagIds: { type: 'array', items: { type: 'number' } }
          }
        }
      }
    },
    async (req: any, reply: any) => {
      try {
        const postId = parseInt(req.params.postId as string, 10)
        const authorId = req.user?.userId
        if (!authorId) {
          return reply.code(401).send({ success: false, error: 'Unauthorized' })
        }

        const comment = await commentService.createComment({
          content: req.body.content,
          postId,
          authorId,
          parentId: req.body.parentId
        })
        return { success: true, data: comment }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // DELETE /comments/:id
  fastify.delete(
    '/:id',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const id = parseInt(req.params.id as string, 10)
        const comment = await commentService.getCommentById(id)
        if (!comment) {
          return reply.code(404).send({ success: false, error: 'Comment not found' })
        }

        const isAdmin = req.user?.role === 'admin'
        const isAuthor = comment.authorId === req.user?.userId

        if (!isAdmin && !isAuthor) {
          return reply.code(403).send({ success: false, error: 'Forbidden' })
        }

        await commentService.deleteComment(id)
        return { success: true, message: 'Comment deleted' }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // PUT /comments/:id - 编辑评论（管理员或作者）
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
          },
        },
      },
    },
    async (req: any, reply: any) => {
      try {
        const id = parseInt(req.params.id as string, 10)
        const comment = await commentService.getCommentById(id)
        if (!comment) {
          return reply.code(404).send({ success: false, error: 'Comment not found' })
        }

        const isAdmin = req.user?.role === 'admin'
        const isAuthor = comment.authorId === req.user?.userId

        if (!isAdmin && !isAuthor) {
          return reply.code(403).send({ success: false, error: 'Forbidden' })
        }

        const updatedComment = await commentService.updateComment(id, req.body.content)
        return { success: true, data: updatedComment }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )
}