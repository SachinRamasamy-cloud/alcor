import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { t } from '../content'
import { Button, Modal } from '../ui'
import { setTokenProvider } from '../api/client'
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
  const currentId = useRef<string | null>(null)
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
    clearPending(); setError(false)
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
    const result = await authClient?.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/auth/callback', scopes: 'openid email profile' } })
    if (result?.error) { clearPending(); setError(true) }
  }
  return <AuthContext.Provider value={{ userId, loading, requireSignIn, signOut }}>{children}
    <Modal open={reason !== null} onOpenChange={open => { if (!open) { setReason(null); clearPending() } }} title={t('auth.title')} description={t(reason === 'wishlist' ? 'auth.wishlist' : reason === 'progress' ? 'auth.progress' : 'auth.library')}>
      {authClient ? <Button variant="secondary" onClick={() => { void signIn() }}>{t('auth.google')}</Button> : <p className="text-sm text-muted">{t('auth.unconfigured')}</p>}
      {error && <p role="alert">{t('errors.auth')}</p>}<p className="mt-3 text-xs text-muted">{t('auth.guest')}</p>
    </Modal>
  </AuthContext.Provider>
}
