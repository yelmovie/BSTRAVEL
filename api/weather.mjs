/**
 * Vercel Serverless — 배포 시 동일 출처 `/api/weather` (Vite proxy 불필요)
 */
import { getWeatherJsonForRequest } from '../server/weatherShared.mjs'

export default async function handler(req, res) {
  const host = req.headers.host || 'localhost'
  const pathAndQuery = req.url || '/api/weather'
  const url = new URL(pathAndQuery, `https://${host}`)
  const result = await getWeatherJsonForRequest(url)
  res.status(result.status)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.send(JSON.stringify(result.body))
}
