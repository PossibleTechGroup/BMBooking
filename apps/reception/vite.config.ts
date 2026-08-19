import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '.'), '')
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:52400'

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 53401,
      allowedHosts: ['reception.possibletechplc.com'],
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 3001,
      allowedHosts: true as any,
    },
  }
})
