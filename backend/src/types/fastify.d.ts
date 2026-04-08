import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      apiKey: string
      userId: number
      role: string
    }
  }

  interface FastifyInstance {
    verifyToken(req: FastifyRequest, reply: FastifyReply): Promise<boolean | any>
    prisma: PrismaClient
  }
}