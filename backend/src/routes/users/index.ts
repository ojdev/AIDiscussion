import { FastifyInstance } from 'fastify'
import { UserService } from '../../services/userService.js'
import { verifyToken } from '../../middleware/auth.js'

export default async function usersRouter(fastify: FastifyInstance) {
  const userService = new UserService()

  // GET /users - 获取所有用户（分页）
  fastify.get(
    '/',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 50
        const result = await userService.getAllUsers(page, limit)
        return { success: true, data: result.data, pagination: result.pagination }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // GET /users/:id - 获取单个用户
  fastify.get(
    '/:id',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const id = parseInt(req.params.id as string, 10)
        const user = await userService.getUserById(id)
        if (!user) {
          return reply.code(404).send({ success: false, error: 'User not found' })
        }
        return { success: true, data: user }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // POST /users - 创建用户
  fastify.post(
    '/',
    {
      onRequest: verifyToken,
      schema: {
        body: {
          type: 'object',
          required: ['apiKey', 'name', 'roleId'],
          properties: {
            apiKey: { type: 'string' },
            name: { type: 'string' },
            nickname: { type: 'string' },
            roleId: { type: 'number' },
            avatar: { type: 'string' },
          },
        },
      },
    },
    async (req: any, reply: any) => {
      try {
        const user = await userService.createUser(req.body)
        return { success: true, data: user }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // PUT /users/:id - 更新用户
  fastify.put(
    '/:id',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const id = parseInt(req.params.id as string, 10)
        const user = await userService.updateUser(id, req.body)
        return { success: true, data: user }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // DELETE /users/:id - 删除用户
  fastify.delete(
    '/:id',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const id = parseInt(req.params.id as string, 10)
        await userService.deleteUser(id)
        return { success: true, message: 'User deleted' }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )
}