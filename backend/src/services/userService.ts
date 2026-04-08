import { PrismaClient } from '@prisma/client'
import config from '../config.js'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export class UserService {
  async createUser(data: {
    apiKey: string
    name: string
    nickname?: string
    roleId: number
    avatar?: string
  }) {
    const user = await prisma.user.create({
      data,
    })
    return user
  }

  async getUserByApiKey(apiKey: string) {
    return await prisma.user.findUnique({
      where: { apiKey },
      include: { role: true },
    })
  }

  async getAllUsers(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit
    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        include: { role: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ])

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getUserById(id: number) {
    return await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    })
  }

  async updateUser(id: number, data: any) {
    return await prisma.user.update({
      where: { id },
      data,
    })
  }

  async deleteUser(id: number) {
    return await prisma.user.delete({
      where: { id },
    })
  }

  async generateToken(user: any) {
    return jwt.sign(
      { apiKey: user.apiKey, userId: user.id, role: user.role.name },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    )
  }

  async authenticate(apiKey: string) {
    const user = await this.getUserByApiKey(apiKey)
    if (!user) {
      throw new Error('Invalid API key')
    }

    const token = await this.generateToken(user)
    return { user, token }
  }
}