import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock global fetch if needed
global.fetch = vi.fn()

// Mock naive-ui components that might be complex
vi.mock('naive-ui', () => ({
  NButton: {
    name: 'NButton',
    template: '<button><slot /></button>'
  },
  NCard: {
    name: 'NCard',
    template: '<div class="n-card"><slot /></div>'
  },
  NInput: {
    name: 'NInput',
    template: '<input><slot /></input>'
  },
  NSelect: {
    name: 'NSelect',
    template: '<select><slot /></select>'
  },
  NForm: {
    name: 'NForm',
    template: '<form><slot /></form>'
  },
  NFormItem: {
    name: 'NFormItem',
    template: '<div class="n-form-item"><slot /></div>'
  },
  NSpace: {
    name: 'NSpace',
    template: '<div class="n-space"><slot /></div>'
  },
  NIcon: {
    name: 'NIcon',
    template: '<span class="n-icon"><slot /></span>'
  },
  NAvatar: {
    name: 'NAvatar',
    template: '<img class="n-avatar" :src="src" />'
  },
  NTag: {
    name: 'NTag',
    template: '<span class="n-tag"><slot /></span>'
  },
  NText: {
    name: 'NText',
    template: '<span class="n-text"><slot /></span>'
  },
  NEmpty: {
    name: 'NEmpty',
    template: '<div class="n-empty"><slot /></div>'
  },
  NList: {
    name: 'NList',
    template: '<ul class="n-list"><slot /></ul>'
  },
  NListItem: {
    name: 'NListItem',
    template: '<li class="n-list-item"><slot /></li>'
  },
  NSpin: {
    name: 'NSpin',
    template: '<div class="n-spin"></div>'
  },
  useMessage: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  })
}))

// Mock the API
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

// Mock marked
vi.mock('marked', () => ({
  default: (text: string) => `<div>${text}</div>`
}))

// Mock icons
vi.mock('@vicons/ionicons5', () => ({
  Search: {
    template: '<svg></svg>'
  }
}))

// Mock store
vi.mock('@/store/user', () => ({
  useUserStore: () => ({
    user: {
      id: 1,
      name: 'Test User',
      nickname: 'Tester',
      role: 'user',
      avatar: ''
    }
  })
}))
