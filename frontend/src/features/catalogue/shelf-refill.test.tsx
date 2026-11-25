import {afterEach,expect,it,vi} from 'vitest'
import {act,cleanup,render,screen,waitFor} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {fromAniList,type ShelfWindow} from '../../shared/api/anilist'
import {setTokenProvider} from '../../shared/api/client'
import {refillShelves,useDiscoveryShelves} from './shelf-refill'
import {publishLibraryEntry} from '../library/cache'
import type {Entry} from '../library'

const state=vi.hoisted(()=>({owner:'a',ready:true}))
vi.mock('../../shared/auth',()=>({useAuth:()=>({userId:state.owner})}))
vi.mock('../../shared/api/backend',()=>({useBackend:()=>({ready:state.ready})}))
const media=(id:number)=>fromAniList({id,type:'ANIME',title:{english:`Story ${id}`}})
const titles=(start:number,count:number)=>Array.from({length:count},(_,index)=>media(start+index))
const signal=()=>new AbortController().signal
it('does not request exhausted or already-filled shelves again within the same scan',async()=>{
  const source=vi.fn(async(page:number,keys?:string[]):Promise<ShelfWindow>=>{if(keys)expect(keys).toEqual(['trending']);return page===1?{
    popular:{items:[],hasMore:false},trending:{items:titles(1,1),hasMore:true},top:{items:titles(30,12),hasMore:true},
  }:{trending:{items:titles(2,12),hasMore:false}}})
  const result=await refillShelves('anime',{popular:[],trending:[],top:[]},'new_to_me','a',signal(),source,async()=>[])
  expect(source.mock.calls).toEqual([[1],[2,['trending']]])
  expect(result.exhausted).toEqual(['popular']);expect(result.pools.top).toHaveLength(12)
})
afterEach(()=>{cleanup();vi.unstubAllGlobals();setTokenProvider(async()=>null);state.owner='a';state.ready=true})

it('refills watched first pages in source order, keeps overflow, and stops once filled',async()=>{
  const source=vi.fn(async(page:number):Promise<ShelfWindow>=>({popular:{items:titles((page-1)*24+1,24),hasMore:true}}))
  const exclude=vi.fn(async()=>Array.from({length:24},(_,i)=>i+1))
  const result=await refillShelves('anime',{popular:[]},'new_to_me','a',signal(),source,exclude)
  expect(source.mock.calls).toEqual([[1],[2]])
  expect(result.pools.popular.map(item=>item.id)).toEqual(titles(25,24).map(item=>item.id))
  expect(result.limited).toEqual([]);expect(result.exhausted).toEqual([])
})
it('distinguishes the three-page scan limit from actual source exhaustion',async()=>{
  const exclude=async()=>Array.from({length:100},(_,i)=>i+1)
  const source=vi.fn(async(page:number)=>({popular:{items:titles(page,1),hasMore:true}}))
  const limited=await refillShelves('anime',{popular:[]},'hide_watched','a',signal(),source,exclude)
  expect(source).toHaveBeenCalledTimes(3);expect(limited).toMatchObject({limited:['popular'],exhausted:[],pools:{popular:[]}})
  source.mockClear();source.mockResolvedValue({popular:{items:[media(1)],hasMore:false}})
  const exhausted=await refillShelves('anime',{popular:[]},'hide_watched','a',signal(),source,exclude)
  expect(source).toHaveBeenCalledOnce();expect(exhausted).toMatchObject({limited:[],exhausted:['popular']})
})
it('deduplicates aliases, preserves sequels and propagates failures without inventing exhaustion',async()=>{
  const sequel=media(2),alias={...media(1),id:'canonical'}
  const result=await refillShelves('anime',{popular:[media(1)]},'new_to_me','a',signal(),async()=>({popular:{items:[alias,sequel],hasMore:false}}),async()=>[])
  expect(result.pools.popular.map(item=>item.id)).toEqual(['anilist-1','anilist-2'])
  await expect(refillShelves('anime',{popular:[]},'new_to_me','a',signal(),async()=>{throw Error('provider failed')})).rejects.toThrow('provider failed')
})
it('never sends old-account eligibility after an abandoned public source window finishes',async()=>{
  const controller=new AbortController(),exclude=vi.fn(async()=>[])
  await expect(refillShelves('anime',{popular:[]},'new_to_me','a',controller.signal,async()=>{
    controller.abort();return {popular:{items:[media(1)],hasMore:false}}
  },exclude)).rejects.toMatchObject({name:'AbortError'})
  expect(exclude).not.toHaveBeenCalled()
})

it('retains only verified initial candidates when replacement metadata fails',async()=>{
  setTokenProvider(async()=>({token:'test-only',userId:'a'}))
  vi.stubGlobal('fetch',vi.fn<typeof fetch>(async url=>String(url).includes('graphql.anilist.co')?
    new Response('{}',{status:503}):new Response('[1]')))
  function Scene(){const result=useDiscoveryShelves('anime',{popular:[media(1),media(2)]},'new_to_me');return <><output>{result.refillError?'replacement failed':'loading'}</output>{result.shelves.popular.map(item=><span key={item.id}>{item.title}</span>)}</>}
  const queries=new QueryClient({defaultOptions:{queries:{retry:false}}})
  render(<QueryClientProvider client={queries}><Scene/></QueryClientProvider>)
  await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('replacement failed'),{timeout:4000})
  expect(screen.getByText('Story 2')).toBeVisible();expect(screen.queryByText('Story 1')).toBeNull()
  queries.clear()
})

it('publishes replacements after eligibility, removes confirmed completion immediately and isolates accounts',async()=>{
  setTokenProvider(async()=>({token:'test-only',userId:state.owner}))
  let finish!:(response:Response)=>void
  const fetcher=vi.fn<typeof fetch>(async(url)=>{
    if(String(url).includes('graphql.anilist.co'))return new Promise<Response>(resolve=>{finish=resolve})
    return new Response(state.owner==='a'?'[1]':'[2]')
  });vi.stubGlobal('fetch',fetcher)
  const initial={popular:[media(1),media(2)]},queries=new QueryClient({defaultOptions:{queries:{retry:false}}})
  function Scene(){const result=useDiscoveryShelves('anime',initial,'new_to_me');return <><output>{result.refilling?'finding':'ready'}</output>{result.shelves.popular.map(item=><span key={item.id}>{item.title}</span>)}</>}
  const tree=()=> <QueryClientProvider client={queries}><Scene/></QueryClientProvider>,view=render(tree())
  await waitFor(()=>expect(finish).toBeTypeOf('function'),{timeout:4000});expect(screen.queryByText('Story 1')).toBeNull()
  expect(screen.getByText('Story 2')).toBeVisible();expect(screen.getByRole('status')).toHaveTextContent('finding')
  await act(async()=>finish(new Response(JSON.stringify({data:{latest:{media:[],pageInfo:{hasNextPage:false}},trending:{media:[],pageInfo:{hasNextPage:false}},top:{media:[],pageInfo:{hasNextPage:false}},ongoing:{media:[],pageInfo:{hasNextPage:false}},popular:{media:titles(1,24).map(item=>({id:Number(item.source_ids!.anilist),type:'ANIME',title:{english:item.title}})),pageInfo:{hasNextPage:false}}}}))))
  await screen.findByText('Story 13');expect(screen.queryByText('Story 14')).toBeNull()
  const entry={media:media(2),status:'completed',ever_completed:true,version:1} as Entry
  act(()=>{publishLibraryEntry(queries,'a',entry)})
  expect(queries.getQueryData<{pools:Record<string,unknown[]>}>(queries.getQueryCache().findAll({queryKey:['private','a','shelf-refill']})[0].queryKey)?.pools.popular).toHaveLength(22)
  await waitFor(()=>expect(screen.queryByText('Story 2')).toBeNull());expect(screen.getByText('Story 14')).toBeVisible()
  state.owner='b';view.rerender(tree());expect(screen.queryByText('Story 14')).toBeNull()
  await screen.findByText('Story 1');expect(screen.queryByText('Story 2')).toBeNull()
  expect(fetcher.mock.calls.filter(([url])=>String(url).includes('graphql.anilist.co'))).toHaveLength(1)
  const publicCache=queries.getQueryData<ShelfWindow>(['public','anilist','shelf-window','anime',1])!
  expect(publicCache.popular.items).toHaveLength(24)
  queries.clear()
})
