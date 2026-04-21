/**
 * 프로젝트 루트 `.env` + `.env.local` 병합
 *
 * 규칙:
 * - 먼저 `.env`를 반영합니다.
 * - 그다음 `.env.local`에서 **값이 비어 있지 않은 키만** 덮어씁니다.
 *   (예시용으로 남아 있는 `KEY=` 빈 줄이 `.env`의 유효한 값을 막지 않도록)
 */
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'dotenv'

/**
 * @param {string} projectRoot
 * @returns {Record<string, string>}
 */
export function getMergedEnv(projectRoot) {
  const envPath = path.join(projectRoot, '.env')
  const localPath = path.join(projectRoot, '.env.local')
  /** @type {Record<string, string>} */
  let merged = {}
  if (fs.existsSync(envPath)) {
    Object.assign(merged, parse(fs.readFileSync(envPath, 'utf8')))
  }
  if (fs.existsSync(localPath)) {
    const local = parse(fs.readFileSync(localPath, 'utf8'))
    for (const [k, v] of Object.entries(local)) {
      const t = String(v ?? '').trim()
      if (t !== '') merged[k] = String(v).trim()
    }
  }
  return merged
}

/**
 * @param {string} projectRoot
 */
export function applyMergedEnv(projectRoot) {
  const merged = getMergedEnv(projectRoot)
  for (const [k, v] of Object.entries(merged)) {
    process.env[k] = v == null ? '' : String(v)
  }
}
