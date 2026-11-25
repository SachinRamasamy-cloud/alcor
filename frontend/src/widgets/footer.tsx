import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { t, type MessageKey } from '../shared/content'

const groups: { title:MessageKey; className?:string; links:[string,MessageKey][] }[] = [
  { title:'footer.explore',links:[['/','nav.home'],['/anime','nav.anime'],['/manga','nav.manga'],['/search','nav.search'],['/discover','nav.discover']] },
  { title:'footer.yourSpace',links:[['/library','nav.library'],['/wishlist','nav.wishlist'],['/collections','collections.title'],['/history','reports.history'],['/statistics','reports.statistics'],['/profile','settings.profile'],['/settings','settings.title']] },
  { title:'footer.information',className:'footer-info',links:[['/about','nav.about'],['/help','nav.help'],['/privacy','nav.privacy'],['/terms','nav.terms'],['/data-sources','nav.sources'],['/status','nav.status']] },
]

export function Footer() {
  return <footer className="site-footer alcor-footer"><div className="shell">
    <div className="footer-grid"><div className="footer-brand">
      <Link to="/" className="footer-wordmark" aria-label={t('brand')}><img src="/brand/alcor-mark.png" width={54} height={54} alt=""/><span>{t('brand')}</span></Link>
      <p className="footer-tagline">{t('footer.tagline')}</p><p className="footer-description">{t('footer.description')}</p>
      <div className="footer-social"><a href="https://github.com/SachinRamasamy-cloud/alcor" target="_blank" rel="noopener noreferrer"><img className="social-icon" src="/icons/github.svg" width={18} height={18} alt="" aria-hidden="true"/>{t('footer.github')}<ArrowUpRight size={14}/></a><a href="https://www.linkedin.com/in/m-sachin-ramasamy-5146092b5/" target="_blank" rel="noopener noreferrer"><img className="social-icon" src="/icons/linkedin.svg" width={18} height={18} alt="" aria-hidden="true"/>{t('footer.linkedin')}<ArrowUpRight size={14}/></a></div>
    </div>{groups.map(group=><nav key={group.title} className={`footer-group ${group.className??''}`} aria-label={t(group.title)}><h2>{t(group.title)}</h2><ul>{group.links.map(([to,label])=><li key={to}><Link to={to}>{t(label)}</Link></li>)}</ul></nav>)}</div>
    <div className="footer-bottom"><p>{t('footer.copyright',{year:new Date().getFullYear()})}</p><p>{t('footer.creator')} <a href="https://www.linkedin.com/in/m-sachin-ramasamy-5146092b5/" target="_blank" rel="noopener noreferrer">Sachin Ramasamy</a></p><p>{t('footer.metadata')} <a href="https://anilist.co" target="_blank" rel="noopener noreferrer">AniList</a></p></div>
  </div></footer>
}
