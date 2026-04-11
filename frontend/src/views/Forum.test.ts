import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Forum from '../views/Forum.vue'

// Mock API modules
vi.mock('@/api', () => ({
  postsApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    update: vi.fn()
  },
  commentsApi: {
    getByPostId: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    update: vi.fn()
  },
  searchApi: {
    search: vi.fn()
  },
  tagsApi: {
    getAll: vi.fn()
  }
}))

// Mock store
vi.mock('@/store/user', () => ({
  useUserStore: () => ({
    user: { id: 1, name: 'Test User', nickname: 'Tester', role: 'user', avatar: '' },
    token: 'test-token'
  })
}))

// Mock marked
vi.mock('marked', () => ({
  default: vi.fn((text: string) => `<div>${text}</div>`)
}))

// Import after mocks
import { postsApi, commentsApi, tagsApi } from '@/api'

// Mock useMessage from naive-ui
const mockMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn()
}

// Stub components
const NFormStub = {
  name: 'NForm',
  template: '<form><slot /></form>',
  methods: {
    validate: () => Promise.resolve(true)
  }
}

const naiveUiStubs = {
  NButton: { name: 'NButton', template: '<button><slot /></button>' },
  NCard: { name: 'NCard', template: '<div class="card"><slot /></div>' },
  NInput: { name: 'NInput', template: '<input v-bind="$attrs"><slot /></input>' },
  NSelect: { name: 'NSelect', template: '<select v-bind="$attrs"><slot /></select>' },
  NForm: NFormStub,
  NFormItem: { name: 'NFormItem', template: '<div class="form-item"><slot /></div>' },
  NSpace: { name: 'NSpace', template: '<div class="space"><slot /></div>' },
  NIcon: { name: 'NIcon', template: '<span class="icon"><slot /></span>' },
  NAvatar: { name: 'NAvatar', template: '<img class="avatar" />' },
  NTag: { name: 'NTag', template: '<span class="tag"><slot /></span>' },
  NText: { name: 'NText', template: '<span class="text"><slot /></span>' },
  NEmpty: { name: 'NEmpty', template: '<div class="empty"><slot /></div>' },
  NList: { name: 'NList', template: '<ul><slot /></ul>' },
  NListItem: { name: 'NListItem', template: '<li><slot /></li>' },
  NSpin: { name: 'NSpin', template: '<div class="spin"></div>' },
  NDivider: { name: 'NDivider', template: '<hr />' }
}

describe('Forum.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default resolved values
    tagsApi.getAll.mockResolvedValue({ success: true, data: [] })
    postsApi.getAll.mockResolvedValue({
      success: true,
      data: [],
      pagination: { page: 1, totalPages: 1, total: 0 }
    })
    commentsApi.getByPostId.mockResolvedValue({ success: true, data: [] })
    // Mock create to return success
    postsApi.create.mockResolvedValue({ success: true, data: {} })
    commentsApi.create.mockResolvedValue({ success: true, data: {} })
  })

  it('应加载标签和帖子', async () => {
    const wrapper = mount(Forum, {
      global: {
        stubs: naiveUiStubs,
        mocks: {
          useMessage: () => mockMessage
        }
      }
    })

    await wrapper.vm.$nextTick()
    await flushPromises()

    expect(tagsApi.getAll).toHaveBeenCalled()
    // Actual call: getAll(page, limit, tagId, followingOnly)
    expect(postsApi.getAll).toHaveBeenCalledWith(1, 20, undefined, false)
  })

  it('标签选择', async () => {
    const wrapper = mount(Forum, {
      global: { stubs: naiveUiStubs }
    })
    await wrapper.vm.$nextTick()
    await flushPromises()

    // Simulate tag selection
    wrapper.vm.selectedTagIds = [1]
    expect(wrapper.vm.selectedTagIds).toEqual([1])
  })

  it('应能发帖', async () => {
    const wrapper = mount(Forum, {
      global: {
        stubs: naiveUiStubs,
        mocks: { useMessage: () => mockMessage }
      }
    })
    await wrapper.vm.$nextTick()
    await flushPromises()

    wrapper.vm.newPost.content = 'Test content'
    wrapper.vm.selectedTagIds = [1, 2]

    await wrapper.vm.handlePublish()

    expect(postsApi.create).toHaveBeenCalledWith('Test content', [1, 2])
  })

  it('应能添加评论回复', async () => {
    const wrapper = mount(Forum, {
      global: {
        stubs: naiveUiStubs,
        mocks: { useMessage: () => mockMessage }
      }
    })
    await wrapper.vm.$nextTick()
    await flushPromises()

    wrapper.vm.newComments[1] = 'Comment'
    await wrapper.vm.handleAddComment(1)

    expect(commentsApi.create).toHaveBeenCalledWith(1, 'Comment', undefined, [])
  })

  it('应能添加嵌套回复', async () => {
    const wrapper = mount(Forum, {
      global: {
        stubs: naiveUiStubs,
        mocks: { useMessage: () => mockMessage }
      }
    })
    await wrapper.vm.$nextTick()
    await flushPromises()

    // For nested reply, key is parentId (2) not postId (1)
    wrapper.vm.newComments[2] = 'Reply'
    wrapper.vm.commentTagIds[2] = [3]
    await wrapper.vm.handleAddComment(1, 2)

    expect(commentsApi.create).toHaveBeenCalledWith(1, 'Reply', 2, [3])
  })
})
