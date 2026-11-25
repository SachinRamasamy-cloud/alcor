import {useState} from 'react'
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import {api} from '../../shared/api/client'
import {useAuth} from '../../shared/auth'
import {useFeedback} from '../../shared/feedback'
import {Button,ErrorState} from '../../shared/ui'
import {t} from '../../shared/content'
import type {Entry} from '.'
type Session={id:string;version:number;active:boolean}

export function CompleteTitle({entry,onComplete}:{entry:Entry;onComplete:()=>void}){
  const {userId}=useAuth(),queries=useQueryClient(),notify=useFeedback()
  const route=entry.media.media_type==='anime'?'watch-sessions':'reading-sessions'
  const sessions=useQuery({queryKey:['private',userId,'tracking',entry.media.id],queryFn:({signal})=>api<Session[]>(`/me/${route}?media_id=${entry.media.id}`,{accountId:userId!,signal}),retry:false})
  const [confirmation,setConfirmation]=useState<{session:Session|null}|null>(null)
  const write=useMutation({mutationFn:async()=>{
    const session=confirmation?.session
    await api(session?`/me/${route}/${session.id}/complete`:`/me/library/${entry.media.id}`,{accountId:userId!,method:session?'POST':'PUT',body:JSON.stringify(session?{expected_version:session.version}:{status:'completed',expected_version:entry.version})})
  },onSuccess:()=>{void queries.invalidateQueries({queryKey:['private',userId]});notify(t('library.completed'));onComplete()},onError:(error:Error)=>notify(error.message)})
  if(sessions.error)return <ErrorState error={sessions.error} retry={()=>{void sessions.refetch()}}/>
  if(confirmation)return <div className="completion-confirmation"><p>{t('tracking.completeHelp')}</p><div className="personal-dialog-actions"><Button variant="secondary" disabled={write.isPending} onClick={()=>setConfirmation(null)}>{t('common.cancel')}</Button><Button disabled={write.isPending} onClick={()=>write.mutate()}>{t('tracking.complete')}</Button></div></div>
  return <Button variant="secondary" disabled={sessions.isPending} onClick={()=>setConfirmation({session:sessions.data?.find(item=>item.active)??null})}>{t('tracking.complete')}</Button>
}
