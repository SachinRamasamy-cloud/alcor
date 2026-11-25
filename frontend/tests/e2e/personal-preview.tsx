// Explicit presentation fixture. No account session or private API write.
import {createRoot} from 'react-dom/client'
import {useState} from 'react'
import {MemoryRouter} from 'react-router-dom'
import {LazyMotion,MotionConfig,domAnimation} from 'motion/react'
import {LibraryGrid} from '../../src/pages/account'
import type {Entry} from '../../src/features/library'
import {PersonalNav} from '../../src/widgets/personal-nav'
import {Modal} from '../../src/shared/ui'
import {fromAniList} from '../../src/shared/api/anilist'
import '../../src/styles.css'
const rows=[1,2].map((id)=>({media:fromAniList({id,type:'ANIME',title:{english:`Personal title ${id}`},coverImage:{large:`https://s4.anilist.co/test/${id}.svg`},genres:['Action','Adventure'],episodes:12,format:'TV',seasonYear:2024}),status:id===1?'in_progress':'planned',version:1} as Entry))
function Preview(){const[entry,setEntry]=useState<Entry|null>(null);return <div className="shell page-body personal-page"><PersonalNav/><div className="page-heading personal-heading"><div className="personal-title"><h1>My library</h1><span className="personal-count">2</span></div></div><LibraryGrid entries={rows} onManage={setEntry}/><Modal open={Boolean(entry)} onOpenChange={open=>{if(!open)setEntry(null)}} title={entry?.media.title??'Manage title'}><p>Manage this title.</p></Modal></div>}
createRoot(document.getElementById('root')!).render(<MemoryRouter initialEntries={['/library']}><LazyMotion features={domAnimation}><MotionConfig reducedMotion="always"><Preview/></MotionConfig></LazyMotion></MemoryRouter>)
