import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: './postcss.config.cjs',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://br90xiwuh4.execute-api.ap-south-1.amazonaws.com',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'https://br90xiwuh4.execute-api.ap-south-1.amazonaws.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
