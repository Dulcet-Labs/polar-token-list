import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@polar/shared': path.resolve(__dirname, '../../shared'),
    },
  },
  server: {
    port: 3000,
    host: true,
    fs: {
      // Allow serving files from the token service data directory
      allow: ['..', '../token-service/data']
    }
  },
  publicDir: 'public',
  // Copy token service data to public directory during build
  define: {
    __TOKEN_SERVICE_DATA_PATH__: JSON.stringify('/packages/token-service/data')
  }
})
