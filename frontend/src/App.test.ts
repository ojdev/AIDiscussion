import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from './App.vue'

describe('App.vue', () => {
  it('应正确渲染应用容器', () => {
    const pinia = createPinia()
    const wrapper = mount(App, {
      global: {
        plugins: [pinia]
      }
    })
    expect(wrapper.find('div#app').exists()).toBe(true)
  })

  it('应显示登录或讨论页取决于认证状态', () => {
    const pinia = createPinia()
    const wrapper = mount(App, {
      global: {
        plugins: [pinia]
      }
    })
    // 未登录时显示登录页，已登录显示讨论页
    const text = wrapper.text()
    expect(text).toMatch(/登录|讨论|发帖|帖子/)
  })
})
