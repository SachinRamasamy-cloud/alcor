import {useEffect} from 'react'
import {useQuery,useQueryClient} from '@tanstack/react-query'
import {useSearchParams} from 'react-router-dom'
import {useAuth} from '../shared/auth'
import {useBackend} from '../shared/api/backend'
import {api,ApiError,type Media} from '../shared/api/client'
import {aniDetails} from '../shared/api/anilist'
import {usePreferences} from '../features/preferences'
import {useFavorites,type FavoritesPageData} from '../features/library/favorites'
import {CardActions} from '../features/library/actions'
import {useRecommendationFeed} from '../features/recommendations/hooks'
import {RecommendationContext,recommendationFilters} from '../features/recommendations/views'
import {FavoriteFeedFilters} from '../features/recommendations/filters'
import type {FeedKind} from '../features/recommendations/feed'
import {useDiscoveryMode,type DiscoveryMode} from '../features/catalogue/policy'
import {DiscoveryNotice} from '../features/catalogue/visibility'
import {useCataloguePagination} from '../features/catalogue/pagination'
import {tasteParams} from '../features/discovery/taste'
import {MediaGrid} from '../entities/media'
import {Button,ErrorState,Loading,Pagination} from '../shared/ui'
import {t} from '../shared/content'

function FeedResults({kind,type,mode,filters,seeds,knownFavorites,version,favoriteVersion,favoriteCursor,restart}:{kind:FeedKind;type:'anime'|'manga';mode:DiscoveryMode;filters:URLSearchParams;seeds:Media[];knownFavorites:Media[];version:number;favoriteVersion:number;favoriteCursor:string;restart:()=>void}){
  const [params]=useSearchParams()
  const query=useRecommendationFeed({kind,type,mode,filters,seeds,knownFavorites,preferenceVersion:version,favoriteVersion,favoriteCursor,token:params.get('cursor')??''})
  const pagination=useCataloguePagination(query.data?.nextCursor,query.data?.hasMore??false,mode,true)
  if(Number(params.get('page')??1)>1&&!params.get('cursor'))return <><ErrorState error={new ApiError(422,'INVALID_CURSOR')}/><Button onClick={restart}>{t('recommendations.restart')}</Button></>
  if(query.personalUnavailable)return <DiscoveryNotice unavailable refetch={query.refetch}/>
  if(query.isPending)return <Loading variant="catalogue"/>
  if(query.error)return <><ErrorState error={query.error} retry={()=>{void query.refetch()}}/><Button onClick={restart}>{t('recommendations.restart')}</Button></>
  return <>{query.data.items.length?<MediaGrid items={query.data.items.map(item=>item.media)} actions={media=><CardActions media={media} recommendationContext={kind}/>} context={media=><RecommendationContext item={query.data.items.find(item=>item.media.id===media.id)!} kind={kind} filters={filters}/>}/>:<p className="coverage-note">{t('recommendations.empty')}</p>}
    {query.data.limited&&<p className="coverage-note">{t('recommendations.limited')}</p>}
    <Pagination page={pagination.page} hasNext={query.data.hasMore} availablePages={pagination.availablePages} busy={query.isFetching} onChange={pagination.change}/>
  </>
}
export function RecommendationsPage(){
  const [params,setParams]=useSearchParams(),{userId,requireSignIn}=useAuth(),{ready}=useBackend(),preferences=usePreferences()
  const queries=useQueryClient()
  const favoriteCursor=params.get('favorites_cursor')??'',favorites=useFavorites(favoriteCursor)
  const mode=useDiscoveryMode(params),type=params.get('type')==='manga'?'manga':'anime',kind=params.get('kind') as FeedKind
  const requested=params.getAll('seed'),requestedVersion=params.get('version')
  const validKind=['favorites','similar','taste'].includes(kind),validType=!params.has('type')||['anime','manga'].includes(params.get('type')!)
  const validSeeds=kind==='similar'?requested.length===1&&/^anilist-[1-9]\d{0,9}$/.test(requested[0]):kind!=='favorites'||requested.length<=3&&requested.every(seed=>/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(seed))&&new Set(requested).size===requested.length
  const selected=useQuery({queryKey:['private',userId,'recommendations','seeds',{mode,ids:requested,version:requestedVersion}],enabled:Boolean(userId&&ready&&kind==='favorites'&&requested.length&&validSeeds),
    queryFn:({signal})=>api<FavoritesPageData>(`/me/favorites?${new URLSearchParams([...requested.map(seed=>['ids',seed] as [string,string]),['limit','3']])}`,{accountId:userId!,signal}),staleTime:30000,retry:false})
  const similar=useQuery({queryKey:['public','anilist',type,requested[0]],enabled:kind==='similar'&&validSeeds,
    queryFn:({signal})=>aniDetails(type,requested[0],signal),staleTime:300000,retry:false})
  const title=t(kind==='favorites'?'recommendations.favorites':kind==='taste'?'dashboard.youMayLike':type==='anime'?'recommendations.similarAnime':'recommendations.similarManga')
  const preferenceRevision=preferences.data?.version,favoriteRevision=favorites.data?.preferences_version,selectedRevision=selected.data?.preferences_version,readFailed=Boolean(preferences.error||favorites.error||selected.error)
  useEffect(()=>{
    if(!userId||readFailed||preferenceRevision===undefined||favoriteRevision===undefined)return
    const latest=Math.max(preferenceRevision,favoriteRevision,selectedRevision??0)
    if(preferenceRevision<latest)void queries.invalidateQueries({queryKey:['private',userId,'preferences']})
    if(favoriteRevision<latest)void queries.invalidateQueries({queryKey:['private',userId,'favorites']})
    if(selectedRevision!==undefined&&selectedRevision<latest)void queries.invalidateQueries({queryKey:['private',userId,'recommendations','seeds']})
  },[userId,readFailed,preferenceRevision,favoriteRevision,selectedRevision,queries])
  useEffect(()=>{document.title=`${title} · ALCOR`},[title])
  function restart(refreshContext=false){setParams(previous=>{
    if(refreshContext){const next=new URLSearchParams({kind,type,mode});if(kind==='similar')requested.forEach(seed=>next.append('seed',seed));return next}
    const next=new URLSearchParams(previous);next.delete('cursor');next.delete('page');return next
  })}
  function changeFilters(change:(next:URLSearchParams)=>void){setParams(previous=>{
    const next=new URLSearchParams(previous);change(next);next.delete('cursor');next.delete('page')
    if(preferences.data)next.set('version',String(preferences.data.version))
    return next
  })}
  function favoriteWindow(cursor:string){changeFilters(next=>{next.delete('seed');if(cursor)next.set('favorites_cursor',cursor);else next.delete('favorites_cursor')})}
  const canonical=preferences.data?.data.favorite_media_ids
  const pool=[...new Map([...(favorites.data?.data??[]),...(selected.data?.data??[])].filter(media=>media.media_type===type&&media.source_ids?.anilist&&(canonical==null||canonical.includes(media.id))).map(media=>[media.id,media])).values()]
  const controls=kind==='favorites'&&userId&&ready&&preferences.data&&favorites.data&&preferenceRevision===favoriteRevision?<FavoriteFeedFilters
    pool={pool} source={requested.length===1?requested[0]:''} genres={[...new Set([...params.getAll('include_genres'),...params.getAll('genre')])]}
    onSource={source=>changeFilters(next=>{next.delete('seed');if(source)next.append('seed',source)})}
    onGenres={genres=>changeFilters(next=>{next.delete('genre');next.delete('include_genres');next.set('genre_match','any');genres.forEach(genre=>next.append('include_genres',genre))})}
    onNext={favorites.data.next_cursor?()=>favoriteWindow(favorites.data!.next_cursor!):undefined} onFirst={favoriteCursor?()=>favoriteWindow(''):undefined}
    onReset={()=>changeFilters(next=>{for(const key of ['seed','genre','include_genres','genre_match'])next.delete(key)})}/>:null
  let body
  if(!validKind||!validType||!validSeeds||requestedVersion!==null&&!/^\d+$/.test(requestedVersion))body=<ErrorState error={new ApiError(422,'INVALID_REQUEST')}/>
  else if(!userId&&kind!=='similar')body=<Button onClick={()=>requireSignIn()}>{t('nav.signIn')}</Button>
  else if(userId&&!ready)body=<DiscoveryNotice unavailable refetch={preferences.refetch}/>
  else if(userId&&(preferences.error||favorites.error)||selected.error||similar.error)body=<ErrorState error={preferences.error??favorites.error??selected.error??similar.error} retry={()=>{void preferences.refetch();void favorites.refetch();if(kind==='favorites'&&requested.length)void selected.refetch();if(kind==='similar')void similar.refetch()}}/>
  else if(userId&&(!preferences.data||!favorites.data||preferenceRevision!==favoriteRevision||selectedRevision!==undefined&&selectedRevision!==preferenceRevision)||kind==='favorites'&&requested.length&&!selected.data||kind==='similar'&&!similar.data)body=<Loading variant="catalogue"/>
  else{
    const version=preferences.data?.version??0,known=[...(favorites.data?.data??[]),...(selected.data?.data??[])]
    const seeds=kind==='similar'?[similar.data!]:kind==='favorites'?requested.length?requested.flatMap(id=>selected.data!.data.find(media=>media.id===id)??[]):(favorites.data?.data??[]).filter(media=>media.media_type===type&&media.source_ids?.anilist).slice(0,3):[]
    const changed=userId&&requestedVersion!==null&&Number(requestedVersion)!==version||kind==='favorites'&&(requested.length&&seeds.length!==requested.length||seeds.some(media=>media.media_type!==type))
    const filters=preferences.data?recommendationFilters(preferences.data.data,type,mode,kind):new URLSearchParams({mode})
    const explicit=new URLSearchParams(params);for(const key of ['kind','type','seed','version','mode','page','cursor','favorites_cursor'])explicit.delete(key)
    const strictExclusions=filters.getAll('exclude_genres')
    for(const key of new Set(explicit.keys())){filters.delete(key);explicit.getAll(key).forEach(value=>filters.append(key,value))}
    for(const genre of strictExclusions)if(!filters.getAll('exclude_genres').includes(genre))filters.append('exclude_genres',genre)
    if(changed)body=<><ErrorState error={new ApiError(409,'RECOMMENDATION_CONTEXT_CHANGED')}/><Button onClick={()=>restart(true)}>{t('recommendations.restart')}</Button></>
    else if(kind==='favorites'&&!seeds.length)body=<p className="coverage-note">{t((favorites.data?.total??0)>0?'recommendations.seedWindowEmpty':'recommendations.noFavorites')}</p>
    else if(kind==='taste'&&preferences.data&&!tasteParams(preferences.data.data,type,mode).personal)body=<p className="coverage-note">{t('recommendations.noTaste')}</p>
    else body=<FeedResults kind={kind} type={type} mode={mode} filters={filters} seeds={seeds} knownFavorites={known} version={version} favoriteVersion={selected.data?.preferences_version??favorites.data?.preferences_version??0} favoriteCursor={favoriteCursor} restart={()=>restart()}/>
  }
  return <div className="shell page-body"><div className="page-heading"><h1>{title}</h1></div>{controls}{body}{kind==='favorites'&&userId&&favoriteCursor&&!controls&&favorites.error&&<Button variant="secondary" onClick={()=>favoriteWindow('')}>{t('recommendations.firstFavorites')}</Button>}</div>
}
