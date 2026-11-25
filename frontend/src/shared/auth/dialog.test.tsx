import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { BackendContext, type BackendState } from '../api/backend-state'
import { clearPending, readPending } from './pending'

const mock=vi.hoisted(()=>({oauth:vi.fn()}))
vi.mock('@supabase/supabase-js',()=>({createClient:()=>({auth:{
  onAuthStateChange:()=>({data:{subscription:{unsubscribe:()=>{}}}}),
  getSession:async()=>({data:{session:null}}),
  signInWithOAuth:mock.oauth,
}})}))
vi.stubEnv('VITE_SUPABASE_URL','https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY','sb_publishable_test_only')
const {AuthProvider,useAuth}=await import('./index')
const retry=vi.fn()
function Trigger(){const {requireSignIn}=useAuth();return <button onClick={()=>requireSignIn('wishlist',{kind:'wishlist',mediaId:'anilist-1'})}>Save a title</button>}
function mount(phase:BackendState['phase']){
  const queries=new QueryClient()
  const tree=(next:BackendState['phase'])=><QueryClientProvider client={queries}><MemoryRouter><BackendContext.Provider value={{phase:next,ready:next==='ready',retry}}><AuthProvider><Trigger/></AuthProvider></BackendContext.Provider></MemoryRouter></QueryClientProvider>
  const view=render(tree(phase))
  const trigger=screen.getByRole('button',{name:'Save a title'})
  trigger.focus();fireEvent.click(trigger)
  return {update:(next:BackendState['phase'])=>view.rerender(tree(next)),trigger}
}
beforeEach(()=>{retry.mockClear();mock.oauth.mockReset().mockResolvedValue({error:null});clearPending()})
afterEach(()=>{cleanup();clearPending();vi.unstubAllEnvs()})

it('shows Google while warming, enables it on readiness and prevents duplicate OAuth requests',async()=>{
  const view=mount('waking')
  const google=screen.getByRole('button',{name:'Continue with Google'})
  expect(google).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('Getting sign-in ready')
  expect(retry).toHaveBeenCalledOnce()
  expect(mock.oauth).not.toHaveBeenCalled()
  view.update('ready')
  expect(google).toBeEnabled()
  expect(screen.queryByText('Getting sign-in ready…')).not.toBeInTheDocument()
  fireEvent.click(google);fireEvent.click(google)
  expect(mock.oauth).toHaveBeenCalledOnce()
  expect(mock.oauth).toHaveBeenCalledWith({provider:'google',options:{redirectTo:location.origin+'/auth/callback',scopes:'openid email profile'}})
  expect(google).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('Opening Google sign-in')
  expect(readPending()?.mediaId).toBe('anilist-1')
})

it('offers offline retry and clears the pending action when closed',async()=>{
  const {trigger}=mount('offline')
  expect(screen.getByRole('alert')).toHaveTextContent("Couldn't connect")
  fireEvent.click(screen.getByRole('button',{name:'Retry'}))
  expect(retry).toHaveBeenCalledTimes(2)
  fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'})
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(readPending()).toBeNull()
  await waitFor(()=>expect(trigger).toHaveFocus())
})

it.each(['returned','thrown'])('handles %s OAuth failure without claiming an expired session',async mode=>{
  if(mode==='returned')mock.oauth.mockResolvedValue({error:new Error('provider internals')})
  else mock.oauth.mockRejectedValue(new Error('provider internals'))
  mount('ready')
  const google=screen.getByRole('button',{name:'Continue with Google'})
  fireEvent.click(google)
  expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't start Google sign-in")
  expect(screen.queryByText('provider internals')).not.toBeInTheDocument()
  expect(google).toBeEnabled()
  expect(readPending()).toBeNull()
})

it('does not let an old OAuth failure erase a newly requested action',async()=>{
  let reject:(error:Error)=>void=()=>{}
  mock.oauth.mockImplementationOnce(()=>new Promise((_,fail)=>{reject=fail}))
  const {trigger}=mount('ready')
  fireEvent.click(screen.getByRole('button',{name:'Continue with Google'}))
  fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'})
  fireEvent.click(trigger)
  const current=readPending()?.nonce
  await act(async()=>{reject(new Error('late failure'))})
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(readPending()?.nonce).toBe(current)
})
