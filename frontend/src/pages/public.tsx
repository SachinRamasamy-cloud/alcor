import {SelectMenu} from '../shared/ui/select-menu'
import { DiscoveryControls } from '../features/discovery'
import { SpoilerText } from '../features/preferences'
import { useEffect } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Star, ArrowUpRight } from 'lucide-react'
import { m } from 'motion/react'
import { useCatalogue, useEpisodes, useGenres, useHome, useMedia, SearchField } from '../features/catalogue'
import { ContinueSections } from '../widgets/continue'
import { EpisodeList } from '../features/catalogue/episode-list'
import { ExpandableSynopsis } from '../features/catalogue/synopsis'
import { PersonalMedia } from '../features/catalogue/personal'
import { mediaPath } from '../shared/api/anilist'
import { SaveButton } from '../features/library'
import { MediaGrid, Poster } from '../entities/media'
import type { Media } from '../shared/api/client'
import { t, formatDate, unitCount, type MessageKey } from '../shared/content'
import { useCataloguePagination } from '../features/catalogue/pagination'
import { Button, ErrorState, Loading, Pagination } from '../shared/ui'

function PageTitle({ title }: { title: string }) {
  useEffect(() => { document.title = `${title} · ${t('brand')}` }, [title])
  return null
}

function WishlistAction({ media }: { media: Media }) { return <SaveButton media={media} compact /> }
function Section({ title, to, items }: { title: MessageKey; to: string; items: Media[] }) {
  if (!items.length) return null
  return <section className="home-section"><div className="section-heading"><h2>{t(title)}</h2><Link className="subtle-link" to={to}>{t('home.all')}<ArrowRight size={14} /></Link></div><div className="mobile-media-rail" role="region" aria-label={t(title)} tabIndex={0}><MediaGrid items={items} actions={media => <WishlistAction media={media} />} /></div></section>
}
function filterLabel(key:string,value:string):string {
  if(key==='has_score')return t('discovery.ratedOnly')
  if(key==='has_image')return t('discovery.coversOnly')
  if(key==='memory')return t('discovery.memory')
  if(key==='genre_match')return t(value==='any'?'discovery.matchAny':'discovery.matchAll')
  if(key==='mode')return t(value==='hide_watched'?'discovery.hideWatched':value==='new_to_me'?'discovery.newToMe':'discovery.all')
  if(key==='sort'&&['popular','score','title','year'].includes(value))return t(`catalogue.${value}` as MessageKey)
  if(key==='status'&&['FINISHED','RELEASING','NOT_YET_RELEASED','HIATUS','CANCELLED'].includes(value))return t(`release.${value}` as MessageKey)
  const labels:Record<string,MessageKey>={year:'catalogue.year',year_from:'discovery.yearFrom',year_to:'discovery.yearTo',studio:'media.studio',score_min:'discovery.scoreMin',units_max:'discovery.unitsMax'}
  return labels[key]?`${t(labels[key])}: ${value}`:value.replaceAll('_',' ')
}
export function HomePage() {
  const home = useHome()
  if (home.isPending) return <Loading variant="home" page />
  if (home.error) return <ErrorState error={home.error} retry={() => { void home.refetch() }} />
  const featured = home.data.featured
  return <div className="shell"><PageTitle title={t('nav.home')} />
    {featured && <section data-media-source="" className="hero"><div className="hero-copy"><p className="eyebrow"><span className="tiny-rule" />{t('home.featured')}</p><h1>{featured.title}</h1>
      {featured.original_title && <p className="hero-original">{featured.original_title}</p>}
      <div className="hero-metadata"><span><Star size={14} fill="currentColor" />{featured.score?.toFixed(2) ?? t('media.notRated')}</span><span>{featured.year ?? t('media.notAvailable')}</span><span>{featured.format}</span><span>{unitCount(featured.total_units ?? null, featured.media_type)}</span></div>
      <SpoilerText><p className="hero-synopsis">{featured.synopsis}</p></SpoilerText><div className="hero-genres">{featured.genres.slice(0, 3).map(g => <Link to={`/anime?genre=${encodeURIComponent(g)}`} key={g}>{g}</Link>)}</div>
      <div className="hero-actions"><Link className="button button-primary" to={mediaPath(featured)}>{t('home.details')}<ArrowRight size={16} /></Link><SaveButton media={featured} /></div>
      <a className="hero-source" href={featured.source.url} target="_blank" rel="noreferrer">{featured.source.name}<ArrowUpRight size={11} /></a>
    </div><div className="hero-art"><m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }} className="hero-poster"><Poster media={featured} priority /></m.div><span className="hero-art-label">{featured.original_title ?? featured.title}</span></div></section>}
    <ContinueSections />
    <Section title="home.popularAnime" to="/anime" items={home.data.anime} />
    <section className="home-section genre-section"><div className="section-heading"><h2>{t('home.genres')}</h2></div><div className="genre-grid">{home.data.genres.slice(0, 8).map((genre, i) => <Link key={genre} to={`/anime?genre=${encodeURIComponent(genre)}`}><span className="genre-number">{String(i + 1).padStart(2, '0')}</span><span>{genre}</span><ArrowRight size={17} /></Link>)}</div></section>
    <Section title="home.popularManga" to="/manga" items={home.data.manga} />
  </div>
}

export function CataloguePage() {
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const type = location.pathname === '/anime' ? 'anime' : location.pathname === '/manga' ? 'manga' : null
  const titleKey = type ? `catalogue.${type}` as const : location.pathname === '/search' ? 'catalogue.search' : 'catalogue.discover'
  const requestParams = new URLSearchParams(params)
  const catalogue = useCatalogue(type ? `/${type}` : '/search', requestParams)
  const genres = useGenres()
  const pagination = useCataloguePagination(catalogue.data?.next_cursor, catalogue.data?.has_more ?? false)
  function change(key: string, value: string) { setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); if (key !== 'cursor') {next.delete('cursor');next.delete('page')}; return next }) }
  function select(key:string,values:string[]){setParams(previous=>{const next=new URLSearchParams(previous);next.delete(key);if(key==='include_genres')next.delete('genre');values.forEach(value=>next.append(key,value));next.delete('page');next.delete('cursor');return next})}
  const options=(values:string[])=>values.map(value=>({value,label:value}))
  const filters = <div className="filters-controls">
    <SelectMenu label={t('catalogue.genre')} placeholder={t('catalogue.allGenres')} options={options(genres.data??[])} values={[...params.getAll('include_genres'),...params.getAll('genre')]} onChange={values=>select('include_genres',values)}/>
    <SelectMenu label={t('catalogue.format')} placeholder={t('catalogue.allFormats')} options={options(type==='manga'?['Manga','Manhwa','Manhua','Light Novel']:type==='anime'?['TV','Movie','OVA','ONA','Special']:['TV','Movie','Manga','Manhwa','Manhua','Light Novel'])} values={params.getAll('format')} onChange={values=>select('format',values)}/>
    <SelectMenu label={t('catalogue.year')} placeholder={t('catalogue.anyYear')} options={options(Array.from({length:new Date().getFullYear()-1898},(_,i)=>String(new Date().getFullYear()+1-i)))} values={params.getAll('year')} onChange={values=>select('year',values)}/>
    <SelectMenu label={t('discovery.season')} placeholder={t('discovery.anySeason')} options={(['winter','spring','summer','fall'] as const).map(value=>({value,label:t(`discovery.${value}`)}))} values={params.getAll('season')} onChange={values=>select('season',values)}/>
    <SelectMenu label={t('media.status')} placeholder={t('catalogue.anyStatus')} options={(['FINISHED','RELEASING','NOT_YET_RELEASED','HIATUS','CANCELLED'] as const).map(value=>({value,label:t(`release.${value}`)}))} values={params.getAll('status')} onChange={values=>select('status',values)}/>
    <SelectMenu label={t('catalogue.sort')} placeholder={t('catalogue.popular')} options={(['popular','score','title','year'] as const).map(value=>({value,label:t(`catalogue.${value}`)}))} values={[params.get('sort')??'popular']} multiple={false} onChange={values=>select('sort',values)}/>
    </div>
  return <div className="shell page-body catalogue-page"><PageTitle title={t(titleKey)} /><div className="page-heading"><h1>{t(titleKey)}</h1></div>
    <div className="search-panel"><div className="search-and-filters"><SearchField key={location.pathname} value={params.get('q')??''} onCommit={value=>change('q',value)} busy={catalogue.isFetching}/></div>
    <div className="desktop-filters filters-toolbar">{filters}<DiscoveryControls params={params} onChange={setParams} items={catalogue.data?.data}/></div>{[...params].some(([key])=>!['page','cursor','q'].includes(key))&&<div className="active-filters" aria-label={t('catalogue.activeFilters')}>{[...params].filter(([key,value])=>!['page','cursor','q'].includes(key)&&value&&value!=='false'&&value!=='all').map(([key,value],index)=><button key={`${key}:${value}:${index}`} className="filter-chip" onClick={()=>{setParams(previous=>{const next=new URLSearchParams(previous);const remaining=next.getAll(key).filter(v=>v!==value);next.delete(key);remaining.forEach(v=>next.append(key,v));next.delete('page');next.delete('cursor');return next})}}>{filterLabel(key,value)}<span aria-hidden="true">&times;</span><span className="sr-only">{t('catalogue.removeFilter')}</span></button>)}</div>}
    {[...params].some(([key])=>!['page','cursor'].includes(key))&&<button className="reset-button filter-reset" onClick={()=>setParams({})}>{t('catalogue.reset')}</button>}</div>
    {params.get('q') && <p className="results-label">{t('catalogue.resultsFor', { query: params.get('q')! })}</p>}
    {catalogue.isPending ? <Loading variant="catalogue" /> : catalogue.error ? <ErrorState error={catalogue.error} retry={() => { void catalogue.refetch() }} /> : catalogue.data.data.length ? <>{catalogue.data.source==='Saved library'&&<p className="coverage-note">{t('catalogue.savedCoverage')}</p>}<MediaGrid items={catalogue.data.data} actions={media => <WishlistAction media={media} />} /><Pagination page={pagination.page} totalPages={pagination.personal?null:catalogue.data.total_pages} hasNext={catalogue.data.has_more} availablePages={pagination.availablePages} busy={catalogue.isFetching} onChange={pagination.change}/></> : <div className="state-box"><h2>{t(catalogue.data.has_more?'catalogue.batchEmpty':'catalogue.noResults')}</h2><p>{t(catalogue.data.has_more?'catalogue.batchEmptyBody':'catalogue.noResultsBody')}</p>{catalogue.data.has_more&&<Pagination page={pagination.page} hasNext availablePages={pagination.availablePages} onChange={pagination.change}/>}<Button variant="secondary" onClick={() => setParams({})}>{t('catalogue.reset')}</Button></div>}
  </div>
}

export function DetailsPage() {
  const { id = '' } = useParams()
  const mediaType = useLocation().pathname.startsWith('/manga') ? 'manga' : 'anime'
  const detail = useMedia(mediaType, id)
  const episodes = useEpisodes(id, mediaType === 'anime' && Boolean(detail.data))
  if (detail.isPending) return <Loading variant="details" page />
  if (detail.error) return <ErrorState error={detail.error} retry={() => { void detail.refetch() }} />
  const media = detail.data
  const releaseKey=`release.${media.status}` as MessageKey
  const status=media.status&&['FINISHED','RELEASING','NOT_YET_RELEASED','HIATUS','CANCELLED'].includes(media.status)?t(releaseKey):media.status??t('media.notAvailable')
  const facts=<dl className="detail-info-panel"><div><dt>{t('catalogue.format')}</dt><dd>{media.format??t('media.notAvailable')}</dd></div><div><dt>{t('media.status')}</dt><dd>{status}</dd></div><div><dt>{t('catalogue.year')}</dt><dd>{media.year??t('media.notAvailable')}</dd></div><div><dt>{t(mediaType==='anime'?'media.episodes':'media.chapters')}</dt><dd>{media.total_units??t('media.notAvailable')}</dd></div><div><dt>{t('media.studio')}</dt><dd>{media.studios?.join(', ')||t('media.notAvailable')}</dd></div></dl>
  return <div className="details-page"><PageTitle title={media.title}/>
    <div className={`detail-banner${media.banner_url?' has-image':''}`} style={media.banner_url?{backgroundImage:`url("${media.banner_url}")`}:undefined}><div className="detail-banner-shade"/><div className="shell detail-banner-inner"><Link className="detail-back" to={`/${mediaType}`}>{t('common.back')}</Link></div></div>
    <div className="shell detail-body"><div data-media-source="" className="detail-intro" id="overview"><aside className="detail-sidebar"><div className="detail-poster"><Poster media={media} priority/></div><div className="detail-save-actions"><SaveButton media={media} kind="library"/><SaveButton media={media}/></div>
      {facts}
    </aside><div className="detail-main"><p className="eyebrow">{media.format}{media.year&&` / ${media.year}`}</p><h1>{media.title}</h1>{media.original_title&&<p className="detail-original">{media.original_title}</p>}
      <div className="detail-highlights"><span className="detail-score"><Star size={16} fill="currentColor"/>{media.score?.toFixed(1)??t('media.notRated')}<small>{media.source.name} {t('media.sourceScore')}</small></span><span>{status}</span><span>{unitCount(media.total_units??null,media.media_type)}</span></div>
      <section className="synopsis-section"><h2>{t('media.synopsis')}</h2><SpoilerText><ExpandableSynopsis text={media.synopsis??t('media.noSynopsis')}/></SpoilerText></section>
      <div className="hero-genres">{media.genres.map(genre=><Link key={genre} to={`/${mediaType}?genre=${encodeURIComponent(genre)}`}>{genre}</Link>)}</div>
      <details className="detail-mobile-facts"><summary>{t('media.relatedInfo')}</summary>{facts}</details>
      <nav className="detail-section-nav" aria-label={t('media.sections')}><a href="#overview">{t('media.overview')}</a><a href="#episodes">{t(mediaType==='anime'?'media.episodes':'media.chapters')}</a><a href="#your-progress">{t('media.yourProgress')}</a></nav>
    <section id="episodes" className="episode-section"><div className="section-heading"><h2>{t(mediaType==='anime'?'media.episodes':'media.chapters')}</h2>{episodes.data?.source==='AniZip'&&<span className="episode-attribution">{t('media.episodeSource')} AniZip</span>}</div>
      {mediaType==='anime'&&episodes.isPending?<Loading variant="episodes"/>:mediaType==='anime'&&episodes.error?<ErrorState error={episodes.error} retry={()=>{void episodes.refetch()}}/>:mediaType==='anime'&&episodes.data?.data.length?<EpisodeList key={id} episodes={episodes.data.data}/>:<p className="mt-4 text-sm text-muted">{t(mediaType==='anime'?'media.episodesMissing':'media.chaptersMissing')}</p>}
    </section><section id="your-progress" className="personal-media-section"><PersonalMedia media={media}/></section>
    </div></div><div className="source-note"><span>{t('media.source')}: {media.source.name}</span><span>{t('media.updated',{date:formatDate(media.source.retrieved_at)})}</span><a href={media.source.url} target="_blank" rel="noreferrer">{t('media.external')}<ArrowUpRight size={12}/></a></div>
    </div></div>
}

export function InfoPage() {
  const path = useLocation().pathname
  const key = ({ '/about': 'about', '/help': 'help', '/privacy': 'privacy', '/terms': 'terms', '/data-sources': 'sources', '/status': 'status' } as const)[path as '/about']
  if (!key) return <div className="shell page-body state-box"><PageTitle title={t('notFound.title')} /><h1>{t('notFound.title')}</h1><p>{t('notFound.body')}</p><Link className="button button-primary" to="/">{t('notFound.action')}</Link></div>
  return <div className="shell page-body prose-page"><PageTitle title={t(`info.${key}Title`)} /><h1>{t(`info.${key}Title`)}</h1><p>{t(`info.${key}`)}</p></div>
}
