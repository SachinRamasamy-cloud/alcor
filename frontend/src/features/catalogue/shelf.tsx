import {useRef,type ReactNode} from 'react'
import {Link} from 'react-router-dom'
import {ArrowLeft,ArrowRight} from 'lucide-react'
import {MediaGrid} from '../../entities/media'
import {CardActions,CardStatus} from '../library/actions'
import type {Media} from '../../shared/api/client'
import {t} from '../../shared/content'
import type {FeedbackContext} from '../recommendations/feedback'

export function BrowseShelf({title,items,to,description,emptyMessage,context,recommendationContext}:{title:string;items:Media[];to:string;description?:string;emptyMessage?:string;context?:(media:Media)=>ReactNode;recommendationContext?:FeedbackContext}){
  const rail=useRef<HTMLDivElement>(null)
  function scroll(direction:number){const node=rail.current;if(node)node.scrollBy({left:direction*node.clientWidth*.85,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
  return <section className="home-section browse-shelf"><div className="section-heading"><div><h2>{title}</h2>{description&&<p className="browse-description">{description}</p>}</div><div className="shelf-tools"><div className="shelf-arrows"><button className="icon-button" aria-label={t('browse.scrollBack',{title})} onClick={()=>scroll(-1)}><ArrowLeft size={16}/></button><button className="icon-button" aria-label={t('browse.scrollForward',{title})} onClick={()=>scroll(1)}><ArrowRight size={16}/></button></div><Link className="subtle-link" to={to}>{t('home.all')}<ArrowRight size={14}/></Link></div></div>{items.length?<div ref={rail} className="browse-rail" role="region" aria-label={title} tabIndex={0}><MediaGrid items={items} actions={media=><CardActions media={media} recommendationContext={recommendationContext}/>} context={context??(media=><CardStatus media={media}/>)} /></div>:<p className="browse-description">{emptyMessage??t('browse.empty')}</p>}</section>
}
