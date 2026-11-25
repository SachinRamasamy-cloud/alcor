import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Media } from '../../shared/api/client'
import type { components } from '../../shared/api/schema'
import { useAuth } from '../../shared/auth'
import { useFeedback } from '../../shared/feedback'
import { t } from '../../shared/content'
import { Button, ErrorState } from '../../shared/ui'

export type Collection = components['schemas']['CollectionRead']
export type Detail = components['schemas']['CollectionDetail']
export function useCollections(cursor='',page=1) {
  const {userId}=useAuth()
  return useQuery({queryKey:['private',userId,'collections',cursor,page],enabled:Boolean(userId),queryFn:({signal})=>api<components['schemas']['CollectionList']>(`/me/collections${cursor?'?cursor='+encodeURIComponent(cursor):'?page='+page}`,{signal,accountId:userId!})})
}
export function useCollection(id:string,offset=0) {
  const {userId}=useAuth()
  return useQuery({queryKey:['private',userId,'collection',id,offset],enabled:Boolean(userId&&id),queryFn:({signal})=>api<Detail>(`/me/collections/${id}?offset=${offset}`,{signal,accountId:userId!})})
}
export function useCollectionWrite() {
  const {userId}=useAuth()
  const queries=useQueryClient(),notify=useFeedback()
  return useMutation({scope:{id:`collections:${userId}`},mutationFn:({path,method,body}:{path:string;method:string;body?:unknown})=>api<Detail|{deleted:boolean}>(path,{method,accountId:userId!,body:body===undefined?undefined:JSON.stringify(body)}),onSuccess:()=>notify(t('collections.saved')),onError:(error:Error)=>notify(error.message),onSettled:()=>{void queries.invalidateQueries({queryKey:['private',userId]})}})
}
export function CollectionPicker({media}:{media:Media}) {
  const {userId}=useAuth()
  const collections=useCollections()
  const write=useCollectionWrite()
  const [id,setId]=useState('')
  if(!userId)return null
  if(collections.error)return <ErrorState error={collections.error} retry={()=>{void collections.refetch()}}/>
  if(!collections.data?.data.length)return null
  const collection=collections.data.data.find(c=>c.id===id)
  return <div className="my-6 flex flex-wrap items-end gap-3"><label className="text-sm">{t('collections.choose')}<select className="ml-3 min-h-11 rounded border border-line px-3" value={id} onChange={e=>setId(e.target.value)}><option value="">{t('collections.choose')}</option>{collections.data.data.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><Button variant="secondary" disabled={!collection||write.isPending} onClick={()=>{if(collection)write.mutate({path:`/me/collections/${id}/items/${media.id}`,method:'PUT',body:{expected_version:collection.version,position:collection.total}})}}>{t('collections.add')}</Button></div>
}
