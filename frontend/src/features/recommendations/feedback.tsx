import {useLayoutEffect,useRef} from 'react'
import {useMutation,useQuery,useQueryClient,type QueryClient} from '@tanstack/react-query'
import {api,ApiError,type Media} from '../../shared/api/client'
import {sameTitle} from '../../shared/api/identity'
import {useAuth} from '../../shared/auth'
import {useBackend} from '../../shared/api/backend'
import {useFeedback} from '../../shared/feedback'
import {Button,ErrorState} from '../../shared/ui'
import {t} from '../../shared/content'
import type {FeedPage} from './feed'
import type {components} from '../../shared/api/schema'

export type FeedbackMutation=components['schemas']['FeedbackMutation']
export type FeedbackContext=NonNullable<FeedbackMutation['context']>
export type FeedbackState=Omit<FeedbackMutation,'changed'>
export type DismissedPage=components['schemas']['FeedbackPage']

export function publishRecommendationFeedback(queries:QueryClient,owner:string,media:Media,result:FeedbackMutation){
  const key=['private',owner,'recommendation-feedback',media.id],current=queries.getQueryData<FeedbackState>(key)
  if(current&&current.version>result.version)return
  void queries.cancelQueries({predicate:query=>query.queryKey[0]==='private'&&query.queryKey[1]===owner&&['recommendations','recommendation-feedback','dismissed-recommendations'].includes(String(query.queryKey[2]))})
  queries.setQueryData(key,result)
  if(result.dismissed)queries.setQueriesData<FeedPage>({queryKey:['private',owner,'recommendations']},previous=>previous&&Array.isArray(previous.items)?{...previous,items:previous.items.filter(item=>!sameTitle(item.media,media))}:previous)
  if(result.changed){queries.removeQueries({queryKey:['private',owner,'recommendation-cursors']});queries.removeQueries({queryKey:['private',owner,'page-cursors','/recommendations']})}
  void queries.invalidateQueries({predicate:query=>query.queryKey[0]==='private'&&query.queryKey[1]===owner&&['recommendations','dismissed-recommendations','history'].includes(String(query.queryKey[2]))})
}
export function useDismissedRecommendations(cursor=''){
  const {userId}=useAuth(),{ready}=useBackend()
  return useQuery({queryKey:['private',userId,'dismissed-recommendations',cursor],enabled:Boolean(userId&&ready),queryFn:({signal})=>api<DismissedPage>(`/me/recommendation-feedback?${new URLSearchParams({limit:'24',...(cursor?{cursor}:{})})}`,{accountId:userId!,signal}),staleTime:30000,retry:false})
}
export function RecommendationFeedbackAction({media,context,version,onDone}:{media:Media;context:FeedbackContext;version?:number;onDone:()=>void}){
  const {userId}=useAuth(),{ready}=useBackend(),queries=useQueryClient(),notify=useFeedback(),account=useRef(userId)
  useLayoutEffect(()=>{account.current=userId;return()=>{account.current=null}},[userId])
  const anilist=Number(media.source_ids?.anilist??/^anilist-(\d+)$/.exec(media.id)?.[1])
  const read=useQuery({queryKey:['private',userId,'recommendation-feedback',media.id],enabled:Boolean(userId&&ready&&version===undefined&&anilist),
    queryFn:async({signal})=>{const result=await api<(FeedbackState&{anilist_id:number})[]>('/me/recommendation-feedback/read',{accountId:userId!,signal,method:'POST',body:JSON.stringify({candidates:[{anilist_id:anilist,mal_id:media.source_ids?.mal?Number(media.source_ids.mal):null,media_type:media.media_type}]})});const item=result.find(item=>item.anilist_id===anilist);if(!item)throw new ApiError(503,'UPSTREAM_UNAVAILABLE');return item},staleTime:30000,retry:false})
  const write=useMutation({networkMode:'always',retry:false,mutationFn:async({owner,expected,dismissed}:{owner:string;expected:number;dismissed:boolean})=>{
    if(account.current!==owner)throw new ApiError(401,'UNAUTHORIZED')
    return api<FeedbackMutation>(`/me/recommendation-feedback/${media.id}`,{accountId:owner,method:'PUT',body:JSON.stringify({dismissed,expected_version:expected,context})})
  },onSuccess:(result,variables)=>{if(account.current!==variables.owner)return;publishRecommendationFeedback(queries,variables.owner,media,result);notify(t(result.dismissed?'recommendations.dismissedNotice':'recommendations.restoredNotice'));onDone()},
  onError:(error:Error,variables)=>{if(account.current!==variables.owner)return;notify(error.message);if(error instanceof ApiError&&error.status===409){void read.refetch();void queries.invalidateQueries({queryKey:['private',variables.owner,'dismissed-recommendations']})}}})
  if(!userId)return null
  if(version===undefined&&read.error)return <ErrorState error={read.error} retry={()=>{void read.refetch()}}/>
  const expected=version??read.data?.version,dismissed=context==='management'?false:!read.data?.dismissed
  return <Button variant="secondary" disabled={!ready||expected===undefined||write.isPending} onClick={()=>{if(expected!==undefined)write.mutate({owner:userId,expected,dismissed})}}>{t(dismissed?'recommendations.dismiss':'recommendations.restore')}</Button>
}
