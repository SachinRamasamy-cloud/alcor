import {useLayoutEffect,useRef,useState} from 'react'
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import {api,ApiError,type Media} from '../../shared/api/client'
import {useAuth} from '../../shared/auth'
import {useFeedback} from '../../shared/feedback'
import {Button,ErrorState} from '../../shared/ui'
import {t} from '../../shared/content'
import type {Entry} from '.'
import {publishLibraryEntry} from './cache'
import {readSavedStatus} from './status'
import {completionUnavailable} from './completion-policy'
type Session={id:string;version:number;active:boolean}

export function CompleteTitle({entry,media,onComplete,label}:{entry?:Entry;media?:Media;onComplete:()=>void;label?:string}){
  const {userId}=useAuth(),queries=useQueryClient(),notify=useFeedback()
  const currentAccount=useRef(userId)
  useLayoutEffect(()=>{currentAccount.current=userId;return()=>{currentAccount.current=null}},[userId])
  const title=entry?.media??media!
  const route=title.media_type==='anime'?'watch-sessions':'reading-sessions'
  const legacy=entry?.active_session===undefined
  const sessions=useQuery({queryKey:['private',userId,'tracking',title.id],enabled:Boolean(userId&&legacy),queryFn:({signal})=>api<Session[]>(`/me/${route}?media_id=${title.id}`,{accountId:userId!,signal}),retry:false})
  const [confirmation,setConfirmation]=useState<{session:Session|null;accountId:string|null;version:number|undefined}|null>(null)
  const write=useMutation({scope:{id:`library:${userId}`},onMutate:()=>({accountId:userId}),mutationFn:async()=>{
    if(!userId||confirmation?.accountId!==userId)throw new Error(t('errors.auth'))
    const session=confirmation?.session
    if(!session)return api<{entry:Entry;changed:boolean}>(`/me/library/${title.id}`,{accountId:userId,method:'PUT',body:JSON.stringify({status:'completed',expected_version:confirmation.version})})
    const result=await api<Session>(`/me/${route}/${session.id}/complete`,{accountId:userId,method:'POST',body:JSON.stringify({expected_version:session.version})})
    if(currentAccount.current!==userId)throw new ApiError(401,'UNAUTHORIZED')
    const saved=await readSavedStatus(title,userId)
    if(!saved||saved.status!=='completed')throw new Error(t('errors.saveUnverified'))
    return {entry:saved,changed:result.version!==session.version}
  },onSuccess:(value,_variables,context)=>{if(context.accountId!==currentAccount.current)return;const published=publishLibraryEntry(queries,context.accountId!,value.entry,[title.id,...(title.source_ids?.anilist?[`anilist-${title.source_ids.anilist}`]:[])]);if(value.changed&&published)notify(t('library.completed'));onComplete()},onError:(error:Error,_variables,context)=>{if(context?.accountId===currentAccount.current)notify(error.message)},onSettled:(_value,_error,_variables,context)=>{void queries.invalidateQueries({queryKey:['private',context?.accountId]})}})
  if(legacy&&sessions.error)return <ErrorState error={sessions.error} retry={()=>{void sessions.refetch()}}/>
  if(completionUnavailable(title))return <div><Button variant="secondary" disabled>{label??t('tracking.complete')}</Button><p className="text-sm text-muted">{t('tracking.completionUnavailable')}</p></div>
  if(confirmation)return <div className="completion-confirmation"><p>{t('tracking.completeHelp')}</p><div className="personal-dialog-actions"><Button variant="secondary" disabled={write.isPending} onClick={()=>setConfirmation(null)}>{t('common.cancel')}</Button><Button disabled={write.isPending} onClick={()=>write.mutate()}>{t('tracking.complete')}</Button></div></div>
  const active=legacy?sessions.data?.find(item=>item.active)??null:entry?.active_session?{...entry.active_session,active:true}:null
  const allowed=!entry||entry.status==='planned'||entry.status==='in_progress'||Boolean(active)
  return <Button variant="secondary" disabled={legacy&&sessions.isPending||!allowed} onClick={()=>setConfirmation({session:active,accountId:userId,version:entry?.version})}>{label??t('tracking.complete')}</Button>
}
