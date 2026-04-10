import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock Prisma methods we'll use
const mockPost = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
}

const mockTag = {
  findMany: vi.fn(),
}

const mockUser = {
  findMany: vi.fn(),
}

// Mock the entire PrismaClient
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      get post() { return mockPost }
      get tag() { return mockTag }
      get user() { return mockUser }
      $disconnect = vi.fn()
    }
  }
})

import { PostService } from '../services/postService'

beforeEach(() => {
  mockPost.findMany.mockClear()
  mockPost.findUnique.mockClear()
  mockPost.create.mockClear()
  mockPost.update.mockClear()
  mockPost.delete.mockClear()
  mockPost.count.mockClear()
})

describe('PostService', () => {
  const service = new PostService()

  it('getAllPosts 应返回分页列表及作者信息', async () => {
    mockPost.count.mockResolvedValue(40)
    mockPost.findMany.mockResolvedValue([
      {
        id: 1,
        content: '帖子1',
        authorId: 1,
        createdAt: new Date('2026-04-10'),
        author: {
          id: 1,
          name: 'User1',
          nickname: 'U1',
          avatar: '',
          role: { id: 2, name: '用户' }
        },
        _count: { comments: 5 }
      }
    ])

    const result = await service.getAllPosts(1, 20)
    expect(result.data).toHaveLength(1)
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 40,
      totalPages: 2
    })
    expect(mockPost.count).toHaveBeenCalled()
    expect(mockPost.findMany).toHaveBeenCalledWith({
      include: expect.objectContaining({
        author: expect.any(Object),
        _count: expect.objectContaining({ select: { comments: true } })
      }),
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20
    })
  })

  it('getPostById 应返回帖子详情包含标签和评论', async () => {
    mockPost.findUnique.mockResolvedValue({
      id: 1,
      content: '详情帖',
      author: { id: 1, name: 'A', nickname: 'a', avatar: '', role: { id: 2, name: '用户' } },
      tags: [{ id: 1, name: '技术', color: '#000' }],
      comments: [
        {
          id: 1,
          content: '评论1',
          author: { id: 2, name: 'B', nickname: 'b', avatar: '', role: { id: 1, name: '管理员' } },
          replies: []
        }
      ]
    })

    const result = await service.getPostById(1)
    expect(result?.id).toBe(1)
    expect(result?.tags).toHaveLength(1)
    expect(result?.comments).toHaveLength(1)
  })

  it('createPost 应创建帖子并关联标签', async () => {
    mockPost.create.mockResolvedValue({
      id: 2,
      content: '新帖',
      authorId: 2,
      tags: []
    })
    mockPost.findUnique.mockResolvedValue({
      id: 2,
      content: '新帖',
      author: { id: 2, name: 'A', nickname: 'a', avatar: '', role: { id: 2, name: '用户' } },
      tags: [{ id: 1, name: '标签A' }]
    })

    const result = await service.createPost({
      content: '新帖',
      authorId: 2,
      tagIds: [1]
    })

    expect(result?.content).toBe('新帖')
    expect(result?.tags).toHaveLength(1)
    expect(mockPost.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { tags: { connect: [{ id: 1 }] } }
    })
  })

  it('deletePost 应删除帖子', async () => {
    mockPost.delete.mockResolvedValue({ id: 1, content: '删我' } as any)
    await service.deletePost(1)
    expect(mockPost.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })

  it('updatePost 应更新内容并设置标签', async () => {
    mockPost.findUnique.mockResolvedValue({
      id: 1,
      content: '更新后',
      author: { id: 1, name: 'A', nickname: 'a', avatar: '', role: { id: 2, name: '用户' } },
      tags: [{ id: 2, name: '新标签' }]
    })
    mockPost.update.mockResolvedValue({ id: 1 } as any)

    const result = await service.updatePost(1, '更新后', [2])
    expect(mockPost.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { tags: { set: [{ id: 2 }] } }
    })
    expect(result?.content).toBe('更新后')
  })

  it('updatePost 传入空 tagIds 应清空标签', async () => {
    mockPost.findUnique.mockResolvedValue({
      id: 1,
      content: '更新后',
      author: { id: 1, name: 'A', nickname: 'a', avatar: '', role: { id: 2, name: '用户' } },
      tags: []
    })
    mockPost.update.mockResolvedValue({ id: 1 } as any)

    await service.updatePost(1, '更新后', [])
    expect(mockPost.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { tags: { set: [] } }
    })
  })
})
