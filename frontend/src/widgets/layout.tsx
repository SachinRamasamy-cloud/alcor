import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bookmark, Menu, Search, X } from 'lucide-react'
import { t, type MessageKey } from '../shared/content'
import { useAuth } from '../shared/auth'
import { Footer } from './footer'
import { Button, RouteSkeleton } from '../shared/ui'
import { BackendNotice, useBackend } from '../shared/api/backend'

const links: [string, MessageKey][] = [['/', 'nav.home'], ['/anime', 'nav.anime'], ['/manga', 'nav.manga'], ['/discover', 'nav.discover'], ['/library', 'nav.library']]
export function Layout() {
  const [menu, setMenu] = useState(false)
  const { requireSignIn, userId, signOut } = useAuth()
  const location = useLocation()
  const { ready } = useBackend()
  const privatePage = /^\/(library|wishlist|collections|history|statistics|profile|settings|setup|auth)(\/|$)/.test(location.pathname)
  const main = useRef<HTMLElement>(null)
  useEffect(() => { main.current?.focus({ preventScroll: true }); window.scrollTo(0, 0) }, [location.pathname])
  return <><a className="skip-link" href="#main">{t('nav.skip')}</a>
    <header className="site-header"><div className="shell header-inner">
      <Link to="/" className="wordmark" aria-label={t('brand')}><img src="/brand/alcor-mark.png" className="brand-mark" alt="" width={32} height={32}/>{t('brand')}</Link>
      <nav className="desktop-nav" aria-label={t('nav.menu')}>{links.map(([to, key]) => <NavLink key={to} to={to} end={to === '/'}>{t(key)}</NavLink>)}</nav>
      <div className="header-actions"><Link to="/search" className="icon-button" aria-label={t('nav.search')}><Search size={19} /></Link>
        <Link to="/wishlist" className="icon-button" aria-label={t('nav.wishlist')}><Bookmark size={18} /></Link>
        <Button variant="secondary" className="sign-in" onClick={() => { if (userId) void signOut(); else requireSignIn() }}>{t(userId ? 'auth.signOut' : 'nav.signIn')}</Button>
        <button className="icon-button mobile-toggle" aria-label={t(menu ? 'nav.close' : 'nav.menu')} aria-expanded={menu} aria-controls="mobile-nav" onClick={() => setMenu(!menu)}>{menu ? <X size={21} /> : <Menu size={21} />}</button>
      </div></div>
      {menu && <nav id="mobile-nav" className="mobile-nav shell" aria-label={t('nav.menu')}>{links.map(([to, key]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenu(false)}>{t(key)}</NavLink>)}</nav>}
    </header>
    <BackendNotice />
    <main id="main" ref={main} tabIndex={-1}>{privatePage && userId && !ready ? <RouteSkeleton /> : <Suspense fallback={<RouteSkeleton />}><Outlet /></Suspense>}</main>
    <Footer/>

  </>
}
