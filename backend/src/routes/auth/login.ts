import { FastifyInstance } from 'fastify'
import { UserService } from '../../services/userService.js'

export default async function loginRoute(fastify: FastifyInstance) {
  const userService = new UserService()

  fastify.post(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['apiKey'],
          properties: {
            apiKey: { type: 'string' },
          },
        },
      },
    },
    async (req: any, reply: any) => {
      try {
        const { apiKey } = req.body as { apiKey: string }
        const result = await userService.authenticate(apiKey)

        return {
          success: true,
          data: {
            user: {
              id: result.user.id,
              apiKey: result.user.apiKey,
              name: result.user.name,
              nickname: result.user.nickname,
              role: result.user.role.name,
              avatar: result.user.avatar,
            },
            token: result.token,
          },
        }
      } catch (error: any) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid API key',
        })
      }
    }
  )
}