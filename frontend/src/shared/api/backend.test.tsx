import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { BackendProvider, useBackend } from './backend'
import { api, setBackendReady, setTokenProvider } from './client'

afterEach(() => { cleanup(); setBackendReady(true); setTokenProvider(async()=>null); vi.unstubAllGlobals(); vi.useRealTimers() })
function Probe() { const {ready,phase,retry}=useBackend(); return <><p>{ready?'Personal ready':'Personal waking'}</p><p>{phase}</p><button onClick={retry}>Wake services</button></> }
it('keeps private writes off the network until dependencies become ready',async()=>{
  vi.useFakeTimers()
  let probes=0
  const fetcher=vi.fn<typeof fetch>().mockImplementation(async url=>{
    if(String(url).endsWith('/ready')) { probes++; return probes===1?new Response('{}',{status:503}):new Response('{"status":"ready"}') }
    return new Response('{"saved":true}')
  })
  vi.stubGlobal('fetch',fetcher)
  setTokenProvider(async()=>({token:'test-token',userId:'owner'}))
  render(<QueryClientProvider client={new QueryClient()}><BackendProvider><Probe/></BackendProvider></QueryClientProvider>)
  await act(async()=>{await vi.advanceTimersByTimeAsync(1)})
  expect(screen.getByText('Personal waking')).toBeVisible()
  await expect(api('/me/library/example',{accountId:'owner',method:'PUT'})).rejects.toMatchObject({code:'BACKEND_WAKING'})
  expect(fetcher.mock.calls.filter(([url])=>String(url).includes('/me/'))).toHaveLength(0)
  await act(async()=>{await vi.advanceTimersByTimeAsync(12000)})
  expect(screen.getByText('Personal ready')).toBeVisible()
  // Becoming ready does not replay a rejected write; only the next explicit call saves.
  expect(fetcher.mock.calls.filter(([url])=>String(url).includes('/me/'))).toHaveLength(0)
  await expect(api('/me/library/example',{accountId:'owner',method:'PUT'})).resolves.toEqual({saved:true})
  expect(fetcher.mock.calls.filter(([url])=>String(url).includes('/me/'))).toHaveLength(1)
})

it('stops at the existing startup deadline and retries on an explicit request',async()=>{
  vi.useFakeTimers()
  const fetcher=vi.fn<typeof fetch>().mockImplementation(async()=>new Response('{}',{status:503}))
  vi.stubGlobal('fetch',fetcher)
  render(<QueryClientProvider client={new QueryClient()}><BackendProvider><Probe/></BackendProvider></QueryClientProvider>)
  await act(async()=>{await vi.advanceTimersByTimeAsync(300001)})
  expect(screen.getByText('offline')).toBeVisible()
  const attempts=fetcher.mock.calls.length
  await act(async()=>{await vi.advanceTimersByTimeAsync(60000)})
  expect(fetcher).toHaveBeenCalledTimes(attempts)
  await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Wake services'}));await vi.advanceTimersByTimeAsync(1)})
  expect(fetcher).toHaveBeenCalledTimes(attempts+1)
  expect(screen.getByText('waking')).toBeVisible()
})
