import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CollectionsPage } from './collections'
import { setTokenProvider } from '../shared/api/client'
vi.mock('../shared/auth',()=>({useAuth:()=>({userId:'a',requireSignIn:vi.fn()})}))
vi.mock('../shared/feedback',()=>({useFeedback:()=>vi.fn()}))
beforeEach(()=>{history.replaceState(null,'','/collections');setTokenProvider(async()=>({token:'test-only',userId:'a'}))})
afterEach(()=>{cleanup();setTokenProvider(async()=>null);vi.unstubAllGlobals()})
function mount(){render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><BrowserRouter><Routes><Route path="/collections" element={<CollectionsPage/>}/><Route path="/collections/:id" element={<CollectionsPage/>}/></Routes></BrowserRouter></QueryClientProvider>)}
it('creates a named collection with a retry identity',async()=>{
  const fetcher=vi.fn().mockImplementation((_url,init)=>Promise.resolve(new Response(JSON.stringify(init.method==='POST'?{id:'c',name:'Favorites',version:1,total:0,items:[],next_offset:null}:{data:[],next_cursor:null}),{status:200})))
  vi.stubGlobal('fetch',fetcher);mount()
  fireEvent.change(screen.getByRole('textbox',{name:'Collection name'}),{target:{value:'Favorites'}})
  fireEvent.click(screen.getByRole('button',{name:'New collection'}))
  await waitFor(()=>expect(fetcher.mock.calls.some(([,init])=>init.method==='POST')).toBe(true))
  const body=JSON.parse(fetcher.mock.calls.find(([,init])=>init.method==='POST')![1].body)
  expect(body.name).toBe('Favorites');expect(body.request_id).toMatch(/^[0-9a-f-]{36}$/)
})
it('keeps service failure distinct from an empty collection list',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{code:'UPSTREAM_UNAVAILABLE'}}),{status:503})))
  mount();expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable')
  expect(screen.queryByText('No collections yet')).toBeNull()
})
