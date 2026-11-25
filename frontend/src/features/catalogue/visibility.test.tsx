import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {act,cleanup,render,screen,waitFor} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {MemoryRouter} from 'react-router-dom'
import type {ReactNode} from 'react'
import {HomePage} from '../../pages/public'
import {fromAniList} from '../../shared/api/anilist'
import {setTokenProvider} from '../../shared/api/client'
import {discoveryLink,visibleTitles,useDiscoveryVisibility} from './visibility'
import {exclusions} from './personal-page'

const state=vi.hoisted(()=>({userId:'a' as string|null,ready:true}))
const titles=[1,2,3].map(id=>fromAniList({id,type:'ANIME',title:{english:`Story ${id}`},status:'FINISHED'}))
vi.mock('../../shared/auth',()=>({useAuth:()=>({userId:state.userId})}))
vi.mock('../../shared/api/backend',()=>({useBackend:()=>({ready:state.ready})}))
vi.mock('../../features/preferences',()=>({SpoilerText:({children}:{children:ReactNode})=>children,usePreferences:()=>({data:undefined})}))
vi.mock('../../widgets/continue',()=>({ContinueSections:()=> <p>Continue Story 2</p>}))
vi.mock('../../features/library',()=>({SaveButton:()=>null}))
vi.mock('../../features/library/actions',()=>({CardActions:()=>null,CardStatus:()=>null}))
vi.mock('.',()=>({useHome:()=>({data:{featured:titles[0],anime:titles,manga:[],genres:['Fantasy']},isPending:false})}))
beforeEach(()=>{state.userId='a';state.ready=true;setTokenProvider(async()=>({token:'test-only',userId:state.userId!}))})
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.clearAllMocks();setTokenProvider(async()=>null)})
function home(path='/?mode=new_to_me'){
  const queries=new QueryClient({defaultOptions:{queries:{retry:false}}})
  render(<QueryClientProvider client={queries}><MemoryRouter initialEntries={[path]}><HomePage/></MemoryRouter></QueryClientProvider>)
  return queries
}
it('filters the Home hero and shelves together, preserves continue, and carries mode to View all',async()=>{
  const fetcher=vi.fn<typeof fetch>(async()=>new Response('[1,2]'));vi.stubGlobal('fetch',fetcher)
  home()
  expect(await screen.findByRole('heading',{name:'Story 3',level:1})).toBeVisible()
  expect(screen.queryByRole('article',{name:'Story 1'})).toBeNull()
  expect(screen.queryByRole('article',{name:'Story 2'})).toBeNull()
  expect(screen.getByRole('article',{name:'Story 3'})).toBeVisible()
  expect(screen.getByText('Continue Story 2')).toBeVisible()
  for(const link of screen.getAllByRole('link',{name:'View all'}))expect(link.getAttribute('href')).toContain('mode=new_to_me')
  expect(fetcher).toHaveBeenCalledOnce()
  expect(JSON.parse(fetcher.mock.calls[0][1]!.body as string).mode).toBe('new_to_me')
})
it('never flashes excluded candidates while history is loading or after a failed lookup',async()=>{
  let complete!:(response:Response)=>void
  vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(resolve=>{complete=resolve})))
  home();await waitFor(()=>expect(complete).toBeTypeOf('function'))
  expect(screen.queryByRole('article')).toBeNull()
  await act(async()=>complete(new Response('{"error":{"code":"UPSTREAM_UNAVAILABLE"}}',{status:503})))
  await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('Personal filtering is temporarily unavailable'))
  expect(screen.queryByRole('article')).toBeNull()
  expect(screen.getByText('Continue Story 2')).toBeVisible()
})
it('keeps the general catalogue available with an explicit warning while personal services sleep',async()=>{
  state.ready=false;const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher)
  home()
  expect(screen.getByRole('article',{name:'Story 1'})).toBeVisible()
  expect(screen.getByRole('status')).toHaveTextContent('General catalogue results may include titles in your history')
  expect(fetcher).not.toHaveBeenCalled()
})
it('preserves an explicit Show All override',()=>{
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);home('/?mode=all')
  expect(screen.getByRole('article',{name:'Story 1'})).toBeVisible();expect(fetcher).not.toHaveBeenCalled()
})
it('uses the approved New to Me default for signed-in Home',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>new Response('[1,2]')));home('/')
  expect(await screen.findByRole('heading',{name:'Story 3',level:1})).toBeVisible()
})
it('keeps eligibility caches separate when switching accounts',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>new Response(state.userId==='a'?'[1]':'[2]')))
  function CandidateList(){const result=useDiscoveryVisibility(titles,'hide_watched');return <div>{result.items.map(item=><span key={item.id}>{item.title}</span>)}</div>}
  const queries=new QueryClient(),tree=()=> <QueryClientProvider client={queries}><CandidateList/></QueryClientProvider>
  const view=render(tree())
  await screen.findByText('Story 2');expect(screen.queryByText('Story 1')).toBeNull()
  state.userId='b';view.rerender(tree());expect(screen.queryByText('Story 2')).toBeNull()
  await screen.findByText('Story 1');expect(screen.queryByText('Story 2')).toBeNull()
  expect(queries.getQueryCache().getAll().map(query=>query.queryKey[1])).toEqual(['a','b'])
})
it('batches large shelf sets within the existing 100-reference contract',async()=>{
  const fetcher=vi.fn<typeof fetch>(async()=>new Response('[]'));vi.stubGlobal('fetch',fetcher)
  const items=Array.from({length:205},(_,index)=>fromAniList({id:index+1,type:'ANIME',title:{english:String(index)}}))
  await exclusions(items,'new_to_me','a')
  expect(fetcher.mock.calls.map(call=>JSON.parse(call[1]!.body as string).candidates.length)).toEqual([100,100,5])
})
it('deduplicates canonical aliases without merging a sequel or anime/manga namespaces',()=>{
  const alias={...titles[0],id:'canonical-1'},sequel=titles[1],manga={...titles[0],id:'manga-1',media_type:'manga' as const}
  expect(visibleTitles([titles[0],alias,sequel,manga],[]).map(item=>item.id)).toEqual(['anilist-1','anilist-2','manga-1'])
  expect(visibleTitles([titles[0],alias,sequel],[1]).map(item=>item.id)).toEqual(['anilist-2'])
  expect(discoveryLink('/search?type=anime&genre=Fantasy','hide_watched')).toBe('/search?type=anime&genre=Fantasy&mode=hide_watched')
})
