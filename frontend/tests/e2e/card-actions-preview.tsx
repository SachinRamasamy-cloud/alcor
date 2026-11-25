// Explicit browser verification surface. Synthetic auth is isolated to this file;
// Playwright intercepts every API call. No real account or private write is used.
import {createRoot} from 'react-dom/client'
import {useLayoutEffect,useState} from 'react'
import {MemoryRouter} from 'react-router-dom'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {LazyMotion,MotionConfig,domAnimation} from 'motion/react'
import {AuthContext} from '../../src/shared/auth/state'
import {setTokenProvider} from '../../src/shared/api/client'
import {FeedbackProvider} from '../../src/shared/feedback'
import {CardActions,CardStatus} from '../../src/features/library/actions'
import {useDiscoveryVisibility} from '../../src/features/catalogue/visibility'
import {MediaGrid} from '../../src/entities/media'
import {fromAniList} from '../../src/shared/api/anilist'
import '../../src/styles.css'
const titles=[1,2].map(id=>({...fromAniList({id:700+id,type:'ANIME',title:{english:`Card story ${id}`},episodes:12,format:'TV',genres:['Fantasy'],status:'FINISHED',coverImage:{large:`https://s4.anilist.co/test/${id}.svg`}}),id:`d98b77b7-5378-4e2e-9c96-18737b47f50${id}`}))
setTokenProvider(async()=>({token:'fixture-only-not-valid-jwt',userId:'fixture-a'}))
function Scene(){
  const [mode,setMode]=useState<'new_to_me'|'all'>('new_to_me')
  const visibility=useDiscoveryVisibility(titles,mode)
  return <div className="shell page-body"><h1>Card action fixture</h1><button className="button button-secondary" onClick={()=>setMode(mode==='all'?'new_to_me':'all')}>{mode==='all'?'New to me':'Show all'}</button>
    <section className="home-section"><div className="section-heading"><h2>Discovery titles</h2></div><MediaGrid items={visibility.items} actions={media=><CardActions media={media}/>} context={media=><CardStatus media={media}/>} /></section>
  </div>
}
function Preview(){
  const [userId,setUserId]=useState('fixture-a')
  useLayoutEffect(()=>{setTokenProvider(async()=>({token:'fixture-only-not-valid-jwt',userId}))},[userId])
  return <AuthContext.Provider value={{userId,loading:false,requireSignIn:()=>{},signOut:async()=>{}}}><button className="button button-secondary" onClick={()=>setUserId('fixture-b')}>Switch fixture account</button><Scene/></AuthContext.Provider>
}
createRoot(document.getElementById('root')!).render(<MemoryRouter><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><LazyMotion features={domAnimation}><MotionConfig reducedMotion="always"><FeedbackProvider><Preview/></FeedbackProvider></MotionConfig></LazyMotion></QueryClientProvider></MemoryRouter>)
