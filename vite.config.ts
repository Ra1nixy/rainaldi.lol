import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    force: true // Force dependency pre-bundling
  },
  server: {
    hmr: {
      overlay: true
    },
    // Proxy for Vercel Functions in local dev
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})