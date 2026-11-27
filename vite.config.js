import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_PATH permite publicar em um subcaminho (ex.: GitHub Pages em /talesludos-react/).
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()]
})
