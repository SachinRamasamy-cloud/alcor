import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {MemoryRouter} from 'react-router-dom'
import {FavoritesPage} from './favorites'
import {fromAniList} from '../shared/api/anilist'
import {setTokenProvider} from '../shared/api/client'
const state=vi.hoisted(()=>({userId:'a' as string|null,signIn:vi.fn()}))
vi.mock('../shared/auth',()=>({useAuth:()=>({userId:state.userId,requireSignIn:state.signIn})}))
const media={...fromAniList({id:1,type:'ANIME',title:{english:'Completed favorite'}}),id:'d98b77b7-5378-4e2e-9c96-18737b47f509'}
beforeEach(()=>{state.userId='a';setTokenProvider(async()=>state.userId?{userId:state.userId,token:'test-only'}:null)})
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.clearAllMocks();setTokenProvider(async()=>null)})
function mount(){render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={['/favorites?mode=new_to_me']}><FavoritesPage/></MemoryRouter></QueryClientProvider>)}
it('keeps completed favorites visible on this management page regardless of discovery mode',async()=>{
  const fetcher=vi.fn<typeof fetch>(async url=>new Response(JSON.stringify(String(url).includes('/media-status')?[{media,status:'completed',ever_completed:true,version:1}]:{data:[media],total:1,preferences_version:3,next_cursor:null})))
  vi.stubGlobal('fetch',fetcher);mount()
  expect(await screen.findByRole('article',{name:'Completed favorite'})).toBeVisible()
  expect(await screen.findByText('Completed',{exact:true})).toBeVisible()
  expect(fetcher.mock.calls.some(([url])=>String(url).includes('/discovery-exclusions'))).toBe(false)
})
it('asks a guest to sign in only on the personal route and makes no private request',()=>{
  state.userId=null;const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);mount()
  expect(screen.getByText('Sign in to manage your favorites.')).toBeVisible()
  fireEvent.click(screen.getByRole('button',{name:'Sign in'}))
  expect(state.signIn).toHaveBeenCalledWith('library');expect(fetcher).not.toHaveBeenCalled()
})
