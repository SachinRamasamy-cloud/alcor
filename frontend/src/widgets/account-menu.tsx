import * as Menu from '@radix-ui/react-dropdown-menu'
import {Bookmark,BookOpen,Check,ChartNoAxesCombined,Folder,History,LayoutDashboard,LogOut,Settings,UserRound} from 'lucide-react'
import {Link} from 'react-router-dom'
import {useState} from 'react'
import {useSetup} from '../features/profile'
import {useAuth} from '../shared/auth'
import {useFeedback} from '../shared/feedback'
import {t} from '../shared/content'

export function AccountMenu({name,onSignOut}:{name?:string;onSignOut:()=>Promise<void>}){
  const [busy,setBusy]=useState(false),notify=useFeedback()
  const initials=name?.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toLocaleUpperCase()
  return <Menu.Root modal={false}><Menu.Trigger className="account-avatar" aria-label={t('nav.account')} disabled={busy}>{initials?<span aria-hidden="true">{initials}</span>:<UserRound size={18}/>}</Menu.Trigger><Menu.Portal><Menu.Content className="select-popup account-popup" sideOffset={12} collisionPadding={12} align="end" aria-label={t('nav.account')}>
    <Menu.Label className="account-menu-heading"><strong>{name||t('nav.yourAccount')}</strong><span>{t('brand')}</span></Menu.Label><Menu.Separator className="select-separator"/>
    {([['/dashboard','nav.dashboard',LayoutDashboard],['/profile','settings.profile',UserRound],['/settings','settings.title',Settings],['/library','nav.library',BookOpen],['/wishlist','nav.wishlist',Bookmark],['/library?status=completed','status.completed',Check],['/collections','collections.title',Folder],['/history','reports.history',History],['/statistics','reports.statistics',ChartNoAxesCombined]] as const).map(([to,label,Icon])=><Menu.Item asChild key={to}><Link className="select-option" to={to}><Icon size={16}/>{t(label)}</Link></Menu.Item>)}
    <Menu.Separator className="select-separator"/><Menu.Item className="select-option" disabled={busy} onSelect={()=>{setBusy(true);void onSignOut().catch(()=>notify(t('errors.generic'))).finally(()=>setBusy(false))}}><LogOut size={16}/>{t('auth.signOut')}</Menu.Item>
  </Menu.Content></Menu.Portal></Menu.Root>
}
export function ProfileMenu(){
  const {signOut}=useAuth(),setup=useSetup()
  return <AccountMenu name={setup.data?.profile.display_name} onSignOut={signOut}/>
}
