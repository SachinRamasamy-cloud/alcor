import {useQuery} from '@tanstack/react-query'
import {useAuth} from '../shared/auth'
import {aniShelfWindow,type ShelfKind} from '../shared/api/anilist'
import {useDiscoveryShelves} from '../features/catalogue/shelf-refill'
import {BrowseShelf} from '../features/catalogue/shelf'
import {discoveryLink,DiscoveryNotice} from '../features/catalogue/visibility'
import type {DiscoveryMode} from '../features/catalogue/policy'
import {ErrorState,Loading} from '../shared/ui'
import {t,type MessageKey} from '../shared/content'

const definitions:Record<string,{title:MessageKey;params:string}>={
  trending:{title:'browse.trending',params:'type=anime&sort=trending'},
  airing:{title:'browse.airing',params:'type=anime&sort=popular&status=RELEASING'},
  upcoming:{title:'browse.upcoming',params:'type=anime&sort=popular&status=NOT_YET_RELEASED'},
}
function SourceShelves({kind,keys,mode}:{kind:ShelfKind;keys:string[];mode:DiscoveryMode}){
  const source=useQuery({queryKey:['public','anilist','shelf-window',kind,1],queryFn:({signal})=>aniShelfWindow(kind,1,signal),staleTime:300000,retry:false})
  const visibility=useDiscoveryShelves(kind,source.data?Object.fromEntries(Object.entries(source.data).map(([key,value])=>[key,value.items])):{},mode)
  return <>{keys.map(key=>{
    const {title,params}=definitions[key]
    if(source.isPending||visibility.pending)return <section className="home-section" key={key}><h2>{t(title)}</h2><Loading variant="shelf"/></section>
    if(source.error)return <section className="home-section" key={key}><h2>{t(title)}</h2><ErrorState error={source.error} retry={()=>{void source.refetch()}}/></section>
    return <section key={key}><DiscoveryNotice unavailable={visibility.unavailable} refetch={visibility.refetch}/>{visibility.refillError&&<ErrorState error={visibility.refillError} retry={()=>{void visibility.retryRefill()}}/>}
      <BrowseShelf title={t(title)} items={visibility.shelves[key]??[]} to={discoveryLink(`/search?${params}`,mode)} emptyMessage={t(visibility.refilling?'discovery.refilling':visibility.exhausted.includes(key)?'discovery.shelfExhausted':'discovery.shelfEmpty')}/>
      {visibility.limited.includes(key)&&<p className="coverage-note">{t('discovery.shelfWindow')}</p>}
    </section>
  })}</>
}
export function HomeDiscovery({mode,position,enabled}:{mode:DiscoveryMode;position:'before-popular'|'after-manga';enabled:boolean}){
  const {userId}=useAuth()
  return userId&&enabled?<SourceShelves kind="home-discovery" keys={position==='before-popular'?['trending','airing']:['upcoming']} mode={mode}/>:null
}
export function AiringShelf({mode}:{mode:DiscoveryMode}){
  const {userId}=useAuth()
  return userId?<SourceShelves kind="airing" keys={['airing']} mode={mode}/>:null
}
