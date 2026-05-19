"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAutoResetError } from "@/hooks/useAutoResetError"

interface UseAsyncActionResult {
    loading: boolean
    error: boolean
    execute: <T>(action: () => Promise<T>) => Promise<T | undefined>
}

/** Handles loading/error state and router refresh for async server action calls. */
export function useAsyncAction(): UseAsyncActionResult {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useAutoResetError()
    const router = useRouter()

    async function execute<T>(action: () => Promise<T>): Promise<T | undefined> {
        setLoading(true)
        setError(false)
        try {
            const result = await action()
            router.refresh()
            return result
        } catch {
            setError(true)
            return undefined
        } finally {
            setLoading(false)
        }
    }

    return { loading, error, execute }
}
