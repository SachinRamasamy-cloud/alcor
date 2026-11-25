import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { t } from '../content'
import { Button, Modal } from '../ui'
import { setTokenProvider } from '../api/client'
import { useBackend } from '../api/backend-state'
import { clearPending, savePending, type PendingAction } from './pending'
import { sessionStorageAdapter } from './storage'
import { EmailForm, type EmailMode } from './email-form'

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
  const [emailError,setEmailError]=useState<import('../content').MessageKey|null>(null)
  const [notice,setNotice]=useState<'confirm'|'reset'|null>(null)
  const [emailMode,setEmailMode]=useState<EmailMode>('login')
  const [signingIn, setSigningIn] = useState(false)
  const [authMethod,setAuthMethod]=useState<'email'|'google'>('google')
  const backend = useBackend()
  const currentId = useRef<string | null>(null)
  const signInAttempt = useRef(0)
  const queries = useQueryClient()
  const navigate = useNavigate()
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
    clearPending(); setError(false); setEmailError(null); setNotice(null); setEmailMode('login'); setSigningIn(false)
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
    setAuthMethod('google')
    setSigningIn(true); setError(false);setEmailError(null)
    try {
      const result = await authClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/auth/callback', scopes: 'openid email profile' } })
      if (result.error) throw result.error
    } catch {
      if (attempt !== signInAttempt.current) return
      clearPending(); setError(true); setSigningIn(false)
    }
  }
  async function emailAccess(mode:EmailMode,email:string,password:string) {
    if(signingIn||!backend.ready)return
    if(!authClient){setEmailError('auth.accountUnavailable');return}
    const attempt=++signInAttempt.current
    setAuthMethod('email')
    setSigningIn(true);setError(false);setEmailError(null)
    try {
      if(mode==='reset'){
        const result=await authClient.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/auth/callback?recovery=1'})
        if(result.error)throw result.error
        if(attempt===signInAttempt.current)setNotice('reset')
      } else {
        const result=mode==='signup'
          ?await authClient.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/auth/callback?setup=1'}})
          :await authClient.auth.signInWithPassword({email,password})
        if(result.error)throw result.error
        if(attempt!==signInAttempt.current)return
        if(!result.data.session){if(mode==='signup')setNotice('confirm');else throw new Error('No session');return}
        setReason(null)
        navigate(mode==='signup'?'/auth/complete?setup=1':'/auth/complete')
      }
    } catch(cause) {
      if(attempt!==signInAttempt.current)return
      const code=(cause as {code?:string})?.code
      setEmailError(code==='email_not_confirmed'?'auth.emailUnconfirmed':code==='weak_password'?'auth.weakPassword':code?.includes('rate_limit')?'auth.tooManyAttempts':'auth.emailFailed')
    } finally {if(attempt===signInAttempt.current)setSigningIn(false)}
  }
  return <AuthContext.Provider value={{ userId, loading, requireSignIn, signOut }}>{children}
    <Modal open={reason !== null} onOpenChange={open => { if (!open) { signInAttempt.current++; setReason(null); setSigningIn(false); clearPending() } }} title={t(emailMode==='signup'?'auth.createAccount':emailMode==='reset'?'auth.resetTitle':'auth.title')} description={t(emailMode==='signup'?'auth.signupIntro':emailMode==='reset'?'auth.resetIntro':reason === 'wishlist' ? 'auth.wishlist' : reason === 'progress' ? 'auth.progress' : 'auth.library')} className="auth-dialog">
      <div className="auth-access-layout"><EmailForm busy={signingIn} ready={backend.ready} notice={notice} error={emailError?t(emailError):null} onSubmit={emailAccess} onChange={mode=>{signInAttempt.current++;setEmailMode(mode);setError(false);setEmailError(null);setNotice(null)}}/>
      <div className="auth-divider">{t('auth.or')}</div><div className="auth-provider-options"><Button variant="secondary" className="auth-provider-button" disabled={!authClient || !backend.ready || signingIn} aria-busy={signingIn} onClick={() => { void signIn() }}><span className="auth-provider-mark" aria-hidden="true">G</span>{t('auth.google')}</Button></div>
      {backend.phase === 'waking' && <div className="auth-startup" role="status" aria-busy="true"><div className="auth-startup-preview" aria-hidden="true"><div className="skeleton-block auth-startup-icon"/><div className="skeleton-lines"><div className="skeleton-block"/><div className="skeleton-block skeleton-short"/></div></div><p>{t('auth.starting')}</p><p className="auth-startup-note">{t('auth.startingBody')}</p></div>}
      {backend.phase === 'offline' && <div className="auth-startup" role="alert"><p>{t('auth.offline')}</p><Button variant="secondary" onClick={backend.retry}>{t('common.retry')}</Button></div>}
      {signingIn && <p role="status" className="auth-setup-note">{t(authMethod==='google'?'auth.redirecting':'auth.working')}</p>}
      {error && <p role="alert" className="auth-field-error">{t('auth.failed')}</p>}<p className="auth-guest-note">{t('auth.guest')}</p></div>
    </Modal>
  </AuthContext.Provider>
}
