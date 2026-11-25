import { MoreHorizontal } from 'lucide-react'
import type { Media } from '../shared/api/client'
import { PersonalNav } from '../widgets/personal-nav'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../shared/auth'
import { useCollection, useCollections, useCollectionWrite } from '../features/collections'
import { MediaCard } from '../entities/media'
import { t } from '../shared/content'
import { Button, ErrorState, Loading, Modal, Pagination } from '../shared/ui'

export function CollectionsPage() {
  const {userId,requireSignIn}=useAuth()
  const {id=''}=useParams()
  const [params,setParams]=useSearchParams()
  const [page,setPage]=useState({id,offset:0})
  const offset=page.id===id?page.offset:0
  const setOffset=(offset:number)=>setPage({id,offset})
  const list=useCollections(params.get('cursor')??'',Number(params.get('page'))||1)
  const detail=useCollection(id,offset)
  const write=useCollectionWrite()
  const [name,setName]=useState('')
  const [deleting,setDeleting]=useState(false)
  const [managedItem,setManagedItem]=useState<{media:Media;position:number;version:number}|null>(null)
  const data=detail.data
  return <div className="shell page-body personal-page"><PersonalNav/><div className="page-heading"><h1>{data?.name??t('collections.title')}</h1><Link className="subtle-link" to="/library">{t('nav.library')}</Link></div>
    {!userId?<div className="state-box"><p>{t('auth.library')}</p><Button onClick={()=>requireSignIn()}>{t('nav.signIn')}</Button></div>:<>
      <form className="personal-toolbar" onSubmit={e=>{e.preventDefault();if(id&&data)write.mutate({path:`/me/collections/${id}`,method:'PATCH',body:{name,expected_version:data.version}});else write.mutate({path:'/me/collections',method:'POST',body:{name,request_id:crypto.randomUUID()}});setName('')}}><label className="text-sm">{t('collections.name')}<input className="ml-3 min-h-11 rounded border border-line px-3" maxLength={100} value={name} onChange={e=>setName(e.target.value)} required/></label><Button disabled={!name.trim()||write.isPending}>{t(id?'collections.rename':'collections.create')}</Button>{id&&<Button type="button" variant="secondary" onClick={()=>setDeleting(true)}>{t('collections.delete')}</Button>}</form>
      {id?(detail.isPending?<Loading variant="collection-detail"/>:detail.error?<ErrorState error={detail.error} retry={()=>{void detail.refetch()}}/>:<><div className="media-grid">{data!.items.map(item=><MediaCard key={item.media.id} media={item.media} context={<span className="personal-card-status">{t('collections.position')}: {item.position}</span>} actions={<button className="card-save" aria-label={t('media.manageLabel',{title:item.media.title})} onClick={()=>setManagedItem({...item,version:data!.version})}><MoreHorizontal size={18}/></button>}/>)}</div>{!data!.items.length&&<p className="my-8 text-sm text-muted">{t('collections.noItems')}</p>}<Pagination page={Math.floor(offset/100)+1} totalPages={Math.max(1,Math.ceil(data!.total/100))} onChange={page=>setOffset((page-1)*100)}/></>):(list.isPending?<Loading variant="collections"/>:list.error?<ErrorState error={list.error} retry={()=>{void list.refetch()}}/>:<><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.data.data.map(c=><Link key={c.id} to={`/collections/${c.id}`} className="rounded border border-line p-6"><h2 className="text-lg font-medium">{c.name}</h2><p className="mt-3 text-sm text-muted">{t('collections.count',{count:c.total})}</p></Link>)}</div>{!list.data.data.length&&<p>{t('collections.empty')}</p>}<Pagination page={list.data.page??1} totalPages={list.data.total_pages??1} onChange={page=>setParams({page:String(page)})}/></>)}
    </>}
    <Modal open={Boolean(managedItem)} onOpenChange={open=>{if(!open)setManagedItem(null)}} title={managedItem?.media.title??t('collections.title')}><form className="personal-form" onSubmit={e=>{e.preventDefault();if(managedItem&&data)write.mutate({path:`/me/collections/${id}/items/${managedItem.media.id}`,method:'PUT',body:{expected_version:managedItem.version,position:Number(new FormData(e.currentTarget).get('position'))}},{onSuccess:()=>setManagedItem(null)})}}><label>{t('collections.position')}<input key={managedItem?.media.id} type="number" min={0} max={100000} name="position" defaultValue={managedItem?.position}/></label><div className="personal-dialog-actions"><Button disabled={write.isPending}>{t('common.save')}</Button><Button type="button" variant="secondary" disabled={write.isPending} onClick={()=>{if(managedItem&&data)write.mutate({path:`/me/collections/${id}/items/${managedItem.media.id}?expected_version=${managedItem.version}`,method:'DELETE'},{onSuccess:()=>setManagedItem(null)})}}>{t('common.remove')}</Button></div></form></Modal>
    <Modal open={deleting} onOpenChange={setDeleting} title={t('collections.deleteQuestion')} description={t('collections.deleteHelp')}><div className="flex gap-3"><Button variant="secondary" onClick={()=>setDeleting(false)}>{t('common.cancel')}</Button><Button disabled={write.isPending||!data} onClick={()=>{if(data)write.mutate({path:`/me/collections/${id}?expected_version=${data.version}`,method:'DELETE'},{onSuccess:()=>{setDeleting(false);window.location.assign('/collections')}})}}>{t('collections.delete')}</Button></div></Modal>
  </div>
}
