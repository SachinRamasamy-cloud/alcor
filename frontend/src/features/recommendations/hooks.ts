import {useQuery,useQueryClient} from '@tanstack/react-query'
import {useAuth} from '../../shared/auth'
import {useBackend} from '../../shared/api/backend'
import {ApiError,type Media} from '../../shared/api/client'
import {aniCatalogue,aniRecommendations,mergeRecommendationWindows,type RecommendationWindow} from '../../shared/api/anilist'
import {sourceFilterParams} from '../catalogue/custom-filters'
import type {DiscoveryMode} from '../catalogue/policy'
import {loadFeed,type FeedCursor,type FeedKind,type FeedPage} from './feed'

type Continuation={context:string;cursor:FeedCursor}
export type RecommendationPage=FeedPage&{nextCursor:string|null}
export function useRecommendationFeed({kind,type,mode,filters,seeds=[],knownFavorites=[],preferenceVersion=0,favoriteVersion=0,favoriteCursor='',enabled=true,token=''}:{
  kind:FeedKind;type:'anime'|'manga';mode:DiscoveryMode;filters:URLSearchParams;seeds?:Media[];knownFavorites?:Media[];
  preferenceVersion?:number;favoriteVersion?:number;favoriteCursor?:string;enabled?:boolean;token?:string;
}){
  const {userId}=useAuth(),{ready}=useBackend(),queries=useQueryClient()
  const normalized=new URLSearchParams(filters);normalized.sort()
  const context={kind,type,mode,filters:normalized.toString(),seeds:seeds.map(seed=>seed.id),preferenceVersion,favoriteVersion,favoriteCursor}
  const fingerprint=JSON.stringify(context),scope=userId?['private',userId]:['public','guest']
  const available=userId?ready:kind==='similar'
  const queryKey=[...scope,'recommendations',kind,context,token]
  const query=useQuery({queryKey,enabled:enabled&&available,
    queryFn:async({signal}):Promise<RecommendationPage>=>{
      if(!available)throw new ApiError(503,'BACKEND_WAKING')
      const continuation=token?queries.getQueryData<Continuation>([...scope,'recommendation-cursors',token]):undefined
      if(token&&(!continuation||continuation.context!==fingerprint))throw new ApiError(422,'INVALID_CURSOR')
      const source=async(page:number,activeSeeds?:number[])=>{
        if(kind==='taste'){
          const params=sourceFilterParams(normalized);params.delete('mode');params.set('cursor',String(page))
          return queries.fetchQuery({queryKey:['public','anilist','recommendation-catalogue',type,params.toString()],staleTime:300000,retry:false,
            queryFn:async({signal:publicSignal}):Promise<RecommendationWindow>=>{const result=await aniCatalogue(`/${type}`,params,publicSignal);return {items:result.data.map(media=>({media,origins:[],ratings:{}})),hasMore:result.has_more}}})
        }
        const ids=activeSeeds??seeds.map(seed=>Number(seed.source_ids?.anilist))
        if(ids.some(id=>!Number.isSafeInteger(id)||id<1))throw new ApiError(503,'RECOMMENDATIONS_UNAVAILABLE')
        const key=(id:number)=>['public','anilist','recommendation-edge',type,id,page]
        const fresh=(id:number)=>{const state=queries.getQueryState<RecommendationWindow>(key(id));return state?.data&&Date.now()-state.dataUpdatedAt<300000?state.data:undefined}
        const missing=ids.filter(id=>!fresh(id))
        if(missing.length){
          const batch=await queries.fetchQuery({queryKey:[...scope,'recommendation-source-batches',type,missing.join(','),page],staleTime:300000,retry:false,
            queryFn:({signal:batchSignal})=>aniRecommendations(missing,type,page,batchSignal)})
          signal.throwIfAborted()
          for(const id of missing){const window=batch.seedWindows?.[String(id)];if(!window)throw new ApiError(503,'UPSTREAM_UNAVAILABLE');queries.setQueryData(key(id),window)}
        }
        return mergeRecommendationWindows(ids.map(id=>queries.getQueryData<RecommendationWindow>(key(id))!))
      }
      const result=await loadFeed({source,filters:normalized,mode,owner:userId,signal,cursor:continuation?.cursor,knownFavorites:[...knownFavorites,...seeds],recommendation:true})
      signal.throwIfAborted()
      const nextCursor=result.next?crypto.randomUUID():null
      if(nextCursor)queries.setQueryData<Continuation>([...scope,'recommendation-cursors',nextCursor],{context:fingerprint,cursor:result.next!})
      return {...result,nextCursor}
    },staleTime:30000,retry:false})
  return {...query,queryKey,personalUnavailable:enabled&&!available}
}
