import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { t } from '../../shared/content'

export function ExpandableSynopsis({text}:{text:string}) {
  const [expanded,setExpanded]=useState(false),[overflow,setOverflow]=useState(false),[pinned,setPinned]=useState(false)
  const paragraph=useRef<HTMLParagraphElement>(null),suppressed=useRef(false)
  const id=useId()
  useEffect(()=>{
    const node=paragraph.current
    if(!node)return
    const measure=()=>{if(!expanded)setOverflow(node.scrollHeight>node.clientHeight+1)}
    const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure)
    observer?.observe(node)
    const timer=setTimeout(measure,0)
    return()=>{clearTimeout(timer);observer?.disconnect()}
  },[expanded,text])
  return <div className={`expandable-synopsis${expanded?' expanded':''}`} onPointerEnter={event=>{if(event.pointerType==='mouse'&&overflow&&!suppressed.current&&window.matchMedia('(hover: hover) and (min-width: 768px)').matches)setExpanded(true)}} onPointerLeave={()=>{suppressed.current=false;if(!pinned)setExpanded(false)}}>
    <p id={id} ref={paragraph} className="synopsis-copy">{text}</p>
    {overflow&&<button className="synopsis-toggle" aria-expanded={expanded} aria-controls={id} onClick={()=>{if(expanded){setExpanded(false);setPinned(false);suppressed.current=true}else{setExpanded(true);setPinned(true)}}}>{t(expanded?'media.showLess':'media.readMore')}{expanded?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button>}
  </div>
}
