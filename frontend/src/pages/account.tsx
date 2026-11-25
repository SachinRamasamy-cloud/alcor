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
import { MoreHorizontal } from 'lucide-react'
import {flyToTarget} from '../shared/motion'
import {CompleteTitle} from '../features/library/complete'
import {StatusActions} from '../features/library/actions'
import {libraryStatusLabel} from '../features/library/labels'
import type {components} from '../shared/api/schema'
import {SearchField} from '../features/catalogue/search-field'
import {SelectMenu} from '../shared/ui/select-menu'
import {hasLibraryFilters} from '../features/library/query'

export async function finishSignedIn(userId:string,fallback='/dashboard') {
  const pending=readPending(true)
  if(pending){
    const current=(await authClient?.auth.getSession())?.data.session
    if(current?.user.id!==userId)throw new Error(t('errors.auth'))
    const canonical=await resolveMediaId(pending.mediaId,userId)
    const saved=await api<components['schemas']['LibraryMutation']>(`/me/library/${canonical}`,{accountId:userId,method:'PUT',headers:{'Idempotency-Key':pending.nonce},body:JSON.stringify({status:pending.kind==='wishlist'?'planned':'in_progress'})})
    if(saved.changed)flyToTarget({scopeKey:userId,target:pending.kind,image:saved.entry.media.image_url})
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
    if(completion.current?.user!==userId)completion.current={user:userId,promise:finishSignedIn(userId,'/dashboard')}
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
export function LibraryGrid({entries,onManage}:{entries:Entry[];onManage:(entry:Entry)=>void}){
  return <div className="media-grid">{entries.map(entry=><MediaCard key={entry.media.id} media={entry.media} context={<div className="card-context"><span className="personal-card-status">{libraryStatusLabel(entry)}</span></div>} actions={<button className="card-save" aria-label={t('media.manageLabel',{title:entry.media.title})} onClick={()=>onManage(entry)}><MoreHorizontal size={18}/></button>}/>)}</div>
}
export function LibraryPage() {
  const {userId}=useAuth()
  return <LibraryContent key={userId??'guest'}/>
}
function LibraryContent() {
  const wishlist = useLocation().pathname === '/wishlist'
  const { userId, loading, requireSignIn } = useAuth()
  const [params, setParams] = useSearchParams()
  const filters={q:params.get('q')??'',media_type:params.get('media_type')??'',sort:params.get('sort')??'id'}
  const entries = useLibrary(wishlist, params.get('cursor') ?? '', params.get('status') ?? '', Number(params.get('page'))||1,filters)
  const filtered=hasLibraryFilters(filters)||Boolean(params.get('status'))
  const write = useLibraryWrite()
  const [manage, setManage] = useState<Entry | null>(null)
  const [removing,setRemoving]=useState(false)
  function filter(key:string,value:string){setParams(previous=>{const next=new URLSearchParams(previous);next.delete('page');next.delete('cursor');if(value&&value!=='id')next.set(key,value);else next.delete(key);return next})}
  useEffect(() => { document.title = `${t(wishlist ? 'nav.wishlist' : 'nav.library')} · ALCOR` }, [wishlist])
  if (loading) return <Loading variant={wishlist?"wishlist":"library"} page />
  return <div className="shell page-body personal-page"><PersonalNav/><div className="page-heading personal-heading"><div className="personal-title"><h1>{t(wishlist ? 'nav.wishlist' : 'nav.library')}</h1>{entries.data && <span className="personal-count">{entries.data.total}</span>}</div><Link className="subtle-link" to="/collections">{t('collections.title')}</Link></div>
    {!userId ? <div className="state-box"><h2>{t('auth.title')}</h2><p>{t(wishlist ? 'auth.wishlist' : 'auth.library')}</p><Button onClick={() => requireSignIn(wishlist ? 'wishlist' : 'library')}>{t('nav.signIn')}</Button><p>{t('auth.guest')}</p></div> : <>
      <SearchField value={filters.q} onCommit={value=>filter('q',value.trim())} busy={entries.isFetching} label={t('library.search')}/><div className="personal-toolbar">
        {!wishlist&&<div className="w-full sm:w-auto"><label>{t('library.status')}<select value={params.get('status') ?? ''} onChange={event=>filter('status',event.target.value)}><option value="">{t('library.all')}</option>{(['planned', 'in_progress', 'completed', 'on_hold', 'dropped', 'not_interested'] as const).map(status=><option key={status} value={status}>{t(`status.${status}`)}</option>)}</select></label></div>}
        <SelectMenu label={t('catalogue.mediaType')} placeholder={t('library.allTypes')} multiple={false} values={[filters.media_type]} options={[{value:'',label:t('library.allTypes')},{value:'anime',label:t('nav.anime')},{value:'manga',label:t('nav.manga')}]} onChange={values=>filter('media_type',values[0]??'')}/>
        <SelectMenu label={t('library.sort')} placeholder={t('library.defaultOrder')} multiple={false} values={[filters.sort]} options={(['id','title','saved','completion_recorded','rating','recorded_units'] as const).map(value=>({value,label:t(value==='id'?'library.defaultOrder':value==='title'?'library.titleOrder':value==='saved'?'library.savedOrder':value==='completion_recorded'?'library.completionOrder':value==='rating'?'library.ratingOrder':'library.unitsOrder')}))} onChange={values=>filter('sort',values[0]??'id')}/>
      </div>
      {entries.isPending||hasLibraryFilters(filters)&&entries.isFetching ? <Loading variant={wishlist?"wishlist":"library"} /> : entries.error ? <ErrorState error={entries.error} retry={() => { void entries.refetch() }} /> : entries.data.data.length === 0 ? <div className="state-box"><h2>{t(entries.data.total>0?'library.pageEmpty':filtered?'library.noMatches':wishlist?'wishlist.empty':'library.empty')}</h2><p>{t(filtered?'library.noMatchesBody':wishlist?'wishlist.emptyBody':'library.emptyBody')}</p>{filtered||entries.data.total>0?<Button variant="secondary" onClick={()=>setParams(previous=>{if(!entries.data.total)return {};const next=new URLSearchParams(previous);next.delete('page');next.delete('cursor');return next})}>{t(entries.data.total>0?'pagination.first':'catalogue.clear')}</Button>:<Link className="button button-secondary" to="/anime">{t('catalogue.anime')}</Link>}</div> : <><LibraryGrid entries={entries.data.data} onManage={entry=>{setManage(entry);setRemoving(false)}}/><Pagination page={entries.data.page??1} totalPages={entries.data.total_pages??Math.max(1,Math.ceil(entries.data.total/24))} onChange={page=>setParams(previous=>{const next=new URLSearchParams(previous);next.delete('cursor');next.set('page',String(page));return next})}/></>}
    </>}
    <Modal open={Boolean(manage)} onOpenChange={open => { if (!open) setManage(null) }} title={removing?t(wishlist?'wishlist.confirmRemove':'library.confirmRemove'):manage?.media.title??t('nav.library')} description={removing?(wishlist?manage?.media.title:t('library.removeHelp')):manage?libraryStatusLabel(manage):undefined}><div className="personal-dialog-actions">{removing?<><Button variant="secondary" onClick={() => setRemoving(false)}>{t('common.cancel')}</Button><Button disabled={write.isPending} onClick={() => { if (manage) write.mutate({ id: manage.media.id, version: manage.version, remove: true, removeLibrary: !wishlist }, { onSuccess: () => setManage(null) }) }}>{t('common.remove')}</Button></>:<>{manage?.status==='planned'&&<Button disabled={write.isPending} onClick={()=>write.mutate({id:manage.media.id,status:'in_progress',version:manage.version},{onSuccess:()=>setManage(null)})}>{t(manage.media.media_type==='anime'?'library.startWatching':'library.startReading')}</Button>}{manage&&['planned','in_progress'].includes(manage.status)&&<CompleteTitle key={manage.media.id} entry={manage} onComplete={()=>setManage(null)}/>}{manage&&<StatusActions entry={manage} close={()=>setManage(null)}/>}<Button variant="secondary" onClick={()=>setRemoving(true)}>{t('common.remove')}</Button></>}</div></Modal>
  </div>
}
