import {useLayoutEffect,useRef} from 'react'
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import {Star} from 'lucide-react'
import {api,ApiError,type Media} from '../../shared/api/client'
import type {components} from '../../shared/api/schema'
import {resolveMedia} from '../../shared/api/identity'
import {useAuth} from '../../shared/auth'
import {useBackend} from '../../shared/api/backend'
import {useFeedback} from '../../shared/feedback'
import {t} from '../../shared/content'
import {Button} from '../../shared/ui'
import {publishLibraryEntry} from './cache'

export type FavoritesPageData=components['schemas']['FavoritesPage']
type FavoriteMutation=components['schemas']['FavoriteMutation']
export function useFavorites(cursor=''){
  const {userId}=useAuth(),{ready}=useBackend()
  const params=new URLSearchParams({limit:'24'});if(cursor)params.set('cursor',cursor)
  return useQuery({queryKey:['private',userId,'favorites',cursor],enabled:Boolean(userId&&ready),
    queryFn:({signal})=>api<FavoritesPageData>(`/me/favorites?${params}`,{accountId:userId!,signal}),
    staleTime:30000,refetchOnWindowFocus:true,retry:false})
}
function useFavoriteMembership(media:Media){
  const {userId}=useAuth(),{ready}=useBackend()
  return useQuery({queryKey:['private',userId,'favorite-membership',media.id],enabled:Boolean(userId&&ready),
    queryFn:({signal})=>api<FavoritesPageData>(`/me/favorites?${new URLSearchParams({ids:media.id,limit:'1'})}`,{accountId:userId!,signal}),
    staleTime:30000,refetchOnWindowFocus:true,retry:false})
}
export function useFavoriteWrite(){
  const {userId}=useAuth(),queries=useQueryClient(),notify=useFeedback(),account=useRef(userId)
  useLayoutEffect(()=>{account.current=userId;return()=>{account.current=null}},[userId])
  return useMutation({scope:{id:`favorites:${userId}`},networkMode:'always',retry:false,
    mutationFn:async({media,favorite,version,owner}:{media:Media;favorite:boolean;version:number;owner:string})=>{
      if(account.current!==owner)throw new ApiError(401,'UNAUTHORIZED')
      const canonical=await resolveMedia(media,owner)
      const result=await api<FavoriteMutation>(`/me/favorites/${canonical.id}`,{accountId:owner,method:'PUT',body:JSON.stringify({favorite,expected_preferences_version:version})})
      return {result,media:canonical,owner}
    },
    onSuccess:({result,media,owner},variables)=>{
      if(account.current!==owner)return
      const current=queries.getQueryData<components['schemas']['PreferencesRead']>(['private',owner,'preferences'])
      if(current&&current.version>result.preferences_version)return
      const aliases=[media.id,variables.media.id]
      void queries.cancelQueries({predicate:query=>query.queryKey[0]==='private'&&query.queryKey[1]===owner&&['preferences','setup','favorite-membership','favorites'].includes(String(query.queryKey[2]))})
      queries.setQueryData(['private',owner,'preferences'],result.preferences)
      queries.setQueriesData<FavoritesPageData>({predicate:query=>query.queryKey[0]==='private'&&query.queryKey[1]===owner&&query.queryKey[2]==='favorite-membership'&&aliases.includes(String(query.queryKey[3]))},
        {data:result.favorite?[media]:[],total:Number(result.favorite),preferences_version:result.preferences_version,next_cursor:null})
      if(result.entry)publishLibraryEntry(queries,owner,result.entry,aliases)
      if(result.changed||current?.version!==result.preferences_version){
        queries.removeQueries({queryKey:['private',owner,'page-cursors','/favorites']})
        void queries.resetQueries({queryKey:['private',owner,'favorites']})
      }
      if(result.changed)notify(t(result.favorite?'favorites.added':'favorites.removed'))
    },
    onError:(error:Error,variables)=>{if(account.current===variables.owner)notify(error.message)},
    onSettled:(_value,_error,variables)=>{const affected=new Set(['preferences','setup','favorite-membership','favorites','media-status','library','wishlist','statistics','history','recommendations']);void queries.invalidateQueries({predicate:query=>query.queryKey[0]==='private'&&query.queryKey[1]===variables.owner&&affected.has(String(query.queryKey[2]))})},
  })
}
export function FavoriteButton({media}:{media:Media}){
  const saved=useFavoriteMembership(media),write=useFavoriteWrite(),{ready}=useBackend(),{userId}=useAuth()
  const favorite=Boolean(saved.data?.data.length)
  const label=t(saved.error?'favorites.retry':saved.isPending?'favorites.checking':favorite?'favorites.remove':'favorites.add')
  return <Button variant="secondary" disabled={!userId||!ready||saved.isPending||write.isPending} aria-pressed={saved.data?favorite:undefined} onClick={()=>{if(saved.error){void saved.refetch();return}if(saved.data&&userId)write.mutate({media,favorite:!favorite,version:saved.data.preferences_version,owner:userId})}}><Star size={16} fill={favorite?'currentColor':'none'}/>{label}</Button>
}
