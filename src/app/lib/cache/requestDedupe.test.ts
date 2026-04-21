import { describe, expect, it, vi } from "vitest"
import { runDeduped } from "./requestDedupe"

describe("runDeduped", () => {
  it("동일 키 동시 요청 5회 → factory 1회", async () => {
    const factory = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 5))
      return 42
    })
    const k = "test:dedupe:parallel"
    const results = await Promise.all([
      runDeduped(k, factory),
      runDeduped(k, factory),
      runDeduped(k, factory),
      runDeduped(k, factory),
      runDeduped(k, factory),
    ])
    expect(results.every((x) => x === 42)).toBe(true)
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it("동일 키 순차 요청 2회 → factory 2회 (inFlight 정리 후)", async () => {
    const factory = vi.fn(async () => 1)
    const k = "test:dedupe:sequential"
    await runDeduped(k, factory)
    await runDeduped(k, factory)
    expect(factory).toHaveBeenCalledTimes(2)
  })
})
