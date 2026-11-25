import { cleanup,fireEvent,render,screen,within } from '@testing-library/react'
import { afterEach,expect,it,vi } from 'vitest'
import { ProfileSetupWizard } from './profile-setup'
import { fromAniList } from '../shared/api/anilist'
import type { SetupRead } from '../features/profile'
const media=fromAniList({id:1,type:'ANIME',title:{english:'A favorite story'},genres:['Fantasy'],episodes:12})
vi.mock('../features/catalogue',async original=>({...await original<typeof import('../features/catalogue')>(),useCatalogue:()=>({data:{data:[media]},isPending:false,isFetching:false,error:null})}))
export const initial:SetupRead={profile:{display_name:'',version:0},preferences:{version:0,data:{timezone:'Asia/Kolkata',motion:'reduced',notifications:false,include_planned:true,discovery_mode:'new_to_me',spoiler_mode:false,preferred_genres:[],preferred_themes:[],preferred_studios:[],positive_rating_min:null,minimum_rating_votes:null,preferred_max_units:null,intelligence_profile:null}},favorites:[]}
afterEach(cleanup)
it('asks nine optional questions in three steps and preserves explicit likes and exclusions',()=>{
  const save=vi.fn(),questions:string[]=[]
  render(<ProfileSetupWizard initial={initial} genres={['Fantasy','Romance']} onSave={save}/>)
  questions.push(...[...document.querySelectorAll('legend')].map(node=>node.textContent!))
  expect(questions).toHaveLength(3)
  fireEvent.change(screen.getByLabelText('Display name'),{target:{value:'Reader'}})
  fireEvent.change(screen.getByLabelText('Year you started watching'),{target:{value:'2020'}})
  fireEvent.click(screen.getByRole('button',{name:'Continue'}))
  questions.push(...[...document.querySelectorAll('legend')].map(node=>node.textContent!))
  fireEvent.click(screen.getByRole('button',{name:'A favorite story'}))
  fireEvent.click(within(screen.getByRole('group',{name:/5\./})).getByRole('button',{name:'Romance'}))
  fireEvent.click(screen.getByRole('button',{name:'World building'}))
  fireEvent.click(screen.getByRole('button',{name:'Continue'}))
  questions.push(...[...document.querySelectorAll('legend')].map(node=>node.textContent!))
  expect(questions).toHaveLength(9)
  fireEvent.click(screen.getByRole('button',{name:'Strictly exclude'}))
  fireEvent.click(screen.getByRole('button',{name:'Romance'}))
  fireEvent.change(screen.getByLabelText('Maximum anime episodes'),{target:{value:'24'}})
  fireEvent.click(screen.getByRole('button',{name:'Save my profile'}))
  expect(save).toHaveBeenCalledWith(expect.objectContaining({displayName:'Reader',genres:['Romance'],favorites:[media],answers:expect.objectContaining({started_year:2020,story_traits:['world_building'],excluded_genres:['Romance'],disliked_genres:[],max_anime_episodes:24})}),false)
})
it('allows skipping at the first step without filling questions',()=>{
  const save=vi.fn()
  render(<ProfileSetupWizard initial={initial} genres={[]} onSave={save}/>)
  fireEvent.click(screen.getByRole('button',{name:'Skip for now'}))
  expect(save).toHaveBeenCalledWith(expect.anything(),true)
})
