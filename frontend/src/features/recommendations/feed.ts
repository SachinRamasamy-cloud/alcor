import {ApiError,type Media} from '../../shared/api/client'
import type {RecommendationItem,RecommendationWindow} from '../../shared/api/anilist'
import {sameTitle} from '../../shared/api/identity'
import {matchesCustomFilters} from '../catalogue/custom-filters'
import {exclusions} from '../catalogue/personal-page'
import type {DiscoveryMode} from '../catalogue/policy'

export type FeedCursor={page:number;offset:number;seen:string[];window?:RecommendationWindow;activeSeeds?:number[]}
export type FeedPage={items:RecommendationItem[];hasMore:boolean;next:FeedCursor|null;limited:boolean}
export type FeedKind='favorites'|'similar'|'taste'
export const titleIdentity=(media:Media)=>`${media.media_type}:${media.source_ids?.anilist?`anilist:${media.source_ids.anilist}`:media.source_ids?.mal?`mal:${media.source_ids.mal}`:media.id}`
const aliases=(media:Media)=>[titleIdentity(media),...(media.source_ids?.mal?[`${media.media_type}:mal:${media.source_ids.mal}`]:[])]

export function matchesFeed(media:Media,params:URLSearchParams){
  const filter=new URLSearchParams(params),studios=filter.getAll('studio')
  filter.delete('studio')
  const normalize=(value:string)=>value.normalize('NFKC').trim().toLocaleLowerCase('en')
  return matchesCustomFilters(media,filter)
    &&(!studios.length||studios.some(selected=>media.studios?.some(actual=>normalize(actual)===normalize(selected))))
    &&(!filter.has('units_max')||media.total_units!=null&&media.total_units<=Number(filter.get('units_max')))
    &&(!filter.has('score_min')||media.score!=null&&media.score>=Number(filter.get('score_min')))
}

export async function loadFeed({source,filters,mode,owner,signal,cursor,knownFavorites=[],exclude=exclusions,recommendation=false}:{
  source:(page:number,activeSeeds?:number[])=>Promise<RecommendationWindow>;filters:URLSearchParams;mode:DiscoveryMode;owner:string|null;signal:AbortSignal;
  cursor?:FeedCursor;knownFavorites?:Media[];exclude?:typeof exclusions;recommendation?:boolean;
}):Promise<FeedPage>{
  let page=cursor?.page??1,offset=cursor?.offset??0
  if(!Number.isSafeInteger(page)||page<1||page>10000||!Number.isSafeInteger(offset)||offset<0||offset>72)throw new ApiError(422,'INVALID_CURSOR')
  const seen=new Set(cursor?.seen??[]),items:RecommendationItem[]=[]
  let activeSeeds=cursor?.activeSeeds
  for(let scanned=0;scanned<3;scanned++){
    signal.throwIfAborted()
    const window=cursor?.window&&page===cursor.page&&offset>0?cursor.window:await source(page,activeSeeds)
    signal.throwIfAborted()
    if(!Array.isArray(window.items)||window.items.length>72)throw new ApiError(503,'UPSTREAM_UNAVAILABLE')
    if(offset>window.items.length)throw new ApiError(422,'INVALID_CURSOR')
    const excluded=owner&&(mode!=='all'||recommendation)?await exclude(window.items.map(item=>item.media),mode,owner,signal,recommendation):[]
    signal.throwIfAborted()
    for(let index=offset;index<window.items.length;index++){
      const item=window.items[index],identities=aliases(item.media)
      if(!identities.some(identity=>seen.has(identity))&&!excluded.includes(Number(item.media.source_ids?.anilist))&&matchesFeed(item.media,filters)&&!knownFavorites.some(favorite=>sameTitle(favorite,item.media))){items.push(item);identities.forEach(identity=>seen.add(identity))}
      if(items.length===24){
        const unread=index+1<window.items.length,more=unread||window.hasMore
        return {items,hasMore:more,next:more?{page:unread?page:page+1,offset:unread?index+1:0,seen:[...seen],...(unread?{window,activeSeeds}:{activeSeeds:window.nextSeeds})}:null,limited:false}
      }
    }
    if(!window.hasMore)return {items,hasMore:false,next:null,limited:false}
    page++;offset=0;activeSeeds=window.nextSeeds
  }
  return {items,hasMore:true,next:{page,offset:0,seen:[...seen],activeSeeds},limited:true}
}

export function recommendationLink(kind:FeedKind,type:'anime'|'manga',mode:DiscoveryMode,{seeds=[],version,filters,favoriteCursor=''}:{seeds?:string[];version?:number;filters?:URLSearchParams;favoriteCursor?:string}={}){
  const params=new URLSearchParams(filters)
  params.set('kind',kind);params.set('type',type);params.set('mode',mode)
  params.delete('cursor');params.delete('page');params.delete('seed');params.delete('version')
  seeds.forEach(seed=>params.append('seed',seed))
  if(version!==undefined)params.set('version',String(version))
  if(favoriteCursor)params.set('favorites_cursor',favoriteCursor);else params.delete('favorites_cursor')
  return `/recommendations?${params}`
}
