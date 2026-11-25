import { useState } from 'react'
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { useLocation,useNavigate } from 'react-router-dom'
import { api,type Media } from '../../shared/api/client'
import type { components } from '../../shared/api/schema'
import { useAuth } from '../../shared/auth'
import { useFeedback } from '../../shared/feedback'
import { t } from '../../shared/content'
import { Button,ErrorState,Modal } from '../../shared/ui'

type Preset=components['schemas']['FilterRead']
const arrays=['include_genres','exclude_genres','include_themes','exclude_themes']
const numeric=['year','year_from','year_to','score_min','units_max','limit']
export function queryFromParams(params:URLSearchParams,path:string){
  const query:Record<string,unknown>={}
  for(const [key,value] of params){if(key==='cursor')continue;if(arrays.includes(key))query[key]=params.getAll(key);else if(numeric.includes(key))query[key]=Number(value);else if(['memory','include_planned'].includes(key))query[key]=value==='true';else query[key]=value}
  if(path==='/anime'||path==='/manga')query.media_type=path.slice(1)
  return query
}
export function paramsFromQuery(query:Preset['query']){
  const params=new URLSearchParams()
  for(const [key,value] of Object.entries(query)){if(value===null||value===undefined||value===''||key==='cursor'||key==='media_type')continue;if(Array.isArray(value))value.forEach(v=>params.append(key,String(v)));else params.set(key,String(value))}
  return params
}
export function DiscoveryControls({params,onChange}:{params:URLSearchParams;onChange:(params:URLSearchParams)=>void}){
  const {userId,requireSignIn}=useAuth()
  const location=useLocation(),navigate=useNavigate()
  const queries=useQueryClient(),notify=useFeedback()
  const [name,setName]=useState(''),[selected,setSelected]=useState(''),[deleting,setDeleting]=useState(false),[random,setRandom]=useState<Media|null>(null)
  const presets=useQuery({queryKey:['private',userId,'saved-filters'],enabled:Boolean(userId),queryFn:({signal})=>api<Preset[]>('/me/saved-filters',{signal,accountId:userId!})})
  const preset=presets.data?.find(p=>p.id===selected)
  const write=useMutation({mutationFn:({path,method,body}:{path:string;method:string;body?:unknown})=>api(path,{accountId:userId!,method,body:body===undefined?undefined:JSON.stringify(body)}),onSuccess:()=>{notify(t('discovery.presetSaved'));setDeleting(false)},onError:(error:Error)=>notify(error.message),onSettled:()=>{void queries.invalidateQueries({queryKey:['private',userId,'saved-filters']})}})
  const pick=useMutation({mutationFn:()=>{const query=new URLSearchParams(params);query.delete('mode');query.delete('include_planned');return api<Media>(`/discover/random?${query}`)},onSuccess:value=>setRandom(value),onError:(error:Error)=>notify(error.message)})
  function applyPreset(id:string){setSelected(id);const value=presets.data?.find(p=>p.id===id);if(!value)return;setName(value.name);const target=value.query.media_type?`/${value.query.media_type}`:'/discover';navigate(`${target}?${paramsFromQuery(value.query)}`)}
  return <div className="my-5 space-y-5">
    <div className="flex flex-wrap items-center gap-3"><label className="text-sm">{t('discovery.mode')}<select className="ml-3 min-h-11 rounded border border-line px-3" value={params.get('mode')??'all'} onChange={e=>{const next=new URLSearchParams(params);next.set('mode',e.target.value);next.delete('cursor');onChange(next)}}><option value="all">{t('discovery.all')}</option><option value="hide_watched">{t('discovery.hideWatched')}</option><option value="new_to_me">{t('discovery.newToMe')}</option></select></label><Button variant="secondary" disabled={pick.isPending} onClick={()=>pick.mutate()}>{t('discovery.random')}</Button></div>
    {!userId&&params.get('mode')&&params.get('mode')!=='all'&&<div className="flex flex-wrap items-center gap-3 text-sm"><p>{t('discovery.guestFilter')}</p><Button variant="secondary" onClick={()=>requireSignIn()}>{t('nav.signIn')}</Button></div>}
    <details className="rounded border border-line p-4"><summary className="min-h-8 cursor-pointer text-sm">{t('discovery.advanced')}</summary><form key={params.toString()} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={e=>{e.preventDefault();const values=new FormData(e.currentTarget),next=new URLSearchParams(params);for(const key of [...arrays,'year_from','year_to','score_min','units_max','studio','status','season','memory']){next.delete(key);const value=String(values.get(key)??'');if(arrays.includes(key))value.split(',').map(v=>v.trim()).filter(Boolean).forEach(v=>next.append(key,v));else if(value)next.set(key,value)}next.delete('cursor');onChange(next)}}>
      {([['include_genres','discovery.includeGenres'],['exclude_genres','discovery.excludeGenres'],['include_themes','discovery.includeThemes'],['exclude_themes','discovery.excludeThemes']] as const).map(([key,label])=><label className="text-xs" key={key}>{t(label)}<input className="mt-2 block min-h-11 w-full rounded border border-line px-3" name={key} defaultValue={params.getAll(key).join(', ')} maxLength={1000}/></label>)}
      {([['year_from','discovery.yearFrom',1900,2200,1],['year_to','discovery.yearTo',1900,2200,1],['score_min','discovery.scoreMin',0,10,0.1],['units_max','discovery.unitsMax',1,100000,1]] as const).map(([key,label,min,max,step])=><label className="text-xs" key={key}>{t(label)}<input className="mt-2 block min-h-11 w-full rounded border border-line px-3" name={key} type="number" min={min} max={max} step={step} defaultValue={params.get(key)??''}/></label>)}
      <label className="text-xs">{t('media.studio')}<input className="mt-2 block min-h-11 w-full rounded border border-line px-3" name="studio" defaultValue={params.get('studio')??''} maxLength={100}/></label><label className="text-xs">{t('media.status')}<input className="mt-2 block min-h-11 w-full rounded border border-line px-3" name="status" defaultValue={params.get('status')??''} maxLength={60}/></label><label className="text-xs">{t('discovery.season')}<select className="mt-2 block min-h-11 w-full rounded border border-line px-3" name="season" defaultValue={params.get('season')??''}><option value="">{t('discovery.anySeason')}</option>{(['winter','spring','summer','fall'] as const).map(s=><option key={s} value={s}>{t(`discovery.${s}`)}</option>)}</select></label><label className="flex items-center gap-3 text-sm"><input type="checkbox" name="memory" value="true" defaultChecked={params.get('memory')==='true'}/>{t('discovery.memory')}</label><Button>{t('discovery.apply')}</Button>
    </form></details>
    {userId&&<div className="rounded border border-line p-4"><h2 className="mb-4 text-sm font-medium">{t('discovery.presets')}</h2>{presets.error?<ErrorState error={presets.error} retry={()=>{void presets.refetch()}}/>:<div className="flex flex-wrap items-center gap-3"><label className="text-xs">{t('discovery.choosePreset')}<select className="ml-3 min-h-11 rounded border border-line px-3" value={selected} onChange={e=>applyPreset(e.target.value)}><option value="">{t('discovery.choosePreset')}</option>{presets.data?.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="text-xs">{t('discovery.presetName')}<input className="ml-3 min-h-11 rounded border border-line px-3" value={name} onChange={e=>setName(e.target.value)} maxLength={100}/></label><Button variant="secondary" disabled={!name.trim()||write.isPending} onClick={()=>write.mutate({path:'/me/saved-filters',method:'POST',body:{name,query:queryFromParams(params,location.pathname),request_id:crypto.randomUUID()}})}>{t('discovery.saveNew')}</Button>{preset&&<><Button variant="secondary" disabled={!name.trim()||write.isPending} onClick={()=>write.mutate({path:`/me/saved-filters/${preset.id}`,method:'PATCH',body:{name,query:queryFromParams(params,location.pathname),expected_version:preset.version}})}>{t('common.save')}</Button><Button variant="ghost" onClick={()=>setDeleting(true)}>{t('common.remove')}</Button></>}</div>}</div>}
    <Modal open={Boolean(random)} onOpenChange={open=>{if(!open)setRandom(null)}} title={random?.title??t('discovery.random')} description={t('catalogue.coverage')}>{random&&<Button onClick={()=>{navigate(`/${random.media_type}/${random.id}`);setRandom(null)}}>{t('home.details')}</Button>}</Modal>
    <Modal open={deleting} onOpenChange={setDeleting} title={t('discovery.removePreset')}><div className="flex gap-3"><Button variant="secondary" onClick={()=>setDeleting(false)}>{t('common.cancel')}</Button><Button disabled={!preset||write.isPending} onClick={()=>{if(preset)write.mutate({path:`/me/saved-filters/${preset.id}?expected_version=${preset.version}`,method:'DELETE'})}}>{t('common.remove')}</Button></div></Modal>
  </div>
}
