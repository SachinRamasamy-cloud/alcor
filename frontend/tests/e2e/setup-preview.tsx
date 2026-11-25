// Explicit component fixture. This is not a production route or authentication bypass.
import { createRoot } from 'react-dom/client'
import { QueryClient,QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { LazyMotion,MotionConfig,domAnimation } from 'motion/react'
import { ProfileSetupWizard } from '../../src/widgets/profile-setup'
import type { SetupRead } from '../../src/features/profile'
import '../../src/styles.css'
const initial:SetupRead={profile:{display_name:'',version:0},preferences:{version:0,data:{timezone:'UTC',motion:'system',notifications:false,include_planned:true,spoiler_mode:false,preferred_genres:[],preferred_themes:[],preferred_studios:[],positive_rating_min:null,minimum_rating_votes:null,preferred_max_units:null,intelligence_profile:null}},favorites:[]}
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><LazyMotion features={domAnimation}><MotionConfig reducedMotion="always"><div className="shell page-body"><ProfileSetupWizard initial={initial} genres={['Action','Adventure','Fantasy','Romance','Comedy']} onSave={(draft,skip)=>{document.getElementById('result')!.textContent=JSON.stringify({name:draft.displayName,genres:draft.genres,favorites:draft.favorites.map(item=>item.id),answers:draft.answers,skip})}}/><pre id="result" hidden/></div></MotionConfig></LazyMotion></MemoryRouter></QueryClientProvider>)
