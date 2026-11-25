import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {MemoryRouter} from 'react-router-dom'
import {DiscoveryControls} from '.'
import {setTokenProvider} from '../../shared/api/client'
import type {PreferencesRead} from '../preferences'
const state=vi.hoisted(()=>({notify:vi.fn()}))
const saved={data:{timezone:'UTC',discovery_mode:'new_to_me',include_planned:false},version:9} as PreferencesRead
vi.mock('../../shared/auth',()=>({useAuth:()=>({userId:'a'})}))
vi.mock('../../shared/api/backend',()=>({useBackend:()=>({ready:true})}))
vi.mock('../../shared/feedback',()=>({useFeedback:()=>state.notify}))
vi.mock('../preferences',()=>({usePreferences:()=>({data:saved})}))
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.clearAllMocks();setTokenProvider(async()=>null)})
it.each([false,true])('persists the selected mode against its captured version and reports conflicts (conflict=%s)',async conflict=>{
  setTokenProvider(async()=>({token:'test-only',userId:'a'}))
  const fetcher=vi.fn<typeof fetch>(async(_url,options)=>new Response(JSON.stringify(options?.method==='PATCH'?conflict?{error:{code:'CONFLICT'}}:{...saved,data:{...saved.data,discovery_mode:'hide_watched'},version:10}:[]),{status:options?.method==='PATCH'&&conflict?409:200}))
  vi.stubGlobal('fetch',fetcher)
  const changed=vi.fn(),queries=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})
  render(<QueryClientProvider client={queries}><MemoryRouter><DiscoveryControls params={new URLSearchParams('genre=Fantasy&page=2&cursor=f%3A2%3A0')} mode="new_to_me" onChange={changed}/></MemoryRouter></QueryClientProvider>)
  fireEvent.click(screen.getByRole('button',{name:'Discovery options'}))
  fireEvent.change(screen.getByLabelText('Discovery mode'),{target:{value:'hide_watched'}})
  await waitFor(()=>expect(fetcher.mock.calls.some(([,options])=>options?.method==='PATCH')).toBe(true))
  const options=fetcher.mock.calls.find(([,value])=>value?.method==='PATCH')![1]!
  expect(JSON.parse(options.body as string)).toEqual({expected_version:9,data:{...saved.data,discovery_mode:'hide_watched'}})
  expect(changed.mock.calls[0][0].toString()).toBe('genre=Fantasy&mode=hide_watched')
  if(conflict)await waitFor(()=>expect(state.notify).toHaveBeenCalledWith(expect.stringContaining('another device')))
  else await waitFor(()=>expect(queries.getQueryData(['private','a','preferences'])).toMatchObject({version:10}))
  expect(fetcher.mock.calls.filter(([,value])=>value?.method==='PATCH')).toHaveLength(1)
})
