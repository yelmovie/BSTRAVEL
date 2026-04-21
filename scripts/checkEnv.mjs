/**
 * 로컬 개발용 환경 변수 상태 점검 (비밀값 전체 출력 금지)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getMergedEnv } from './mergeProjectEnv.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

/** @param {string | undefined} val */
function maskSecret(val) {
  const s = typeof val === 'string' ? val.trim() : ''
  if (!s) return '(empty)'
  if (s.length <= 8) return `${s.slice(0, 2)}… (${s.length} chars)`
  return `${s.slice(0, 4)}…${s.slice(-4)} (${s.length} chars)`
}

const merged = getMergedEnv(projectRoot)
const envFile = path.join(projectRoot, '.env')
const localFile = path.join(projectRoot, '.env.local')

const hasEnv = fs.existsSync(envFile)
const hasLocal = fs.existsSync(localFile)

let exitCode = 0

console.log('[env:check] project root:', projectRoot)
console.log('[env:check] files present — .env:', hasEnv, ' .env.local:', hasLocal)

if (!hasLocal && !hasEnv) {
  console.log('[env:check] WARNING: Neither .env nor .env.local exists.')
  console.log('[env:check] Run: pnpm env:restore   then fill keys and restart pnpm dev.')
  exitCode = 1
} else if (!hasLocal) {
  console.log('[env:check] NOTE: .env.local is missing (OK if all secrets are in .env only).')
}

/** @type {{ key: string; label: string; critical: boolean }[]} */
const checks = [
  { key: 'VISITKOREA_SERVICE_KEY', label: 'TourAPI 프록시 (서버)', critical: true },
  { key: 'VITE_KAKAO_MAP_JS_KEY', label: '카카오맵 JS 키 (클라이언트 번들)', critical: true },
  { key: 'VISITKOREA_MOBILE_APP', label: 'TourAPI MobileApp (선택, 기본 MovieSSam)', critical: false },
  { key: 'TOURAPI_SERVER_PORT', label: '프록시 포트 (선택, 기본 3080)', critical: false },
  { key: 'VITE_APP_NAME', label: '앱 표시명 (선택)', critical: false },
]

for (const { key, label, critical } of checks) {
  const raw = merged[key]
  const ok = typeof raw === 'string' && raw.trim() !== ''
  if (!ok) {
    if (critical) {
      console.log(`[env:check] MISSING: ${key} — ${label}`)
      exitCode = 1
    } else {
      console.log(`[env:check] optional (empty / defaults): ${key} — ${label}`)
    }
  } else {
    console.log(`[env:check] OK ${key}:`, maskSecret(raw), `— ${label}`)
  }
}

console.log('[env:check] Optional flags (documented in .env.example): TOURAPI_PROXY_DEBUG, TOURAPI_DEBUG, TOURAPI_THROW_IF_NO_KEY')

if (exitCode !== 0) {
  console.log('[env:check] Fill missing values in .env.local (or .env), then restart pnpm dev.')
}

process.exit(exitCode)
