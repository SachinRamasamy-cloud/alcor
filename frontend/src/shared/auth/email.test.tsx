import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react'
import { QueryClient,QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter,useLocation } from 'react-router-dom'
import { afterEach,beforeEach,expect,it,vi } from 'vitest'
const mock=vi.hoisted(()=>({signup:vi.fn(),login:vi.fn(),reset:vi.fn()}))
vi.mock('@supabase/supabase-js',()=>({createClient:()=>({auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe:()=>{}}}}),getSession:async()=>({data:{session:null}}),signUp:mock.signup,signInWithPassword:mock.login,resetPasswordForEmail:mock.reset}})}))
vi.stubEnv('VITE_SUPABASE_URL','https://test.supabase.co');vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY','sb_publishable_test_only')
const {AuthProvider,useAuth}=await import('./index')
function Probe(){const {requireSignIn}=useAuth(),location=useLocation();return <><button onClick={()=>requireSignIn()}>Open account</button><p data-testid="path">{location.pathname+location.search}</p></>}
function mount(){render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><AuthProvider><Probe/></AuthProvider></MemoryRouter></QueryClientProvider>);fireEvent.click(screen.getByRole('button',{name:'Open account'}))}
beforeEach(()=>{mock.signup.mockReset().mockResolvedValue({data:{session:null},error:null});mock.login.mockReset().mockResolvedValue({data:{session:{user:{id:'a'}}},error:null});mock.reset.mockReset().mockResolvedValue({error:null})})
afterEach(()=>{cleanup();vi.unstubAllEnvs()})
function credentials(){fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'reader@example.com'}});fireEvent.change(screen.getByLabelText('Password',{exact:true}),{target:{value:'test-password'}})}

it('signs in through the SDK without storing a password',async()=>{
  mount();credentials();fireEvent.submit(screen.getByLabelText('Email address').closest('form')!)
  await waitFor(()=>expect(screen.getByTestId('path')).toHaveTextContent('/auth/complete'))
  expect(mock.login).toHaveBeenCalledWith({email:'reader@example.com',password:'test-password'})
  expect(JSON.stringify({...localStorage,...sessionStorage})).not.toContain('test-password')
})
it('requires matching signup passwords and shows confirmation without a signed-in session',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:'Create account'}));credentials()
  fireEvent.change(screen.getByLabelText('Confirm password'),{target:{value:'different'}})
  fireEvent.submit(screen.getByLabelText('Email address').closest('form')!)
  expect(screen.getByRole('alert')).toHaveTextContent("passwords don't match")
  expect(mock.signup).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Confirm password'),{target:{value:'test-password'}})
  fireEvent.submit(screen.getByLabelText('Email address').closest('form')!)
  await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('Check your email'))
  expect(mock.signup).toHaveBeenCalledWith({email:'reader@example.com',password:'test-password',options:{emailRedirectTo:location.origin+'/auth/callback?setup=1'}})
  expect(screen.getByTestId('path')).not.toHaveTextContent('/auth/complete')
})
it('routes an actual signup session to account completion with setup intent',async()=>{
  mock.signup.mockResolvedValue({data:{session:{user:{id:'a'}}},error:null})
  mount();fireEvent.click(screen.getByRole('button',{name:'Create account'}));credentials()
  fireEvent.change(screen.getByLabelText('Confirm password'),{target:{value:'test-password'}})
  fireEvent.submit(screen.getByLabelText('Email address').closest('form')!)
  await waitFor(()=>expect(screen.getByTestId('path')).toHaveTextContent('/auth/complete?setup=1'))
})
it('requests recovery with a neutral message and no exposed credentials',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:'Forgot password?'}))
  fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'reader@example.com'}})
  fireEvent.submit(screen.getByLabelText('Email address').closest('form')!)
  await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('If an account uses this address'))
  expect(mock.reset).toHaveBeenCalledWith('reader@example.com',{redirectTo:location.origin+'/auth/callback?recovery=1'})
})
