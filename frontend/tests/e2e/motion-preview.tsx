// Explicit motion fixture. Controls simulate server outcomes, not an auth bypass.
// No private endpoint is called and no record is created.
import {createRoot} from 'react-dom/client'
import {useState} from 'react'
import {Link,MemoryRouter,useNavigate} from 'react-router-dom'
import {LazyMotion,domAnimation} from 'motion/react'
import {Bookmark} from 'lucide-react'
import {MediaCard} from '../../src/entities/media'
import {fromAniList} from '../../src/shared/api/anilist'
import {FlyTarget,FlyToTargetProvider,captureFlyOrigin,flyToTarget,type FlyOrigin} from '../../src/shared/motion'
import '../../src/styles.css'
const media=fromAniList({id:1,type:'ANIME',title:{english:'Motion title'},coverImage:{large:'https://s4.anilist.co/test/1.svg'},format:'TV',episodes:12,seasonYear:2024,genres:['Action']})
function Scene({scope,onSwitch}:{scope:string;onSwitch:()=>void}){
  const[origin,setOrigin]=useState<FlyOrigin>(),[count,setCount]=useState(2),[hidden,setHidden]=useState(false),[cover,setCover]=useState(true),[source,setSource]=useState(true)
  const navigate=useNavigate()
  const confirm=()=>{setCount(value=>value+1);flyToTarget({scopeKey:scope,target:'wishlist',origin,image:cover?media.image_url:null})}
  return <><header className="site-header"><div className="shell header-inner"><strong>ALCOR</strong><Link aria-label="Wishlist" to="/wishlist" className="icon-button header-wishlist" style={{marginLeft:'auto',visibility:hidden?'hidden':'visible'}}><FlyTarget name="wishlist"><Bookmark size={18}/><span className="wishlist-count" aria-hidden="true">{count}</span></FlyTarget></Link></div></header>
    <div className="shell page-body"><h1 style={{marginBlock:28}}>Confirmed save fixture</h1><div className="personal-dialog-actions" style={{marginBottom:24}}><button onClick={confirm}>Confirm save</button><button onClick={()=>setOrigin(undefined)}>No change</button><button onClick={()=>setOrigin(undefined)}>Fail save</button><button onClick={()=>setHidden(!hidden)}>Toggle target</button><button onClick={()=>setCover(!cover)}>Toggle artwork</button><button onClick={()=>setSource(false)}>Unmount source</button><button onClick={()=>navigate('/next')}>Navigate</button><button onClick={onSwitch}>Switch account</button></div>
    {source&&<div style={{maxWidth:210,marginTop:60}}><MediaCard media={media} actions={<button className="card-save" aria-label="Add Motion title to wishlist" onClick={event=>setOrigin(captureFlyOrigin(event.currentTarget))}><Bookmark size={18}/></button>}/></div>}
    </div></>
}
function Preview(){const[scope,setScope]=useState('fixture');return <FlyToTargetProvider scopeKey={scope}><Scene scope={scope} onSwitch={()=>setScope('other')}/></FlyToTargetProvider>}
createRoot(document.getElementById('root')!).render(<MemoryRouter><LazyMotion features={domAnimation}><Preview/></LazyMotion></MemoryRouter>)
