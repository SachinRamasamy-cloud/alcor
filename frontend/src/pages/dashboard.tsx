import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight,Bookmark,BookOpen,SlidersHorizontal } from 'lucide-react'
import { useAuth } from '../shared/auth'
import { useBackend } from '../shared/api/backend'
import type { Media } from '../shared/api/client'
import { t,type MessageKey } from '../shared/content'
import { Button,ErrorState,Loading } from '../shared/ui'
import { useSetup,storyTraits,type SetupRead } from '../features/profile'
import { useHome,useCatalogue } from '../features/catalogue'
import { useLibrary } from '../features/library'
import {CardActions,CardStatus} from '../features/library/actions'
import {useFavorites} from '../features/library/favorites'
import { tasteItems,tasteParams } from '../features/discovery/taste'
import {PersonalShelves} from '../features/recommendations/views'
import {useDiscoveryMode} from '../features/catalogue/policy'
import { MediaGrid } from '../entities/media'
import { ContinueSections } from '../widgets/continue'

export function DashboardHeader({name,needsSetup}:{name?:string;needsSetup:boolean}){
  return <><header className="dashboard-heading"><div><p className="eyebrow">{t(name?'dashboard.welcomeName':'dashboard.welcome',{name:name??''})}</p><h1>{t('dashboard.title')}</h1><p>{t('dashboard.subtitle')}</p></div><Link className="button button-secondary" to="/setup"><SlidersHorizontal size={16}/>{t(needsSetup?'dashboard.finishSetup':'setup.edit')}</Link></header>
    {needsSetup&&<section className="dashboard-setup-callout"><div><h2>{t('dashboard.setupTitle')}</h2><p>{t('dashboard.setupBody')}</p></div><Link className="button button-primary" to="/setup">{t('dashboard.startSetup')}<ArrowRight size={15}/></Link></section>}
    <nav className="dashboard-shortcuts" aria-label={t('dashboard.shortcuts')}>{([['/library','nav.library','dashboard.libraryHelp',BookOpen],['/wishlist','nav.wishlist','dashboard.wishlistHelp',Bookmark],['/profile','settings.profile','dashboard.profileHelp',SlidersHorizontal]] as const).map(([path,label,help,Icon])=><Link key={path} to={path}><Icon size={20}/><div><strong>{t(label)}</strong><p>{t(help)}</p></div><ArrowRight size={16}/></Link>)}</nav></>
}
export function DashboardShelf({title,description,items,to,showSave=true}:{title:string;description?:string;items:Media[];to?:string;showSave?:boolean}){
  if(!items.length)return null
  return <section className="home-section dashboard-shelf"><div className="section-heading"><div><h2>{title}</h2>{description&&<p>{description}</p>}</div>{to&&<Link className="subtle-link" to={to}>{t('home.all')}<ArrowRight size={14}/></Link>}</div><div className="mobile-media-rail" role="region" aria-label={title} tabIndex={0}><MediaGrid items={items} actions={showSave?media=><CardActions media={media}/>:undefined} context={media=><CardStatus media={media}/>}/></div></section>
}
function GeneralSuggestions({setup}:{setup:SetupRead}){
  const taste=tasteParams(setup.preferences.data)
  const query=useCatalogue('/anime',taste.params)
  const items=query.data?tasteItems(query.data.data,setup.preferences.data,setup.favorites??[]).slice(0,12):[]
  const title=t(taste.personal?'dashboard.youMayLike':'dashboard.discover')
  const description=t(taste.genres.length?'dashboard.basedOnGenres':taste.personal?'dashboard.basedOnFilters':'dashboard.generalPicks',{genres:taste.genres.join(', ')})
  if(query.isPending)return <section className="home-section"><h2 className="dashboard-section-title">{title}</h2><Loading variant="shelf"/></section>
  if(query.error)return <section className="home-section"><h2 className="dashboard-section-title">{title}</h2><ErrorState error={query.error} retry={()=>{void query.refetch()}}/></section>
  if(!items.length)return <section className="home-section dashboard-empty"><h2>{title}</h2><p>{t('dashboard.noSuggestions')}</p><Link className="button button-secondary" to={`/anime?${taste.params}`}>{t('nav.discover')}</Link></section>
  return <DashboardShelf title={title} description={description} items={items} to={`/anime?${taste.params}`}/>
}
function Suggestions({setup}:{setup:SetupRead}){
  const mode=useDiscoveryMode(new URLSearchParams())
  return tasteParams(setup.preferences.data).personal?<PersonalShelves type="anime" mode={mode} showFavorites={false}/>:<GeneralSuggestions setup={setup}/>
}
function FavoritesShelf(){
  const query=useFavorites()
  if(query.isPending)return <section className="home-section"><h2 className="dashboard-section-title">{t('dashboard.favorites')}</h2><Loading variant="shelf"/></section>
  if(query.error)return <ErrorState error={query.error} retry={()=>{void query.refetch()}}/>
  return <DashboardShelf title={t('dashboard.favorites')} description={t('dashboard.favoritesHelp')} items={query.data.data.slice(0,12)} to="/favorites"/>
}
function WishlistShelf(){
  const query=useLibrary(true)
  if(query.isPending)return <section className="home-section"><h2 className="dashboard-section-title">{t('nav.wishlist')}</h2><Loading variant="shelf" count={6}/></section>
  if(query.error)return <ErrorState error={query.error} retry={()=>{void query.refetch()}}/>
  return <DashboardShelf title={t('nav.wishlist')} description={t('dashboard.savedCount',{count:query.data.total})} items={query.data.data.slice(0,6).map(entry=>entry.media)} to="/wishlist" showSave={false}/>
}
export function TasteSummary({setup}:{setup:SetupRead}){
  const profile=setup.preferences.data.intelligence_profile
  const genres=setup.preferences.data.preferred_genres??[]
  const traits=profile?.story_traits??[]
  if(!genres.length&&!traits.length)return null
  return <section className="dashboard-taste"><div><h2>{t('dashboard.yourTaste')}</h2><p>{t('dashboard.tasteHelp')}</p></div><div className="setup-choices">{genres.map(genre=><span key={genre}>{genre}</span>)}{traits.map(trait=><span key={trait}>{(storyTraits as readonly string[]).includes(trait)?t(`setup.trait.${trait}` as MessageKey):trait}</span>)}{profile?.excluded_genres?.map(genre=><span key={`exclude:${genre}`}>{t('dashboard.excludeGenre',{genre})}</span>)}</div><Link className="subtle-link" to="/setup">{t('setup.edit')}<ArrowRight size={14}/></Link></section>
}
export function DashboardPage(){
  const {userId,requireSignIn}=useAuth(),{ready}=useBackend(),setup=useSetup(),home=useHome(!userId||!ready||Boolean(setup.error))
  useEffect(()=>{document.title=`${t('dashboard.title')} · ALCOR`},[])
  return <div className="shell page-body dashboard-page"><DashboardHeader name={userId?setup.data?.profile.display_name:undefined} needsSetup={Boolean(userId&&ready&&setup.data&&setup.data.preferences.data.intelligence_profile?.setup_status!=='completed')}/>
    {!userId&&<section className="dashboard-setup-callout"><div><h2>{t('dashboard.guestTitle')}</h2><p>{t('dashboard.guestBody')}</p></div><Button onClick={()=>requireSignIn()}>{t('auth.emailLogin')}</Button></section>}
    {userId&&ready&&<><ContinueSections/>{setup.isPending?<Loading variant="shelf"/>:setup.error?<ErrorState error={setup.error} retry={()=>{void setup.refetch()}}/>:<><Suggestions setup={setup.data}/><FavoritesShelf/><TasteSummary setup={setup.data}/></>}<WishlistShelf/></>}
    {(!userId||!ready||setup.error)&&<>{home.isPending?<Loading variant="catalogue"/>:home.error?<ErrorState error={home.error} retry={()=>{void home.refetch()}}/>:<DashboardShelf title={t('home.popularAnime')} description={t('dashboard.generalPicks')} items={home.data.anime} to="/anime"/>}</>}
  </div>
}
