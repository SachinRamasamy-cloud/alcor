import { NavLink } from 'react-router-dom'
import { t,type MessageKey } from '../shared/content'

export function PersonalNav(){
  const links:[string,MessageKey][]=[['/library','nav.library'],['/wishlist','nav.wishlist'],['/collections','collections.title'],['/history','reports.history'],['/statistics','reports.statistics'],['/profile','settings.profile'],['/settings','settings.title']]
  return <nav aria-label={t('reports.navigation')} className="my-5 flex flex-wrap gap-x-5 gap-y-2 border-b border-line pb-3 text-xs">{links.map(([path,key])=><NavLink key={path} to={path} className={({isActive})=>`inline-flex min-h-11 items-center ${isActive?'font-semibold underline underline-offset-4':'text-muted'}`}>{t(key)}</NavLink>)}</nav>
}
