import {useEffect,useRef,useState} from 'react'
import {useQuery} from '@tanstack/react-query'
import {Link} from 'react-router-dom'
import {ArrowRight} from 'lucide-react'
import {Poster} from '../entities/media'
import {aniShelfWindow,mediaPath} from '../shared/api/anilist'
import type {Media} from '../shared/api/client'
import {t} from '../shared/content'
import {ErrorState} from '../shared/ui'

const sections=['latest','top']

function PosterColumn({title,items,direction,pending}:{title:string;items:Media[];direction:'up'|'down';pending:boolean}){
  return <div className="intro-poster-column">
    <div className={`intro-poster-window${items.length<2?' is-static':''}`} role="group" aria-label={title}>
      {pending?<div className="intro-poster-status" role="status">{t('hero.loading')}</div>:!items.length?<div className="intro-poster-status">{t('browse.empty')}</div>:
        <div className={`intro-poster-track scroll-${direction}`}>
          {[false,true].map(duplicate=><ul key={String(duplicate)} className="intro-poster-group" aria-hidden={duplicate||undefined} inert={duplicate||undefined}>{items.map((media,index)=><li key={media.id}>
            <Link className="intro-poster-card" to={mediaPath(media)} aria-label={t('media.open',{title:media.title})} onFocus={event=>event.currentTarget.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'})}>
              <Poster media={media} priority={!duplicate&&index<2}/><span className="intro-poster-caption">{media.title}</span>
            </Link>
          </li>)}</ul>)}
        </div>}
    </div>
  </div>
}

export function HomeHero(){
  const root=useRef<HTMLElement>(null),[inView,setInView]=useState(true),[hidden,setHidden]=useState(()=>document.hidden)
  const source=useQuery({queryKey:['public','anilist','shelf-window','anime',1,'latest,top'],queryFn:({signal})=>aniShelfWindow('anime',1,signal,sections),staleTime:300000,retry:false})
  const latest=source.data?.latest.items??[],top=source.data?.top.items??[]
  const pending=source.isPending,suspended=hidden||!inView
  useEffect(()=>{
    const update=()=>setHidden(document.hidden)
    document.addEventListener('visibilitychange',update)
    return()=>document.removeEventListener('visibilitychange',update)
  },[])
  useEffect(()=>{
    if(!root.current||typeof IntersectionObserver==='undefined')return
    const observer=new IntersectionObserver(([entry])=>setInView(entry.isIntersecting))
    observer.observe(root.current)
    return()=>observer.disconnect()
  },[])
  return <section ref={root} className={`intro-hero${suspended?' is-paused':''}`} aria-labelledby="home-intro-title">
    <div className="intro-hero-copy"><img className="intro-brand-mark" src="/brand/alcor-mark.png" width={80} height={80} alt=""/><p className="intro-brand-name">{t('brand')}</p>
      <h1 id="home-intro-title">{t('hero.title')}</h1><p className="intro-hero-tagline">{t('hero.tagline')}</p><p className="intro-hero-description">{t('hero.description')}</p>
      <div className="intro-hero-actions"><Link className="button button-primary" to="/discover">{t('hero.explore')}<ArrowRight size={16}/></Link><Link className="button button-secondary" to="/library">{t('nav.library')}</Link></div>
    </div>
    <div className="intro-hero-art">
      {source.error?<ErrorState error={source.error} retry={()=>{void source.refetch()}}/>:
        <div className="intro-poster-columns"><PosterColumn title={t('browse.latest')} items={latest} direction="down" pending={pending}/><PosterColumn title={t('browse.top')} items={top} direction="up" pending={pending}/></div>}
    </div>
  </section>
}
