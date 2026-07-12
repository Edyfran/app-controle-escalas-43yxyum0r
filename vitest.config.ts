/* Vitest config for unit tests of pure src/lib logic — kept separate from vite.config.ts since
   that one's build-mode branching (dev-only uid plugin, rolldown warning suppression) doesn't
   apply to tests. */
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, './src') }],
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
