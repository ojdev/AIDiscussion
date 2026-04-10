import { FastifyInstance } from 'fastify'
import { FollowService } from '../../services/followService.js'
import { verifyToken } from '../../middleware/auth.js'

export default async function followsRouter(fastify: FastifyInstance) {
  const followService = new FollowService()

  // POST /users/:id/follow - 关注/取消关注
  fastify.post(
    '/users/:id/follow',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const targetId = parseInt(req.params.id as string, 10)
        const followerId = req.user?.userId
        if (!followerId) {
          return reply.code(401).send({ success: false, error: 'Unauthorized' })
        }

        const result = await followService.toggleFollow(followerId, targetId)
        return { success: true, data: result }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // GET /users/:id/following - 获取用户关注列表
  fastify.get('/users/:id/following', async (req: any, reply: any) => {
    try {
      const userId = parseInt(req.params.id as string, 10)
      const following = await followService.getFollowing(userId)
      return { success: true, data: following }
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message })
    }
  })

  // GET /users/:id/followers - 获取粉丝列表
  fastify.get('/users/:id/followers', async (req: any, reply: any) => {
    try {
      const userId = parseInt(req.params.id as string, 10)
      const followers = await followService.getFollowers(userId)
      return { success: true, data: followers }
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message })
    }
  })

  // GET /users/:id/is-following - 检查是否已关注 (需认证)
  fastify.get('/users/:id/is-following', { onRequest: verifyToken }, async (req: any, reply: any) => {
    try {
      const targetId = parseInt(req.params.id as string, 10)
      const userId = req.user?.userId
      if (!userId) {
        return reply.code(401).send({ success: false, error: 'Unauthorized' })
      }

      const isFollowing = await followService.checkIsFollowing(userId, targetId)
      return { success: true, data: { isFollowing } }
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message })
    }
  })
}

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
