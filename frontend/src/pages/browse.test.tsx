import {cleanup,render,screen,within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach,expect,it,vi} from 'vitest'
import {BrowsePage} from './browse'
import {fromAniList} from '../shared/api/anilist'
import {defaultAnswers} from '../features/profile'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import type {ReactNode} from 'react'
const state=vi.hoisted(()=>({personal:false,request:vi.fn()}))
const media=fromAniList({id:10,type:'ANIME',title:{english:'A new adventure'},genres:['Fantasy'],status:'FINISHED'})
vi.mock('../shared/auth',()=>({useAuth:()=>({userId:null})}))
function wrapper({children}:{children:ReactNode}){return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>}
vi.mock('./public',()=>({CataloguePage:()=> <h1>Full filtered results</h1>}))
vi.mock('../features/library',()=>({SaveButton:()=> <button>Save title</button>}))
vi.mock('../features/catalogue',()=>({useBrowse:()=>({data:{latest:[media],popular:[media],trending:[media],top:[media],ongoing:[media]},isPending:false}),useCatalogue:(path:string,params:URLSearchParams)=>{state.request(path,params.toString());return {data:{data:[media]},isPending:false}}}))
vi.mock('../features/profile',async original=>({...await original<typeof import('../features/profile')>(),useSetup:()=>({data:state.personal?{preferences:{data:{preferred_genres:['Fantasy'],intelligence_profile:{...defaultAnswers()}}},favorites:[]}:undefined})}))
afterEach(()=>{cleanup();state.personal=false;vi.clearAllMocks()})
it('shows general shelves for guests and preserves existing filtered links',()=>{
  const view=render(<MemoryRouter initialEntries={['/anime']}><BrowsePage/></MemoryRouter>,{wrapper})
  expect(screen.getByRole('heading',{name:'Trending now'})).toBeVisible()
  expect(screen.queryByRole('heading',{name:'You may like'})).toBeNull()
  expect(screen.getByRole('heading',{name:'Make room for your next favorite.'})).toBeVisible()
  view.unmount();render(<MemoryRouter initialEntries={['/anime?genre=Action']}><BrowsePage/></MemoryRouter>,{wrapper})
  expect(screen.getByRole('heading',{name:'Full filtered results'})).toBeVisible()
})
it('uses explicit profile choices for You may like and links the same filters to full search',()=>{
  state.personal=true;render(<MemoryRouter initialEntries={['/anime']}><BrowsePage/></MemoryRouter>,{wrapper})
  const rail=screen.getByRole('region',{name:'You may like'})
  expect(screen.getByRole('heading',{name:'Trending now'})).toBeVisible()
  expect(within(rail).getByRole('article',{name:'A new adventure'})).toBeVisible()
  expect(state.request).toHaveBeenCalledWith('/anime',expect.stringContaining('include_genres=Fantasy'))
  const section=rail.closest('section')!
  const target=new URL(within(section).getByRole('link',{name:'View all'}).getAttribute('href')!,'https://example.test')
  expect(target.pathname).toBe('/search');expect(target.searchParams.get('type')).toBe('anime')
  expect(target.searchParams.getAll('include_genres')).toEqual(['Fantasy'])
})
