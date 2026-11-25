// Explicit component fixture; no signed-in account or production auth bypass.
import { createRoot } from 'react-dom/client'
import { QueryClient,QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { LazyMotion,MotionConfig,domAnimation } from 'motion/react'
import { useHome } from '../../src/features/catalogue'
import { defaultAnswers,type SetupRead } from '../../src/features/profile'
import { tasteItems } from '../../src/features/discovery/taste'
import { DashboardHeader,DashboardShelf,TasteSummary } from '../../src/pages/dashboard'
import { Loading } from '../../src/shared/ui'
import '../../src/styles.css'
function Preview(){
  const home=useHome()
  if(home.isPending||!home.data)return <Loading variant="dashboard" page/>
  const first=home.data.anime[0]
  const setup:SetupRead={profile:{display_name:'Reader',version:1},preferences:{version:1,data:{timezone:'UTC',motion:'system',notifications:false,include_planned:true,spoiler_mode:false,preferred_genres:first.genres.slice(0,1),preferred_themes:[],preferred_studios:[],positive_rating_min:null,minimum_rating_votes:null,preferred_max_units:null,intelligence_profile:{...defaultAnswers(),story_traits:['world_building'],favorite_anime_ids:[first.id]}}},favorites:[first]}
  return <div className="shell page-body dashboard-page"><DashboardHeader name="Reader" needsSetup={false}/><DashboardShelf title="You may like" description={`From your selected genres: ${setup.preferences.data.preferred_genres!.join(', ')}.`} items={tasteItems(home.data.anime,setup.preferences.data,setup.favorites)} to="/anime"/><DashboardShelf title="Your favorites" items={setup.favorites}/><TasteSummary setup={setup}/><DashboardShelf title="Wishlist" items={home.data.anime.slice(6,12)} to="/wishlist" showSave={false}/></div>
}
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><LazyMotion features={domAnimation}><MotionConfig reducedMotion="always"><Preview/></MotionConfig></LazyMotion></MemoryRouter></QueryClientProvider>)
