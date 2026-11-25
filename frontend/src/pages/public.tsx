import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Search, SlidersHorizontal, Star, ArrowUpRight } from 'lucide-react'
import { m } from 'motion/react'
import { useCatalogue, useEpisodes, useGenres, useHome, useMedia } from '../features/catalogue'
import { SaveButton } from '../features/library'
import { MediaGrid, Poster } from '../entities/media'
import type { Media } from '../shared/api/client'
import { t, formatDate, unitCount, type MessageKey } from '../shared/content'
import { Button, ErrorState, Loading, Modal } from '../shared/ui'

function PageTitle({ title }: { title: string }) {
  useEffect(() => { document.title = `${title} · ${t('brand')}` }, [title])
  return null
}
export function SnapshotNotice() { return <div className="snapshot-notice"><span className="status-dot" /> <strong>{t('catalogue.sample')}</strong><span>{t('catalogue.sampleBody')}</span></div> }
function WishlistAction({ media }: { media: Media }) { return <SaveButton media={media} compact /> }
function Section({ title, to, items }: { title: MessageKey; to: string; items: Media[] }) {
  if (!items.length) return null
  return <section className="home-section"><div className="section-heading"><h2>{t(title)}</h2><Link className="subtle-link" to={to}>{t('home.all')}<ArrowRight size={14} /></Link></div><MediaGrid items={items} actions={media => <WishlistAction media={media} />} /></section>
}
export function HomePage() {
  const home = useHome()
  if (home.isPending) return <Loading />
  if (home.error) return <ErrorState error={home.error} retry={() => { void home.refetch() }} />
  const featured = home.data.featured
  return <div className="shell"><PageTitle title={t('nav.home')} /><SnapshotNotice />
    {featured && <section className="hero"><div className="hero-copy"><p className="eyebrow"><span className="tiny-rule" />{t('home.featured')}</p><h1>{featured.title}</h1>
      {featured.original_title && <p className="hero-original">{featured.original_title}</p>}
      <div className="hero-metadata"><span><Star size={14} fill="currentColor" />{featured.score?.toFixed(2) ?? t('media.notRated')}</span><span>{featured.year ?? t('media.notAvailable')}</span><span>{featured.format}</span><span>{unitCount(featured.total_units ?? null, featured.media_type)}</span></div>
      <p className="hero-synopsis">{featured.synopsis}</p><div className="hero-genres">{featured.genres.slice(0, 3).map(g => <Link to={`/anime?genre=${encodeURIComponent(g)}`} key={g}>{g}</Link>)}</div>
      <div className="hero-actions"><Link className="button button-primary" to={`/anime/${featured.id}`}>{t('home.details')}<ArrowRight size={16} /></Link><SaveButton media={featured} /></div>
      <a className="hero-source" href={featured.source.url} target="_blank" rel="noreferrer">{featured.source.name}<ArrowUpRight size={11} /></a>
    </div><div className="hero-art"><m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }} className="hero-poster"><Poster media={featured} priority /></m.div><span className="hero-art-label">{featured.original_title ?? featured.title}</span></div></section>}
    <Section title="home.popularAnime" to="/anime" items={home.data.anime} />
    <section className="home-section genre-section"><div className="section-heading"><h2>{t('home.genres')}</h2></div><div className="genre-grid">{home.data.genres.slice(0, 8).map((genre, i) => <Link key={genre} to={`/anime?genre=${encodeURIComponent(genre)}`}><span className="genre-number">{String(i + 1).padStart(2, '0')}</span><span>{genre}</span><ArrowRight size={17} /></Link>)}</div></section>
    <Section title="home.popularManga" to="/manga" items={home.data.manga} />
  </div>
}

export function CataloguePage() {
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const type = location.pathname === '/anime' ? 'anime' : location.pathname === '/manga' ? 'manga' : null
  const titleKey = type ? `catalogue.${type}` as const : location.pathname === '/search' ? 'catalogue.search' : 'catalogue.discover'
  const requestParams = new URLSearchParams(params)
  const catalogue = useCatalogue(type ? `/${type}` : '/search', requestParams)
  const genres = useGenres()
  function change(key: string, value: string) { setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); if (key !== 'cursor') next.delete('cursor'); return next }) }
  const filters = <div className="filters-controls"><label>{t('catalogue.genre')}<select value={params.get('genre') ?? ''} onChange={e => change('genre', e.target.value)}><option value="">{t('catalogue.allGenres')}</option>{genres.data?.map(g => <option key={g} value={g}>{g}</option>)}</select></label>
    <label>{t('catalogue.format')}<select value={params.get('format') ?? ''} onChange={e => change('format', e.target.value)}><option value="">{t('catalogue.allFormats')}</option>{(type === 'manga' ? ['Manga', 'Manhwa', 'Manhua', 'Light Novel'] : type === 'anime' ? ['TV', 'Movie', 'OVA', 'ONA', 'Special'] : ['TV', 'Movie', 'Manga', 'Light Novel']).map(f => <option key={f}>{f}</option>)}</select></label>
    <label>{t('catalogue.sort')}<select value={params.get('sort') ?? 'popular'} onChange={e => change('sort', e.target.value)}>{(['popular', 'score', 'title', 'year'] as const).map(s => <option value={s} key={s}>{t(`catalogue.${s}`)}</option>)}</select></label>
    <button className="reset-button" onClick={() => setParams({})}>{t('catalogue.reset')}</button></div>
  return <div className="shell page-body"><PageTitle title={t(titleKey)} /><SnapshotNotice /><div className="page-heading"><h1>{t(titleKey)}</h1><span className="eyebrow">{t('brand')}</span></div>
    <div className="search-and-filters"><form className="search-field" onSubmit={e => { e.preventDefault(); clearTimeout(timer.current); const value = new FormData(e.currentTarget).get('query'); change('q', String(value ?? '')) }}><Search size={18} /><input key={`${location.pathname}:${params.get('q') ?? ''}`} name="query" aria-label={t('catalogue.searchPlaceholder')} placeholder={t('catalogue.searchPlaceholder')} defaultValue={params.get('q') ?? ''} onChange={e => { const value = e.target.value; clearTimeout(timer.current); timer.current = setTimeout(() => change('q', value), 400) }} /><button aria-label={t('nav.search')} className="icon-button" type="submit"><ArrowRight size={17} /></button></form>
      <Button variant="secondary" className="mobile-filter-button" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={17} />{t('catalogue.filters')}</Button></div>
    <div className="desktop-filters">{filters}</div><Modal open={filtersOpen} onOpenChange={setFiltersOpen} title={t('catalogue.filters')}>{filters}</Modal>
    {params.get('q') && <p className="results-label">{t('catalogue.resultsFor', { query: params.get('q')! })}</p>}
    {catalogue.isPending ? <Loading /> : catalogue.error ? <ErrorState error={catalogue.error} retry={() => { void catalogue.refetch() }} /> : catalogue.data.data.length ? <><p className="coverage-note">{t('catalogue.coverage')}</p><MediaGrid items={catalogue.data.data} actions={media => <WishlistAction media={media} />} /><div className="pagination">{params.has('cursor') && <Button variant="secondary" onClick={() => change('cursor', '')}>{t('catalogue.back')}</Button>}{catalogue.data.has_more && <Button variant="secondary" onClick={() => change('cursor', catalogue.data.next_cursor!)}>{t('catalogue.more')}<ArrowRight size={15} /></Button>}</div></> : <div className="state-box"><h2>{t('catalogue.noResults')}</h2><p>{t('catalogue.noResultsBody')}</p><Button variant="secondary" onClick={() => setParams({})}>{t('catalogue.reset')}</Button></div>}
  </div>
}

export function DetailsPage() {
  const { id = '' } = useParams()
  const mediaType = useLocation().pathname.startsWith('/manga') ? 'manga' : 'anime'
  const detail = useMedia(mediaType, id)
  const episodes = useEpisodes(id, mediaType === 'anime')
  if (detail.isPending) return <Loading />
  if (detail.error) return <ErrorState error={detail.error} retry={() => { void detail.refetch() }} />
  const media = detail.data
  return <div className="shell page-body"><PageTitle title={media.title} /><SnapshotNotice /><Link className="subtle-link mb-8 inline-flex" to={`/${mediaType}`}>{t('common.back')}</Link><div className="details-layout"><div className="detail-poster"><Poster media={media} priority /></div><div className="detail-main"><p className="eyebrow">{media.format} {media.year && ` / ${media.year}`}</p><h1>{media.title}</h1>{media.original_title && <p className="detail-original">{media.original_title}</p>}<div className="hero-metadata"><span><Star size={14} />{media.score ?? t('media.notRated')}</span><span>{t('media.score')}</span><span>{unitCount(media.total_units ?? null, media.media_type)}</span></div><div className="hero-actions"><SaveButton media={media} kind="library" /><SaveButton media={media} /></div><div className="hero-genres">{media.genres.map(g => <Link key={g} to={`/${mediaType}?genre=${encodeURIComponent(g)}`}>{g}</Link>)}</div><section className="synopsis-section"><h2>{t('media.synopsis')}</h2><p>{media.synopsis ?? t('media.noSynopsis')}</p></section><dl className="detail-facts"><div><dt>{t('media.status')}</dt><dd>{media.status ?? t('media.notAvailable')}</dd></div><div><dt>{t('media.studio')}</dt><dd>{media.studios?.join(', ') || t('media.notAvailable')}</dd></div></dl></div></div>
    <section className="episode-section"><h2>{t(mediaType === 'anime' ? 'media.episodes' : 'media.chapters')}</h2>{mediaType === 'anime' && episodes.isPending ? <Loading /> : mediaType === 'anime' && episodes.error ? <ErrorState error={episodes.error} retry={() => { void episodes.refetch() }} /> : mediaType === 'anime' && episodes.data?.data.length ? <ol className="episode-list">{episodes.data.data.map(ep => <li key={ep.key}><span className="tabular-nums text-muted">{ep.label}</span><span>{ep.title ?? t('media.notAvailable')}</span></li>)}</ol> : <p className="mt-4 text-sm text-muted">{t(mediaType === 'anime' ? 'media.episodesMissing' : 'media.chaptersMissing')}</p>}</section>
    <div className="source-note"><span>{t('media.source')}: {media.source.name}</span><span>{t('media.updated', { date: formatDate(media.source.retrieved_at) })}</span><a href={media.source.url} target="_blank" rel="noreferrer">{t('media.external')}<ArrowUpRight size={12} /></a></div>
  </div>
}

export function InfoPage() {
  const path = useLocation().pathname
  const key = ({ '/about': 'about', '/help': 'help', '/privacy': 'privacy', '/terms': 'terms', '/data-sources': 'sources', '/status': 'status' } as const)[path as '/about']
  if (!key) return <div className="shell page-body state-box"><PageTitle title={t('notFound.title')} /><h1>{t('notFound.title')}</h1><p>{t('notFound.body')}</p><Link className="button button-primary" to="/">{t('notFound.action')}</Link></div>
  return <div className="shell page-body prose-page"><PageTitle title={t(`info.${key}Title`)} /><h1>{t(`info.${key}Title`)}</h1><p>{t(`info.${key}`)}</p></div>
}
