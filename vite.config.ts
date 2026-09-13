import { defineConfig } from 'vitest/config'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { rrtwBackupPlugin } from './vite.rrtw-backup-plugin.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), rrtwBackupPlugin()],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.ts'],
  },
})
