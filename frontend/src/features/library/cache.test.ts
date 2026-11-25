import {expect,it} from 'vitest'
import {QueryClient} from '@tanstack/react-query'
import {fromAniList} from '../../shared/api/anilist'
import type {Entry} from '.'
import {excludesEntry,publishLibraryEntry} from './cache'
const media=fromAniList({id:1,idMal:10,type:'ANIME',title:{english:'Remembered title'}})
const planned={media:{...media,id:'canonical'},status:'planned',ever_completed:false,version:4,deleted_at:null} as Entry
it('invalidates filtered/sorted saved pages without guessing their membership, order or count',()=>{
  const queries=new QueryClient(),key=['private','a','library','','',1,{q:'different title',sort:'rating',media_type:'anime'}]
  const page={data:[],total:0,page:1,total_pages:1};queries.setQueryData(key,page)
  publishLibraryEntry(queries,'a',planned)
  expect(queries.getQueryData(key)).toEqual(page)
  expect(queries.getQueryState(key)?.isInvalidated).toBe(true)
})
it('removes confirmed history from owned recommendation previews while preserving source and continuation snapshots',async()=>{
  const queries=new QueryClient(),key=['private','a','recommendations','favorites',{mode:'new_to_me'},'']
  const other=['private','b','recommendations','favorites',{mode:'new_to_me'},''],publicKey=['public','anilist','recommendation-edges','anime','1',1]
  const initial={items:[{media,origins:[],ratings:{}}],next:{page:1,offset:1,seen:[]},hasMore:true,limited:false}
  queries.setQueryData(key,initial);queries.setQueryData(other,initial);queries.setQueryData(publicKey,initial)
  let finish!:(value:typeof initial)=>void
  const pending=queries.fetchQuery({queryKey:key,queryFn:()=>new Promise<typeof initial>(resolve=>{finish=resolve}),staleTime:0}).catch(()=>undefined)
  publishLibraryEntry(queries,'a',{...planned,media,status:'completed',ever_completed:true,version:5})
  finish(initial);await pending
  expect(queries.getQueryData(key)).toMatchObject({items:[],next:{page:1,offset:1},hasMore:true})
  expect(queries.getQueryData(other)).toEqual(initial);expect(queries.getQueryData(publicKey)).toEqual(initial)
})
it('publishes committed completion across owned aliases, eligibility and list counts without changing public or foreign data',()=>{
  const queries=new QueryClient(),scope=['private','a']
  const canonical=[...scope,'media-status','anime','canonical'],alias=[...scope,'media-status','anime','anilist-1'],foreign=['private','b','media-status','anime','anilist-1']
  const legacy=[...scope,'media-status','canonical'],exclusions=[...scope,'discovery-exclusions','new_to_me','anime:1'],page=[...scope,'anilist-catalogue','/anime','mode=new_to_me']
  const wishlist=[...scope,'wishlist','','',1],publicKey=['public','anilist','home']
  const initial={data:[media],has_more:true,next_cursor:'f:2:0',total:null,total_pages:null}
  queries.setQueryData(canonical,planned);queries.setQueryData(alias,planned);queries.setQueryData(foreign,planned);queries.setQueryData(legacy,[planned]);queries.setQueryData(exclusions,[]);queries.setQueryData(page,initial);queries.setQueryData(publicKey,{anime:[media]})
  queries.setQueryData(wishlist,{data:[planned],total:1,page:1,total_pages:1})
  queries.setQueryData([...scope,'page-cursors','/anime','mode=new_to_me'],{1:'',2:'f:2:0'})
  const completed={...planned,status:'completed',ever_completed:true,version:5} as Entry
  publishLibraryEntry(queries,'a',completed)
  expect(queries.getQueryData(canonical)).toEqual(completed);expect(queries.getQueryData(alias)).toEqual(completed)
  expect(queries.getQueryData(legacy)).toEqual([completed]);expect(queries.getQueryData(exclusions)).toEqual([1])
  expect(queries.getQueryData(page)).toMatchObject({data:[],has_more:true,next_cursor:'f:2:0'})
  expect(queries.getQueryData(wishlist)).toMatchObject({data:[],total:0})
  expect(queries.getQueryData(foreign)).toEqual(planned);expect(queries.getQueryData(publicKey)).toEqual({anime:[media]})
  expect(queries.getQueryCache().findAll({queryKey:[...scope,'page-cursors']})).toHaveLength(0)
})
it('cancels stale eligibility reads before publishing the confirmed exclusion',async()=>{
  const queries=new QueryClient(),key=['private','a','discovery-exclusions','hide_watched','anime:1']
  queries.setQueryData(key,[])
  let complete!:(value:number[])=>void
  const pending=queries.fetchQuery({queryKey:key,queryFn:()=>new Promise<number[]>(resolve=>{complete=resolve}),staleTime:0}).catch(()=>undefined)
  publishLibraryEntry(queries,'a',{...planned,ever_completed:true,status:'in_progress'})
  complete([]);await pending
  expect(queries.getQueryData(key)).toEqual([1])
})
it('preserves historical exclusions on repeats/removal and applies planned inclusion only to active planned records',()=>{
  const history={...planned,ever_completed:true,status:'in_progress'} as Entry
  expect(excludesEntry(history,'hide_watched')).toBe(true)
  expect(excludesEntry({...history,deleted_at:'2026-11-25'},'new_to_me')).toBe(true)
  expect(excludesEntry(history,'all')).toBe(false)
  expect(excludesEntry(planned,'new_to_me',true)).toBe(false)
  expect(excludesEntry(planned,'new_to_me',false)).toBe(true)
  expect(excludesEntry({...planned,deleted_at:'2026-11-25'},'new_to_me',false)).toBe(false)
  expect(excludesEntry({...planned,status:'on_hold'},'hide_watched')).toBe(false)
})
it('does not replace a newer confirmed version with a late response',()=>{
  const queries=new QueryClient(),alias=['private','a','media-status','anime','canonical']
  const newer={...planned,status:'completed',ever_completed:true,version:6} as Entry
  queries.setQueryData(alias,newer)
  expect(publishLibraryEntry(queries,'a',{...planned,version:5})).toBe(false)
  expect(queries.getQueryData(alias)).toEqual(newer)
})
