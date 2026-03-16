import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { frameConfigPlugin } from './vite-plugin-frame-config'

export default defineConfig({
  plugins: [
    react(),
    frameConfigPlugin(),
  ],
})
