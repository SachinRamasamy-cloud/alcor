import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { BackendContext } from '../api/backend-state'

const mock=vi.hoisted(()=>({createClient:vi.fn()}))
vi.mock('@supabase/supabase-js',()=>({createClient:mock.createClient}))
vi.stubEnv('VITE_SUPABASE_URL','')
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY','')
const {AuthProvider,useAuth}=await import('./index')
function Trigger(){const {requireSignIn}=useAuth();return <button onClick={()=>requireSignIn()}>Open sign-in</button>}
afterEach(()=>{cleanup();vi.unstubAllEnvs()})
it('keeps Google visible but disabled without real configuration, independently of warmup',()=>{
  const retry=vi.fn()
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><BackendContext.Provider value={{phase:'waking',ready:false,retry}}><AuthProvider><Trigger/></AuthProvider></BackendContext.Provider></MemoryRouter></QueryClientProvider>)
  fireEvent.click(screen.getByRole('button',{name:'Open sign-in'}))
  expect(screen.getByRole('button',{name:'Continue with Google'})).toBeDisabled()
  expect(screen.queryByText("Google sign-in hasn't been enabled yet.")).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Getting sign-in ready')
  expect(mock.createClient).not.toHaveBeenCalled()
  expect(retry).toHaveBeenCalledOnce()
})
