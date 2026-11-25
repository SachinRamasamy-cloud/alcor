// Synthetic account and intercepted transport only; no runtime auth override.
import {createRoot} from 'react-dom/client'
import {MemoryRouter,Routes,Route} from 'react-router-dom'
import {QueryClientProvider} from '@tanstack/react-query'
import {LazyMotion,MotionConfig,domAnimation} from 'motion/react'
import {AuthContext} from '../../src/shared/auth/state'
import {setTokenProvider} from '../../src/shared/api/client'
import {createAppQueryClient} from '../../src/shared/api/query-client'
import {PersonalShelves} from '../../src/features/recommendations/views'
import {DismissedRecommendationsPage} from '../../src/pages/dismissed-recommendations'
import '../../src/styles.css'
setTokenProvider(async()=>({token:'fixture-only-not-valid-jwt',userId:'fixture-a'}))
createRoot(document.getElementById('root')!).render(<MemoryRouter><QueryClientProvider client={createAppQueryClient()}><AuthContext.Provider value={{userId:'fixture-a',loading:false,requireSignIn:()=>{},signOut:async()=>{}}}><LazyMotion features={domAnimation}><MotionConfig reducedMotion="always"><Routes><Route path="/" element={<div className="shell page-body"><h1>Recommendation feedback fixture</h1><PersonalShelves type="anime" mode="all"/></div>}/><Route path="/recommendations/dismissed" element={<DismissedRecommendationsPage/>}/></Routes></MotionConfig></LazyMotion></AuthContext.Provider></QueryClientProvider></MemoryRouter>)
