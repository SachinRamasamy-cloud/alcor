import {useSearchParams} from 'react-router-dom'
import {useAuth} from '../../shared/auth'
import {SelectMenu} from '../../shared/ui/select-menu'
import {t} from '../../shared/content'
import type {DiscoveryMode} from './policy'

export function DiscoveryModeControl({mode}:{mode:DiscoveryMode}){
  const {userId}=useAuth(),[,setParams]=useSearchParams()
  if(!userId)return null
  return <div className="personal-toolbar"><SelectMenu label={t('discovery.mode')} placeholder={t('discovery.newToMe')} multiple={false}
    options={(['all','hide_watched','new_to_me'] as const).map(value=>({value,label:t(value==='all'?'discovery.all':value==='hide_watched'?'discovery.hideWatched':'discovery.newToMe')}))}
    values={[mode]} onChange={values=>{const value=values[0];if(value)setParams(previous=>{const next=new URLSearchParams(previous);next.set('mode',value);next.delete('page');next.delete('cursor');return next})}}/>
  </div>
}
