import { NavLink } from 'react-router-dom'
import { t,type MessageKey } from '../shared/content'

export function PersonalNav(){
  const links:[string,MessageKey][]=[['/library','nav.library'],['/wishlist','nav.wishlist'],['/collections','collections.title'],['/history','reports.history'],['/statistics','reports.statistics'],['/profile','settings.profile'],['/settings','settings.title']]
  return <nav aria-label={t('reports.navigation')} className="personal-nav">{links.map(([path,key])=><NavLink key={path} to={path}>{t(key)}</NavLink>)}</nav>
}
