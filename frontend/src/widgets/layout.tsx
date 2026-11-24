import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bookmark, Menu, Search, X, ArrowUpRight } from 'lucide-react'
import { t, type MessageKey } from '../shared/content'
import { useAuth } from '../shared/auth'
import { Button } from '../shared/ui'

const links: [string, MessageKey][] = [['/', 'nav.home'], ['/anime', 'nav.anime'], ['/manga', 'nav.manga'], ['/discover', 'nav.discover'], ['/library', 'nav.library']]
export function Layout() {
  const [menu, setMenu] = useState(false)
  const { requireSignIn } = useAuth()
  const location = useLocation()
  const main = useRef<HTMLElement>(null)
  useEffect(() => { main.current?.focus({ preventScroll: true }); window.scrollTo(0, 0) }, [location.pathname])
  return <><a className="skip-link" href="#main">{t('nav.skip')}</a>
    <header className="site-header"><div className="shell header-inner">
      <Link to="/" className="wordmark" aria-label={t('brand')}><span className="brand-symbol" aria-hidden="true">a</span>{t('brand')}</Link>
      <nav className="desktop-nav" aria-label={t('nav.menu')}>{links.map(([to, key]) => <NavLink key={to} to={to} end={to === '/'}>{t(key)}</NavLink>)}</nav>
      <div className="header-actions"><Link to="/search" className="icon-button" aria-label={t('nav.search')}><Search size={19} /></Link>
        <Link to="/wishlist" className="icon-button" aria-label={t('nav.wishlist')}><Bookmark size={18} /></Link>
        <Button variant="secondary" className="sign-in" onClick={() => requireSignIn()}>{t('nav.signIn')}</Button>
        <button className="icon-button mobile-toggle" aria-label={t(menu ? 'nav.close' : 'nav.menu')} aria-expanded={menu} aria-controls="mobile-nav" onClick={() => setMenu(!menu)}>{menu ? <X size={21} /> : <Menu size={21} />}</button>
      </div></div>
      {menu && <nav id="mobile-nav" className="mobile-nav shell" aria-label={t('nav.menu')}>{links.map(([to, key]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenu(false)}>{t(key)}</NavLink>)}</nav>}
    </header>
    <main id="main" ref={main} tabIndex={-1}><Outlet /></main>
    <footer className="site-footer"><div className="shell footer-inner"><div><Link className="wordmark text-base" to="/">{t('brand')}</Link><p className="mt-2 text-xs text-muted">{t('home.footer')}</p></div>
      <nav className="footer-links" aria-label={t('nav.help')}>{([['/about', 'nav.about'], ['/help', 'nav.help'], ['/privacy', 'nav.privacy'], ['/terms', 'nav.terms'], ['/data-sources', 'nav.sources'], ['/status', 'nav.status']] as [string, MessageKey][]).map(([to, key]) => <Link key={to} to={to}>{t(key)}{to === '/data-sources' && <ArrowUpRight size={11} />}</Link>)}</nav>
    </div></footer>
  </>
}
