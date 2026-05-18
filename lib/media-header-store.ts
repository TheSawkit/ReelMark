"use client"

import { useSyncExternalStore } from "react"

type State = { title: string | null; scrolled: boolean }

let state: State = { title: null, scrolled: false }
const listeners = new Set<() => void>()
const SERVER_SNAPSHOT: State = { title: null, scrolled: false }

const notify = () => listeners.forEach((l) => l())
const getSnapshot = () => state
const getServerSnapshot = () => SERVER_SNAPSHOT

export const mediaHeaderStore = {
    setMedia: (title: string | null) => {
        state = { title, scrolled: false }
        notify()
    },
    setScrolled: (scrolled: boolean) => {
        if (state.scrolled === scrolled) return
        state = { ...state, scrolled }
        notify()
    },
    clear: () => {
        state = { title: null, scrolled: false }
        notify()
    },
}

export function useMediaHeader() {
    return useSyncExternalStore(
        (l) => { listeners.add(l); return () => listeners.delete(l) },
        getSnapshot,
        getServerSnapshot
    )
}
