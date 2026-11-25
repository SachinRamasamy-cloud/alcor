import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { Menu, Search, X } from 'lucide-react'
import {FlyTarget} from '../shared/motion'
import {WishlistTarget} from './wishlist-target'
import {ProfileMenu} from './account-menu'
import { t, type MessageKey } from '../shared/content'
import { useAuth } from '../shared/auth'
import { Footer } from './footer'
import { Button, RouteSkeleton } from '../shared/ui'
import { BackendNotice, useBackend } from '../shared/api/backend'
import {DiscoveryModeControl} from '../features/catalogue/mode-control'
import {useDiscoveryMode} from '../features/catalogue/policy'

const links: [string, MessageKey][] = [['/', 'nav.home'], ['/anime', 'nav.anime'], ['/manga', 'nav.manga'], ['/discover', 'nav.discover'], ['/library', 'nav.library']]
export function Layout() {
  const [menu, setMenu] = useState(false)
  const { requireSignIn, userId } = useAuth()
  const navigation=links
  const location = useLocation()
  const [params]=useSearchParams(),mode=useDiscoveryMode(params,location.pathname==='/search')
  const discoveryPage=Boolean(userId)&&(['/', '/anime', '/manga', '/discover', '/search', '/recommendations'].includes(location.pathname)||/^\/(anime|manga)\/[^/]+$/.test(location.pathname))
  const { ready } = useBackend()
  const privatePage = /^\/(library|wishlist|collections|history|statistics|profile|settings|setup|auth)(\/|$)/.test(location.pathname)
  const main = useRef<HTMLElement>(null)
  const menuToggle=useRef<HTMLButtonElement>(null)
  useEffect(() => { main.current?.focus({ preventScroll: true }); window.scrollTo(0, 0) }, [location.pathname])
  return <><a className="skip-link" href="#main">{t('nav.skip')}</a>
    <header className="site-header"><div className="shell header-inner">
      <Link to="/" className="wordmark" aria-label={t('brand')}><img src="/brand/alcor-mark.png" className="brand-mark" alt="" width={32} height={32}/>{t('brand')}</Link>
      <nav className="desktop-nav" aria-label={t('nav.menu')}>{navigation.map(([to, key]) => <NavLink key={to} to={to} end={to === '/'}>{to==='/library'?<FlyTarget name="library">{t(key)}</FlyTarget>:t(key)}</NavLink>)}</nav>
      <div className="header-actions">{discoveryPage&&<div className="header-discovery"><DiscoveryModeControl mode={mode} compact/></div>}<Link to={location.pathname.startsWith('/anime')?'/search?type=anime':location.pathname.startsWith('/manga')?'/search?type=manga':'/search'} className="icon-button" aria-label={t('nav.search')}><Search size={19} /></Link>
        <WishlistTarget/>
        {userId?<ProfileMenu/>:<Button variant="secondary" className="sign-in" onClick={() => requireSignIn()}>{t('nav.signIn')}</Button>}
        <button ref={menuToggle} className="icon-button mobile-toggle" aria-label={t(menu ? 'nav.close' : 'nav.menu')} aria-expanded={menu} aria-controls="mobile-nav" onClick={() => setMenu(!menu)}>{menu ? <X size={21} /> : <Menu size={21} />}</button>
      </div></div>
      {menu && <nav id="mobile-nav" className="mobile-nav shell" aria-label={t('nav.menu')}>{navigation.map(([to, key]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenu(false)}>{t(key)}</NavLink>)}{discoveryPage&&<div className="mobile-discovery"><span>{t('discovery.mode')}</span><DiscoveryModeControl mode={mode} compact onSelected={()=>{setMenu(false);menuToggle.current?.focus()}}/></div>}</nav>}
    </header>
    <BackendNotice />
    <main id="main" ref={main} tabIndex={-1}>{privatePage && userId && !ready ? <RouteSkeleton /> : <Suspense fallback={<RouteSkeleton />}><Outlet /></Suspense>}</main>
    <Footer/>

  </>
}
