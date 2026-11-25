import {useAuth} from '../../shared/auth'
import {usePreferences} from '../preferences'
export type DiscoveryMode='all'|'hide_watched'|'new_to_me'

export function resolveDiscoveryMode(explicit:string|null,userId:string|null,saved:DiscoveryMode|undefined,search=false):DiscoveryMode{
  if(!userId)return 'all'
  if(explicit==='all'||explicit==='hide_watched'||explicit==='new_to_me')return explicit
  return search?'all':saved??'new_to_me'
}
export function useDiscoveryMode(params:URLSearchParams,search=false){
  const {userId}=useAuth(),preferences=usePreferences()
  return resolveDiscoveryMode(params.get('mode'),userId,preferences.data?.data.discovery_mode,search||Boolean(params.get('q')))
}
