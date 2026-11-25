import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {MemoryRouter,Routes,Route} from 'react-router-dom'
import {PersonalShelves,SimilarShelf} from './views'
import {RecommendationsPage} from '../../pages/recommendations'
import {fromAniList,mergeRecommendationWindows,type RecommendationWindow} from '../../shared/api/anilist'
import {setTokenProvider} from '../../shared/api/client'
import type {PreferencesRead} from '../preferences'

const state=vi.hoisted(()=>({owner:'a' as string|null,edges:vi.fn(),catalogue:vi.fn(),genres:[] as string[],favoriteIds:[1,2],version:7}))
vi.mock('../../shared/auth',()=>({useAuth:()=>({userId:state.owner,requireSignIn:vi.fn()})}))
vi.mock('../../shared/api/backend',()=>({useBackend:()=>({ready:true})}))
vi.mock('../library/actions',()=>({CardActions:()=>null,CardStatus:()=>null}))
vi.mock('../../shared/api/anilist',async original=>({...await original<typeof import('../../shared/api/anilist')>(),aniRecommendations:state.edges,aniCatalogue:state.catalogue}))
const media=(id:number)=>fromAniList({id,type:'ANIME',title:{english:`Story ${id}`},genres:['Fantasy'],episodes:12})
const canonical=(id:number)=>({...media(id),id:`d98b77b7-5378-4e2e-9c96-18737b47f5${String(id).padStart(2,'0')}`})
const prefs=():PreferencesRead=>({version:state.version,data:{timezone:'UTC',motion:'system',notifications:false,include_planned:true,spoiler_mode:false,discovery_mode:'new_to_me',preferred_genres:state.genres,preferred_themes:[],preferred_studios:[],favorite_media_ids:state.favoriteIds.map(id=>canonical(id).id)}})
const sourceWindow=(ids=[1,2]):RecommendationWindow=>{
  const seedWindows=Object.fromEntries(ids.map(seed=>[String(seed),{items:[10,seed===1?11:12].map(id=>({media:media(id),origins:[{anilistId:seed,title:`Story ${seed}`}],ratings:{}})),hasMore:false,nextSeeds:[]}]))
  return {...mergeRecommendationWindows(Object.values(seedWindows)),seedWindows}
}
const clients:QueryClient[]=[]
beforeEach(()=>{
  state.owner='a';state.genres=[];state.favoriteIds=[1,2];state.version=7
  state.edges.mockImplementation(async(ids:number[])=>sourceWindow(ids))
  state.catalogue.mockImplementation(async()=>({data:[media(11),{...media(15),genres:['Romance']}],has_more:false}))
  setTokenProvider(async()=>state.owner?{token:'test-only',userId:state.owner}:null)
  vi.stubGlobal('fetch',vi.fn<typeof fetch>(async(url,options)=>{
    const path=new URL(String(url),'http://local.test')
    if(path.pathname.endsWith('/preferences'))return new Response(JSON.stringify(prefs()))
    if(path.pathname.endsWith('/favorites')){
      const ids=path.searchParams.getAll('ids'),data=state.favoriteIds.map(canonical).filter(item=>!ids.length||ids.includes(item.id))
      return new Response(JSON.stringify({data,total:data.length,preferences_version:state.version,next_cursor:null}))
    }
    if(path.pathname.endsWith('/discovery-exclusions')){
      expect(JSON.parse(String(options?.body)).mode).toBe('new_to_me')
      return new Response(state.owner==='a'?'[10]':'[11]')
    }
    return new Response('[]')
  }))
})
afterEach(()=>{cleanup();clients.forEach(client=>client.clear());clients.length=0;vi.unstubAllGlobals();vi.clearAllMocks();setTokenProvider(async()=>null)})
function mount(path='/preview'){
  const queries=new QueryClient({defaultOptions:{queries:{retry:false}}});clients.push(queries)
  const tree=()=> <QueryClientProvider client={queries}><MemoryRouter initialEntries={[path]}><Routes><Route path="/preview" element={<><h1>Recommendation preview</h1><PersonalShelves type="anime" mode="new_to_me"/></>}/><Route path="/recommendations" element={<RecommendationsPage/>}/></Routes></MemoryRouter></QueryClientProvider>
  const view=render(tree());return {queries,view,tree}
}
it('supports favourite-only evidence, removes watched candidates and opens the identical verified View All feed',async()=>{
  mount()
  const rail=await screen.findByRole('region',{name:'Based on your favourites'})
  expect(within(rail).getAllByRole('article').map(card=>card.getAttribute('aria-labelledby'))).toHaveLength(2)
  expect(within(rail).queryByRole('article',{name:'Story 10'})).toBeNull()
  expect(within(rail).getByText('Because you favourited Story 1.')).toBeVisible()
  expect(screen.queryByRole('heading',{name:'You may like'})).toBeNull()
  fireEvent.click(within(rail.closest('section')!).getByRole('link',{name:'View all'}))
  await screen.findByRole('heading',{name:'Based on your favourites',level:1})
  await waitFor(()=>expect(screen.getAllByRole('article')).toHaveLength(2))
  expect(state.edges).toHaveBeenCalledOnce()
})
it('supports explicit-profile-only suggestions without favourite seed calls and filters before display',async()=>{
  state.favoriteIds=[];state.genres=['Fantasy'];mount()
  const rail=await screen.findByRole('region',{name:'You may like'})
  expect(within(rail).getByRole('article',{name:'Story 11'})).toBeVisible()
  expect(within(rail).queryByRole('article',{name:'Story 15'})).toBeNull()
  expect(within(rail).getByText('Matches your selected Fantasy genre.')).toBeVisible()
  expect(state.edges).not.toHaveBeenCalled()
  fireEvent.click(within(rail.closest('section')!).getByRole('link',{name:'View all'}))
  await screen.findByRole('heading',{name:'You may like',level:1})
  await waitFor(()=>expect(screen.getAllByRole('article')).toHaveLength(1))
  expect(state.catalogue).toHaveBeenCalledOnce()
})
it('requires an explicit restart for a deep cursor whose session is missing',async()=>{
  mount('/recommendations?kind=favorites&type=anime&mode=new_to_me&page=2&cursor=missing')
  const restart=await screen.findByRole('button',{name:'Start this feed again'})
  expect(state.edges).not.toHaveBeenCalled();expect(screen.queryByRole('article')).toBeNull()
  fireEvent.click(restart)
  await screen.findByRole('article',{name:'Story 11'})
})
it('never lets an old-account pending source response publish a personal shelf for the new account',async()=>{
  let finish!:(window:RecommendationWindow)=>void
  state.edges.mockImplementationOnce(()=>new Promise<RecommendationWindow>(resolve=>{finish=resolve}))
  const {view,tree}=mount()
  await waitFor(()=>expect(finish).toBeTypeOf('function'))
  state.owner='b';state.favoriteIds=[2];view.rerender(tree())
  await screen.findByRole('article',{name:'Story 12'})
  await act(async()=>finish(sourceWindow()))
  expect(screen.queryByRole('article',{name:'Story 11'})).toBeNull()
})
it('removes favourite contributions when confirmed authoritative membership becomes empty',async()=>{
  const {queries}=mount();await screen.findByRole('region',{name:'Based on your favourites'})
  state.favoriteIds=[];state.version=8
  await act(async()=>{queries.setQueryData(['private','a','preferences'],prefs());await queries.invalidateQueries({queryKey:['private','a','favorites']})})
  await screen.findByText('Add favourites to see source-backed suggestions from those titles.')
  expect(screen.queryByRole('article')).toBeNull()
})
it('shows guest Similar from public title edges without owned filtering or a personal claim',async()=>{
  state.owner=null
  const queries=new QueryClient({defaultOptions:{queries:{retry:false}}});clients.push(queries)
  render(<QueryClientProvider client={queries}><MemoryRouter><SimilarShelf media={media(1)} mode="all"/></MemoryRouter></QueryClientProvider>)
  const rail=await screen.findByRole('region',{name:'Similar anime'})
  expect(within(rail).getAllByRole('article')).toHaveLength(2)
  expect(within(rail).getAllByText(/Suggested by AniList for/)).toHaveLength(2)
  expect(vi.mocked(fetch).mock.calls).toHaveLength(0)
})
