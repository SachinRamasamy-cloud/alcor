import {useEffect,useRef} from 'react'
import {Link,useLocation,useSearchParams} from 'react-router-dom'
import {ArrowLeft,ArrowRight,Search} from 'lucide-react'
import {useBrowse,useCatalogue} from '../features/catalogue'
import {useSetup,type SetupRead} from '../features/profile'
import {tasteItems,tasteParams} from '../features/discovery/taste'
import {SaveButton} from '../features/library'
import {MediaGrid} from '../entities/media'
import {browseSections} from '../shared/api/anilist'
import type {Media} from '../shared/api/client'
import {t} from '../shared/content'
import {ErrorState,Loading} from '../shared/ui'
import {CataloguePage} from './public'
import {discoveryMode,discoveryLink,useDiscoveryVisibility,DiscoveryNotice} from '../features/catalogue/visibility'

export function BrowseShelf({title,items,to,description}:{title:string;items:Media[];to:string;description?:string}){
  const rail=useRef<HTMLDivElement>(null)
  function scroll(direction:number){const node=rail.current;if(node)node.scrollBy({left:direction*node.clientWidth*.85,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
  return <section className="home-section browse-shelf"><div className="section-heading"><div><h2>{title}</h2>{description&&<p className="browse-description">{description}</p>}</div><div className="shelf-tools"><div className="shelf-arrows"><button className="icon-button" aria-label={t('browse.scrollBack',{title})} onClick={()=>scroll(-1)}><ArrowLeft size={16}/></button><button className="icon-button" aria-label={t('browse.scrollForward',{title})} onClick={()=>scroll(1)}><ArrowRight size={16}/></button></div><Link className="subtle-link" to={to}>{t('home.all')}<ArrowRight size={14}/></Link></div></div>{items.length?<div ref={rail} className="browse-rail" role="region" aria-label={title} tabIndex={0}><MediaGrid items={items} actions={media=><SaveButton media={media} compact/>}/></div>:<p className="browse-description">{t('browse.empty')}</p>}</section>
}
function Suggestions({setup,type}:{setup:SetupRead;type:'anime'|'manga'}){
  const taste=tasteParams(setup.preferences.data,type)
  const query=useCatalogue(`/${type}`,taste.params)
  const params=new URLSearchParams(taste.params);params.set('type',type)
  const items=query.data?tasteItems(query.data.data,setup.preferences.data,setup.favorites??[],type).slice(0,12):[]
  if(query.isPending)return <section className="home-section"><h2>{t('dashboard.youMayLike')}</h2><Loading variant="shelf"/></section>
  if(query.error)return <section className="home-section"><h2>{t('dashboard.youMayLike')}</h2><ErrorState error={query.error} retry={()=>{void query.refetch()}}/></section>
  return <BrowseShelf title={t(taste.personal?'dashboard.youMayLike':'browse.trending')} description={t(taste.personal?'dashboard.basedOnFilters':'dashboard.generalPicks')} items={items} to={`/search?${params}`}/>
}
function Shelves({type}:{type:'anime'|'manga'}){
  const browse=useBrowse(type),setup=useSetup()
  const [params]=useSearchParams(),mode=discoveryMode(params.get('mode'))
  const visibility=useDiscoveryVisibility(browse.data?Object.values(browse.data).flat():[],mode)
  useEffect(()=>{document.title=`${t(type==='anime'?'nav.anime':'nav.manga')} · ALCOR`},[type])
  if(browse.isPending)return <Loading variant="browse" page/>
  if(browse.error)return <ErrorState error={browse.error} retry={()=>{void browse.refetch()}}/>
  if(visibility.pending)return <Loading variant="browse" page/>
  return <div className="shell page-body browse-page"><header className="browse-heading"><div><p className="eyebrow">{t('footer.tagline')}</p><h1>{t(type==='anime'?'nav.anime':'nav.manga')}</h1><p>{t(type==='anime'?'browse.animeIntro':'browse.mangaIntro')}</p></div><Link className="button button-primary" to={`/search?type=${type}`}><Search size={17}/>{t(type==='anime'?'browse.searchAnime':'browse.searchManga')}</Link></header>
    <DiscoveryNotice unavailable={visibility.unavailable} refetch={visibility.refetch}/>
    {visibility.personal&&!visibility.unavailable&&<p className="coverage-note">{t('discovery.partialPersonal')}</p>}
    {browseSections(type).map(({key,params})=>key==='trending'&&setup.data&&tasteParams(setup.data.preferences.data,type).personal?<Suggestions key={`${type}:taste`} type={type} setup={setup.data}/>:<BrowseShelf key={key} title={t(key==='latest'?'browse.latest':key==='popular'?'browse.popular':key==='top'?'browse.top':key==='trending'?'browse.trending':type==='anime'?'browse.upcoming':'browse.publishing')} items={browse.data[key].filter(item=>visibility.items.some(candidate=>candidate.id===item.id))} to={discoveryLink(`/search?${params}`,mode)}/>)}
    {(!setup.data||!tasteParams(setup.data.preferences.data,type).personal)&&<div className="browse-profile-invite"><div><h2>{t('browse.yourTaste')}</h2><p>{t('browse.tasteHelp')}</p></div><Link className="button button-secondary" to="/setup">{t('dashboard.startSetup')}</Link></div>}
  </div>
}
export function BrowsePage(){
  const type=useLocation().pathname==='/manga'?'manga':'anime'
  const [params]=useSearchParams()
  // Preserve existing bookmarked filter URLs; bare navigation opens shelves.
  return [...params.keys()].some(key=>key!=='mode')?<CataloguePage/>:<Shelves key={type} type={type}/>
}
