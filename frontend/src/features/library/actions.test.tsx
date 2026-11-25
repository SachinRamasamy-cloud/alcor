import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {MemoryRouter} from 'react-router-dom'
import {CardActions,CardStatus} from './actions'
import {CompleteTitle} from './complete'
import {fromAniList} from '../../shared/api/anilist'
import {setTokenProvider} from '../../shared/api/client'
import type {Entry} from '.'
const state=vi.hoisted(()=>({userId:'a' as string|null,notify:vi.fn(),signIn:vi.fn(),resolve:vi.fn()}))
const media=fromAniList({id:321,type:'ANIME',title:{english:'Remembered story'}})
const canonical={...media,id:'d98b77b7-5378-4e2e-9c96-18737b47f509'}
const entry={media:canonical,status:'completed',ever_completed:true,version:1,deleted_at:null} as Entry
vi.mock('../../shared/auth',()=>({useAuth:()=>({userId:state.userId,requireSignIn:state.signIn})}))
vi.mock('../../shared/feedback',()=>({useFeedback:()=>state.notify}))
vi.mock('../../shared/api/identity',async original=>({...await original<typeof import('../../shared/api/identity')>(),resolveMedia:(...args:unknown[])=>{state.resolve(...args);return Promise.resolve(canonical)}}))
beforeEach(()=>{state.userId='a';setTokenProvider(async()=>state.userId?{token:'test-only',userId:state.userId}:null)})
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.clearAllMocks();setTokenProvider(async()=>null)})
function tree(queries:QueryClient,child=<><CardActions media={media}/><CardStatus media={media}/></>){return <QueryClientProvider client={queries}><MemoryRouter>{child}</MemoryRouter></QueryClientProvider>}
it('asserts historical completion directly from a card without creating wishlist or unit marks',async()=>{
  let recorded=false
  const fetcher=vi.fn<typeof fetch>(async(url,options)=>{
    if(options?.method==='PUT'){recorded=true;return new Response(JSON.stringify({entry,changed:true}))}
    return new Response(JSON.stringify(String(url).includes('/media-status')&&recorded?[entry]:String(url).includes('/collections')?{data:[]}:[]))
  })
  vi.stubGlobal('fetch',fetcher)
  const queries=new QueryClient({defaultOptions:{queries:{retry:false}}})
  render(tree(queries));expect(state.resolve).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button',{name:'Manage Remembered story'}))
  const complete=await screen.findByRole('button',{name:'Mark watched'})
  await waitFor(()=>expect(complete).not.toBeDisabled());fireEvent.click(complete)
  expect(fetcher.mock.calls.some(([,options])=>options?.method==='PUT')).toBe(false)
  fireEvent.click(screen.getByRole('button',{name:'Mark as completed'}))
  await waitFor(()=>expect(state.notify).toHaveBeenCalledWith('Marked as completed.'))
  const writes=fetcher.mock.calls.filter(([,options])=>options?.method==='PUT')
  expect(writes).toHaveLength(1);expect(String(writes[0][0])).toContain(`/me/library/${canonical.id}`)
  expect(JSON.parse(writes[0][1]!.body as string)).toEqual({status:'completed'})
  expect(screen.queryByRole('dialog')).toBeNull();expect(screen.getByText('Completed')).toBeVisible()
})
it('keeps a failed completion open and suppresses success',async()=>{
  vi.stubGlobal('fetch',vi.fn<typeof fetch>(async(url,options)=>new Response(JSON.stringify(options?.method==='PUT'?{error:{code:'CONFLICT'}}:String(url).includes('/collections')?{data:[]}:[]),{status:options?.method==='PUT'?409:200})))
  render(tree(new QueryClient({defaultOptions:{queries:{retry:false}}})))
  fireEvent.click(screen.getByRole('button',{name:'Manage Remembered story'}))
  const complete=await screen.findByRole('button',{name:'Mark watched'});await waitFor(()=>expect(complete).not.toBeDisabled());fireEvent.click(complete)
  fireEvent.click(screen.getByRole('button',{name:'Mark as completed'}))
  await waitFor(()=>expect(state.notify).toHaveBeenCalledWith(expect.stringContaining('another device')))
  expect(screen.getByRole('dialog')).toBeVisible();expect(state.notify).not.toHaveBeenCalledWith('Marked as completed.')
})
it('removes an open confirmation when the account changes, without replaying it',async()=>{
  const fetcher=vi.fn<typeof fetch>(async url=>new Response(JSON.stringify(String(url).includes('/collections')?{data:[]}:[])));vi.stubGlobal('fetch',fetcher)
  const queries=new QueryClient({defaultOptions:{queries:{retry:false}}}),view=render(tree(queries))
  fireEvent.click(screen.getByRole('button',{name:'Manage Remembered story'}))
  const complete=await screen.findByRole('button',{name:'Mark watched'});await waitFor(()=>expect(complete).not.toBeDisabled());fireEvent.click(complete)
  state.userId='b';view.rerender(tree(queries))
  expect(screen.queryByRole('dialog')).toBeNull();expect(fetcher.mock.calls.some(([,options])=>options?.method==='PUT')).toBe(false)
})
it('keeps guest wishlist intent without replaying completion on login',()=>{
  state.userId=null;const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher)
  render(tree(new QueryClient()));fireEvent.click(screen.getByRole('button',{name:'Add Remembered story to wishlist'}))
  expect(state.signIn).toHaveBeenCalledWith('wishlist',{kind:'wishlist',mediaId:media.id});expect(fetcher).not.toHaveBeenCalled()
})
it('publishes confirmed completion before a held refresh and does not celebrate no-op assertions',async()=>{
  let refresh!:(response:Response)=>void
  vi.stubGlobal('fetch',vi.fn<typeof fetch>(async(url,options)=>{
    if(options?.method==='PUT')return new Response(JSON.stringify({entry,changed:false}))
    if(String(url).includes('/media-status'))return new Promise<Response>(resolve=>{refresh=resolve})
    return new Response('[]')
  }))
  const queries=new QueryClient({defaultOptions:{queries:{retry:false}}}),alias=['private','a','media-status','anime','anilist-321']
  queries.setQueryData(alias,null)
  render(tree(queries,<><CardStatus media={media}/><CompleteTitle entry={{...entry,status:'planned',version:4}} onComplete={()=>{}}/></>))
  const complete=screen.getByRole('button',{name:'Mark as completed'});await waitFor(()=>expect(complete).not.toBeDisabled());fireEvent.click(complete);fireEvent.click(screen.getByRole('button',{name:'Mark as completed'}))
  await waitFor(()=>expect(queries.getQueryData(alias)).toEqual(entry))
  await waitFor(()=>expect(refresh).toBeTypeOf('function'))
  expect(state.notify).not.toHaveBeenCalledWith('Marked as completed.')
  if(refresh)await act(async()=>refresh(new Response(JSON.stringify([entry]))))
})
