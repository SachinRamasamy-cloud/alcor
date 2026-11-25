import { PersonalNav } from '../widgets/personal-nav'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth, authClient } from '../shared/auth'
import { clearPending, readPending } from '../shared/auth/pending'
import { api } from '../shared/api/client'
import { resolveMediaId } from '../shared/api/identity'
import { useLibrary, useLibraryWrite, type Entry } from '../features/library'
import { MediaCard } from '../entities/media'
import { t } from '../shared/content'
import { Button, ErrorState, Loading, Modal, Pagination } from '../shared/ui'
import { useBackend } from '../shared/api/backend'

export async function finishSignedIn(userId:string,fallback='/library') {
  const pending=readPending(true)
  if(pending){
    const current=(await authClient?.auth.getSession())?.data.session
    if(current?.user.id!==userId)throw new Error(t('errors.auth'))
    const canonical=await resolveMediaId(pending.mediaId,userId)
    await api(`/me/library/${canonical}`,{accountId:userId,method:'PUT',headers:{'Idempotency-Key':pending.nonce},body:JSON.stringify({status:pending.kind==='wishlist'?'planned':'in_progress'})})
  }
  return pending?.returnPath??fallback
}

const callbacks = new Map<string, Promise<string>>()
export function finishRecovery(code:string){
  const key=`recovery:${code}`
  if(!callbacks.has(key)){
    callbacks.clear()
    callbacks.set(key,(async()=>{if(!authClient)throw new Error(t('auth.unconfigured'));const result=await authClient.auth.exchangeCodeForSession(code);if(result.error||!result.data.session)throw new Error(t('errors.auth'));clearPending();return '/auth/password'})())
  }
  return callbacks.get(key)!
}
export function finishCallback(code: string) {
  if (!callbacks.has(code)) {
    callbacks.clear()
    callbacks.set(code, (async () => {
      if (!authClient) throw new Error(t('auth.unconfigured'))
      const { data, error } = await authClient.auth.exchangeCodeForSession(code)
      if (error || !data.session) { clearPending(); throw new Error(t('errors.auth')) }
      return finishSignedIn(data.session.user.id)
    })())
  }
  return callbacks.get(code)!
}
export function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queries = useQueryClient()
  const [error, setError] = useState<Error | null>(null)
  const {ready}=useBackend()
  useEffect(() => {
    if(!ready)return
    const code = params.get('code')
    if (!code) { clearPending(); navigate('/', { replace: true }); return }
    let active = true
    const complete=params.get('recovery')==='1'
      ?finishRecovery(code)
      :finishCallback(code)
    void complete.then(path => { if (active) { void queries.invalidateQueries({ queryKey: ['private'] }); navigate(params.get('setup')==='1'&&params.get('recovery')!=='1'?'/setup':path, { replace: true }) } }).catch(error => { if (active) setError(error instanceof Error ? error : new Error(t('errors.auth'))) })
    return () => { active = false }
  }, [params, navigate, queries,ready])
  return error ? <ErrorState error={error} /> : <Loading variant="profile" page />
}

export function AuthCompletePage(){
  const {userId,loading}=useAuth(),{ready}=useBackend()
  const [params]=useSearchParams(),navigate=useNavigate()
  const [error,setError]=useState<Error|null>(null)
  const completion=useRef<{user:string;promise:Promise<string>}|null>(null)
  useEffect(()=>{
    if(loading||!ready||!userId)return
    let active=true
    if(completion.current?.user!==userId)completion.current={user:userId,promise:finishSignedIn(userId,'/library')}
    void completion.current.promise.then(path=>{if(active)navigate(params.get('setup')==='1'?'/setup':path,{replace:true})}).catch(cause=>{if(active)setError(cause instanceof Error?cause:new Error(t('errors.auth')))})
    return()=>{active=false}
  },[userId,loading,ready,params,navigate])
  if(!loading&&!userId)return <div className="shell page-body state-box"><p>{t('auth.library')}</p><Link className="button button-primary" to="/">{t('nav.home')}</Link></div>
  return error?<ErrorState error={error}/>:<Loading variant="profile" page/>
}

export function PasswordPage(){
  const {userId,requireSignIn}=useAuth()
  const [password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('')
  const [busy,setBusy]=useState(false),[error,setError]=useState(false),[saved,setSaved]=useState(false)
  return <div className="shell page-body"><div className="page-heading"><h1>{t('auth.updatePassword')}</h1></div>{!userId?<Button onClick={()=>requireSignIn()}>{t('nav.signIn')}</Button>:saved?<p role="status">{t('auth.passwordUpdated')}</p>:<form className="auth-email-form max-w-xl" onSubmit={async event=>{event.preventDefault();if(password!==confirmation){setError(true);return}if(!authClient)return;setBusy(true);setError(false);try{const result=await authClient.auth.updateUser({password});if(result.error)throw result.error;setPassword('');setConfirmation('');setSaved(true)}catch{setError(true)}finally{setBusy(false)}}}><label htmlFor="new-password">{t('auth.newPassword')}</label><input id="new-password" type="password" autoComplete="new-password" required value={password} disabled={busy} onChange={event=>setPassword(event.target.value)}/><label htmlFor="confirm-new-password">{t('auth.confirmPassword')}</label><input id="confirm-new-password" type="password" autoComplete="new-password" required value={confirmation} disabled={busy} onChange={event=>setConfirmation(event.target.value)}/>{error&&<p role="alert">{t(password!==confirmation?'auth.passwordMismatch':'auth.emailFailed')}</p>}<Button disabled={busy}>{t('auth.updatePassword')}</Button></form>}</div>
}
export function LibraryPage() {
  const wishlist = useLocation().pathname === '/wishlist'
  const { userId, loading, requireSignIn } = useAuth()
  const [params, setParams] = useSearchParams()
  const entries = useLibrary(wishlist, params.get('cursor') ?? '', params.get('status') ?? '', Number(params.get('page'))||1)
  const write = useLibraryWrite()
  const [remove, setRemove] = useState<Entry | null>(null)
  useEffect(() => { document.title = `${t(wishlist ? 'nav.wishlist' : 'nav.library')} · ALCOR` }, [wishlist])
  if (loading) return <Loading variant={wishlist?"wishlist":"library"} page />
  return <div className="shell page-body"><PersonalNav/><div className="page-heading"><Link className="subtle-link" to="/collections">{t('collections.title')}</Link><h1>{t(wishlist ? 'nav.wishlist' : 'nav.library')}</h1>{entries.data && <span className="text-sm text-muted">{entries.data.total}</span>}</div>
    {!userId ? <div className="state-box"><h2>{t('auth.title')}</h2><p>{t(wishlist ? 'auth.wishlist' : 'auth.library')}</p><Button onClick={() => requireSignIn(wishlist ? 'wishlist' : 'library')}>{t('nav.signIn')}</Button><p>{t('auth.guest')}</p></div> : <>
      {!wishlist && <label className="block mb-6 text-sm">{t('library.status')}<select className="ml-3 min-h-11 border border-line rounded px-3" value={params.get('status') ?? ''} onChange={e => setParams(e.target.value ? { status: e.target.value } : {})}><option value="">{t('library.all')}</option>{(['planned', 'in_progress', 'completed', 'on_hold', 'dropped', 'not_interested'] as const).map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}</select></label>}
      {entries.isPending ? <Loading variant={wishlist?"wishlist":"library"} /> : entries.error ? <ErrorState error={entries.error} retry={() => { void entries.refetch() }} /> : entries.data.data.length === 0 ? <div className="state-box"><h2>{t(wishlist ? 'wishlist.empty' : 'library.empty')}</h2><p>{t(wishlist ? 'wishlist.emptyBody' : 'library.emptyBody')}</p><Link className="button button-secondary" to="/anime">{t('catalogue.anime')}</Link></div> : <><div className="media-grid">{entries.data.data.map(entry => <div key={entry.media.id}><MediaCard media={entry.media} /><p className="my-3 text-xs text-muted">{t(`status.${entry.status}`)}</p>{entry.status === 'planned' && <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={write.isPending} onClick={() => write.mutate({ id: entry.media.id, status: 'in_progress', version: entry.version })}>{t(entry.media.media_type === 'anime' ? 'library.startWatching' : 'library.startReading')}</Button>{wishlist&&<Button variant="ghost" onClick={() => setRemove(entry)}>{t('common.remove')}</Button>}</div>}{!wishlist&&<Button variant="ghost" onClick={()=>setRemove(entry)}>{t('common.remove')}</Button>}</div>)}</div><Pagination page={entries.data.page??1} totalPages={entries.data.total_pages??Math.max(1,Math.ceil(entries.data.total/24))} onChange={page=>setParams(previous=>{const next=new URLSearchParams(previous);next.delete('cursor');next.set('page',String(page));return next})}/></>}
    </>}
    <Modal open={Boolean(remove)} onOpenChange={open => { if (!open) setRemove(null) }} title={t(wishlist?'wishlist.confirmRemove':'library.confirmRemove')} description={wishlist?remove?.media.title:t('library.removeHelp')}><div className="flex gap-3"><Button variant="secondary" onClick={() => setRemove(null)}>{t('common.cancel')}</Button><Button disabled={write.isPending} onClick={() => { if (remove) write.mutate({ id: remove.media.id, version: remove.version, remove: true, removeLibrary: !wishlist }, { onSuccess: () => setRemove(null) }) }}>{t('common.remove')}</Button></div></Modal>
  </div>
}
