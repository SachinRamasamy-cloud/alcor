// Isolated synthetic account fixture. Tests intercept every external transport.
import {createRoot} from 'react-dom/client'
import {MemoryRouter,Routes,Route} from 'react-router-dom'
import {QueryClientProvider} from '@tanstack/react-query'
import {LazyMotion,MotionConfig,domAnimation} from 'motion/react'
import {AuthContext} from '../../src/shared/auth/state'
import {setTokenProvider} from '../../src/shared/api/client'
import {createAppQueryClient} from '../../src/shared/api/query-client'
import {BrowsePage} from '../../src/pages/browse'
import {RecommendationsPage} from '../../src/pages/recommendations'
import '../../src/styles.css'
setTokenProvider(async()=>({token:'fixture-only-not-valid-jwt',userId:'fixture-a'}))
createRoot(document.getElementById('root')!).render(<MemoryRouter initialEntries={['/anime']}><QueryClientProvider client={createAppQueryClient()}><AuthContext.Provider value={{userId:'fixture-a',loading:false,requireSignIn:()=>{},signOut:async()=>{}}}><LazyMotion features={domAnimation}><MotionConfig reducedMotion="always"><Routes><Route path="/anime" element={<BrowsePage/>}/><Route path="/recommendations" element={<RecommendationsPage/>}/></Routes></MotionConfig></LazyMotion></AuthContext.Provider></QueryClientProvider></MemoryRouter>)
