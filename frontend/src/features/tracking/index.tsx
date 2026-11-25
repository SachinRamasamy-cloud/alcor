import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Media } from '../../shared/api/client'
import type { components } from '../../shared/api/schema'
import { useAuth } from '../../shared/auth'
import { useFeedback } from '../../shared/feedback'
import { t } from '../../shared/content'
import { Button, ErrorState, Loading, Modal, Pagination } from '../../shared/ui'

type Session = components['schemas']['SessionRead']
type Index = { id: string; media_id: string; kind: 'initial' | 'repeat'; active: boolean; version: number }
export function Tracker({ media }: { media: Media }) {
  const { userId, requireSignIn } = useAuth()
  const queries = useQueryClient()
  const notify = useFeedback()
  const [selected, setSelected] = useState('')
  const [offset, setOffset] = useState(0)
  const [labels, setLabels] = useState('')
  const [skipCounts, setSkipCounts] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [details,setDetails]=useState<{key:string;rating:number|null;notes:string;version:number}|null>(null)
  const [checked, setChecked] = useState<string[]>([])
  const route = media.media_type === 'anime' ? 'watch-sessions' : 'reading-sessions'
  const unit = media.media_type === 'anime' ? 'episodes' : 'chapters'
  const done = media.media_type === 'anime' ? 'watched' : 'read'
  const index = useQuery({ queryKey: ['private',userId,'tracking',media.id], enabled: Boolean(userId), queryFn: ({signal}) => api<Index[]>(`/me/${route}?media_id=${media.id}`,{signal,accountId:userId!}) })
  const id = selected || index.data?.find(s=>s.active)?.id || index.data?.[0]?.id || ''
  const session = useQuery({ queryKey: ['private',userId,'session',id,offset], enabled: Boolean(userId && id), queryFn:({signal})=>api<Session>(`/me/${route}/${id}/${unit}?offset=${offset}`,{signal,accountId:userId!}) })
  const write = useMutation({
    scope: {id:`tracking:${userId}:${media.id}`},
    mutationFn: ({path,body,method='POST'}:{path:string;body:unknown;method?:string}) => api<Session>(path,{accountId:userId!,method,body:JSON.stringify(body)}),
    onSuccess: (value, variables) => { setSelected(value.id);setChecked([]);setConfirm(false);setDetails(null);setLabels('');if (value.version !== (variables.body as {expected_version?:number}).expected_version) notify(t('tracking.saved')) },
    onError:(error:Error)=>notify(error.message),
    onSettled:()=>{void queries.invalidateQueries({queryKey:['private',userId]})},
  })
  function start(repeat=false) {
    const manual = labels.split(/[\n,]/).map(s=>s.trim()).filter(Boolean)
    write.mutate({path:`/me/${route}`,body:{media_id:media.id,request_id:crypto.randomUUID(),repeat,skip_counts:skipCounts,manual_labels:manual}})
    setOffset(0)
  }
  function mark(keys:string[],state:string) {
    if (!session.data) return
    write.mutate({path:`/me/${route}/${id}/${unit}/bulk`,body:{expected_version:session.data.version,keys,state}})
  }
  const manualForm = <div className="my-5 rounded border border-line p-4"><label className="block text-sm">{t('tracking.manualLabels')}<textarea className="mt-2 block min-h-20 w-full rounded border border-line p-3" value={labels} onChange={e=>setLabels(e.target.value)} /></label><p className="mt-2 text-xs text-muted">{t('tracking.manualHelp')}</p><label className="my-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={skipCounts} onChange={e=>setSkipCounts(e.target.checked)} />{t('tracking.skipPolicy')}</label></div>
  if (!userId) return <div className="mt-6"><Button variant="secondary" onClick={()=>requireSignIn('progress')}>{t('tracking.track')}</Button></div>
  return <section className="mt-8 border-t border-line pt-6"><h2 className="text-xl font-medium">{t('tracking.progress')}</h2>
    {index.isPending ? <Loading variant="tracking"/> : index.error ? <ErrorState error={index.error} retry={()=>{void index.refetch()}}/> : <>
      {index.data.length>0 && <label className="my-4 block text-sm">{t('tracking.session')}<select className="ml-3 min-h-11 rounded border border-line px-3" value={id} onChange={e=>{setSelected(e.target.value);setOffset(0);setChecked([])}}>{index.data.map((s,i)=><option key={s.id} value={s.id}>{t(s.kind==='repeat'?'tracking.repeat':'tracking.initial')} {i+1}{s.active?` · ${t('tracking.active')}`:''}</option>)}</select></label>}
      {!id ? <>{manualForm}<Button disabled={write.isPending} onClick={()=>start()}>{t('tracking.start')}</Button></> : session.isPending ? <Loading variant="tracking"/> : session.error ? <ErrorState error={session.error} retry={()=>{void session.refetch()}}/> : <>
        <p className="my-4 text-sm" role="status">{t('tracking.counts',{done:session.data.summary.done,skipped:session.data.summary.skipped,remaining:session.data.summary.remaining})}</p>
        {!session.data.coverage_complete && <p className="my-3 text-xs text-muted">{t('tracking.unknownCoverage')}</p>}
        {session.data.summary.caught_up && <p>{t('tracking.caughtUp')}</p>}
        {session.data.active && session.data.summary.next_key && <Button disabled={write.isPending} variant="secondary" onClick={()=>mark([session.data.summary.next_key!],done)}>{t('tracking.next',{label:session.data.summary.next_key})}</Button>}
        <ul className="my-5 divide-y divide-line">{session.data.units.map(u=><li key={u.key} className="flex flex-wrap items-center gap-3 py-3 text-sm"><label className="flex min-h-11 items-center gap-3"><input aria-label={t('tracking.select',{label:u.label})} type="checkbox" disabled={!session.data.active||!u.released} checked={checked.includes(u.key)} onChange={e=>setChecked(e.target.checked?[...checked,u.key]:checked.filter(k=>k!==u.key))}/><span>{u.label}</span></label><span className="mr-auto">{u.title}</span><span className="text-xs text-muted">{t(`tracking.${u.state}`)}</span><Button variant="ghost" aria-label={t('personal.unitDetailsLabel',{label:u.label})} onClick={()=>setDetails({key:u.key,rating:u.rating??null,notes:u.notes??'',version:session.data.version})}>{t('personal.unitDetails')}</Button>{session.data.active&&u.released&&<><Button variant="ghost" disabled={write.isPending} onClick={()=>mark([u.key],done)}>{t(media.media_type==='anime'?'tracking.markWatched':'tracking.markRead')}</Button><Button variant="ghost" disabled={write.isPending} onClick={()=>mark([u.key],'skipped')}>{t('tracking.skip')}</Button><Button variant="ghost" disabled={write.isPending||u.state==='unresolved'} onClick={()=>mark([u.key],'unresolved')}>{t('tracking.unmark')}</Button></>}</li>)}</ul>
        {checked.length>0&&<div className="my-4 flex flex-wrap gap-3"><Button disabled={write.isPending} onClick={()=>mark(checked,done)}>{t('tracking.markSelected')}</Button><Button disabled={write.isPending} variant="secondary" onClick={()=>mark(checked,'skipped')}>{t('tracking.skipSelected')}</Button></div>}
        <Pagination page={Math.floor(offset/100)+1} totalPages={Math.max(1,Math.ceil((session.data.total_units??session.data.units.length)/100))} onChange={page=>{setOffset((page-1)*100);setChecked([])}}/>
        {session.data.active ? <><Button variant="secondary" disabled={write.isPending} onClick={()=>setConfirm(true)}>{t('tracking.complete')}</Button>{manualForm}<Button variant="secondary" disabled={write.isPending||!labels.trim()} onClick={()=>write.mutate({path:`/me/media/${media.id}/manual-${unit}`,body:{media_id:media.id,session_id:id,request_id:crypto.randomUUID(),expected_version:session.data.version,manual_labels:labels.split(/[\n,]/).map(s=>s.trim()).filter(Boolean)}})}>{t('tracking.addManual')}</Button></> : <>{manualForm}<Button disabled={write.isPending} onClick={()=>start(true)}>{t(media.media_type==='anime'?'tracking.rewatch':'tracking.reread')}</Button></>}
        <Modal open={Boolean(details)} onOpenChange={open=>{if(!open)setDetails(null)}} title={t('personal.unitDetails')}>
          {details&&<form onSubmit={e=>{e.preventDefault();write.mutate({path:`/me/${route}/${id}/${unit}/${encodeURIComponent(details.key)}/details`,method:'PUT',body:{expected_version:details.version,rating:details.rating,notes:details.notes}})}}><label className="block text-sm">{t('personal.rating')}<select className="ml-3 min-h-11 border border-line rounded px-3" value={details.rating??''} onChange={e=>setDetails({...details,rating:e.target.value?Number(e.target.value):null})}><option value="">{t('media.notRated')}</option>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label><label className="my-5 block text-sm">{t('personal.notes')}<textarea className="mt-2 block min-h-24 w-full border border-line rounded p-3" maxLength={10000} value={details.notes} onChange={e=>setDetails({...details,notes:e.target.value})}/></label><Button disabled={write.isPending}>{t('common.save')}</Button></form>}
        </Modal>
        <Modal open={confirm} onOpenChange={setConfirm} title={t('tracking.completeQuestion')} description={t('tracking.completeHelp')}><div className="flex gap-3"><Button variant="secondary" onClick={()=>setConfirm(false)}>{t('common.cancel')}</Button><Button disabled={write.isPending} onClick={()=>write.mutate({path:`/me/${route}/${id}/complete`,body:{expected_version:session.data.version}})}>{t('tracking.complete')}</Button></div></Modal>
      </>}
    </>}
  </section>
}
