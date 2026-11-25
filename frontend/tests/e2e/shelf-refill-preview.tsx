// Isolated browser fixture: synthetic context, all transport intercepted by tests.
import {createRoot} from 'react-dom/client'
import {MemoryRouter,Link,Routes,Route} from 'react-router-dom'
import {QueryClientProvider} from '@tanstack/react-query'
import {LazyMotion,MotionConfig,domAnimation} from 'motion/react'
import {AuthContext} from '../../src/shared/auth/state'
import {setTokenProvider} from '../../src/shared/api/client'
import {createAppQueryClient} from '../../src/shared/api/query-client'
import {BrowsePage} from '../../src/pages/browse'
import {HomePage} from '../../src/pages/public'
import '../../src/styles.css'
setTokenProvider(async()=>({token:'fixture-only-not-valid-jwt',userId:'fixture-a'}))
createRoot(document.getElementById('root')!).render(<MemoryRouter initialEntries={['/anime']}><QueryClientProvider client={createAppQueryClient()}><AuthContext.Provider value={{userId:'fixture-a',loading:false,requireSignIn:()=>{},signOut:async()=>{}}}><LazyMotion features={domAnimation}><MotionConfig reducedMotion="always"><nav aria-label="Fixture navigation"><Link to="/">Home fixture</Link></nav><Routes><Route path="/anime" element={<BrowsePage/>}/><Route path="/" element={<HomePage/>}/></Routes></MotionConfig></LazyMotion></AuthContext.Provider></QueryClientProvider></MemoryRouter>)
