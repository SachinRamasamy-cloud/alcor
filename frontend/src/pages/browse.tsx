import {useEffect} from 'react'
import {Link,useLocation,useSearchParams} from 'react-router-dom'
import {Search} from 'lucide-react'
import {useBrowse} from '../features/catalogue'
import {useSetup} from '../features/profile'
import {tasteParams} from '../features/discovery/taste'
import {browseSections} from '../shared/api/anilist'
import {t} from '../shared/content'
import {ErrorState,Loading} from '../shared/ui'
import {CataloguePage} from './public'
import {discoveryLink,DiscoveryNotice} from '../features/catalogue/visibility'
import {useDiscoveryShelves} from '../features/catalogue/shelf-refill'
import {useDiscoveryMode} from '../features/catalogue/policy'
import {BrowseShelf} from '../features/catalogue/shelf'
import {AiringShelf} from '../widgets/discovery-home'
import {PersonalShelves} from '../features/recommendations/views'
export {BrowseShelf} from '../features/catalogue/shelf'

function Shelves({type}:{type:'anime'|'manga'}){
  const browse=useBrowse(type),setup=useSetup()
  const [params]=useSearchParams(),mode=useDiscoveryMode(params)
  const visibility=useDiscoveryShelves(type,browse.data??{},mode)
  useEffect(()=>{document.title=`${t(type==='anime'?'nav.anime':'nav.manga')} · ALCOR`},[type])
  if(browse.isPending)return <Loading variant="browse" page/>
  if(browse.error)return <ErrorState error={browse.error} retry={()=>{void browse.refetch()}}/>
  if(visibility.pending)return <Loading variant="browse" page/>
  return <div className="shell page-body browse-page"><header className="browse-heading"><div><p className="eyebrow">{t('footer.tagline')}</p><h1>{t(type==='anime'?'nav.anime':'nav.manga')}</h1><p>{t(type==='anime'?'browse.animeIntro':'browse.mangaIntro')}</p></div><Link className="button button-primary" to={`/search?type=${type}`}><Search size={17}/>{t(type==='anime'?'browse.searchAnime':'browse.searchManga')}</Link></header>
    <DiscoveryNotice unavailable={visibility.unavailable} refetch={visibility.refetch}/>
    {visibility.refilling&&<p className="coverage-note" role="status">{t('discovery.refilling')}</p>}
    {visibility.refillError&&<ErrorState error={visibility.refillError} retry={()=>{void visibility.retryRefill()}}/>}
    {visibility.limited.length>0&&<p className="coverage-note">{t('discovery.shelfWindow')}</p>}
    {browseSections(type).map(({key,params})=><BrowseShelf key={key} title={t(key==='latest'?'browse.latest':key==='popular'?'browse.popular':key==='top'?'browse.top':key==='trending'?'browse.trending':type==='anime'?'browse.upcoming':'browse.publishing')} items={visibility.shelves[key]??[]} emptyMessage={visibility.personal&&!visibility.unavailable?t(visibility.refilling?'discovery.refilling':visibility.exhausted.includes(key)?'discovery.shelfExhausted':'discovery.shelfEmpty'):undefined} to={discoveryLink(`/search?${params}`,mode)}/>)}
    <PersonalShelves type={type} mode={mode} enabled={!visibility.refilling}/>
    {type==='anime'&&!visibility.refilling&&<AiringShelf mode={mode}/>}
    {(!setup.data||!tasteParams(setup.data.preferences.data,type).personal)&&<div className="browse-profile-invite"><div><h2>{t('browse.yourTaste')}</h2><p>{t('browse.tasteHelp')}</p></div><Link className="button button-secondary" to="/setup">{t('dashboard.startSetup')}</Link></div>}
  </div>
}
export function BrowsePage(){
  const type=useLocation().pathname==='/manga'?'manga':'anime'
  const [params]=useSearchParams()
  // Preserve existing bookmarked filter URLs; bare navigation opens shelves.
  return [...params.keys()].some(key=>key!=='mode')?<CataloguePage/>:<Shelves key={type} type={type}/>
}
