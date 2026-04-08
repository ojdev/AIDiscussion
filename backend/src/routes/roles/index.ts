import { FastifyInstance } from 'fastify'
import { RoleService } from '../../services/roleService.js'
import { verifyToken } from '../../middleware/auth.js'

export default async function rolesRouter(fastify: FastifyInstance) {
  const roleService = new RoleService()

  // GET /roles - 获取所有角色
  fastify.get(
    '/',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        const roles = await roleService.getAllRoles()
        return { success: true, data: roles }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )
}