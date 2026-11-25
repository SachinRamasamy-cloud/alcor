// Isolated presentation/integration fixture with intercepted transport only.
import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {QueryClientProvider} from '@tanstack/react-query'
import {LazyMotion,MotionConfig,domAnimation} from 'motion/react'
import {AuthContext} from '../../src/shared/auth/state'
import {setTokenProvider} from '../../src/shared/api/client'
import {createAppQueryClient} from '../../src/shared/api/query-client'
import {LibraryPage} from '../../src/pages/account'
import '../../src/styles.css'
setTokenProvider(async()=>({token:'fixture-only-not-valid-jwt',userId:'fixture-a'}))
createRoot(document.getElementById('root')!).render(<MemoryRouter initialEntries={['/library']}><QueryClientProvider client={createAppQueryClient()}><AuthContext.Provider value={{userId:'fixture-a',loading:false,requireSignIn:()=>{},signOut:async()=>{}}}><LazyMotion features={domAnimation}><MotionConfig reducedMotion="always"><LibraryPage/></MotionConfig></LazyMotion></AuthContext.Provider></QueryClientProvider></MemoryRouter>)
