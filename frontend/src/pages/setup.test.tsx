import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react'
import { QueryClient,QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter,Route,Routes } from 'react-router-dom'
import { afterEach,expect,it,vi } from 'vitest'
import { SetupPage } from './setup'
import { fromAniList } from '../shared/api/anilist'
import { setBackendReady,setTokenProvider } from '../shared/api/client'
const sample=fromAniList({id:1,type:'ANIME',title:{english:'Favorite title'},genres:['Action']})
vi.mock('../shared/auth',()=>({useAuth:()=>({userId:'owner',requireSignIn:vi.fn()})}))
vi.mock('../features/catalogue',async original=>({...await original<typeof import('../features/catalogue')>(),useGenres:()=>({data:['Action'],isPending:false,error:null}),useCatalogue:()=>({data:{data:[sample]},isPending:false,isFetching:false,error:null})}))
afterEach(()=>{cleanup();setTokenProvider(async()=>null);setBackendReady(true);vi.unstubAllGlobals()})
it('saves verified favorite IDs and both versions while preserving existing settings',async()=>{
  const stored={profile:{display_name:'',version:2},preferences:{version:4,data:{timezone:'Asia/Kolkata',motion:'reduced',notifications:false,include_planned:true,spoiler_mode:true,preferred_genres:[],preferred_themes:[],preferred_studios:[],positive_rating_min:null,minimum_rating_votes:null,preferred_max_units:null,intelligence_profile:null}},favorites:[]}
  const canonical='76aaad3c-0eb9-5e5c-a47c-d190a2b1300f'
  const writes:{url:string;body:Record<string,unknown>}[]=[]
  vi.stubGlobal('fetch',vi.fn(async(url,options)=>{
    const body=options?.body?JSON.parse(String(options.body)):{}
    if(options?.method==='POST')return new Response(JSON.stringify({...sample,id:canonical}))
    if(options?.method==='PUT'){writes.push({url:String(url),body});return new Response(JSON.stringify({...stored,profile:{display_name:body.display_name,version:3},preferences:{data:body.data,version:5}}))}
    return new Response(JSON.stringify(stored))
  }))
  setBackendReady(true);setTokenProvider(async()=>({token:'test-only',userId:'owner'}))
  render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><MemoryRouter initialEntries={['/setup']}><Routes><Route path="setup" element={<SetupPage/>}/><Route path="profile" element={<h1>Saved profile</h1>}/></Routes></MemoryRouter></QueryClientProvider>)
  await screen.findByLabelText('Display name')
  fireEvent.change(screen.getByLabelText('Display name'),{target:{value:'Reader'}})
  fireEvent.click(screen.getByRole('button',{name:'Continue'}))
  fireEvent.click(screen.getByRole('button',{name:'Favorite title'}))
  fireEvent.click(screen.getByRole('button',{name:'Continue'}))
  fireEvent.click(screen.getByRole('button',{name:'Save my profile'}))
  await waitFor(()=>expect(screen.getByRole('heading',{name:'Saved profile'})).toBeVisible())
  expect(writes).toHaveLength(1)
  expect(writes[0].body).toMatchObject({display_name:'Reader',expected_profile_version:2,expected_preferences_version:4,data:{timezone:'Asia/Kolkata',motion:'reduced',spoiler_mode:true,intelligence_profile:{favorite_anime_ids:[canonical],setup_status:'completed'}}})
})
