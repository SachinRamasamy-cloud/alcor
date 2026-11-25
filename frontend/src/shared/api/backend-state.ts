import { createContext, useContext } from 'react'

export type BackendState = { ready: boolean; phase: 'ready' | 'waking' | 'offline'; retry: () => void }
export const BackendContext = createContext<BackendState>({ ready: true, phase: 'ready', retry: () => {} })
export const useBackend = () => useContext(BackendContext)
