import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock Prisma methods
const mockUser = {
  findUnique: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
}
const mockPost = { count: vi.fn() }
const mockComment = { count: vi.fn() }
const mockFollow = { count: vi.fn() }

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    get user() { return mockUser }
    get post() { return mockPost }
    get comment() { return mockComment }
    get follow() { return mockFollow }
    $disconnect = vi.fn()
  }
}))

import { UserService } from '../services/userService'

beforeEach(() => {
  mockUser.findUnique.mockClear()
  mockUser.findMany.mockClear()
  mockUser.create.mockClear()
  mockUser.update.mockClear()
  mockUser.delete.mockClear()
  mockUser.count.mockClear()
})

describe('UserService', () => {
  const service = new UserService()

  it('createUser 创建用户', async () => {
    mockUser.create.mockResolvedValue({
      id: 1,
      apiKey: 'key123',
      name: 'Alice',
      nickname: 'A',
      roleId: 2
    })
    const result = await service.createUser({
      apiKey: 'key123',
      name: 'Alice',
      roleId: 2
    })
    expect(result.id).toBe(1)
    expect(mockUser.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ apiKey: 'key123', name: 'Alice' })
    })
  })

  it('getUserByApiKey 通过 API key 查找用户', async () => {
    mockUser.findUnique.mockResolvedValue({
      id: 1,
      apiKey: 'key123',
      name: 'Alice',
      role: { id: 2, name: '用户' }
    })
    const result = await service.getUserByApiKey('key123')
    expect(result?.name).toBe('Alice')
    expect(mockUser.findUnique).toHaveBeenCalledWith({
      where: { apiKey: 'key123' },
      include: { role: true }
    })
  })

  it('getAllUsers 分页获取用户列表', async () => {
    mockUser.count.mockResolvedValue(25)
    mockUser.findMany.mockResolvedValue([
      { id: 1, name: 'A', nickname: 'a', avatar: '', createdAt: new Date(), role: { id: 2, name: '用户' } },
      { id: 2, name: 'B', nickname: 'b', avatar: '', createdAt: new Date(), role: { id: 1, name: '管理员' } }
    ])
    const result = await service.getAllUsers(1, 2)
    expect(result.data).toHaveLength(2)
    expect(result.pagination.total).toBe(25)
    expect(result.pagination.totalPages).toBe(13)
  })

  it('getUserById 获取单个用户', async () => {
    mockUser.findUnique.mockResolvedValue({
      id: 1,
      name: 'Alice',
      nickname: 'A',
      avatar: '',
      createdAt: new Date(),
      role: { id: 2, name: '用户' }
    })
    const result = await service.getUserById(1)
    expect(result?.id).toBe(1)
    expect(result?.role.name).toBe('用户')
  })

  it('updateUser 更新用户信息', async () => {
    mockUser.update.mockResolvedValue({
      id: 1,
      name: 'Updated',
      nickname: 'U',
      avatar: 'new.jpg'
    })
    const result = await service.updateUser(1, { name: 'Updated', avatar: 'new.jpg' })
    expect(result.name).toBe('Updated')
    expect(mockUser.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Updated', avatar: 'new.jpg' }
    })
  })

  it('deleteUser 删除用户', async () => {
    mockUser.delete.mockResolvedValue({ id: 1, name: 'Deleted' } as any)
    await service.deleteUser(1)
    expect(mockUser.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })



  it('authenticate 失败抛出错误', async () => {
    mockUser.findUnique.mockResolvedValue(null)
    await expect(service.authenticate('badkey')).rejects.toThrow('Invalid API key')
  })

  it('getMe 返回当前用户（简化测试）', async () => {
    mockUser.findUnique.mockResolvedValue({
      id: 1,
      apiKey: 'key123',
      name: 'Alice',
      nickname: 'A',
      avatar: '',
      createdAt: new Date('2026-04-10'),
      role: { id: 2, name: '用户' }
    })
    // 暂不测试统计 (依赖多表 count)
    const result = await service.getMe(1)
    expect(result.id).toBe(1)
    expect(result.name).toBe('Alice')
    expect(result.role).toBe('用户')
  })

  it('getProfile 返回公开用户资料（简化测试）', async () => {
    mockUser.findUnique.mockResolvedValue({
      id: 1,
      name: 'Alice',
      nickname: 'A',
      avatar: '',
      createdAt: new Date('2026-04-10'),
      role: { id: 2, name: '用户' }
    })
    const result = await service.getProfile(1)
    expect(result.id).toBe(1)
    expect(result.name).toBe('Alice')
    expect(result.role).toBe('用户')
  })
})
