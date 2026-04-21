/** 브라우저·노드 공통 짧은 캐시 키용 비암호화 해시 */
export function hashStringToKey(s: string): string {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}
