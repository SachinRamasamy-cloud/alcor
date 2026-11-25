import {afterEach,expect,it,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {onlineManager,QueryClientProvider,useMutation} from '@tanstack/react-query'
import {createAppQueryClient} from './query-client'
import {api,setTokenProvider} from './client'

afterEach(()=>{cleanup();onlineManager.setOnline(true);vi.unstubAllGlobals();setTokenProvider(async()=>null)})
it('fails a private offline write immediately and never dispatches it on reconnect',async()=>{
  setTokenProvider(async()=>({token:'test-only',userId:'a'}))
  const fetcher=vi.fn<typeof fetch>(async()=>{throw new Error('offline transport')});vi.stubGlobal('fetch',fetcher)
  function Write(){const write=useMutation({mutationFn:()=>api('/me/library/test',{accountId:'a',method:'PUT',body:JSON.stringify({status:'planned'})})});return <><button onClick={()=>write.mutate()}>Save once</button><output>{write.isError?'failed':write.isPaused?'paused':write.isPending?'pending':'idle'}</output></>}
  const queries=createAppQueryClient()
  render(<QueryClientProvider client={queries}><Write/></QueryClientProvider>)
  act(()=>onlineManager.setOnline(false));fireEvent.click(screen.getByRole('button',{name:'Save once'}))
  await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('failed'))
  expect(fetcher).toHaveBeenCalledOnce()
  await act(async()=>{onlineManager.setOnline(true);await new Promise(resolve=>setTimeout(resolve,0))})
  expect(fetcher).toHaveBeenCalledOnce()
  queries.clear()
})
