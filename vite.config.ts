import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Without this, Vite's dep scanner also picks up agent/src/renderer/index.html
  // (a separate Electron sub-project with its own node_modules/react-dom copy)
  // and mixes that build into this app's shared dependency cache, causing a
  // duplicate-React-instance "Invalid hook call" crash.
  optimizeDeps: {
    entries: ['index.html'],
  },
  server: {
    watch: {
      ignored: ['**/agent/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
