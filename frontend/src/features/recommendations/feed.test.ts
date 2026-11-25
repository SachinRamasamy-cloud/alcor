import {expect,it,vi} from 'vitest'
import {fromAniList,type RecommendationItem} from '../../shared/api/anilist'
import {loadFeed,matchesFeed,recommendationLink} from './feed'
const item=(id:number):RecommendationItem=>({media:fromAniList({id,type:'ANIME',title:{english:`Story ${id}`},genres:['Fantasy'],episodes:12}),origins:[{anilistId:999,title:'A favourite'}],ratings:{'999':3}})
const signal=()=>new AbortController().signal
it('filters history and favourites before pagination and preserves the exact unread offset and emitted identities',async()=>{
  const source=vi.fn(async()=>({items:Array.from({length:50},(_,i)=>item(i+1)),hasMore:false}))
  const input={source,mode:'new_to_me' as const,owner:'a',signal:signal(),filters:new URLSearchParams(),knownFavorites:[item(2).media],exclude:async()=>[1]}
  const first=await loadFeed(input)
  expect(first.items.map(value=>value.media.id)).toEqual(Array.from({length:24},(_,i)=>`anilist-${i+3}`))
  expect(first.next).toMatchObject({page:1,offset:26})
  const second=await loadFeed({...input,cursor:first.next!})
  expect(second.items[0].media.id).toBe('anilist-27');expect(second.items).toHaveLength(24)
  expect(second.hasMore).toBe(false)
  const repeated=await loadFeed({...input,cursor:{page:1,offset:0,seen:first.next!.seen}})
  expect(repeated.items[0].media.id).toBe('anilist-27')
})
it('limits fully excluded source scans and distinguishes real exhaustion',async()=>{
  const source=vi.fn(async()=>({items:[item(1)],hasMore:true}))
  const base={source,mode:'hide_watched' as const,owner:'a',signal:signal(),filters:new URLSearchParams(),exclude:async()=>[1]}
  const limited=await loadFeed(base)
  expect(source).toHaveBeenCalledTimes(3);expect(limited).toMatchObject({items:[],limited:true,hasMore:true,next:{page:4,offset:0}})
  source.mockResolvedValue({items:[],hasMore:false})
  expect(await loadFeed(base)).toMatchObject({limited:false,hasMore:false,next:null})
})
it('uses explicit constraints, refuses unknown lengths, and never sends old-account eligibility after abort',async()=>{
  expect(matchesFeed({...item(1).media,total_units:null},new URLSearchParams('units_max=12'))).toBe(false)
  expect(matchesFeed({...item(1).media,studios:['Studio B']},new URLSearchParams('studio=Studio+A&studio=Studio+B'))).toBe(true)
  const controller=new AbortController(),exclude=vi.fn(async()=>[])
  await expect(loadFeed({source:async()=>{controller.abort();return {items:[item(1)],hasMore:false}},mode:'new_to_me',owner:'a',signal:controller.signal,filters:new URLSearchParams(),exclude})).rejects.toMatchObject({name:'AbortError'})
  expect(exclude).not.toHaveBeenCalled()
})
it('retains Show All and reconstructs the exact feed link without a stale cursor',async()=>{
  const exclude=vi.fn(async()=>[1])
  const result=await loadFeed({source:async()=>({items:[item(1)],hasMore:false}),mode:'all',owner:'a',signal:signal(),filters:new URLSearchParams(),exclude})
  expect(result.items).toHaveLength(1);expect(exclude).not.toHaveBeenCalled()
  const link=new URL(recommendationLink('taste','anime','hide_watched',{filters:new URLSearchParams('include_genres=Fantasy&units_max=24&cursor=old&page=9'),version:7}),'https://example.test')
  expect(link.pathname).toBe('/recommendations');expect(link.searchParams.get('include_genres')).toBe('Fantasy');expect(link.searchParams.get('units_max')).toBe('24')
  expect(link.searchParams.get('mode')).toBe('hide_watched');expect(link.searchParams.has('cursor')).toBe(false)
})
