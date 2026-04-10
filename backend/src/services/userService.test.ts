import { vi, describe, it, expect, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'

// Mock PrismaClient before importing services
vi.mock('@prisma/client', () => {
  const mockUserFindUnique = vi.fn()
  const mockUserFindMany = vi.fn()
  const mockUserCreate = vi.fn()
  const mockUserUpdate = vi.fn()
  const mockUserDelete = vi.fn()
  const mockUserCount = vi.fn()
  const mockRole = {
    findUnique: vi.fn(),
    findMany: vi.fn()
  }

  return {
    PrismaClient: class {
      user = {
        findUnique: mockUserFindUnique,
        findMany: mockUserFindMany,
        create: mockUserCreate,
        update: mockUserUpdate,
        delete: mockUserDelete,
        count: mockUserCount
      }
      role = mockRole
      $disconnect = vi.fn()
    }
  }
})

// Mock config
vi.mock('../config.js', () => ({
  default: {
    JWT_SECRET: 'test-secret'
  }
}))

// Mock jwt
vi.mock('jsonwebtoken', () => ({
  sign: vi.fn(() => 'mock-token')
}))

import { UserService } from '../services/userService.js'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('UserService', () => {
  const service = new UserService()

  describe('createUser', () => {
    it('应创建用户', async () => {
      const mockUser = {
        id: 1,
        apiKey: 'key123',
        name: 'Test User',
        nickname: 'Tester',
        roleId: 2,
        avatar: ''
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.user.create.mockResolvedValue(mockUser)

      const result = await service.createUser({
        apiKey: 'key123',
        name: 'Test User',
        nickname: 'Tester',
        roleId: 2
      })

      expect(result).toEqual(mockUser)
      expect(client.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          apiKey: 'key123',
          name: 'Test User',
          nickname: 'Tester',
          roleId: 2
        })
      })
    })
  })

  describe('getUserByApiKey', () => {
    it('应通过API key查找用户', async () => {
      const mockUser = {
        id: 1,
        apiKey: 'key123',
        name: 'User',
        role: { name: 'admin' }
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.getUserByApiKey('key123')

      expect(result).toEqual(mockUser)
      expect(client.user.findUnique).toHaveBeenCalledWith({
        where: { apiKey: 'key123' },
        include: { role: true }
      })
    })

    it('无效API key返回null', async () => {
      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.user.findUnique.mockResolvedValue(null)

      const result = await service.getUserByApiKey('invalid')

      expect(result).toBeNull()
    })
  })

  describe('getAllUsers', () => {
    it('应返回分页用户列表', async () => {
      const mockUsers = [
        { id: 1, name: 'User1', nickname: 'U1', avatar: '', createdAt: new Date(), role: { name: 'user' } },
        { id: 2, name: 'User2', nickname: 'U2', avatar: '', createdAt: new Date(), role: { name: 'admin' } }
      ]

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.user.count.mockResolvedValue(50)
      client.user.findMany.mockResolvedValue(mockUsers)

      const result = await service.getAllUsers(1, 10)

      expect(result.data).toHaveLength(2)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 50,
        totalPages: 5
      })
      expect(client.user.findMany).toHaveBeenCalledWith({
        select: expect.arrayContaining([expect.objectContaining({ id: true, name: true })]),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      })
    })
  })

  describe('getUserById', () => {
    it('应返回用户详情', async () => {
      const mockUser = {
        id: 1,
        name: 'User',
        nickname: 'U',
        avatar: '',
        createdAt: new Date(),
        role: { name: 'user' }
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.getUserById(1)

      expect(result).toEqual(mockUser)
      expect(client.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.objectContaining({
          id: true,
          name: true,
          nickname: true,
          role: expect.any(Object)
        })
      })
    })

    it('未找到用户返回null', async () => {
      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.user.findUnique.mockResolvedValue(null)

      const result = await service.getUserById(999)

      expect(result).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('应更新用户', async () => {
      const updatedUser = { id: 1, name: 'Updated Name', nickname: 'Updated' }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.user.update.mockResolvedValue(updatedUser)

      const result = await service.updateUser(1, { name: 'Updated Name', nickname: 'Updated' })

      expect(client.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated Name', nickname: 'Updated' }
      })
    })
  })

  describe('deleteUser', () => {
    it('应删除用户', async () => {
      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.user.delete.mockResolvedValue({ id: 1 })

      await service.deleteUser(1)

      expect(client.user.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })
  })

  describe('authenticate', () => {
    it('应使用有效API key进行认证', async () => {
      const mockUser = {
        id: 1,
        apiKey: 'key123',
        name: 'User',
        role: { name: 'user' }
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.authenticate('key123')

      expect(result.user).toEqual(mockUser)
      expect(result.token).toBe('mock-token')
      expect(jwt.sign).toHaveBeenCalledWith(
        { apiKey: 'key123', userId: 1, role: 'user' },
        'test-secret',
        { expiresIn: '7d' }
      )
    })

    it('无效API key抛出错误', async () => {
      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.user.findUnique.mockResolvedValue(null)

      await expect(service.authenticate('invalid')).rejects.toThrow('Invalid API key')
    })
  })

  describe('getMe', () => {
    it('应返回当前用户及统计信息', async () => {
      const mockUser = {
        id: 1,
        apiKey: 'key123',
        name: 'User',
        nickname: 'U',
        avatar: '',
        role: { name: 'user' },
        createdAt: new Date()
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.user.findUnique.mockResolvedValue(mockUser)
      client.post.count.mockResolvedValue(5)
      client.comment.count.mockResolvedValue(10)

      const result = await service.getMe(1)

      expect(result).toEqual({
        id: 1,
        apiKey: 'key123',
        name: 'User',
        nickname: 'U',
        role: 'user',
        avatar: '',
        joinedAt: mockUser.createdAt,
        stats: { postCount: 5, commentCount: 10 }
      })
    })

    it('用户不存在抛出错误', async () => {
      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.user.findUnique.mockResolvedValue(null)

      await expect(service.getMe(999)).rejects.toThrow('User not found')
    })
  })

  describe('updateMe', () => {
    it('应更新用户信息并返回更新后的数据', async () => {
      const mockUser = {
        id: 1,
        apiKey: 'key123',
        name: 'User',
        nickname: 'Updated',
        avatar: 'new.jpg',
        role: { name: 'user' },
        createdAt: new Date()
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.user.findUnique.mockResolvedValue(mockUser)
      client.post.count.mockResolvedValue(3)
      client.comment.count.mockResolvedValue(7)

      const result = await service.updateMe(1, { nickname: 'Updated', avatar: 'new.jpg' })

      expect(result.nickname).toBe('Updated')
      expect(result.avatar).toBe('new.jpg')
      expect(client.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nickname: 'Updated', avatar: 'new.jpg' }
      })
    })
  })

  describe('getProfile', () => {
    it('应返回公开用户资料', async () => {
      const mockUser = {
        id: 1,
        name: 'User',
        nickname: 'U',
        avatar: '',
        createdAt: new Date(),
        role: { name: 'user' }
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.user.findUnique.mockResolvedValue(mockUser)
      client.post.count.mockResolvedValue(2)
      client.comment.count.mockResolvedValue(4)

      const result = await service.getProfile(1)

      expect(result).toEqual({
        id: 1,
        name: 'User',
        nickname: 'U',
        role: 'user',
        avatar: '',
        joinedAt: mockUser.createdAt,
        stats: { postCount: 2, commentCount: 4 }
      })
    })

    it('不返回敏感字段（如apiKey）', async () => {
      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'User',
        nickname: 'U',
        apiKey: 'should-not-appear',
        role: { name: 'user' },
        createdAt: new Date()
      })
      client.post.count.mockResolvedValue(0)
      client.comment.count.mockResolvedValue(0)

      const result = await service.getProfile(1)

      expect(result).not.toHaveProperty('apiKey')
    })
  })
})
