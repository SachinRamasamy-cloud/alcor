import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { HistoryPage,StatisticsPage } from './reports'
import { setTokenProvider } from '../shared/api/client'
const state=vi.hoisted(()=>({notify:vi.fn()}))
vi.mock('../shared/auth',()=>({useAuth:()=>({userId:'a',requireSignIn:vi.fn()})}))
vi.mock('../shared/feedback',()=>({useFeedback:()=>state.notify}))
afterEach(()=>{cleanup();vi.clearAllMocks();vi.unstubAllGlobals();setTokenProvider(async()=>null)})
function mount(child=<HistoryPage/>){setTokenProvider(async()=>({token:'test-only',userId:'a'}));render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><BrowserRouter>{child}</BrowserRouter></QueryClientProvider>)}
it('submits the recorded original version for undo',async()=>{
  const fetcher=vi.fn().mockImplementation((_url,init)=>Promise.resolve(new Response(JSON.stringify(init.method==='POST'?{undone:true,changed:true}:{data:[{id:'action',media_id:null,title:null,action:'library.details',occurred_at:'2026-11-25T00:00:00Z',can_undo:true,undone:false,expected_version:4}],next_cursor:null}),{status:200})))
  vi.stubGlobal('fetch',fetcher);mount();fireEvent.click(await screen.findByRole('button',{name:'Undo',exact:true}))
  await waitFor(()=>expect(state.notify).toHaveBeenCalledWith('Change undone.'))
  expect(JSON.parse(fetcher.mock.calls.find(([,init])=>init.method==='POST')![1].body)).toEqual({expected_version:4})
})
it('does not turn an unavailable history response into no activity',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{code:'UPSTREAM_UNAVAILABLE'}}),{status:503})))
  mount();expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable')
  expect(screen.queryByText('No recorded activity')).toBeNull()
})
it('does not invent watch time when duration coverage is missing',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({library:{titles:1,ever_completed:0,in_progress:1,planned:0,favorites:0,average_rating:null},progress:{watching_events:9,reading_events:0,unique_episodes:9,unique_chapters:0,skipped:1},repeat_sessions:0,genres:[],estimated_watch_minutes:null,time_coverage:'Unavailable'}),{status:200})))
  mount(<StatisticsPage/>);expect(await screen.findByText('Estimated watch time is unavailable because duration metadata is incomplete.')).toBeVisible()
  expect(screen.getByText('Not available')).toBeVisible()
})
