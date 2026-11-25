import { PersonalNav } from '../widgets/personal-nav'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../shared/auth'
import { useCollection, useCollections, useCollectionWrite } from '../features/collections'
import { MediaCard } from '../entities/media'
import { t } from '../shared/content'
import { Button, ErrorState, Loading, Modal } from '../shared/ui'

export function CollectionsPage() {
  const {userId,requireSignIn}=useAuth()
  const {id=''}=useParams()
  const [params,setParams]=useSearchParams()
  const [page,setPage]=useState({id,offset:0})
  const offset=page.id===id?page.offset:0
  const setOffset=(offset:number)=>setPage({id,offset})
  const list=useCollections(params.get('cursor')??'')
  const detail=useCollection(id,offset)
  const write=useCollectionWrite()
  const [name,setName]=useState('')
  const [deleting,setDeleting]=useState(false)
  const data=detail.data
  return <div className="shell page-body"><PersonalNav/><div className="page-heading"><h1>{data?.name??t('collections.title')}</h1><Link className="subtle-link" to="/library">{t('nav.library')}</Link></div>
    {!userId?<div className="state-box"><p>{t('auth.library')}</p><Button onClick={()=>requireSignIn()}>{t('nav.signIn')}</Button></div>:<>
      <form className="my-6 flex flex-wrap gap-3" onSubmit={e=>{e.preventDefault();if(id&&data)write.mutate({path:`/me/collections/${id}`,method:'PATCH',body:{name,expected_version:data.version}});else write.mutate({path:'/me/collections',method:'POST',body:{name,request_id:crypto.randomUUID()}});setName('')}}><label className="text-sm">{t('collections.name')}<input className="ml-3 min-h-11 rounded border border-line px-3" maxLength={100} value={name} onChange={e=>setName(e.target.value)} required/></label><Button disabled={!name.trim()||write.isPending}>{t(id?'collections.rename':'collections.create')}</Button>{id&&<Button type="button" variant="secondary" onClick={()=>setDeleting(true)}>{t('collections.delete')}</Button>}</form>
      {id?(detail.isPending?<Loading variant="collection-detail"/>:detail.error?<ErrorState error={detail.error} retry={()=>{void detail.refetch()}}/>:<><div className="media-grid">{data!.items.map(item=><div key={item.media.id}><MediaCard media={item.media}/><form className="my-3 flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();const position=Number(new FormData(e.currentTarget).get('position'));write.mutate({path:`/me/collections/${id}/items/${item.media.id}`,method:'PUT',body:{expected_version:data!.version,position}})}}><label className="text-xs">{t('collections.position')}<input className="ml-2 min-h-11 w-16 rounded border border-line px-2" key={item.position} type="number" min={0} max={100000} name="position" defaultValue={item.position}/></label><Button variant="secondary" disabled={write.isPending}>{t('common.save')}</Button><Button type="button" variant="ghost" disabled={write.isPending} onClick={()=>write.mutate({path:`/me/collections/${id}/items/${item.media.id}?expected_version=${data!.version}`,method:'DELETE'})}>{t('common.remove')}</Button></form></div>)}</div>{!data!.items.length&&<p className="my-8 text-sm text-muted">{t('collections.noItems')}</p>}<div className="pagination">{offset>0&&<Button variant="secondary" onClick={()=>setOffset(Math.max(0,offset-100))}>{t('common.back')}</Button>}{data!.next_offset!==null&&<Button variant="secondary" onClick={()=>setOffset(data!.next_offset!)}>{t('catalogue.more')}</Button>}</div></>):(list.isPending?<Loading variant="collections"/>:list.error?<ErrorState error={list.error} retry={()=>{void list.refetch()}}/>:<><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.data.data.map(c=><Link key={c.id} to={`/collections/${c.id}`} className="rounded border border-line p-6"><h2 className="text-lg font-medium">{c.name}</h2><p className="mt-3 text-sm text-muted">{t('collections.count',{count:c.total})}</p></Link>)}</div>{!list.data.data.length&&<p>{t('collections.empty')}</p>}<div className="pagination">{params.has('cursor')&&<Button variant="secondary" onClick={()=>setParams({})}>{t('catalogue.back')}</Button>}{list.data.next_cursor&&<Button variant="secondary" onClick={()=>setParams({cursor:list.data.next_cursor!})}>{t('catalogue.more')}</Button>}</div></>)}
    </>}
    <Modal open={deleting} onOpenChange={setDeleting} title={t('collections.deleteQuestion')} description={t('collections.deleteHelp')}><div className="flex gap-3"><Button variant="secondary" onClick={()=>setDeleting(false)}>{t('common.cancel')}</Button><Button disabled={write.isPending||!data} onClick={()=>{if(data)write.mutate({path:`/me/collections/${id}?expected_version=${data.version}`,method:'DELETE'},{onSuccess:()=>{setDeleting(false);window.location.assign('/collections')}})}}>{t('collections.delete')}</Button></div></Modal>
  </div>
}
