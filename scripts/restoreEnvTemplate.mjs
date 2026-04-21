/**
 * `.env.local` 이 없을 때만 예시 파일에서 복사합니다. 기존 파일은 덮어쓰지 않습니다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

const dest = path.join(projectRoot, '.env.local')

const templateCandidates = ['.env.local.example', 'env.local.example']

function findTemplate() {
  for (const name of templateCandidates) {
    const p = path.join(projectRoot, name)
    if (fs.existsSync(p)) return p
  }
  return null
}

const templatePath = findTemplate()

if (!templatePath) {
  console.error('[env:restore] No template found. Expected one of:', templateCandidates.join(', '))
  process.exit(1)
}

if (fs.existsSync(dest)) {
  console.log('[env:restore] .env.local already exists — not overwriting:')
  console.log('           ', dest)
  console.log('[env:restore] Edit it manually, or delete it first to recreate from template.')
  process.exit(0)
}

fs.copyFileSync(templatePath, dest)
console.log('[env:restore] Created:', dest)
console.log('[env:restore] From template:', path.basename(templatePath))
console.log('[env:restore] Next: set VISITKOREA_SERVICE_KEY and VITE_KAKAO_MAP_JS_KEY (optional CROWD_API_* on server), then run pnpm env:check')
console.log('[env:restore] Restart pnpm dev after saving.')
process.exit(0)
