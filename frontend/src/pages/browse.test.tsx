import {cleanup,render,screen,within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {BrowsePage} from './browse'
import {fromAniList} from '../shared/api/anilist'
import {defaultAnswers} from '../features/profile'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import type {ReactNode} from 'react'
import {setTokenProvider} from '../shared/api/client'
const state=vi.hoisted(()=>({personal:false,request:vi.fn()}))
const media=fromAniList({id:10,type:'ANIME',title:{english:'A new adventure'},genres:['Fantasy'],status:'FINISHED'})
const other=fromAniList({id:11,type:'ANIME',title:{english:'An unrelated romance'},genres:['Romance'],status:'FINISHED'})
vi.mock('../shared/auth',()=>({useAuth:()=>({userId:state.personal?'owner':null})}))
vi.mock('../shared/api/anilist',async original=>({...await original<typeof import('../shared/api/anilist')>(),aniCatalogue:async(path:string,params:URLSearchParams)=>{state.request(path,params.toString());return {data:[media,other],has_more:false}},aniShelfWindow:async()=>({airing:{items:[],hasMore:false}})}))
function wrapper({children}:{children:ReactNode}){return <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>{children}</QueryClientProvider>}
vi.mock('./public',()=>({CataloguePage:()=> <h1>Full filtered results</h1>}))
vi.mock('../features/library',()=>({SaveButton:()=> <button>Save title</button>}))
vi.mock('../features/catalogue',()=>({useBrowse:()=>({data:{latest:[media],popular:[media],trending:[media],top:[media],ongoing:[media]},isPending:false}),useCatalogue:(path:string,params:URLSearchParams)=>{state.request(path,params.toString());return {data:{data:[media]},isPending:false}}}))
vi.mock('../features/profile',async original=>({...await original<typeof import('../features/profile')>(),useSetup:()=>({data:state.personal?{preferences:{data:{preferred_genres:['Fantasy'],intelligence_profile:{...defaultAnswers()}}},favorites:[]}:undefined})}))
beforeEach(()=>{setTokenProvider(async()=>({token:'test-only',userId:'owner'}));vi.stubGlobal('fetch',vi.fn<typeof fetch>(async url=>new Response(JSON.stringify(String(url).includes('/preferences')?{version:1,data:{preferred_genres:['Fantasy'],discovery_mode:'new_to_me',intelligence_profile:defaultAnswers()}}:String(url).includes('/favorites')?{data:[],total:0,preferences_version:1,next_cursor:null}:[]))))})
afterEach(()=>{cleanup();state.personal=false;vi.clearAllMocks();vi.unstubAllGlobals();setTokenProvider(async()=>null)})
it('shows general shelves for guests and preserves existing filtered links',()=>{
  const view=render(<MemoryRouter initialEntries={['/anime']}><BrowsePage/></MemoryRouter>,{wrapper})
  expect(screen.getByRole('heading',{name:'Trending now'})).toBeVisible()
  expect(screen.queryByRole('heading',{name:'You may like'})).toBeNull()
  expect(screen.getByRole('heading',{name:'Make room for your next favorite.'})).toBeVisible()
  view.unmount();render(<MemoryRouter initialEntries={['/anime?genre=Action']}><BrowsePage/></MemoryRouter>,{wrapper})
  expect(screen.getByRole('heading',{name:'Full filtered results'})).toBeVisible()
})
it('uses explicit profile choices for You may like and links the same filters to the matching feed',async()=>{
  state.personal=true;render(<MemoryRouter initialEntries={['/anime']}><BrowsePage/></MemoryRouter>,{wrapper})
  const rail=await screen.findByRole('region',{name:'You may like'})
  expect(screen.getByRole('heading',{name:'Trending now'})).toBeVisible()
  expect(within(rail).getByRole('article',{name:'A new adventure'})).toBeVisible()
  expect(state.request).toHaveBeenCalledWith('/anime',expect.stringContaining('sort=popular'))
  expect(within(rail).queryByRole('article',{name:'An unrelated romance'})).toBeNull()
  const section=rail.closest('section')!
  const target=new URL(within(section).getByRole('link',{name:'View all'}).getAttribute('href')!,'https://example.test')
  expect(target.pathname).toBe('/recommendations');expect(target.searchParams.get('kind')).toBe('taste');expect(target.searchParams.get('type')).toBe('anime')
  expect(target.searchParams.getAll('include_genres')).toEqual(['Fantasy'])
})
