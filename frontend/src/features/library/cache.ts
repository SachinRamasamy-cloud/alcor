import type {QueryClient} from '@tanstack/react-query'
import type {components} from '../../shared/api/schema'
import type {CataloguePage} from '../../shared/api/client'
import {sameTitle} from '../../shared/api/identity'
import type {ShelfPools} from '../catalogue/shelf-refill'
import type {FeedPage} from '../recommendations/feed'
import {hasLibraryFilters,type LibraryReadFilters} from './query'
type Entry=components['schemas']['LibraryEntry']
type PreferencesRead=components['schemas']['PreferencesRead']
type LibraryPage=components['schemas']['LibraryPage']

export function excludesEntry(entry:Entry,mode:string,includePlanned=true){
  return mode!=='all'&&(entry.ever_completed||entry.status==='completed'||mode==='new_to_me'&&(
    ['in_progress','on_hold','dropped','not_interested'].includes(entry.status)||!includePlanned&&entry.status==='planned'&&!entry.deleted_at))
}
// Only committed server responses enter here. Public source data is never edited.
export function publishLibraryEntry(queries:QueryClient,owner:string,serverEntry:Entry,references:string[]=[]){
  const saved=queries.getQueryCache().findAll({queryKey:['private',owner,'media-status']}).flatMap(query=>Array.isArray(query.state.data)?query.state.data:query.state.data?[query.state.data]:[]) as Entry[]
  const knownMedia=saved.find(item=>sameTitle(item.media,serverEntry.media))?.media
  if(saved.some(item=>sameTitle(item.media,serverEntry.media)&&item.version>serverEntry.version))return false
  const entry={...serverEntry,media:{...serverEntry.media,source_ids:{...knownMedia?.source_ids,...serverEntry.media.source_ids}}}
  const scope=['private',owner],aliases=[entry.media.id,...references,
    ...(entry.media.source_ids?.anilist?[`anilist-${entry.media.source_ids.anilist}`]:[])]
  const statusQueries=queries.getQueryCache().findAll({predicate:query=>query.queryKey[0]==='private'&&query.queryKey[1]===owner&&query.queryKey[2]==='media-status'&&query.queryKey[3]===entry.media.media_type&&aliases.includes(String(query.queryKey[4]))})
  const previousStatus=statusQueries.find(query=>query.state.status==='success')?.state.data as Entry|null|undefined
  const listQueries=queries.getQueryCache().findAll({predicate:query=>query.queryKey[0]==='private'&&query.queryKey[1]===owner&&['library','wishlist'].includes(String(query.queryKey[2]))})
  const previous=previousStatus??listQueries.flatMap(query=>(query.state.data as LibraryPage|undefined)?.data??[]).find(item=>sameTitle(item.media,entry.media))
  if(previous&&previous.version>entry.version)return false
  const known=previousStatus!==undefined||Boolean(previous)
  const relevant=new Set(['media-status','discovery-exclusions','anilist-catalogue','shelf-refill','recommendations','library','wishlist'])
  void queries.cancelQueries({predicate:query=>query.queryKey[0]==='private'&&query.queryKey[1]===owner&&relevant.has(String(query.queryKey[2]))})
  queries.setQueriesData<Entry|null>({predicate:query=>query.queryKey[0]==='private'&&query.queryKey[1]===owner&&query.queryKey[2]==='media-status'&&query.queryKey[3]===entry.media.media_type&&aliases.includes(String(query.queryKey[4]))},entry.deleted_at?null:entry)
  queries.setQueriesData<Entry[]>({predicate:query=>query.queryKey[0]==='private'&&query.queryKey[1]===owner&&query.queryKey[2]==='media-status'&&aliases.includes(String(query.queryKey[3]))},previous=>previous?entry.deleted_at?previous.filter(item=>!sameTitle(item.media,entry.media)):[...previous.filter(item=>!sameTitle(item.media,entry.media)),entry]:previous)
  const includePlanned=queries.getQueryData<PreferencesRead>([...scope,'preferences'])?.data.include_planned??true
  const anilist=Number(entry.media.source_ids?.anilist??/^anilist-(\d+)$/.exec(aliases.find(id=>/^anilist-\d+$/.test(id))??'')?.[1])
  if(anilist)for(const query of queries.getQueryCache().findAll({queryKey:[...scope,'discovery-exclusions']})){
    queries.setQueryData<number[]>(query.queryKey,previous=>previous?excludesEntry(entry,String(query.queryKey[3]),includePlanned)?[...new Set([...previous,anilist])]:previous.filter(id=>id!==anilist):previous)
  }
  for(const query of queries.getQueryCache().findAll({queryKey:[...scope,'anilist-catalogue']})){
    const mode=new URLSearchParams(String(query.queryKey[4])).get('mode')??'all'
    if(excludesEntry(entry,mode,includePlanned))queries.setQueryData<CataloguePage>(query.queryKey,previous=>previous?{...previous,data:previous.data.filter(item=>!sameTitle(item,entry.media)),total:null,total_pages:null}:previous)
  }
  for(const query of queries.getQueryCache().findAll({queryKey:[...scope,'shelf-refill']})){
    if(excludesEntry(entry,String(query.queryKey[3]),includePlanned))queries.setQueryData<ShelfPools>(query.queryKey,previous=>previous?{
      ...previous,pools:Object.fromEntries(Object.entries(previous.pools).map(([key,items])=>[key,items.filter(item=>!sameTitle(item,entry.media))])),
    }:previous)
  }
  for(const query of queries.getQueryCache().findAll({queryKey:[...scope,'recommendations']})){
    const mode=(query.queryKey[4] as {mode?:string}|undefined)?.mode??'all'
    if(excludesEntry(entry,mode,includePlanned))queries.setQueryData<FeedPage>(query.queryKey,previous=>previous&&Array.isArray(previous.items)?{
      ...previous,items:previous.items.filter(item=>!sameTitle(item.media,entry.media)),
    }:previous)
  }
  for(const query of listQueries){
    if(hasLibraryFilters((query.queryKey[6]??{}) as LibraryReadFilters)){void queries.invalidateQueries({queryKey:query.queryKey,exact:true});continue}
    const status=query.queryKey[2]==='wishlist'?'planned':String(query.queryKey[4]??'')
    const belongs=(item:Entry|undefined|null)=>Boolean(item&&!item.deleted_at&&(!status||item.status===status))
    queries.setQueryData<LibraryPage>(query.queryKey,page=>{
      if(!page)return page
      const included=page.data.some(item=>sameTitle(item.media,entry.media))
      let data=page.data.filter(item=>!sameTitle(item.media,entry.media))
      if(belongs(entry)&&(included||Number(query.queryKey[5]??1)===1))data=[...data,entry].sort((a,b)=>a.media.id.localeCompare(b.media.id)).slice(0,24)
      const delta=known?Number(belongs(entry))-Number(belongs(previous)):included&&!belongs(entry)?-1:0
      const total=Math.max(0,page.total+delta)
      return {...page,data,total,total_pages:Math.max(1,Math.ceil(total/24))}
    })
  }
  queries.removeQueries({queryKey:[...scope,'page-cursors']})
  return true
}
