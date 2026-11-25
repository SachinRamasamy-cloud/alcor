import { Link } from 'react-router-dom'
import { m } from 'motion/react'
import { Star } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Media } from '../../shared/api/client'
import { mediaPath } from '../../shared/api/anilist'
import { t, unitCount } from '../../shared/content'

export function Poster({ media, priority = false }: { media: Media; priority?: boolean }) {
  return media.image_url ? <img src={media.image_url} alt="" width="300" height="450" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} className="poster" onError={event => { event.currentTarget.style.visibility = 'hidden' }} /> : <div className="poster poster-empty" role="img" aria-label={t('media.noImage')} />
}
export function MediaCard({ media, actions }: { media: Media; actions?: ReactNode }) {
  return <article className="media-card"><m.div className="poster-wrap" whileHover={{ scale: 1.02 }} transition={{ duration: .16 }}>
    <Link to={mediaPath(media)} aria-label={t('media.open', { title: media.title })}><Poster media={media} /></Link>
    {actions && <div className="card-actions">{actions}</div>}
    {media.score !== null && <span className="score-pill" aria-label={`${media.source.name} ${t('media.sourceScore')}: ${media.score}`}><Star size={11} fill="currentColor" />{media.score?.toFixed(1)}</span>}
  </m.div><Link to={mediaPath(media)} className="card-title" title={media.title}>{media.title}</Link>
    <p className="card-meta">{[media.format, media.year].filter(Boolean).join(' · ') || unitCount(media.total_units ?? null, media.media_type)}</p>
  </article>
}
export function MediaGrid({ items, actions }: { items: Media[]; actions?: (media: Media) => ReactNode }) {
  return <div className="media-grid">{items.map(media => <MediaCard key={media.id} media={media} actions={actions?.(media)} />)}</div>
}
