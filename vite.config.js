import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/minecraft-rank-generator-RU/', // ✅ название репозитория на GitHub (с учётом регистра!)
  plugins: [vue()],
  build: {
    outDir: 'dist'
  }
})
