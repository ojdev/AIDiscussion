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
        select: {
          id: true,
          name: true,
          nickname: true,
          avatar: true,
          createdAt: true,
          role: true,
        },
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
      select: {
        id: true,
        name: true,
        nickname: true,
        avatar: true,
        createdAt: true,
        role: true,
      },
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

  // Get current user with stats (for GET /users/me)
  async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    })
    if (!user) {
      throw new Error('User not found')
    }

    // Get stats
    const [postCount, commentCount] = await Promise.all([
      prisma.post.count({ where: { authorId: userId } }),
      prisma.comment.count({ where: { authorId: userId } }),
    ])

    // Return consistent shape with role as string
    return {
      id: user.id,
      apiKey: user.apiKey,
      name: user.name,
      nickname: user.nickname,
      role: user.role.name,
      avatar: user.avatar,
      joinedAt: user.createdAt,
      stats: { postCount, commentCount },
    }
  }

  // Update current user (only nickname and avatar allowed)
  async updateMe(userId: number, data: { nickname?: string; avatar?: string }) {
    // Only allow updating nickname and avatar
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.nickname !== undefined && { nickname: data.nickname }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      },
    })
    // Return updated user with stats and role as string
    return await this.getMe(userId)
  }

  // Get public user profile with stats (for GET /users/:id)
  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        nickname: true,
        avatar: true,
        createdAt: true,
        role: true,
      },
    })
    if (!user) {
      throw new Error('User not found')
    }

    // Get stats
    const [postCount, commentCount] = await Promise.all([
      prisma.post.count({ where: { authorId: userId } }),
      prisma.comment.count({ where: { authorId: userId } }),
    ])

    // Return public profile with role as string
    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      role: user.role.name,
      avatar: user.avatar,
      joinedAt: user.createdAt,
      stats: { postCount, commentCount },
    }
  }
}