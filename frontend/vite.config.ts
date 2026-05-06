import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const PROD_BASE = '/todify/'

// https://vitejs.dev/config/
// 开发环境 base 用 /，避免 HMR WebSocket 落在 /todify/ 时握手失败（控制台 client:1035 ping 报错）
export default defineConfig(({ command, mode }) => {
  const useRootBase = command === 'serve' && mode === 'development'
  return {
    plugins: [react()],
    server: {
      port: 3001,
      strictPort: true,
      proxy: {
        '/api/v1': {
          target: process.env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8214',
          changeOrigin: true,
          secure: false,
        },
        '/api/dify': {
          target: process.env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8214',
          changeOrigin: true,
          secure: false,
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
    base: useRootBase ? '/' : PROD_BASE,
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
  }
})