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
  const mockRoleFindUnique = vi.fn()
  const mockRoleFindMany = vi.fn()
  const mockPostCount = vi.fn()
  const mockCommentCount = vi.fn()
  const mockFollowCount = vi.fn()

  const mocks = {
    user: {
      findUnique: mockUserFindUnique,
      findMany: mockUserFindMany,
      create: mockUserCreate,
      update: mockUserUpdate,
      delete: mockUserDelete,
      count: mockUserCount
    },
    role: {
      findUnique: mockRoleFindUnique,
      findMany: mockRoleFindMany
    },
    post: { count: mockPostCount },
    comment: { count: mockCommentCount },
    follow: { count: mockFollowCount }
  }

  ;(global as any).__MOCK_PRISMA__ = mocks

  return {
    PrismaClient: class {
      user = mocks.user
      role = mocks.role
      post = mocks.post
      comment = mocks.comment
      follow = mocks.follow
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
  default: { sign: vi.fn(() => 'mock-token') }
}))

import { UserService } from '../services/userService.js'

beforeEach(() => {
  const mocks = (global as any).__MOCK_PRISMA__
  if (mocks) {
    vi.clearAllMocks()
    mocks.user.findUnique.mockClear?.()
    mocks.user.findMany.mockClear?.()
    mocks.user.create.mockClear?.()
    mocks.user.update.mockClear?.()
    mocks.user.delete.mockClear?.()
    mocks.user.count.mockClear?.()
    mocks.role.findUnique.mockClear?.()
    mocks.role.findMany.mockClear?.()
    mocks.post.count.mockResolvedValue(0)
    mocks.comment.count.mockResolvedValue(0)
    mocks.follow.count.mockResolvedValue(0)
  }
})

describe('UserService', () => {
  const service = new UserService()
  const mocks = (global as any).__MOCK_PRISMA__

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

      mocks.user.create.mockResolvedValue(mockUser)

      const result = await service.createUser({
        apiKey: 'key123',
        name: 'Test User',
        nickname: 'Tester',
        roleId: 2
      })

      expect(result).toEqual(mockUser)
      expect(mocks.user.create).toHaveBeenCalledWith({
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

      mocks.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.getUserByApiKey('key123')

      expect(result).toEqual(mockUser)
      expect(mocks.user.findUnique).toHaveBeenCalledWith({
        where: { apiKey: 'key123' },
        include: { role: true }
      })
    })

    it('无效API key返回null', async () => {
      mocks.user.findUnique.mockResolvedValue(null)

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

      mocks.user.count.mockResolvedValue(50)
      mocks.user.findMany.mockResolvedValue(mockUsers)

      const result = await service.getAllUsers(1, 10)

      expect(result.data).toHaveLength(2)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 50,
        totalPages: 5
      })
      expect(mocks.user.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({
          id: true,
          name: true,
          nickname: true,
          avatar: true,
          createdAt: true,
          role: true
        }),
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

      mocks.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.getUserById(1)

      expect(result).toEqual(mockUser)
      expect(mocks.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.objectContaining({
          id: true,
          name: true,
          nickname: true,
          avatar: true,
          createdAt: true,
          role: true
        })
      })
    })

    it('未找到用户返回null', async () => {
      mocks.user.findUnique.mockResolvedValue(null)

      const result = await service.getUserById(999)

      expect(result).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('应更新用户', async () => {
      const updatedUser = { id: 1, name: 'Updated Name' }
      mocks.user.update.mockResolvedValue(updatedUser)

      const result = await service.updateUser(1, { name: 'Updated Name' })

      expect(result).toEqual(updatedUser)
      expect(mocks.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated Name' }
      })
    })
  })

  describe('deleteUser', () => {
    it('应删除用户', async () => {
      const deletedUser = { id: 1 }
      mocks.user.delete.mockResolvedValue(deletedUser)

      await service.deleteUser(1)

      expect(mocks.user.delete).toHaveBeenCalledWith({ where: { id: 1 } })
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

      mocks.user.findUnique.mockResolvedValue(mockUser)

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
      mocks.user.findUnique.mockResolvedValue(null)

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

      mocks.user.findUnique.mockResolvedValue(mockUser)
      mocks.post.count.mockResolvedValue(5)
      mocks.comment.count.mockResolvedValue(10)
      // Two follow count queries: followingCount (followerId) then followerCount (followingId)
      mocks.follow.count.mockResolvedValueOnce(3)
      mocks.follow.count.mockResolvedValueOnce(7)

      const result = await service.getMe(1)

      expect(result).toEqual({
        id: 1,
        apiKey: 'key123',
        name: 'User',
        nickname: 'U',
        role: 'user',
        avatar: '',
        joinedAt: mockUser.createdAt,
        stats: {
          postCount: 5,
          commentCount: 10,
          followingCount: 3,
          followerCount: 7
        }
      })
    })

    it('用户不存在抛出错误', async () => {
      mocks.user.findUnique.mockResolvedValue(null)

      await expect(service.getMe(999)).rejects.toThrow('User not found')
    })
  })

  describe('updateMe', () => {
    it('应更新用户信息并返回更新后的数据', async () => {
      const updatedUser = {
        id: 1,
        apiKey: 'key123',
        name: 'User',
        nickname: 'New Nick',
        avatar: '',
        role: { name: 'user' },
        createdAt: new Date()
      }

      mocks.user.findUnique.mockResolvedValue(updatedUser)
      mocks.post.count.mockResolvedValue(3)
      mocks.comment.count.mockResolvedValue(7)

      const result = await service.updateMe(1, { nickname: 'New Nick' })

      expect(result).toEqual({
        id: 1,
        apiKey: 'key123',
        name: 'User',
        nickname: 'New Nick',
        role: 'user',
        avatar: '',
        joinedAt: updatedUser.createdAt,
        stats: {
          postCount: 3,
          commentCount: 7,
          followingCount: 0,
          followerCount: 0
        }
      })
      expect(mocks.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nickname: 'New Nick' }
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

      mocks.user.findUnique.mockResolvedValue(mockUser)
      mocks.post.count.mockResolvedValue(2)
      mocks.comment.count.mockResolvedValue(4)
      mocks.follow.count.mockResolvedValue(5) // following
      mocks.follow.count.mockResolvedValue(10) // followers

      const result = await service.getProfile(1)

      expect(result).toEqual({
        id: 1,
        name: 'User',
        nickname: 'U',
        avatar: '',
        joinedAt: mockUser.createdAt,
        role: 'user',
        stats: {
          postCount: 2,
          commentCount: 4,
          followingCount: 5,
          followerCount: 10
        }
      })
      // Ensure apiKey not included
      expect(result).not.toHaveProperty('apiKey')
    })

    it('不返回敏感字段（如apiKey）', async () => {
      const mockUser = {
        id: 1,
        apiKey: 'secret-key',
        name: 'User',
        role: { name: 'user' },
        createdAt: new Date()
      }

      mocks.user.findUnique.mockResolvedValue(mockUser)
      mocks.post.count.mockResolvedValue(0)
      mocks.comment.count.mockResolvedValue(0)
      mocks.follow.count.mockResolvedValue(0)
      mocks.follow.count.mockResolvedValue(0)

      const result = await service.getProfile(1)

      expect(result).not.toHaveProperty('apiKey')
    })
  })
})
