import {useEffect} from 'react'
import {useQueryClient} from '@tanstack/react-query'
import {Link} from 'react-router-dom'
import {useAuth} from '../../shared/auth'
import {useBackend} from '../../shared/api/backend'
import type {Media} from '../../shared/api/client'
import type {RecommendationItem} from '../../shared/api/anilist'
import {sameTitle} from '../../shared/api/identity'
import {t} from '../../shared/content'
import {ErrorState,Loading} from '../../shared/ui'
import {CardStatus} from '../library/actions'
import {useFavorites} from '../library/favorites'
import {usePreferences,type Preferences} from '../preferences'
import {tasteParams} from '../discovery/taste'
import {BrowseShelf} from '../catalogue/shelf'
import {DiscoveryNotice} from '../catalogue/visibility'
import type {DiscoveryMode} from '../catalogue/policy'
import {useRecommendationFeed} from './hooks'
import {recommendationLink,type FeedKind} from './feed'

export function recommendationFilters(preferences:Preferences,type:'anime'|'manga',mode:DiscoveryMode,kind:FeedKind){
  const params=tasteParams(preferences,type,mode).params
  if(kind!=='taste'){params.delete('include_genres');params.delete('genre_match')}
  return params
}

export function recommendationReason(item:RecommendationItem,kind:FeedKind,filters:URLSearchParams){
  if(kind==='favorites'&&item.origins.length)return t(item.origins.length>1?'recommendations.becauseFavorites':'recommendations.becauseFavorite',{title:item.origins[0].title,count:item.origins.length-1})
  if(kind==='similar'&&item.origins.length)return t('recommendations.becauseSimilar',{title:item.origins[0].title})
  const same=(a:string,b:string)=>a.normalize('NFKC').trim().toLocaleLowerCase('en')===b.normalize('NFKC').trim().toLocaleLowerCase('en')
  const genre=filters.getAll('include_genres').find(selected=>item.media.genres.some(actual=>same(selected,actual)))
  if(genre)return t('recommendations.becauseGenre',{genre})
  const theme=filters.getAll('include_themes').find(selected=>item.media.themes?.some(actual=>same(selected,actual)))
  if(theme)return t('recommendations.becauseTheme',{theme})
  const studio=filters.getAll('studio').find(selected=>item.media.studios?.some(actual=>same(selected,actual)))
  return studio?t('recommendations.becauseStudio',{studio}):t('recommendations.becauseFilters')
}
export function RecommendationContext({item,kind,filters}:{item:RecommendationItem;kind:FeedKind;filters:URLSearchParams}){
  const reason=recommendationReason(item,kind,filters)
  return <><CardStatus media={item.media}/><div className="card-context"><p className="card-meta" title={reason}>{reason}</p></div></>
}
function FeedShelf({kind,type,mode,filters,seeds=[],knownFavorites=[],version,favoriteVersion,favoriteCursor='',title,enabled=true}:{
  kind:FeedKind;type:'anime'|'manga';mode:DiscoveryMode;filters:URLSearchParams;seeds?:Media[];knownFavorites?:Media[];version:number;favoriteVersion?:number;favoriteCursor?:string;title:string;enabled?:boolean;
}){
  const query=useRecommendationFeed({kind,type,mode,filters,seeds,knownFavorites,preferenceVersion:version,favoriteVersion,favoriteCursor,enabled})
  if(query.personalUnavailable)return <section className="home-section"><h2>{title}</h2><DiscoveryNotice unavailable refetch={query.refetch}/></section>
  if(query.isPending)return <section className="home-section"><h2>{title}</h2><Loading variant="shelf"/></section>
  if(query.error)return <section className="home-section"><h2>{title}</h2><ErrorState error={query.error} retry={()=>{void query.refetch()}}/></section>
  const items=query.data.items.slice(0,12),to=recommendationLink(kind,type,mode,{filters,seeds:seeds.map(seed=>kind==='similar'?`anilist-${seed.source_ids?.anilist}`:seed.id),version,favoriteCursor})
  return <><BrowseShelf title={title} items={items.map(item=>item.media)} to={to} emptyMessage={t('recommendations.empty')} recommendationContext={kind}
    context={media=><RecommendationContext item={items.find(item=>sameTitle(item.media,media))!} kind={kind} filters={filters}/>}/>
    {query.data.limited&&<p className="coverage-note">{t('recommendations.limited')}</p>}</>
}
function PersonalFeeds({type,mode,showFavorites=true,showTaste=true,enabled=true}:{type:'anime'|'manga';mode:DiscoveryMode;showFavorites?:boolean;showTaste?:boolean;enabled?:boolean}){
  const {userId}=useAuth(),{ready}=useBackend(),queries=useQueryClient(),preferences=usePreferences()
  const version=preferences.data?.version??0
  const favorites=useFavorites()
  const baselineFavorites=useFavorites()
  const preferenceRevision=preferences.data?.version,favoriteRevision=favorites.data?.preferences_version,readFailed=Boolean(preferences.error||favorites.error)
  useEffect(()=>{
    if(preferenceRevision===undefined||favoriteRevision===undefined||readFailed)return
    if(preferenceRevision>favoriteRevision)void queries.invalidateQueries({queryKey:['private',userId,'favorites']})
    else if(preferenceRevision<favoriteRevision)void queries.invalidateQueries({queryKey:['private',userId,'preferences']})
  },[preferenceRevision,favoriteRevision,readFailed,queries,userId])
  if(!ready)return <DiscoveryNotice unavailable refetch={()=>{void preferences.refetch();void favorites.refetch()}}/>
  if(preferences.error||favorites.error)return <>{[...(showFavorites?['recommendations.favorites' as const]:[]),...(showTaste?['dashboard.youMayLike' as const]:[])].map(title=><section className="home-section" key={title}><h2>{t(title)}</h2><ErrorState error={preferences.error??favorites.error} retry={()=>{void preferences.refetch();void favorites.refetch()}}/></section>)}</>
  if(!preferences.data||!favorites.data||preferenceRevision!==favoriteRevision)return <section className="home-section"><h2>{t(showFavorites?'recommendations.favorites':'dashboard.youMayLike')}</h2><Loading variant="shelf"/></section>
  const canonical=preferences.data.data.favorite_media_ids
  const known=favorites.data.data.filter(media=>canonical==null||canonical.includes(media.id))
  const pool=known.filter(media=>media.media_type===type&&Boolean(media.source_ids?.anilist)),seeds=pool.slice(0,3)
  const taste=tasteParams(preferences.data.data,type,mode)
  return <>
    {showFavorites&&(seeds.length?<FeedShelf kind="favorites" type={type} mode={mode} filters={recommendationFilters(preferences.data.data,type,mode,'favorites')} seeds={seeds} knownFavorites={known} version={version} favoriteVersion={favorites.data.preferences_version} title={t('recommendations.favorites')} enabled={enabled}/>:
      favorites.data.total>0?<section className="home-section"><h2>{t('recommendations.favorites')}</h2><p className="browse-description">{t('recommendations.seedWindowEmpty')}</p></section>:
        <section className="home-section"><h2>{t('recommendations.favorites')}</h2><p className="browse-description">{t('recommendations.noFavorites')}</p><Link className="subtle-link" to="/favorites">{t('favorites.title')}</Link></section>)}
    {showTaste&&taste.personal&&(baselineFavorites.data&&!baselineFavorites.error?<FeedShelf kind="taste" type={type} mode={mode} filters={taste.params} knownFavorites={baselineFavorites.data.data.filter(media=>canonical==null||canonical.includes(media.id))} version={version} favoriteVersion={baselineFavorites.data.preferences_version} title={t('dashboard.youMayLike')} enabled={enabled}/>:<section className="home-section"><h2>{t('dashboard.youMayLike')}</h2>{baselineFavorites.error?<ErrorState error={baselineFavorites.error} retry={()=>{void baselineFavorites.refetch()}}/>:<Loading variant="shelf"/>}</section>)}
  </>
}
export function PersonalShelves(props:{type:'anime'|'manga';mode:DiscoveryMode;showFavorites?:boolean;showTaste?:boolean;enabled?:boolean}){
  const {userId}=useAuth()
  return userId?<PersonalFeeds key={`${userId}:${props.type}`} {...props}/>:null
}
function HomePersonal({mode}:{mode:DiscoveryMode}){
  const favorites=useFavorites(),preferences=usePreferences()
  const mediaTypes=preferences.data?.data.intelligence_profile?.media_types??[]
  const first=favorites.data?.data.find(media=>media.media_type==='anime')??favorites.data?.data[0]
  const type=first?.media_type??(mediaTypes.length&&!mediaTypes.includes('anime')?'manga':'anime')
  return <PersonalShelves type={type} mode={mode}/>
}
export function HomePersonalShelves({mode,enabled}:{mode:DiscoveryMode;enabled:boolean}){
  const {userId}=useAuth()
  return userId&&enabled?<HomePersonal key={userId} mode={mode}/>:null
}
function SimilarCarousel({media,mode,filters,knownFavorites,version,favoriteVersion,title}:{media:Media;mode:DiscoveryMode;filters:URLSearchParams;knownFavorites:Media[];version:number;favoriteVersion:number;title:string}){
  const query=useRecommendationFeed({kind:'similar',type:media.media_type,mode,filters,seeds:[media],knownFavorites,preferenceVersion:version,favoriteVersion})
  if(query.personalUnavailable)return <section className="home-section details-similar"><h2>{title}</h2><DiscoveryNotice unavailable refetch={query.refetch}/></section>
  if(query.error)return <section className="home-section details-similar"><h2>{title}</h2><ErrorState error={query.error} retry={()=>{void query.refetch()}}/></section>
  if(query.isPending)return <section className="home-section details-similar"><h2>{title}</h2><Loading variant="shelf"/></section>
  const items=query.data.items
  const to=recommendationLink('similar',media.media_type,mode,{filters,seeds:[`anilist-${media.source_ids?.anilist}`],version})
  return <div className="details-similar"><BrowseShelf title={title} items={items.map(item=>item.media)} to={to} recommendationContext="similar" emptyMessage={t('recommendations.empty')}
    context={candidate=><RecommendationContext item={items.find(item=>sameTitle(item.media,candidate))!} kind="similar" filters={filters}/>}/>
  </div>
}
export function SimilarShelf({media,mode}:{media:Media;mode:DiscoveryMode}){
  const preferences=usePreferences(),favorites=useFavorites(),{userId}=useAuth()
  const title=t(media.media_type==='anime'?'recommendations.similarAnime':'recommendations.similarManga')
  if(!media.source_ids?.anilist)return null
  if(userId&&(preferences.error||favorites.error))return <section className="home-section"><h2>{title}</h2><ErrorState error={preferences.error??favorites.error} retry={()=>{void preferences.refetch();void favorites.refetch()}}/></section>
  if(userId&&(!preferences.data||!favorites.data))return <section className="home-section"><h2>{title}</h2><Loading variant="shelf"/></section>
  const filters=preferences.data?recommendationFilters(preferences.data.data,media.media_type,mode,'similar'):new URLSearchParams({mode})
  const version=preferences.data?.version??0,favoriteVersion=favorites.data?.preferences_version??0
  return <SimilarCarousel key={JSON.stringify([userId,media.id,mode,version,favoriteVersion,filters.toString()])} media={media} mode={mode} filters={filters} knownFavorites={favorites.data?.data??[]} version={version} favoriteVersion={favoriteVersion} title={title}/>
}
