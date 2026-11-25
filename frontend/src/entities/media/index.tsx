import { Link } from 'react-router-dom'
import { m } from 'motion/react'
import { ImageOff, Star } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import type { Media } from '../../shared/api/client'
import { mediaPath } from '../../shared/api/anilist'
import { t, unitCount } from '../../shared/content'

export function Poster({ media, priority = false }: { media: Media; priority?: boolean }) {
  const [failedSource,setFailedSource]=useState<string|null>(null)
  return media.image_url && failedSource!==media.image_url
    ? <img data-media-poster="" src={media.image_url} alt="" width="300" height="450" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} className="poster" onError={()=>setFailedSource(media.image_url!)} />
    : <div className="poster poster-empty" role="img" aria-label={t('media.noImage')}><ImageOff size={26} aria-hidden="true"/><span>{t('media.noImage')}</span></div>
}
export function MediaCard({ media, actions, context }: { media: Media; actions?: ReactNode; context?:ReactNode }) {
  const titleId=useId()
  return <article data-media-source="" className="media-card" aria-labelledby={titleId}><m.div className="poster-wrap" whileHover={{ scale: 1.02 }} transition={{ duration: .16 }}>
    <Link to={mediaPath(media)} aria-label={t('media.open', { title: media.title })}><Poster media={media} /></Link>
    {media.score != null && <span className="score-pill" aria-label={`${t('media.sourceScore')}: ${media.score}`}><Star size={12} fill="currentColor" />{media.score.toFixed(1)}</span>}
  </m.div><div className="card-body"><Link id={titleId} to={mediaPath(media)} className="card-title" title={media.title}>{media.title}</Link>
    <p className="card-meta">{[media.format, media.year].filter(Boolean).join(' · ') || t('media.notAvailable')}</p>
    <p className="card-unit-count">{unitCount(media.total_units??null,media.media_type)}</p>
    <div className="card-genres">{(media.genres??[]).slice(0,2).map(genre=><span key={genre} title={genre}>{genre}</span>)}</div>
    {context}
  </div>
    {actions&&<div className="card-actions">{actions}</div>}
  </article>
}
export function MediaGrid({ items, actions,context }: { items: Media[]; actions?: (media: Media) => ReactNode;context?:(media:Media)=>ReactNode }) {
  return <div className="media-grid">{items.map(media => <MediaCard key={media.id} media={media} actions={actions?.(media)} context={context?.(media)}/>)}</div>
}
