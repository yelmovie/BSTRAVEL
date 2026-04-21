/**
 * Vercel Serverless — 배포 시 동일 출처 `/api/tour/*`
 */
import { getTourProxyResponse } from '../../server/tourProxyShared.mjs'

export default async function handler(req, res) {
  const host = req.headers.host || 'localhost'
  const pathAndQuery = req.url || '/api/tour/health'
  const url = new URL(pathAndQuery, `https://${host}`)

  if (req.method === 'OPTIONS') {
    res.status(204)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.end()
    return
  }

  if (req.method !== 'GET') {
    res.status(404)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.send(JSON.stringify({ ok: false, error: { code: 'NOT_FOUND', message: 'Method not allowed' } }))
    return
  }

  const result = await getTourProxyResponse(url)
  res.status(result.status)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.send(JSON.stringify(result.body))
}
