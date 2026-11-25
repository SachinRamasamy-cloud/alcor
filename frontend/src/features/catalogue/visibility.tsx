import {useQuery} from '@tanstack/react-query'
import type {Media} from '../../shared/api/client'
import {sameTitle} from '../../shared/api/identity'
import {useAuth} from '../../shared/auth'
import {useBackend} from '../../shared/api/backend'
import {t} from '../../shared/content'
import {Button} from '../../shared/ui'
import {exclusions} from './personal-page'

export type DiscoveryMode='all'|'hide_watched'|'new_to_me'
export function discoveryMode(value:string|null):DiscoveryMode {
  return value==='hide_watched'||value==='new_to_me'?value:'all'
}
export function discoveryLink(to:string,mode:DiscoveryMode){
  if(mode==='all')return to
  const [path,query]=to.split('?'),params=new URLSearchParams(query)
  params.set('mode',mode)
  return `${path}?${params}`
}
export function visibleTitles(items:Media[],excluded:number[]):Media[]{
  return items.filter((item,index)=>!excluded.includes(Number(item.source_ids?.anilist))&&!items.slice(0,index).some(previous=>sameTitle(previous,item)))
}
// Public candidates stay public. Only the read-only eligibility overlay is private.
export function useDiscoveryVisibility(items:Media[],mode:DiscoveryMode){
  const {userId}=useAuth(),{ready}=useBackend()
  const personal=Boolean(userId&&mode!=='all'),enabled=personal&&ready&&items.length>0
  const references=items.map(item=>`${item.media_type}:${item.source_ids?.anilist}:${item.source_ids?.mal??''}`).sort().join(',')
  const query=useQuery({queryKey:['private',userId,'discovery-exclusions',mode,references],enabled,
    queryFn:({signal})=>exclusions(items,mode,userId!,signal),staleTime:30000,retry:false})
  const pending=enabled&&query.isPending
  const unavailable=personal&&(!ready||Boolean(query.error))
  // A failed overlay cannot be represented as confirmed empty history.
  const visible=pending||enabled&&query.error?[]:visibleTitles(items,enabled?query.data??[]:[])
  return {items:visible,pending,unavailable,personal,refetch:query.refetch}
}
export function DiscoveryNotice({unavailable,refetch}:{unavailable:boolean;refetch:()=>unknown}){
  return unavailable?<div className="coverage-note" role="status"><p>{t('discovery.filterUnavailable')}</p><Button variant="secondary" onClick={()=>{void refetch()}}>{t('common.retry')}</Button></div>:null
}
