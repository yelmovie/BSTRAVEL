/** 깊은 병합 — locale 번역에 누락된 키는 base(보통 ko)에서 채움 */
export function mergeDeep<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const out = { ...base } as Record<string, unknown>
  for (const k of Object.keys(override)) {
    const bv = base[k as keyof T]
    const ov = override[k as keyof T]
    if (
      ov !== undefined &&
      ov !== null &&
      typeof ov === "object" &&
      !Array.isArray(ov) &&
      typeof bv === "object" &&
      bv !== null &&
      !Array.isArray(bv)
    ) {
      out[k] = mergeDeep(bv as Record<string, unknown>, ov as Record<string, unknown>)
    } else if (ov !== undefined) {
      out[k] = ov as unknown
    }
  }
  return out as T
}
