import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersonalDetails } from './details'
import { setTokenProvider, type Media } from '../../shared/api/client'
const mock=vi.hoisted(()=>({notify:vi.fn()}))
vi.mock('../../shared/auth',()=>({useAuth:()=>({userId:'a'})}))
vi.mock('../../shared/feedback',()=>({useFeedback:()=>mock.notify}))
afterEach(()=>{cleanup();vi.unstubAllGlobals();setTokenProvider(async()=>null);vi.clearAllMocks()})
it('saves private notes with the original version and does not change status',async()=>{
  setTokenProvider(async()=>({token:'test-only',userId:'a'}))
  const media={id:'title',title:'Test',media_type:'anime'} as Media
  const entry={media,status:'planned',version:5,rating:null,notes:'Saved note',favorite:false,tags:[],priority:'normal',reason:null}
  const fetcher=vi.fn().mockImplementation((_url,init)=>Promise.resolve(new Response(JSON.stringify(init.method==='PATCH'?{entry:{...entry,version:6,notes:'Draft note'},changed:true}:[entry]),{status:200})))
  vi.stubGlobal('fetch',fetcher)
  render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><PersonalDetails media={media}/></QueryClientProvider>)
  fireEvent.change(await screen.findByRole('textbox',{name:'Private notes'}),{target:{value:'Draft note'}})
  fireEvent.click(screen.getByRole('button',{name:'Save changes'}))
  await waitFor(()=>expect(mock.notify).toHaveBeenCalledWith('Personal details saved.'))
  const body=JSON.parse(fetcher.mock.calls.find(([,init])=>init.method==='PATCH')![1].body)
  expect(body.expected_version).toBe(5);expect(body.notes).toBe('Draft note');expect(body.status).toBeUndefined()
})
