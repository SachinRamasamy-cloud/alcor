import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,render,screen,within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {HomeDiscovery,AiringShelf} from './discovery-home'
import {fromAniList} from '../shared/api/anilist'
import {setTokenProvider} from '../shared/api/client'
const state=vi.hoisted(()=>({owner:'a' as string|null,window:vi.fn()}))
vi.mock('../shared/auth',()=>({useAuth:()=>({userId:state.owner})}))
vi.mock('../shared/api/backend',()=>({useBackend:()=>({ready:true})}))
vi.mock('../features/library/actions',()=>({CardActions:()=>null,CardStatus:()=>null}))
vi.mock('../shared/api/anilist',async original=>({...await original<typeof import('../shared/api/anilist')>(),aniShelfWindow:state.window}))
afterEach(()=>{cleanup();vi.clearAllMocks();vi.unstubAllGlobals();state.owner='a';setTokenProvider(async()=>null)})
const items=(start:number)=>Array.from({length:24},(_,i)=>fromAniList({id:start+i,type:'ANIME',title:{english:`Story ${start+i}`},status:'FINISHED'}))
function mount(){render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter><p>Existing popular section</p><HomeDiscovery mode="new_to_me" position="before-popular" enabled/><HomeDiscovery mode="new_to_me" position="after-manga" enabled/></MemoryRouter></QueryClientProvider>)}
it('adds distinct source-labelled member shelves, filters history and shares the public source request',async()=>{
  setTokenProvider(async()=>({token:'test-only',userId:'a'}))
  state.window.mockResolvedValue({trending:{items:items(1),hasMore:true},airing:{items:items(101),hasMore:true},upcoming:{items:items(201),hasMore:true}})
  vi.stubGlobal('fetch',vi.fn(async()=>new Response('[1]')))
  mount()
  const trending=await screen.findByRole('region',{name:'Trending now'})
  expect(within(trending).queryByRole('article',{name:'Story 1'})).toBeNull()
  expect(within(trending).getAllByRole('article')).toHaveLength(12)
  for(const title of ['Currently airing','Coming soon'])expect(await screen.findByRole('region',{name:title})).toBeVisible()
  expect(state.window).toHaveBeenCalledOnce()
  expect(screen.getByText('Existing popular section')).toBeVisible()
  const link=trending.closest('section')!.querySelector('a.subtle-link')!
  expect(link.getAttribute('href')).toBe('/search?type=anime&sort=trending&mode=new_to_me')
})
it('leaves the existing guest Home intact without extra source requests',()=>{
  state.owner=null;mount()
  expect(screen.queryByRole('heading',{name:'Trending now'})).toBeNull()
  expect(state.window).not.toHaveBeenCalled()
})
it('loads the distinct member airing shelf with its exact continuation filters',async()=>{
  setTokenProvider(async()=>({token:'test-only',userId:'a'}))
  state.window.mockResolvedValue({airing:{items:items(301),hasMore:false}})
  vi.stubGlobal('fetch',vi.fn(async()=>new Response('[]')))
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><AiringShelf mode="hide_watched"/></MemoryRouter></QueryClientProvider>)
  const rail=await screen.findByRole('region',{name:'Currently airing'})
  expect(rail.closest('section')!.querySelector('a.subtle-link')!.getAttribute('href')).toBe('/search?type=anime&sort=popular&status=RELEASING&mode=hide_watched')
})
