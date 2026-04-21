/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import path from 'path'

import { getMergedEnv } from './scripts/mergeProjectEnv.mjs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


/** Windows: path.resolve('D:', 'BSTRAVEL') resolves incorrectly — use absolute root path. */
const EXPECTED_DEV_ROOT = path.resolve('D:\\BSTRAVEL')

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

export default defineConfig(() => {
  const merged = getMergedEnv(process.cwd())
  const tourPort = String(merged.TOURAPI_SERVER_PORT || '3080').trim()

  /** `.env` + `.env.local` 병합값으로 클라이언트 `import.meta.env.VITE_*` 고정 (빈 `.env.local` 줄이 `.env`를 덮어쓰지 않도록) */
  const viteDefines = Object.fromEntries(
    Object.entries(merged)
      .filter(([k]) => k.startsWith('VITE_'))
      .map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v ?? '')]),
  )

  return {
    define: viteDefines,
    plugins: [
      devWorkspaceGuard(),
      figmaAssetResolver(),
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
    ],
    server: {
      /** 즐겨찾기·타 도구와 맞추기 위함; 포트 사용 중이면 Vite가 다음 빈 포트로 자동 전환 */
      port: 5174,
      strictPort: false,
      proxy: {
        // `/api/weather` 는 여기 포함 안 함 (README·.env.example 동일). 날씨는 VITE_API_BASE_URL 또는 배포 api/weather.mjs
        // TourAPI 프록시: serviceKey는 Node(server/tourApi.mjs)에서만 주입 — 포트는 TOURAPI_SERVER_PORT 와 동일
        '/api/tour': {
          target: `http://127.0.0.1:${tourPort}`,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err, req) => {
              // eslint-disable-next-line no-console
              console.error(
                `[vite-proxy] /api/tour proxy failure target=http://127.0.0.1:${tourPort} url=${req.url ?? 'unknown'} error=${err.message}`,
              )
            })
          },
        },
        // 혼잡 외부 API 프록시 (crowdApi.mjs · 서버만 CROWD_API_* 사용)
        '/api/crowd': {
          target: `http://127.0.0.1:${tourPort}`,
          changeOrigin: true,
        },
        // 로컬 전용: 배포(dist)에는 포함 안 됨. 프로덕션 동일 도메인 /api/tour·/api/crowd 없으면 깨질 수 있음 → README·docs/deploy-smoke-checklist.md
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
