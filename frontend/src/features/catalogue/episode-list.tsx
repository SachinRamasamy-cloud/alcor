import { useState } from 'react'
import type { EpisodePage } from '../../shared/api/client'
import { t } from '../../shared/content'
import { Pagination } from '../../shared/ui'
import { SpoilerText } from '../preferences'

export function EpisodeList({episodes}:{episodes:EpisodePage['data']}) {
  const [page,setPage]=useState(1),[extras,setExtras]=useState(false)
  const regular=episodes.filter(ep=>ep.kind!=='extra'),extra=episodes.filter(ep=>ep.kind==='extra')
  const visible=extras?extra:regular
  return <><div className="episode-toolbar"><div className="episode-types" role="group" aria-label={t('media.episodeType')}>
    <button aria-pressed={!extras} onClick={()=>{setExtras(false);setPage(1)}}>{t('media.episodes')}<span>{regular.length}</span></button>
    {extra.length>0&&<button aria-pressed={extras} onClick={()=>{setExtras(true);setPage(1)}}>{t('media.extras')}<span>{extra.length}</span></button>}
  </div></div><ol className="episode-cards">{visible.slice((page-1)*24,page*24).map(ep=><li key={ep.key} className="episode-card">
    <div className="episode-thumbnail">{ep.image_url?<img src={ep.image_url} alt="" loading="lazy" width={192} height={108} referrerPolicy="no-referrer" onError={event=>{event.currentTarget.style.visibility='hidden'}}/>:<span>{ep.label}</span>}</div>
    <div className="episode-copy"><div className="episode-kicker"><span>{extras?ep.label:t('media.episodeLabel',{number:ep.label})}</span>{ep.runtime_minutes!=null&&<span>{t('media.minutes',{count:ep.runtime_minutes})}</span>}{ep.air_date&&<time dateTime={ep.air_date}>{ep.air_date}</time>}</div><h3>{ep.title??t('media.episodeLabel',{number:ep.label})}</h3>
      {ep.synopsis&&<SpoilerText><details className="episode-overview"><summary>{t('media.overview')}</summary><p>{ep.synopsis}</p></details></SpoilerText>}
    </div>
  </li>)}</ol><Pagination page={page} totalPages={Math.max(1,Math.ceil(visible.length/24))} onChange={setPage}/></>
}
