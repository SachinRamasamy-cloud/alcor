import { useId, useRef, useState } from 'react'
import type { EpisodePage } from '../../shared/api/client'
import { t } from '../../shared/content'
import { Button, Pagination } from '../../shared/ui'
import { SpoilerText } from '../preferences'

export function EpisodeList({episodes}:{episodes:EpisodePage['data']}) {
  const [page,setPage]=useState(1),[extras,setExtras]=useState(false),[expanded,setExpanded]=useState(false)
  const listId=useId(),preview=useRef<HTMLDivElement>(null)
  const regular=episodes.filter(ep=>ep.kind!=='extra'),extra=episodes.filter(ep=>ep.kind==='extra')
  const visible=extras?extra:regular
  const pageEpisodes=visible.slice((page-1)*24,page*24),items=expanded?pageEpisodes:pageEpisodes.slice(0,6)
  function selectExtras(value:boolean){setExtras(value);setPage(1);setExpanded(false)}
  function toggle(){if(expanded){setPage(1);preview.current?.closest('section')?.scrollIntoView({block:'start',behavior:'instant'})}setExpanded(value=>!value)}
  return <><div className="episode-toolbar"><div className="episode-types" role="group" aria-label={t('media.episodeType')}>
    <button aria-pressed={!extras} onClick={()=>selectExtras(false)}>{t('media.episodes')}<span>{regular.length}</span></button>
    {extra.length>0&&<button aria-pressed={extras} onClick={()=>selectExtras(true)}>{t('media.extras')}<span>{extra.length}</span></button>}
  </div></div><div ref={preview} className={`episode-preview${expanded?'':' is-collapsed'}${visible.length>6?' has-more':' mobile-more'}`}><ol id={listId} className="episode-cards">{items.map(ep=><li key={ep.key} className="episode-card">
    <div className="episode-thumbnail">{ep.image_url?<img src={ep.image_url} alt="" loading="lazy" width={192} height={108} referrerPolicy="no-referrer" onError={event=>{event.currentTarget.style.visibility='hidden'}}/>:<span>{ep.label}</span>}</div>
    <div className="episode-copy"><div className="episode-kicker"><span>{extras?ep.label:t('media.episodeLabel',{number:ep.label})}</span>{ep.runtime_minutes!=null&&<span>{t('media.minutes',{count:ep.runtime_minutes})}</span>}{ep.air_date&&<time dateTime={ep.air_date}>{ep.air_date}</time>}</div><h3>{ep.title??t('media.episodeLabel',{number:ep.label})}</h3>
      {ep.synopsis&&<SpoilerText><details className="episode-overview"><summary>{t('media.overview')}</summary><p>{ep.synopsis}</p></details></SpoilerText>}
    </div>
  </li>)}</ol></div>{visible.length>3&&<div className={`episode-preview-actions${!expanded&&visible.length<=6?' mobile-only':''}`}><Button variant="secondary" aria-expanded={expanded} aria-controls={listId} onClick={toggle}>{t(expanded?'media.showFewerEpisodes':'media.showMoreEpisodes')}</Button></div>}
  {expanded&&<Pagination page={page} totalPages={Math.max(1,Math.ceil(visible.length/24))} onChange={setPage}/>}</>
}
