import { useLocation } from 'react-router-dom'
import { t } from '../content'

export type SkeletonKind = 'home' | 'catalogue' | 'details' | 'library' | 'wishlist' | 'collections' | 'collection-detail' | 'history' | 'statistics' | 'profile' | 'settings' | 'setup' | 'tracking' | 'episodes' | 'info' | 'panel'
const Block = ({ className = '' }: { className?: string }) => <div className={`skeleton-block ${className}`} />
function Lines({ count = 3 }: { count?: number }) { return <div className="skeleton-lines">{Array.from({ length: count }, (_, i) => <Block key={i} className={i === count - 1 ? 'skeleton-short' : ''} />)}</div> }
function Cards({ mobileScroll = false }: { mobileScroll?: boolean }) {
  const grid = <div className="media-grid">{Array.from({ length: 12 }, (_, i) => <div key={i} className="media-card"><Block className="skeleton-poster" /><Block className="skeleton-card-save"/><div className="card-body"><Lines count={2} /><Block className="skeleton-short"/><Block className="skeleton-short"/><div className="card-genres"><Block className="skeleton-short"/></div></div></div>)}</div>
  return mobileScroll ? <div className="mobile-media-rail">{grid}</div> : grid
}
function Detail() {
  return <div className="details-layout"><Block className="skeleton-poster detail-poster" /><div className="detail-main skeleton-detail-copy"><Block className="skeleton-short" /><Block className="skeleton-title" /><Lines count={2} /><div className="skeleton-buttons"><Block /><Block /></div><Lines count={6} /></div></div>
}

export function Loading({ variant = 'panel', page = false }: { variant?: SkeletonKind; page?: boolean }) {
  if(variant==='setup')return <div role="status" aria-busy="true" className={`${page?'shell page-body ':''}skeleton-region skeleton-setup`}><span className="sr-only">{t('common.loading')}</span><div className="setup-shell" aria-hidden="true"><header className="setup-heading"><Block className="skeleton-short"/><Block className="skeleton-title"/><Lines count={2}/></header><div className="setup-steps">{[1,2,3].map(step=><Block key={step} className="skeleton-input"/>)}</div><div className="setup-panel"><Block className="skeleton-heading"/>{[1,2,3].map(question=><div key={question} className="skeleton-setup-question"><Block className="skeleton-short"/><Block className="skeleton-input"/></div>)}<div className="setup-actions"><Block className="skeleton-input skeleton-short"/><Block className="skeleton-input skeleton-short"/></div></div></div></div>
  if(variant==='details'&&page)return <div role="status" aria-busy="true" className="details-page skeleton-region skeleton-details"><span className="sr-only">{t('common.loading')}</span><div aria-hidden="true"><Block className="detail-banner"/><div className="shell detail-body"><div className="detail-intro"><div className="detail-sidebar"><Block className="skeleton-poster detail-poster"/><div className="detail-save-actions"><Block className="skeleton-input"/><Block className="skeleton-input"/></div><div className="detail-info-panel"><Lines count={7}/></div></div><div className="detail-main skeleton-detail-copy"><Block className="skeleton-short"/><Block className="skeleton-title"/><Lines count={2}/><div className="skeleton-buttons"><Block/><Block/></div><Lines count={4}/><div className="episode-section"><Block className="skeleton-heading"/><Lines count={6}/></div></div></div></div></div></div>
  const cards = ['catalogue', 'library', 'wishlist', 'collection-detail'].includes(variant)
  const personal = ['library','wishlist','collections','collection-detail','history','statistics','profile','settings'].includes(variant)
  return <div role="status" aria-busy="true" className={`${page ? `shell page-body ${variant === 'info' ? 'prose-page ' : ''}` : ''}skeleton-region skeleton-${variant}`}>
    <span className="sr-only">{t('common.loading')}</span>
    <div aria-hidden="true">
      {page && personal && <div className="skeleton-personal-nav">{Array.from({length:7},(_,i)=><Block key={i}/>)}</div>}
      {page && variant !== 'home' && <div className="page-heading"><Block className="skeleton-title" /></div>}
      {variant === 'home' ? <><div className="skeleton-notice"><Block className="skeleton-short" /></div><section className="hero"><div className="hero-copy skeleton-hero-copy"><Block className="skeleton-short" /><Block className="skeleton-title" /><Lines count={4} /><div className="skeleton-buttons"><Block /><Block /></div></div><div className="hero-art"><Block className="hero-poster skeleton-block" /></div></section><section className="home-section"><Block className="skeleton-heading" /><Cards mobileScroll /></section><section className="home-section"><Block className="skeleton-heading" /><div className="genre-grid">{Array.from({ length: 8 }, (_, i) => <Block className="skeleton-genre" key={i} />)}</div></section><section className="home-section"><Block className="skeleton-heading" /><Cards mobileScroll /></section></>
        : variant === 'details' ? <><Detail /><div className="episode-section"><Block className="skeleton-heading" /><Lines count={5} /></div></>
        : cards ? <>{page && <div className="skeleton-toolbar"><Block /><Block /><Block /></div>}<Cards /></>
        : variant === 'collections' ? <div className="skeleton-stat-grid">{Array.from({length:6},(_,i)=><div className="skeleton-panel" key={i}><Lines count={2}/></div>)}</div>
        : variant === 'statistics' ? <><div className="skeleton-stat-grid">{Array.from({ length: 12 }, (_, i) => <Block className="skeleton-stat" key={i} />)}</div><div className="skeleton-panel"><Lines count={6} /></div></>
        : variant === 'history' || variant === 'episodes' || variant === 'tracking' ? <div className="skeleton-rows">{Array.from({ length: variant === 'history' ? 8 : 5 }, (_, i) => <div className="skeleton-row" key={i}><Block className="skeleton-avatar" /><Lines count={2} /></div>)}</div>
        : variant === 'info' ? <Lines count={8}/>
        : <div className="skeleton-form">{Array.from({ length: variant === 'settings' ? 7 : variant === 'profile' ? 2 : 3 }, (_, i) => <div className="skeleton-field" key={i}><Block className="skeleton-short" /><Block className="skeleton-input" /></div>)}<div className="skeleton-buttons"><Block /><Block /></div></div>}
    </div>
  </div>
}

export function RouteSkeleton() {
  const path = useLocation().pathname
  const segment = path.split('/')[1]
  const variant: SkeletonKind = path === '/' ? 'home' : /^(anime|manga)$/.test(segment) && path.split('/').length > 2 ? 'details' : ['anime', 'manga', 'discover', 'search'].includes(segment) ? 'catalogue' : segment === 'collections' && path.split('/').length > 2 ? 'collection-detail' : ['library', 'wishlist', 'collections', 'history', 'statistics', 'profile', 'settings','setup'].includes(segment) ? segment as SkeletonKind : segment === 'auth' ? 'profile' : 'info'
  return <Loading variant={variant} page />
}
