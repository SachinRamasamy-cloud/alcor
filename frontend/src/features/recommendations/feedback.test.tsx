import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {QueryClient,QueryClientProvider,onlineManager} from '@tanstack/react-query'
import {fromAniList} from '../../shared/api/anilist'
import {setTokenProvider} from '../../shared/api/client'
import {loadFeed} from './feed'
import {RecommendationFeedbackAction,publishRecommendationFeedback,type FeedbackMutation} from './feedback'

const state=vi.hoisted(()=>({owner:'a'}))
vi.mock('../../shared/auth',()=>({useAuth:()=>({userId:state.owner})}))
const media={...fromAniList({id:10,type:'ANIME',title:{english:'A title'}}),id:'37dc7e41-1292-4a48-a080-983d613e413d'}
const item={media,origins:[],ratings:{}}
const result=(dismissed=true,version=1):FeedbackMutation=>({media_id:media.id,dismissed,version,context:'favorites',updated_at:'2026-11-26T00:00:00Z',changed:true})
let queries:QueryClient
beforeEach(()=>{state.owner='a';queries=new QueryClient({defaultOptions:{queries:{retry:false}}});setTokenProvider(async()=>({token:'test-only',userId:state.owner}))})
afterEach(()=>{cleanup();queries.clear();onlineManager.setOnline(true);setTokenProvider(async()=>null);vi.unstubAllGlobals()})
it('applies recommendation-only dismissal before Show All pagination while general Show All stays unchanged',async()=>{
  const exclude=vi.fn(async()=>[10]),base={source:async()=>({items:[item],hasMore:false}),mode:'all' as const,owner:'a',signal:new AbortController().signal,filters:new URLSearchParams(),exclude}
  expect((await loadFeed({...base,recommendation:true})).items).toHaveLength(0)
  expect(exclude).toHaveBeenCalledWith([media],'all','a',expect.any(AbortSignal),true)
  exclude.mockClear();expect((await loadFeed(base)).items).toHaveLength(1);expect(exclude).not.toHaveBeenCalled()
})
it('publishes only matching-account feed removal, retaining public source and library data',()=>{
  const own=['private','a','recommendations','favorites',{mode:'all'},''],other=['private','b','recommendations','favorites',{mode:'all'},''],publicKey=['public','anilist','recommendation-edge','anime',1,1],libraryKey=['private','a','library']
  const page={items:[item],hasMore:false,next:null,limited:false}
  for(const key of [own,other,publicKey,libraryKey])queries.setQueryData(key,page)
  queries.setQueryData(['private','a','recommendation-cursors','old'],{})
  publishRecommendationFeedback(queries,'a',media,result())
  expect(queries.getQueryData(own)).toEqual({...page,items:[]})
  for(const key of [other,publicKey,libraryKey])expect(queries.getQueryData(key)).toEqual(page)
  expect(queries.getQueryData(['private','a','recommendation-cursors','old'])).toBeUndefined()
})
it('sends captured version and source context and closes only after confirmed commit',async()=>{
  const done=vi.fn(),fetcher=vi.fn<typeof fetch>(async(_url,options)=>{
    if(options?.method==='POST')return new Response(JSON.stringify([{...result(false,0),anilist_id:10}]))
    expect(JSON.parse(String(options?.body))).toEqual({dismissed:true,expected_version:0,context:'favorites'})
    return new Response(JSON.stringify(result()))
  });vi.stubGlobal('fetch',fetcher)
  render(<QueryClientProvider client={queries}><RecommendationFeedbackAction media={media} context="favorites" onDone={done}/></QueryClientProvider>)
  await waitFor(()=>expect(screen.getByRole('button',{name:'Dismiss recommendation'})).toBeEnabled())
  expect(done).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Dismiss recommendation'}))
  await waitFor(()=>expect(done).toHaveBeenCalledOnce())
  expect(queries.getQueryData(['private','a','recommendation-feedback',media.id])).toMatchObject({dismissed:true,version:1})
  expect(fetcher).toHaveBeenCalledTimes(2)
})
it('does not publish or close on a failed write, and reconnect never replays it',async()=>{
  const done=vi.fn(),fetcher=vi.fn<typeof fetch>(async()=>new Response(JSON.stringify({error:{code:'BACKEND_WAKING'}}),{status:503}));vi.stubGlobal('fetch',fetcher)
  onlineManager.setOnline(false)
  render(<QueryClientProvider client={queries}><RecommendationFeedbackAction media={media} context="management" version={2} onDone={done}/></QueryClientProvider>)
  fireEvent.click(screen.getByRole('button',{name:'Restore recommendation'}))
  await waitFor(()=>expect(screen.getByRole('button',{name:'Restore recommendation'})).toBeEnabled())
  expect(fetcher).toHaveBeenCalledOnce();expect(done).not.toHaveBeenCalled()
  expect(queries.getQueryData(['private','a','recommendation-feedback',media.id])).toBeUndefined()
  await act(async()=>{onlineManager.setOnline(true)})
  expect(fetcher).toHaveBeenCalledOnce()
})
it('does not publish an old-account committed response into the next account',async()=>{
  let finish!:(response:Response)=>void
  const done=vi.fn();vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(resolve=>{finish=resolve})))
  const tree=()=> <QueryClientProvider client={queries}><RecommendationFeedbackAction media={media} context="management" version={2} onDone={done}/></QueryClientProvider>
  const view=render(tree());fireEvent.click(screen.getByRole('button',{name:'Restore recommendation'}))
  await waitFor(()=>expect(finish).toBeTypeOf('function'))
  state.owner='b';view.rerender(tree());await act(async()=>finish(new Response(JSON.stringify(result(false,3)))))
  expect(done).not.toHaveBeenCalled();expect(queries.getQueryData(['private','b','recommendation-feedback',media.id])).toBeUndefined()
})
