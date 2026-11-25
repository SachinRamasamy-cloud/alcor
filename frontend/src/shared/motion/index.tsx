import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import {animate,m,useAnimationControls,useReducedMotion} from 'motion/react'
import {useLocation} from 'react-router-dom'

export type FlyTargetKey='wishlist'|'library'|'collection'|'favorite'
export type FlyOrigin={button:HTMLElement;poster:HTMLElement|null;path:string}
type ConfirmedSave={scopeKey:string;target:FlyTargetKey;origin?:FlyOrigin;image?:string|null}
type Cue={target:FlyTargetKey;nonce:number;reduced:boolean}
type Flight={nonce:number;target:FlyTargetKey;image:string;left:number;top:number;width:number;height:number;dx:number;dy:number}
const eventName='alcor:confirmed-save-motion'
const tokens={flight:.6,pulse:.18,badge:1200,layer:90}
const MotionContext=createContext<{register:(key:FlyTargetKey,node:HTMLElement|null)=>void;cue:Cue|null}>({register:()=>{},cue:null})

export function captureFlyOrigin(button:HTMLElement):FlyOrigin{
  return{button,poster:button.closest('[data-media-source]')?.querySelector('[data-media-poster]')??null,path:location.pathname+location.search}
}
// Call only after an acknowledged changed server result. This stores no session
// or counter and never performs a write; the provider also checks account scope.
export function flyToTarget(detail:ConfirmedSave){window.dispatchEvent(new CustomEvent(eventName,{detail}))}

function visible(node:HTMLElement|undefined|null){
  if(!node?.isConnected)return false
  const rect=node.getBoundingClientRect()
  return rect.width>0&&rect.height>0&&rect.right>0&&rect.bottom>0&&rect.left<innerWidth&&rect.top<innerHeight&&getComputedStyle(node).visibility!=='hidden'
}

export function FlyToTargetProvider({children,scopeKey}:{children:ReactNode;scopeKey:string}){
  const location=useLocation(),systemReduced=useReducedMotion()
  const targets=useRef(new Map<FlyTargetKey,HTMLElement>())
  const nonce=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined)
  const sourceAnimation=useRef<ReturnType<typeof animate>|null>(null)
  const [flight,setFlight]=useState<Flight|null>(null),[cue,setCue]=useState<Cue|null>(null)
  const register=useCallback((key:FlyTargetKey,node:HTMLElement|null)=>{if(node)targets.current.set(key,node);else targets.current.delete(key)},[])
  const clear=useCallback(()=>{nonce.current++;clearTimeout(timer.current);sourceAnimation.current?.cancel();sourceAnimation.current=null;setFlight(null);setCue(null)},[])
  const arrive=useCallback((target:FlyTargetKey,id:number,reduced:boolean)=>{
    if(id!==nonce.current)return
    setFlight(null);setCue({target,nonce:id,reduced})
    clearTimeout(timer.current);timer.current=setTimeout(()=>setCue(null),tokens.badge)
  },[])
  useEffect(()=>{
    const celebrate=(event:Event)=>{
      const detail=(event as CustomEvent<ConfirmedSave>).detail
      if(detail.scopeKey!==scopeKey||document.visibilityState==='hidden')return
      clear() // Cap decorative concurrency at one; authoritative state is separate.
      const target=targets.current.get(detail.target)
      const reduced=Boolean(systemReduced)||document.documentElement.dataset.motion==='reduced'
      const id=++nonce.current
      if(!reduced&&detail.origin?.button.isConnected)sourceAnimation.current=animate(detail.origin.button,{scale:[1,.96,1.08,1]},{duration:tokens.pulse})
      if(!visible(target))return
      const source=detail.origin?.poster??detail.origin?.button
      const artworkReady=detail.origin?.poster instanceof HTMLImageElement&&detail.origin.poster.complete&&detail.origin.poster.naturalWidth>0
      if(reduced||!detail.image||!artworkReady||!visible(source)||detail.origin?.path!==window.location.pathname+window.location.search){arrive(detail.target,id,reduced);return}
      const start=source!.getBoundingClientRect(),end=target!.getBoundingClientRect()
      setFlight({nonce:id,target:detail.target,image:detail.image,left:start.left,top:start.top,width:start.width,height:start.height,dx:end.left+end.width/2-start.left-start.width/2,dy:end.top+end.height/2-start.top-start.height/2})
    }
    window.addEventListener(eventName,celebrate)
    return()=>window.removeEventListener(eventName,celebrate)
  },[scopeKey,systemReduced,clear,arrive])
  useEffect(()=>{
    const hidden=()=>{if(document.visibilityState==='hidden')clear()}
    window.addEventListener('resize',clear);window.addEventListener('scroll',clear,true);document.addEventListener('visibilitychange',hidden)
    return()=>{clear();window.removeEventListener('resize',clear);window.removeEventListener('scroll',clear,true);document.removeEventListener('visibilitychange',hidden)}
  },[location.key,scopeKey,clear])
  return <MotionContext.Provider value={{register,cue}}>{children}{flight&&createPortal(<m.img key={flight.nonce} className="fly-poster" data-fly-poster="" src={flight.image} alt="" aria-hidden="true" style={{position:'fixed',left:flight.left,top:flight.top,width:flight.width,height:flight.height,pointerEvents:'none',zIndex:tokens.layer,objectFit:'cover',borderRadius:8}} initial={{x:0,y:0,scale:1,opacity:.9}} animate={{x:[0,flight.dx*.5,flight.dx],y:[0,Math.min(0,flight.dy)*.6-40,flight.dy],scale:[1,.65,.06],opacity:[.9,.85,0]}} transition={{duration:tokens.flight,ease:'easeInOut'}} onAnimationComplete={()=>arrive(flight.target,flight.nonce,false)}/>,document.body)}</MotionContext.Provider>
}

export function FlyTarget({name,children}:{name:FlyTargetKey;children:ReactNode}){
  const{register,cue}=useContext(MotionContext),controls=useAnimationControls()
  const ref=useCallback((node:HTMLSpanElement|null)=>register(name,node),[name,register])
  const active=cue?.target===name?cue:null
  useEffect(()=>{if(active&&!active.reduced)void controls.start({scale:[1,1.2,1],transition:{duration:tokens.pulse}});else controls.set({scale:1});return()=>controls.stop()},[active,controls])
  return <m.span ref={ref} className="fly-target" data-fly-target={name} data-celebrating={active?'true':undefined} animate={controls}>{children}{active&&<m.span key={active.nonce} className="fly-delta" aria-hidden="true" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:active.reduced?0:tokens.pulse}}>+1</m.span>}</m.span>
}
