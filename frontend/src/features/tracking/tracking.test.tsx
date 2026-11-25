import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Tracker } from './index'
import { setTokenProvider, type Media } from '../../shared/api/client'
const state = vi.hoisted(()=>({notify:vi.fn()}))
vi.mock('../../shared/auth',()=>({useAuth:()=>({userId:'a',requireSignIn:vi.fn()})}))
vi.mock('../../shared/feedback',()=>({useFeedback:()=>state.notify}))
const media = {id:'76aaad3c-0eb9-5e5c-a47c-d190a2b1300f',media_type:'anime',title:'Test title'} as Media
const snapshot = {id:'session-1',media,kind:'initial',active:true,version:3,skip_counts:false,coverage_complete:false,final_total:null,summary:{done:9,skipped:1,resolved:10,remaining:2,next_key:'9',caught_up:false,completed:false},units:[{key:'9',label:'9',order:9,released:true,title:null,released_at:null,provenance:'manual',state:'unresolved'}],next_offset:null,updated_at:'2026-11-25T00:00:00Z'}
beforeEach(()=>{vi.clearAllMocks();setTokenProvider(async()=>({token:'test-only',userId:'a'}))})
afterEach(()=>{cleanup();setTokenProvider(async()=>null);vi.unstubAllGlobals()})
function mount(){render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><Tracker media={media}/></QueryClientProvider>)}
it('shows separate counts and sends versioned next-gap marking',async()=>{
  const fetcher=vi.fn().mockImplementation((url,init)=>Promise.resolve(new Response(JSON.stringify(init.method==='POST'?{...snapshot,version:4}:String(url).includes('/episodes')?snapshot:[{id:'session-1',active:true,kind:'initial'}]),{status:200})))
  vi.stubGlobal('fetch',fetcher);mount()
  expect(await screen.findByText('9 watched/read · 1 skipped · 2 remaining')).toBeVisible()
  fireEvent.click(screen.getByRole('button',{name:'Mark 9 watched/read'}))
  await waitFor(()=>expect(state.notify).toHaveBeenCalledWith('Progress saved.'))
  const write=fetcher.mock.calls.find(([,init])=>init.method==='POST')!
  expect(JSON.parse(write[1].body)).toEqual({expected_version:3,keys:['9'],state:'watched'})
})
it('does not claim success after a failed progress save',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockImplementation((url,init)=>Promise.resolve(new Response(JSON.stringify(init.method==='POST'?{error:{code:'CONFLICT'}}:String(url).includes('/episodes')?snapshot:[{id:'session-1',active:true,kind:'initial'}]),{status:init.method==='POST'?409:200}))))
  mount();fireEvent.click(await screen.findByRole('button',{name:'Mark 9 watched/read'}))
  await waitFor(()=>expect(state.notify).toHaveBeenCalled())
  expect(state.notify).not.toHaveBeenCalledWith('Progress saved.')
})
