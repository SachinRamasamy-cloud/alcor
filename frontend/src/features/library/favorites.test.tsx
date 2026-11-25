import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {onlineManager,QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {FavoriteButton,useFavoriteWrite} from './favorites'
import {fromAniList} from '../../shared/api/anilist'
import {setTokenProvider} from '../../shared/api/client'
import type {PreferencesRead} from '../preferences'
const state=vi.hoisted(()=>({userId:'a' as string|null,notify:vi.fn()}))
vi.mock('../../shared/auth',()=>({useAuth:()=>({userId:state.userId})}))
vi.mock('../../shared/feedback',()=>({useFeedback:()=>state.notify}))
const media={...fromAniList({id:44,type:'ANIME',title:{english:'A favorite story'}}),id:'d98b77b7-5378-4e2e-9c96-18737b47f509'}
const preferences={version:3,data:{timezone:'UTC',motion:'system',notifications:false,include_planned:true,discovery_mode:'new_to_me',spoiler_mode:false,favorite_media_ids:[]}} as PreferencesRead
const page=(favorite:boolean,version=3)=>({data:favorite?[media]:[],total:Number(favorite),preferences_version:version,next_cursor:null})
const result=(changed=true)=>({media_id:media.id,favorite:true,changed,preferences_version:4,preferences:{...preferences,version:4,data:{...preferences.data,favorite_media_ids:[media.id]}},entry:null})
beforeEach(()=>{state.userId='a';setTokenProvider(async()=>state.userId?{userId:state.userId,token:'test-only'}:null)})
afterEach(()=>{cleanup();onlineManager.setOnline(true);vi.unstubAllGlobals();vi.clearAllMocks();setTokenProvider(async()=>null)})
function tree(queries:QueryClient){return <QueryClientProvider client={queries}><FavoriteButton media={media}/></QueryClientProvider>}
it('publishes only acknowledged favorite state and full preference version before a held refresh',async()=>{
  let reads=0,commit!:(response:Response)=>void,refresh!:(response:Response)=>void
  const fetcher=vi.fn<typeof fetch>(async(_url,options)=>{
    if(options?.method==='PUT')return new Promise<Response>(resolve=>{commit=resolve})
    if(++reads===1)return new Response(JSON.stringify(page(false)))
    return new Promise<Response>(resolve=>{refresh=resolve})
  });vi.stubGlobal('fetch',fetcher)
  const queries=new QueryClient({defaultOptions:{queries:{retry:false}}}),other=['private','b','preferences']
  queries.setQueryData(['private','a','preferences'],preferences);queries.setQueryData(other,{...preferences,version:19})
  render(tree(queries));fireEvent.click(await screen.findByRole('button',{name:'Add favorite'}))
  await waitFor(()=>expect(commit).toBeTypeOf('function'))
  expect(state.notify).not.toHaveBeenCalled();expect(queries.getQueryData(['private','a','preferences'])).toEqual(preferences)
  await act(async()=>commit(new Response(JSON.stringify(result()))))
  await waitFor(()=>expect(refresh).toBeTypeOf('function'))
  expect(screen.getByRole('button',{name:'Remove favorite'})).toHaveAttribute('aria-pressed','true')
  expect(queries.getQueryData(['private','a','preferences'])).toEqual(result().preferences)
  expect(queries.getQueryData(other)).toMatchObject({version:19})
  expect(state.notify).toHaveBeenCalledExactlyOnceWith('Added to favorites.')
  const write=fetcher.mock.calls.find(([,options])=>options?.method==='PUT')!
  expect(JSON.parse(write[1]!.body as string)).toEqual({favorite:true,expected_preferences_version:3})
  expect(fetcher.mock.calls.every(([url])=>String(url).includes('/favorites'))).toBe(true)
  await act(async()=>refresh(new Response(JSON.stringify(page(true,4)))))
})
it.each([false,true])('does not celebrate a no-op or a failed favorite write (failure=%s)',async failure=>{
  let saved=false
  vi.stubGlobal('fetch',vi.fn<typeof fetch>(async(_url,options)=>{
    if(options?.method==='PUT'){saved=!failure;return new Response(JSON.stringify(failure?{error:{code:'CONFLICT'}}:result(false)),{status:failure?409:200})}
    return new Response(JSON.stringify(page(saved,saved?4:3)))
  }))
  render(tree(new QueryClient({defaultOptions:{queries:{retry:false}}})))
  fireEvent.click(await screen.findByRole('button',{name:'Add favorite'}))
  await waitFor(()=>expect(screen.getByRole('button',{name:failure?'Add favorite':'Remove favorite'})).not.toBeDisabled())
  expect(state.notify).not.toHaveBeenCalledWith('Added to favorites.')
  if(failure)expect(state.notify).toHaveBeenCalledWith(expect.stringContaining('another device'))
})
it('ignores a late old-account favorite response and never replays it for the new account',async()=>{
  let commit!:(response:Response)=>void
  const fetcher=vi.fn<typeof fetch>(async(_url,options)=>options?.method==='PUT'?new Promise<Response>(resolve=>{commit=resolve}):new Response(JSON.stringify(page(false))))
  vi.stubGlobal('fetch',fetcher)
  const queries=new QueryClient({defaultOptions:{queries:{retry:false}}}),view=render(tree(queries))
  queries.setQueryData(['private','b','preferences'],{...preferences,version:19})
  fireEvent.click(await screen.findByRole('button',{name:'Add favorite'}));await waitFor(()=>expect(commit).toBeTypeOf('function'))
  state.userId='b';view.rerender(tree(queries));await act(async()=>commit(new Response(JSON.stringify(result()))))
  await waitFor(()=>expect(screen.getByRole('button',{name:'Add favorite'})).not.toBeDisabled())
  expect(queries.getQueryData(['private','b','preferences'])).toMatchObject({version:19})
  expect(state.notify).not.toHaveBeenCalled();expect(fetcher.mock.calls.filter(([,options])=>options?.method==='PUT')).toHaveLength(1)
})
it('rejects a captured old-account intent before dispatch',async()=>{
  let write!:ReturnType<typeof useFavoriteWrite>
  function Action(){write=useFavoriteWrite();return null}
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher)
  const queries=new QueryClient(),tree=()=> <QueryClientProvider client={queries}><Action/></QueryClientProvider>,view=render(tree())
  state.userId='b';view.rerender(tree())
  await act(async()=>{await write.mutateAsync({media,favorite:true,version:3,owner:'a'}).catch(()=>{})})
  expect(fetcher).not.toHaveBeenCalled();expect(state.notify).not.toHaveBeenCalled()
})
it('retries a failed membership read without treating it as confirmed absence or issuing a write',async()=>{
  const fetcher=vi.fn<typeof fetch>(async()=>new Response('{"error":{"code":"UPSTREAM_UNAVAILABLE"}}',{status:503}));vi.stubGlobal('fetch',fetcher)
  render(tree(new QueryClient({defaultOptions:{queries:{retry:false}}})))
  const retry=await screen.findByRole('button',{name:'Retry favorite status'})
  expect(retry).not.toHaveAttribute('aria-pressed')
  fireEvent.click(retry);await waitFor(()=>expect(fetcher).toHaveBeenCalledTimes(2))
  expect(fetcher.mock.calls.every(([,options])=>options?.method!=='PUT')).toBe(true)
})
it('fails an offline favorite attempt instead of queueing or replaying it on reconnect',async()=>{
  const fetcher=vi.fn<typeof fetch>(async(_url,options)=>{
    if(options?.method==='PUT')throw new Error('offline transport')
    return new Response(JSON.stringify(page(false)))
  });vi.stubGlobal('fetch',fetcher)
  render(tree(new QueryClient({defaultOptions:{queries:{retry:false}}})))
  const add=await screen.findByRole('button',{name:'Add favorite'})
  act(()=>onlineManager.setOnline(false));fireEvent.click(add)
  await waitFor(()=>expect(state.notify).toHaveBeenCalledWith('Couldn\'t reach ALCOR. Check your connection and try again.'))
  expect(fetcher.mock.calls.filter(([,options])=>options?.method==='PUT')).toHaveLength(1)
  await act(async()=>{onlineManager.setOnline(true);await new Promise(resolve=>setTimeout(resolve,0))})
  expect(fetcher.mock.calls.filter(([,options])=>options?.method==='PUT')).toHaveLength(1)
  expect(state.notify).not.toHaveBeenCalledWith('Added to favorites.')
})
