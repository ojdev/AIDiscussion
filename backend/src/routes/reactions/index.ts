import { FastifyInstance } from 'fastify'
import { ReactionService } from '../../services/reactionService.js'
import { verifyToken } from '../../middleware/auth.js'

export default async function reactionsRouter(fastify: FastifyInstance) {
  const reactionService = new ReactionService()

  // POST /posts/:id/like - 点赞/取消点赞帖子
  fastify.post(
    '/posts/:id/like',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const postId = parseInt(req.params.id as string, 10)
        const userId = req.user?.userId
        if (!userId) {
          return reply.code(401).send({ success: false, error: 'Unauthorized' })
        }

        const result = await reactionService.toggleLikePost(userId, postId)
        return { success: true, data: result }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // POST /comments/:id/like - 点赞/取消点赞评论
  fastify.post(
    '/comments/:id/like',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const commentId = parseInt(req.params.id as string, 10)
        const userId = req.user?.userId
        if (!userId) {
          return reply.code(401).send({ success: false, error: 'Unauthorized' })
        }

        const result = await reactionService.toggleLikeComment(userId, commentId)
        return { success: true, data: result }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )
}
