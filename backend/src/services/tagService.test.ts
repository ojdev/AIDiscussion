import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock PrismaClient before importing services
vi.mock('@prisma/client', () => {
  const mockTagFindMany = vi.fn()
  const mockTagFindUnique = vi.fn()
  const mockTagCreate = vi.fn()
  const mockTagDelete = vi.fn()

  const mockTag = {
    findMany: mockTagFindMany,
    findUnique: mockTagFindUnique,
    create: mockTagCreate,
    delete: mockTagDelete
  }

  // We'll set these mock functions on global for test access
  ;(global as any).__MOCK_TAG__ = mockTag

  return {
    PrismaClient: class {
      tag = mockTag
      $disconnect = vi.fn()
    }
  }
})

import { TagService } from '../services/tagService.js'

beforeEach(() => {
  const mockTag = (global as any).__MOCK_TAG__
  mockTag.findMany.mockClear()
  mockTag.findUnique.mockClear()
  mockTag.create.mockClear()
  mockTag.delete.mockClear()
})

describe('TagService', () => {
  const service = new TagService()
  const mockTag = (global as any).__MOCK_TAG__

  it('getAllTags 应返回所有标签', async () => {
    mockTag.findMany.mockResolvedValue([
      { id: 1, name: '技术', color: '#FF5733' },
      { id: 2, name: '产品', color: '#33FF57' },
      { id: 3, name: '设计', color: '#3357FF' }
    ])
    const tags = await service.getAllTags()
    expect(tags).toHaveLength(3)
    expect(mockTag.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, color: true }
    })
  })

  it('getAllTags 在无标签时返回空数组', async () => {
    mockTag.findMany.mockResolvedValue([])
    const tags = await service.getAllTags()
    expect(tags).toEqual([])
  })

  it('createTag 应创建标签并返回', async () => {
    mockTag.create.mockResolvedValue({ id: 5, name: '新标签', color: '#123456' })
    const result = await service.createTag({ name: '新标签', color: '#123456' })
    expect(result.name).toBe('新标签')
    expect(result.color).toBe('#123456')
    expect(mockTag.create).toHaveBeenCalledWith({
      data: { name: '新标签', color: '#123456' },
      select: { id: true, name: true, color: true }
    })
  })

  it('createTag 标签名重复应抛出错误', async () => {
    mockTag.findUnique.mockResolvedValue({ id: 1, name: '已存在', color: '#000' })
    await expect(service.createTag({ name: '已存在' })).rejects.toThrow('标签名已存在')
    // reset
    mockTag.findUnique.mockClear()
    mockTag.findUnique.mockResolvedValue(null)
    await service.createTag({ name: '新名', color: '#222' })
    expect(mockTag.create).toHaveBeenCalled()
  })

  it('deleteTag 应删除标签', async () => {
    mockTag.delete.mockResolvedValue({ id: 1, name: '删我', color: '#000' } as any)
    await service.deleteTag(1)
    expect(mockTag.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })

  it('deleteTag 不存在的标签抛出错误', async () => {
    mockTag.delete.mockRejectedValue(new Error('记录未找到'))
    await expect(service.deleteTag(999)).rejects.toThrow()
  })
})
