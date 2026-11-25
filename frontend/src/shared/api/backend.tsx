import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setBackendReady } from './client'
import { t } from '../content'
import { Button } from '../ui'
import { useAuth } from '../auth'
import { BackendContext, useBackend, type BackendState } from './backend-state'
export { useBackend } from './backend-state'

export function BackendProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<BackendState['phase']>('waking')
  const [attempt, setAttempt] = useState(0)
  const queries = useQueryClient()
  useEffect(() => {
    let active = true, timer: ReturnType<typeof setTimeout>
    const controller = new AbortController()
    const started = Date.now()
    setBackendReady(false)
    async function check() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1/ready`, {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]), credentials: 'omit', cache: 'no-store',
        })
        const body = response.ok ? await response.json() : null
        if (body?.status !== 'ready') throw new Error('not ready')
        if (!active) return
        setBackendReady(true); setPhase('ready')
        void queries.invalidateQueries({ queryKey: ['private'] })
      } catch {
        if (!active) return
        if (Date.now() - started >= 300000) setPhase('offline')
        else timer = setTimeout(() => { void check() }, 12000)
      }
    }
    void check()
    const lost = () => { setBackendReady(false); setPhase('waking'); setAttempt(value => value + 1) }
    window.addEventListener('alcor:backend-unavailable', lost)
    return () => { active = false; controller.abort(); clearTimeout(timer); window.removeEventListener('alcor:backend-unavailable', lost) }
  }, [attempt, queries])
  const retry = useCallback(() => { setPhase('waking'); setAttempt(value => value + 1) }, [])
  return <BackendContext.Provider value={{ ready: phase === 'ready', phase, retry }}>{children}</BackendContext.Provider>
}

export function BackendNotice() {
  const { phase, retry } = useBackend()
  const {userId}=useAuth()
  if (phase === 'ready' || !userId) return null
  return <div className="backend-notice"><div className="shell backend-notice-inner"><p role="status">{t(phase === 'waking' ? 'backend.waking' : 'backend.offline')}</p>{phase === 'offline' && <Button variant="secondary" onClick={retry}>{t('common.retry')}</Button>}</div></div>
}
