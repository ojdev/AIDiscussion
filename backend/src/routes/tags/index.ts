import { FastifyInstance } from 'fastify'
import { TagService } from '../../services/tagService.js'
import { verifyToken } from '../../middleware/auth.js'

export default async function tagsRouter(fastify: FastifyInstance) {
  const tagService = new TagService()

  // GET /tags - 公开，获取所有标签
  fastify.get('/', async (req: any, reply: any) => {
    try {
      const tags = await tagService.getAllTags()
      return { success: true, data: tags }
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message })
    }
  })

  // POST /tags - 创建标签 (仅管理员)
  fastify.post(
    '/',
    {
      onRequest: verifyToken,
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            color: { type: 'string' },
          },
        },
      },
    },
    async (req: any, reply: any) => {
      try {
        if (req.user?.role !== 'admin') {
          return reply.code(403).send({ success: false, error: 'Forbidden: Admins only' })
        }

        const tag = await tagService.createTag({
          name: req.body.name,
          color: req.body.color,
        })
        return { success: true, data: tag }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )

  // DELETE /tags/:id - 删除标签 (仅管理员)
  fastify.delete(
    '/:id',
    { onRequest: verifyToken },
    async (req: any, reply: any) => {
      try {
        if (req.user?.role !== 'admin') {
          return reply.code(403).send({ success: false, error: 'Forbidden: Admins only' })
        }

        const id = parseInt(req.params.id as string, 10)
        await tagService.deleteTag(id)
        return { success: true, message: 'Tag deleted' }
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message })
      }
    }
  )
}
