import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/services/**/*.ts', 'src/stores/**/*.ts', 'src/utils/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
