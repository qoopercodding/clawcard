import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { frameConfigPlugin } from './vite-plugin-frame-config'

export default defineConfig(({ command }) => ({
  // GitHub Pages deployment — base musi pasować do nazwy repo
  base: command === 'build' ? '/clawcard/' : '/',
  plugins: [
    react(),
    // Vite plugin działa tylko w dev — w build jest pomijany
    ...(command === 'serve' ? [frameConfigPlugin()] : []),
  ],
}))
