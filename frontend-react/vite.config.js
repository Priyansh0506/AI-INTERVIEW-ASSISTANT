import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['face-api.js']
  },
  build: {
    rolldownOptions: {
      external: [],
    },
    commonjsOptions: {
      include: [/face-api.js/, /node_modules/]
    }
  }
})
