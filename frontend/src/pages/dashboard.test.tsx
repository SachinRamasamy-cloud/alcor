import { cleanup,render,screen,within } from '@testing-library/react'
import { QueryClient,QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach,expect,it,vi } from 'vitest'
import { DashboardPage } from './dashboard'
import { defaultAnswers } from '../features/profile'
import { fromAniList } from '../shared/api/anilist'
const state=vi.hoisted(()=>({ready:true}))
const favorite=fromAniList({id:1,type:'ANIME',title:{english:'A favorite'},genres:['Fantasy'],episodes:12,status:'FINISHED'})
const suggestion=fromAniList({id:2,type:'ANIME',title:{english:'A fresh suggestion'},genres:['Fantasy'],episodes:12,status:'FINISHED'})
vi.mock('../shared/auth',()=>({useAuth:()=>({userId:'owner',requireSignIn:vi.fn()})}))
vi.mock('../shared/api/backend',()=>({useBackend:()=>({ready:state.ready})}))
vi.mock('../features/profile',async original=>({...await original<typeof import('../features/profile')>(),useSetup:()=>({data:{profile:{display_name:'Reader',version:1},preferences:{version:1,data:{preferred_genres:['Fantasy'],intelligence_profile:{...defaultAnswers(),favorite_anime_ids:[favorite.id],excluded_genres:['Romance']}}},favorites:[favorite]},isPending:false,error:null})}))
vi.mock('../features/catalogue',()=>({useHome:()=>({data:{anime:[suggestion]},isPending:false,error:null}),useCatalogue:()=>({data:{data:[suggestion,favorite]},isPending:false,error:null})}))
vi.mock('../features/library',()=>({SaveButton:()=> <button>Save title</button>,useLibrary:()=>({data:{total:1,data:[{media:suggestion}]},isPending:false,error:null})}))
vi.mock('../widgets/continue',()=>({ContinueSections:()=> <h2>Continue watching</h2>}))
afterEach(()=>{cleanup();state.ready=true})
function mount(){render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><DashboardPage/></MemoryRouter></QueryClientProvider>)}
it('shows suggestions with a reason, favorites, continue and wishlist without repeating favorites in suggestions',()=>{
  mount()
  expect(screen.getByRole('heading',{name:'You may like'})).toBeVisible()
  const shelf=screen.getByRole('region',{name:'You may like'})
  expect(within(shelf).getByRole('article',{name:'A fresh suggestion'})).toBeVisible()
  expect(within(shelf).queryByRole('article',{name:'A favorite'})).not.toBeInTheDocument()
  expect(screen.getByRole('region',{name:'Your favorites'})).toBeVisible()
  expect(screen.getByRole('heading',{name:'Continue watching'})).toBeVisible()
  expect(screen.getByText('From your selected genres: Fantasy. Your publication and episode preferences also apply.')).toBeVisible()
})
it('keeps public browsing available and does not claim personal suggestions before readiness',()=>{
  state.ready=false;mount()
  expect(screen.queryByRole('heading',{name:'You may like'})).not.toBeInTheDocument()
  expect(screen.getByRole('region',{name:'Popular anime'})).toBeVisible()
  expect(screen.queryByRole('region',{name:'Your favorites'})).not.toBeInTheDocument()
})
