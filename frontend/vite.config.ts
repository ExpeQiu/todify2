import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: true,
    proxy: {
      '/api/v1': {
        target: 'http://127.0.0.1:3003',
        changeOrigin: true,
        secure: false,
      },
      '/api/dify': {
        target: 'http://127.0.0.1:3003',
        changeOrigin: true,
        secure: false,
      },
      '/api/workflow-stats': {
        target: 'http://127.0.0.1:3003',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/workflow-stats/, '/api/v1/workflow-stats'),
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  base: '/',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})