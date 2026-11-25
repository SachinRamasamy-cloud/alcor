import {api,ApiError} from '../../shared/api/client'
import type {components} from '../../shared/api/schema'

export type LibraryReadFilters={q?:string;media_type?:string;sort?:string}
export const hasLibraryFilters=(filters:LibraryReadFilters)=>Boolean(filters.q?.trim()||filters.media_type||filters.sort&&filters.sort!=='id')
export async function readLibraryPage(wishlist:boolean,cursor:string,status:string,page:number,filters:LibraryReadFilters,owner:string,signal:AbortSignal){
  const context={q:filters.q?.trim()??'',media_type:filters.media_type||null,status:wishlist?'planned':status||null,sort:filters.sort||'id'}
  const params=new URLSearchParams(cursor?{cursor}:{page:String(page)})
  if(status&&!wishlist)params.set('status',status)
  if(context.q)params.set('q',context.q)
  if(context.media_type)params.set('media_type',context.media_type)
  if(context.sort!=='id')params.set('sort',context.sort)
  const result=await api<components['schemas']['LibraryPage']>(`/me/${wishlist?'wishlist':'library'}?${params}`,{signal,accountId:owner})
  if(hasLibraryFilters(filters)&&(!result.query_context||Object.entries(context).some(([key,value])=>result.query_context![key as keyof typeof context]!==value)))throw new ApiError(503,'LIBRARY_QUERY_UNAVAILABLE')
  return result
}
