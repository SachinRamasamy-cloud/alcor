import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { SettingsPage } from './settings'
import { setTokenProvider } from '../shared/api/client'
const state=vi.hoisted(()=>({notify:vi.fn()}))
vi.mock('../shared/auth',()=>({useAuth:()=>({userId:'a',requireSignIn:vi.fn()})}))
vi.mock('../shared/feedback',()=>({useFeedback:()=>state.notify}))
afterEach(()=>{cleanup();vi.clearAllMocks();vi.unstubAllGlobals();setTokenProvider(async()=>null)})
it('saves explicit preferences against the original version without inventing thresholds',async()=>{
  const saved={version:3,data:{timezone:'UTC',motion:'system',notifications:false,include_planned:true,spoiler_mode:false,preferred_genres:[],preferred_themes:[],preferred_studios:[],positive_rating_min:null,minimum_rating_votes:null,preferred_max_units:null}}
  const fetcher=vi.fn().mockImplementation((_url,init)=>Promise.resolve(new Response(JSON.stringify(init.method==='PATCH'?{...saved,version:4}:saved),{status:200})))
  vi.stubGlobal('fetch',fetcher);setTokenProvider(async()=>({token:'test-only',userId:'a'}))
  render(<QueryClientProvider client={new QueryClient()}><BrowserRouter><SettingsPage/></BrowserRouter></QueryClientProvider>)
  fireEvent.change(await screen.findByRole('textbox',{name:'Time zone (IANA name)'}),{target:{value:'Asia/Kolkata'}})
  fireEvent.click(screen.getByRole('button',{name:'Save changes'}))
  await waitFor(()=>expect(state.notify).toHaveBeenCalledWith('Preferences saved.'))
  const body=JSON.parse(fetcher.mock.calls.find(([,init])=>init.method==='PATCH')![1].body)
  expect(body.expected_version).toBe(3);expect(body.data.timezone).toBe('Asia/Kolkata');expect(body.data.minimum_rating_votes).toBeNull();expect(body.data.notifications).toBe(false)
})
