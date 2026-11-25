import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLayoutEffect,useRef,useState } from 'react'
import { api, type Media } from '../../shared/api/client'
import type { components } from '../../shared/api/schema'
import { useAuth } from '../../shared/auth'
import { useFeedback } from '../../shared/feedback'
import { t } from '../../shared/content'
import { Button, ErrorState, Loading } from '../../shared/ui'
import {publishLibraryEntry} from './cache'
import {readSavedStatus} from './status'
import {useBackend} from '../../shared/api/backend'

type Entry=components['schemas']['LibraryEntry']
type Mutation=components['schemas']['LibraryMutation']
function DetailsForm({entry,userId,showFavorite}:{entry:Entry;userId:string;showFavorite:boolean}) {
  const [draft,setDraft]=useState(entry)
  const notify=useFeedback(),queries=useQueryClient()
  const account=useRef(userId)
  useLayoutEffect(()=>{account.current=userId;return()=>{account.current=''}},[userId])
  const save=useMutation({mutationFn:()=>api<Mutation>(`/me/library/${entry.media.id}`,{accountId:userId,method:'PATCH',body:JSON.stringify({expected_version:draft.version,rating:draft.rating,notes:draft.notes,favorite:draft.favorite,tags:draft.tags,priority:draft.priority,reason:draft.reason})}),onSuccess:value=>{if(account.current!==userId)return;if(!publishLibraryEntry(queries,userId,value.entry))return;setDraft(value.entry);if(value.changed&&value.entry.favorite!==entry.favorite){void queries.resetQueries({queryKey:['private',userId,'favorites']});void queries.resetQueries({queryKey:['private',userId,'favorite-membership']})};if(value.changed)notify(t('personal.saved'))},onError:(error:Error)=>{if(account.current===userId)notify(error.message)},onSettled:()=>{void queries.invalidateQueries({queryKey:['private',userId]})}})
  return <form className="my-6 rounded border border-line p-5" onSubmit={e=>{e.preventDefault();save.mutate()}}><h2 className="mb-5 text-xl font-medium">{t('personal.title')}</h2><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm">{t('personal.rating')}<select className="ml-3 min-h-11 rounded border border-line px-3" value={draft.rating??''} onChange={e=>setDraft({...draft,rating:e.target.value?Number(e.target.value):null})}><option value="">{t('media.notRated')}</option>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label>{showFavorite&&<label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={draft.favorite} onChange={e=>setDraft({...draft,favorite:e.target.checked})}/>{t('personal.favorite')}</label>}<label className="text-sm">{t('personal.tags')}<input className="mt-2 block min-h-11 w-full rounded border border-line px-3" value={(draft.tags??[]).join(', ')} onChange={e=>setDraft({...draft,tags:e.target.value.split(',').map(value=>value.trim())})}/></label>{entry.status==='planned'&&<label className="text-sm">{t('personal.priority')}<select className="ml-3 min-h-11 rounded border border-line px-3" value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value as Entry['priority']})}>{(['high','normal','low'] as const).map(p=><option key={p} value={p}>{t(`personal.${p}`)}</option>)}</select></label>}</div><label className="mt-5 block text-sm">{t('personal.notes')}<textarea className="mt-2 block min-h-24 w-full rounded border border-line p-3" maxLength={10000} value={draft.notes??''} onChange={e=>setDraft({...draft,notes:e.target.value})}/></label>{entry.status==='planned'&&<label className="mt-5 block text-sm">{t('personal.reason')}<input className="mt-2 block min-h-11 w-full rounded border border-line px-3" maxLength={1000} value={draft.reason??''} onChange={e=>setDraft({...draft,reason:e.target.value})}/></label>}<div className="mt-5 flex gap-3"><Button disabled={save.isPending}>{t('common.save')}</Button><Button type="button" variant="secondary" onClick={()=>setDraft(entry)}>{t('personal.reload')}</Button></div>{draft.version!==entry.version&&<p role="status" className="mt-3 text-sm">{t('errors.conflict')}</p>}</form>
}
export function PersonalDetails({media,showFavorite=true}:{media:Media;showFavorite?:boolean}) {
  const {userId}=useAuth()
  const {ready}=useBackend()
  const query=useQuery({queryKey:['private',userId,'media-status',media.media_type,media.id],enabled:Boolean(userId&&ready),queryFn:()=>readSavedStatus(media,userId!),staleTime:30000,retry:false})
  if(!userId)return null
  if(query.isPending)return <Loading/>
  if(query.error)return <ErrorState error={query.error} retry={()=>{void query.refetch()}}/>
  if(!query.data)return null
  return <DetailsForm key={`${userId}:${media.id}`} entry={query.data} userId={userId} showFavorite={showFavorite}/>
}
