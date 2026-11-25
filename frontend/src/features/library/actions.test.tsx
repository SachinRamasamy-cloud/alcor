import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {MemoryRouter} from 'react-router-dom'
import {CardActions,CardStatus,StatusActions} from './actions'
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
vi.mock('./favorites',()=>({FavoriteButton:()=>null}))
vi.mock('../../shared/api/identity',async original=>({...await original<typeof import('../../shared/api/identity')>(),resolveMedia:(...args:unknown[])=>{state.resolve(...args);return Promise.resolve(canonical)}}))
beforeEach(()=>{state.userId='a';setTokenProvider(async()=>state.userId?{token:'test-only',userId:state.userId}:null)})
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.clearAllMocks();setTokenProvider(async()=>null)})
function tree(queries:QueryClient,child=<><CardActions media={media}/><CardStatus media={media}/></>){return <QueryClientProvider client={queries}><MemoryRouter>{child}</MemoryRouter></QueryClientProvider>}
it('explains why an ongoing title cannot be finally completed and sends no write',()=>{
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher)
  render(tree(new QueryClient(),<CompleteTitle entry={{...entry,media:{...canonical,status:'RELEASING'},status:'in_progress',active_session:null}} onComplete={()=>{}}/>))
  expect(screen.getByRole('button',{name:'Mark as completed'})).toBeDisabled()
  expect(screen.getByText(/This title is still releasing/)).toBeVisible()
  expect(fetcher).not.toHaveBeenCalled()
})
it('uses the same management dialog from the existing labelled hero action slot',async()=>{
  vi.stubGlobal('fetch',vi.fn<typeof fetch>(async url=>new Response(JSON.stringify(String(url).includes('/collections')?{data:[]}:[]))))
  render(tree(new QueryClient({defaultOptions:{queries:{retry:false}}}),<CardActions media={media} presentation="hero"/>))
  const trigger=screen.getByRole('button',{name:'Manage Remembered story'})
  expect(trigger).toHaveClass('button-secondary');expect(trigger).not.toHaveClass('card-save')
  fireEvent.click(trigger)
  expect(await screen.findByRole('button',{name:'Mark watched'})).toBeVisible()
  expect(screen.getByRole('dialog',{name:'Remembered story'})).toBeVisible()
})
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
it('offers only server-derived ordinary transitions and sends the original version',async()=>{
  const fetcher=vi.fn<typeof fetch>(async()=>new Response(JSON.stringify({entry:{...entry,status:'on_hold',version:8},changed:true})));vi.stubGlobal('fetch',fetcher)
  const closed=vi.fn(),queries=new QueryClient({defaultOptions:{queries:{retry:false}}})
  render(tree(queries,<StatusActions entry={{...entry,status:'in_progress',version:7,allowed_statuses:['completed','on_hold','dropped']}} close={closed}/>))
  expect(screen.getAllByRole('button').map(button=>button.textContent)).toEqual(['On hold','Dropped'])
  expect(screen.queryByRole('button',{name:'Mark as completed'})).toBeNull()
  fireEvent.click(screen.getByRole('button',{name:'On hold'}))
  await waitFor(()=>expect(closed).toHaveBeenCalledOnce())
  expect(JSON.parse(fetcher.mock.calls[0][1]!.body as string)).toEqual({status:'on_hold',expected_version:7})
})
it('uses the owned session snapshot for completion without per-card session listing',async()=>{
  const fetcher=vi.fn<typeof fetch>(async(url,options)=>new Response(JSON.stringify(options?.method==='POST'?{id:'active',version:13}:String(url).includes('/media-status')?[entry]:[])))
  vi.stubGlobal('fetch',fetcher)
  render(tree(new QueryClient({defaultOptions:{queries:{retry:false}}}),<CompleteTitle entry={{...entry,status:'in_progress',version:7,active_session:{id:'active',version:12,kind:'repeat'}}} onComplete={()=>{}}/>))
  const complete=screen.getByRole('button',{name:'Mark as completed'});expect(complete).not.toBeDisabled()
  fireEvent.click(complete);fireEvent.click(screen.getByRole('button',{name:'Mark as completed'}))
  await waitFor(()=>expect(state.notify).toHaveBeenCalledWith('Marked as completed.'))
  expect(fetcher.mock.calls.some(([url,options])=>String(url).includes('/watch-sessions?')&&options?.method!=='POST')).toBe(false)
  const post=fetcher.mock.calls.find(([,options])=>options?.method==='POST')!
  expect(String(post[0])).toContain('/watch-sessions/active/complete')
  expect(JSON.parse(post[1]!.body as string)).toEqual({expected_version:12})
})
it('keeps a public card dialog on its captured version after background refresh',async()=>{
  let version=7
  const fetcher=vi.fn<typeof fetch>(async(url,options)=>new Response(JSON.stringify(options?.method==='PUT'?{error:{code:'CONFLICT'}}:String(url).includes('/media-status')?[{...entry,status:'planned',version,active_session:null,allowed_statuses:['completed','in_progress']}]:String(url).includes('/collections')?{data:[]}:[]),{status:options?.method==='PUT'?409:200}))
  vi.stubGlobal('fetch',fetcher)
  const queries=new QueryClient({defaultOptions:{queries:{retry:false}}});render(tree(queries))
  fireEvent.click(screen.getByRole('button',{name:'Manage Remembered story'}))
  await screen.findByRole('button',{name:'Mark watched'})
  version=8;await act(async()=>{await queries.invalidateQueries({queryKey:['private','a','media-status']})})
  expect(queries.getQueryData(['private','a','media-status','anime',media.id])).toMatchObject({version:8})
  fireEvent.click(screen.getByRole('button',{name:'Mark watched'}));fireEvent.click(screen.getByRole('button',{name:'Mark as completed'}))
  await waitFor(()=>expect(state.notify).toHaveBeenCalledWith(expect.stringContaining('another device')))
  const post=fetcher.mock.calls.find(([,options])=>options?.method==='PUT')!
  expect(JSON.parse(post[1]!.body as string)).toEqual({status:'completed',expected_version:7})
  expect(screen.getByRole('dialog')).toBeVisible()
})
