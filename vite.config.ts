import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { expressPlugin } from './vite-plugin-express.js'

export default defineConfig({
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: false,
  },
  preview: {
    port: 4173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
