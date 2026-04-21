import { execSync } from 'child_process'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const gitHash = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'dev'
  }
})()

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __GIT_HASH__: JSON.stringify(gitHash),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      includeAssets: ['appIcon.png', 'appIcon-192.png', 'appIcon-maskable.png', 'appIcon-192-maskable.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Wastelessful',
        short_name: 'Wastelessful',
        description: 'Track food and household items to avoid waste',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'appIcon-192.png',          sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'appIcon-192-maskable.png',  sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'appIcon.png',              sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'appIcon-maskable.png',     sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
