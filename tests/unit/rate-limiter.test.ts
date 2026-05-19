import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import { checkRateLimit } from "@/lib/rate-limiter"

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe("checkRateLimit", () => {
    it("allows first request and returns correct remaining", () => {
        const result = checkRateLimit("rl-first", 5, 60_000)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(4)
        expect(result.resetAt).toBe(Date.now() + 60_000)
    })

    it("decrements remaining with each successive request", () => {
        const key = "rl-decrement"
        checkRateLimit(key, 5, 60_000)
        checkRateLimit(key, 5, 60_000)
        const third = checkRateLimit(key, 5, 60_000)
        expect(third.allowed).toBe(true)
        expect(third.remaining).toBe(2)
    })

    it("blocks when count reaches the limit", () => {
        const key = "rl-block"
        for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60_000)
        const result = checkRateLimit(key, 3, 60_000)
        expect(result.allowed).toBe(false)
        expect(result.remaining).toBe(0)
    })

    it("resets after the window expires", () => {
        const key = "rl-reset"
        for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60_000)
        vi.advanceTimersByTime(61_000)
        const result = checkRateLimit(key, 3, 60_000)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(2)
    })

    it("tracks different keys independently", () => {
        const key1 = "rl-independent-a"
        const key2 = "rl-independent-b"
        for (let i = 0; i < 3; i++) checkRateLimit(key1, 3, 60_000)
        const result = checkRateLimit(key2, 3, 60_000)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(2)
    })

    it("limit of 1 allows exactly one request then blocks", () => {
        const key = "rl-limit-one"
        const first = checkRateLimit(key, 1, 60_000)
        expect(first.allowed).toBe(true)
        expect(first.remaining).toBe(0)
        const second = checkRateLimit(key, 1, 60_000)
        expect(second.allowed).toBe(false)
    })
})
