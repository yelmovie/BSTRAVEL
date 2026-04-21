/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


const EXPECTED_DEV_ROOT = path.resolve('D:', 'BSTRAVEL')

function sameRootDir(a: string, b: string) {
  return path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase()
}

function devWorkspaceGuard() {
  return {
    name: 'dev-workspace-guard',
    configureServer() {
      const cwd = path.resolve(process.cwd())
      // eslint-disable-next-line no-console
      console.log('[BSTRAVEL] dev server working directory:', cwd)
      if (!sameRootDir(cwd, EXPECTED_DEV_ROOT)) {
        // eslint-disable-next-line no-console
        console.warn(
          '⚠️ You are NOT working on SSD project folder (expected D:\\BSTRAVEL)',
        )
      }
    },
  }
}

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const tourPort = (env.TOURAPI_SERVER_PORT || '3080').trim()

  return {
    plugins: [
      devWorkspaceGuard(),
      figmaAssetResolver(),
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        // TourAPI 프록시: serviceKey는 Node(server/tourApi.mjs)에서만 주입 — 포트는 TOURAPI_SERVER_PORT 와 동일
        '/api/tour': {
          target: `http://127.0.0.1:${tourPort}`,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],

    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
      passWithNoTests: false,
    },
  }
})
