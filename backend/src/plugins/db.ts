import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'

const prisma = new PrismaClient()

export default async function dbPlugin(fastify: FastifyInstance) {
  fastify.decorate('prisma', prisma)

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
}