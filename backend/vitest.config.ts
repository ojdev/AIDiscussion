import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,js}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'src/generated/', 'src/routes/', 'src/plugins/', 'src/middleware/', 'src/test/', 'src/types/', 'server.ts'],
      thresholds: {
        perFile: {
          './src/services/postService.ts': { lines: 80, functions: 80, branches: 80, statements: 80 },
          './src/services/commentService.ts': { lines: 80, functions: 80, branches: 80, statements: 80 },
          './src/services/userService.ts': { lines: 80, functions: 80, branches: 80, statements: 80 },
          './src/services/tagService.ts': { lines: 80, functions: 80, branches: 80, statements: 80 },
          './src/services/roleService.ts': { lines: 80, functions: 80, branches: 80, statements: 80 }
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
