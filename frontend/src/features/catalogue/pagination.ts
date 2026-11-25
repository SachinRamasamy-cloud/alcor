import { useQueryClient } from '@tanstack/react-query'
import { useBackend } from '../../shared/api/backend'
import { useAuth } from '../../shared/auth'
import { useLocation, useSearchParams } from 'react-router-dom'
import { needsLocalFilters } from './custom-filters'

export function useCataloguePagination(nextCursor: string | null | undefined, hasNext: boolean,mode?:string) {
  const [params,setParams] = useSearchParams()
  const location=useLocation()
  const {userId}=useAuth()
  const {ready}=useBackend()
  const queries=useQueryClient()
  const personal=params.get('memory')!=='true' && (needsLocalFilters(params) || (['hide_watched','new_to_me'].includes(mode??params.get('mode')??'') && Boolean(userId&&ready)))
  const page=Math.max(1,Number(params.get('page'))||1)
  const context=new URLSearchParams(params);context.delete('page');context.delete('cursor')
  if(mode)context.set('mode',mode)
  const key=['private',userId,'page-cursors',location.pathname,context.toString()]
  const cursors=queries.getQueryData<Record<number,string>>(key)??{1:''}
  const known={...cursors,[page]:params.get('cursor')??'',...(hasNext&&nextCursor?{[page+1]:nextCursor}:{})}
  function change(target:number) {
    if(personal && !(target in known))return
    if(personal)queries.setQueryData(key,known)
    setParams(previous=>{const next=new URLSearchParams(previous);if(mode)next.set('mode',mode);next.delete('cursor');if(target===1)next.delete('page');else next.set('page',String(target));if(personal&&known[target])next.set('cursor',known[target]);return next})
  }
  return {page,change,availablePages:personal?Object.keys(known).map(Number):undefined,personal}
}
