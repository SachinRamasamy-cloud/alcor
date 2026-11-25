import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { t } from '../content'
import { Button, Modal } from '../ui'
import { setTokenProvider } from '../api/client'
import { useBackend } from '../api/backend-state'
import { clearPending, savePending, type PendingAction } from './pending'
import { sessionStorageAdapter } from './storage'

type Reason = 'wishlist' | 'library' | 'progress'
const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
// Only browser-safe publishable keys enable the deferred configuration.
export const authClient = url.startsWith('https://') && key.startsWith('sb_publishable_')
  ? createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: false, storage: sessionStorageAdapter } }) : null
setTokenProvider(async () => {
  const session = (await authClient?.auth.getSession())?.data.session
  return session ? { token: session.access_token, userId: session.user.id } : null
})
type AuthState = {
  userId: string | null
  loading: boolean
  requireSignIn: (reason?: Reason, action?: { kind: PendingAction['kind']; mediaId: string }) => void
  signOut: () => Promise<void>
}
const AuthContext = createContext<AuthState>({ userId: null, loading: false, requireSignIn: () => {}, signOut: async () => {} })
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [reason, setReason] = useState<Reason | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(authClient))
  const [error, setError] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const backend = useBackend()
  const currentId = useRef<string | null>(null)
  const signInAttempt = useRef(0)
  const queries = useQueryClient()
  useEffect(() => {
    if (!authClient) return
    const { data } = authClient.auth.onAuthStateChange((_event, session) => {
      const next = session?.user.id ?? null
      if (currentId.current !== next) {
        void queries.cancelQueries({ queryKey: ['private'] })
        queries.removeQueries({ queryKey: ['private'] })
        if (currentId.current !== null || next === null) clearPending()
      }
      currentId.current = next
      setUserId(next); setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [queries])
  const requireSignIn: AuthState['requireSignIn'] = (value = 'library', action) => {
    signInAttempt.current++
    clearPending(); setError(false); setSigningIn(false)
    if (!backend.ready) backend.retry()
    if (action) savePending(action.kind, action.mediaId, location.pathname + location.search)
    setReason(value)
  }
  async function signOut() {
    clearPending()
    await queries.cancelQueries({ queryKey: ['private'] })
    queries.removeQueries({ queryKey: ['private'] })
    await authClient?.auth.signOut()
  }
  async function signIn() {
    if (!authClient || !backend.ready || signingIn) return
    const attempt = ++signInAttempt.current
    setSigningIn(true); setError(false)
    try {
      const result = await authClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/auth/callback', scopes: 'openid email profile' } })
      if (result.error) throw result.error
    } catch {
      if (attempt !== signInAttempt.current) return
      clearPending(); setError(true); setSigningIn(false)
    }
  }
  return <AuthContext.Provider value={{ userId, loading, requireSignIn, signOut }}>{children}
    <Modal open={reason !== null} onOpenChange={open => { if (!open) { signInAttempt.current++; setReason(null); setSigningIn(false); clearPending() } }} title={t('auth.title')} description={t(reason === 'wishlist' ? 'auth.wishlist' : reason === 'progress' ? 'auth.progress' : 'auth.library')} className="auth-dialog">
      <div className="auth-provider-options"><Button variant="secondary" className="auth-provider-button" disabled={!authClient || !backend.ready || signingIn} aria-busy={signingIn} onClick={() => { void signIn() }}><span className="auth-provider-mark" aria-hidden="true">G</span>{t('auth.google')}</Button></div>
      {!authClient && <p className="auth-setup-note">{t('auth.googlePending')}</p>}
      {backend.phase === 'waking' && <div className="auth-startup" role="status" aria-busy="true"><div className="auth-startup-preview" aria-hidden="true"><div className="skeleton-block auth-startup-icon"/><div className="skeleton-lines"><div className="skeleton-block"/><div className="skeleton-block skeleton-short"/></div></div><p>{t('auth.starting')}</p><p className="auth-startup-note">{t('auth.startingBody')}</p></div>}
      {backend.phase === 'offline' && <div className="auth-startup" role="alert"><p>{t('auth.offline')}</p><Button variant="secondary" onClick={backend.retry}>{t('common.retry')}</Button></div>}
      {signingIn && <p role="status" className="auth-setup-note">{t('auth.redirecting')}</p>}
      {error && <p role="alert">{t('auth.failed')}</p>}<p className="mt-3 text-xs text-muted">{t('auth.guest')}</p>
    </Modal>
  </AuthContext.Provider>
}
