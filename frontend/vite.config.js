import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,        // no source maps in production
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 5173,
      // Proxy only applies in development (when VITE_API_URL points to localhost)
      proxy: mode === 'development' ? {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        }
      } : undefined,
    },
  }
})
