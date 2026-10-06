import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      // OpenAPI spec and Swagger UI (/q/openapi, /q/swagger-ui)
      '/q': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../src/main/resources/META-INF/resources',
    emptyOutDir: true
  }
})
