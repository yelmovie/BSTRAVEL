/**
 * 로컬 Node 서버에서 `/api/weather` — 로직은 weatherShared.mjs 와 Vercel api/weather 동일
 */
import { getWeatherJsonForRequest } from './weatherShared.mjs'

/**
 * @param {URL} url
 * @param {import('node:http').ServerResponse} res
 * @param {(res: import('node:http').ServerResponse, status: number, obj: unknown) => void} sendJson
 */
export async function handleWeatherProxy(url, res, sendJson) {
  const result = await getWeatherJsonForRequest(url)
  sendJson(res, result.status, result.body)
}
