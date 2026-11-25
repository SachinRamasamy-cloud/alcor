import {supportsSavedFilters} from '../catalogue/custom-filters'
import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { useLocation,useNavigate } from 'react-router-dom'
import { api,type Media } from '../../shared/api/client'
import type { components } from '../../shared/api/schema'
import { useBackend } from '../../shared/api/backend'
import { useAuth } from '../../shared/auth'
import { useFeedback } from '../../shared/feedback'
import { t } from '../../shared/content'
import { Button,ErrorState,Modal } from '../../shared/ui'

type Preset=components['schemas']['FilterRead']
const arrays=['include_genres','exclude_genres','include_themes','exclude_themes']
const numeric=['year','year_from','year_to','score_min','units_max','limit']
export function queryFromParams(params:URLSearchParams,path:string){
  if(!supportsSavedFilters(params))throw new Error(t('catalogue.multiPresetLimit'))
  const query:Record<string,unknown>={}
  for(const [key,value] of params){if(key==='cursor'||key==='page')continue;if(arrays.includes(key))query[key]=params.getAll(key);else if(numeric.includes(key))query[key]=Number(value);else if(['memory','include_planned','has_score','has_image'].includes(key))query[key]=value==='true';else query[key]=value}
  if(path==='/anime'||path==='/manga')query.media_type=path.slice(1)
  else if(['anime','manga'].includes(params.get('type')??''))query.media_type=params.get('type')
  delete query.type
  return query
}
export function paramsFromQuery(query:Preset['query']){
  const params=new URLSearchParams()
  for(const [key,value] of Object.entries(query)){if(value===null||value===undefined||value===''||key==='cursor'||key==='page'||key==='media_type')continue;if(Array.isArray(value))value.forEach(v=>params.append(key,String(v)));else params.set(key,String(value))}
  return params
}
export function DiscoveryControls({params,onChange,items=[]}:{params:URLSearchParams;onChange:(params:URLSearchParams)=>void;items?:Media[]}){
  const {userId,requireSignIn}=useAuth()
  const multi=!supportsSavedFilters(params)
  const {ready}=useBackend()
  const location=useLocation(),navigate=useNavigate()
  const queries=useQueryClient(),notify=useFeedback()
  const [name,setName]=useState(''),[selected,setSelected]=useState(''),[deleting,setDeleting]=useState(false),[random,setRandom]=useState<Media|null>(null)
  const presets=useQuery({queryKey:['private',userId,'saved-filters'],enabled:Boolean(userId&&ready),queryFn:({signal})=>api<Preset[]>('/me/saved-filters',{signal,accountId:userId!})})
  const [open,setOpen]=useState(false)
  const preset=presets.data?.find(p=>p.id===selected)
  const write=useMutation({mutationFn:({path,method,body}:{path:string;method:string;body?:unknown})=>api(path,{accountId:userId!,method,body:body===undefined?undefined:JSON.stringify(body)}),onSuccess:()=>{notify(t('discovery.presetSaved'));setDeleting(false)},onError:(error:Error)=>notify(error.message),onSettled:()=>{void queries.invalidateQueries({queryKey:['private',userId,'saved-filters']})}})
  const pick = () => { if(items.length){setOpen(false);setRandom(items[Math.floor(Math.random()*items.length)])} }
  function applyPreset(id:string){setSelected(id);const value=presets.data?.find(p=>p.id===id);if(!value)return;setName(value.name);const target=value.query.media_type?`/${value.query.media_type}`:'/discover';navigate(`${target}?${paramsFromQuery(value.query)}`)}
  return <><button type="button" className="discovery-toggle icon-button" title={t('discovery.options')} aria-label={t('discovery.options')} aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}><SlidersHorizontal size={19}/></button><Modal open={open} onOpenChange={setOpen} title={t('discovery.options')} className="discovery-dialog"><div className="discovery-controls">
    <div className="discovery-mode-row"><label className="discovery-field"><span>{t('discovery.mode')}</span><select value={params.get('mode')??'all'} onChange={e=>{const next=new URLSearchParams(params);next.set('mode',e.target.value);next.delete('cursor');next.delete('page');onChange(next);setOpen(false)}}><option value="all">{t('discovery.all')}</option><option disabled={!userId||!ready} value="hide_watched">{t('discovery.hideWatched')}</option><option disabled={!userId||!ready} value="new_to_me">{t('discovery.newToMe')}</option></select></label><Button variant="secondary" disabled={!items.length} onClick={pick}>{t('discovery.randomScope')}</Button></div>
    {(!userId||!ready)&&params.get('mode')&&params.get('mode')!=='all'&&<div className="flex flex-wrap items-center gap-3 text-sm"><p>{t(userId?'discovery.backendFilter':'discovery.guestFilter')}</p><Button variant="secondary" onClick={()=>requireSignIn()}>{t('nav.signIn')}</Button></div>}
    <section className="discovery-advanced"><h2>{t('discovery.advanced')}</h2><p className="discovery-help">{t('discovery.sourceLimits')}</p><form key={params.toString()} className="discovery-filter-form" onSubmit={e=>{e.preventDefault();const values=new FormData(e.currentTarget),next=new URLSearchParams(params);for(const key of [...arrays,'year_from','year_to','score_min','units_max','studio','status','season','memory','genre_match','has_score','has_image']){next.delete(key);const value=String(values.get(key)??'');if(arrays.includes(key)||key==='season'||key==='status')value.split(',').map(v=>v.trim()).filter(Boolean).forEach(v=>next.append(key,v));else if(value)next.set(key,value)}next.delete('cursor');next.delete('page');onChange(next);setOpen(false)}}>
      {([['include_genres','discovery.includeGenres'],['exclude_genres','discovery.excludeGenres'],['include_themes','discovery.includeThemes'],['exclude_themes','discovery.excludeThemes']] as const).map(([key,label])=><label className="discovery-field" key={key}><span>{t(label)}</span><input name={key} defaultValue={params.getAll(key).join(', ')} maxLength={1000}/></label>)}
      {([['year_from','discovery.yearFrom',1900,2200,1],['year_to','discovery.yearTo',1900,2200,1],['score_min','discovery.scoreMin',0,10,0.1],['units_max','discovery.unitsMax',1,100000,1]] as const).map(([key,label,min,max,step])=><label className="discovery-field" key={key}><span>{t(label)}</span><input name={key} type="number" min={min} max={max} step={step} defaultValue={params.get(key)??''}/></label>)}
      <label className="discovery-field"><span>{t('media.studio')}</span><input name="studio" defaultValue={params.get('studio')??''} maxLength={100}/></label>
      <label className="discovery-field"><span>{t('media.status')}</span><input name="status" defaultValue={params.getAll('status').join(', ')} maxLength={60}/></label>
      <label className="discovery-field"><span>{t('discovery.season')}</span><input name="season" defaultValue={params.getAll('season').join(', ')} maxLength={100}/></label>
      <label className="discovery-field"><span>{t('discovery.genreMatch')}</span><select name="genre_match" defaultValue={params.get('genre_match')??'all'}><option value="all">{t('discovery.matchAll')}</option><option value="any">{t('discovery.matchAny')}</option></select></label>
      <div className="discovery-checks"><label><input type="checkbox" name="memory" disabled={!userId||!ready||multi} title={multi?t('catalogue.multiPresetLimit'):t('discovery.backendFilter')} value="true" defaultChecked={params.get('memory')==='true'}/><span>{t('discovery.memory')}</span></label>{(['has_score','has_image'] as const).map(key=><label key={key}><input type="checkbox" name={key} value="true" defaultChecked={params.get(key)==='true'}/><span>{t(key==='has_score'?'discovery.ratedOnly':'discovery.coversOnly')}</span></label>)}</div>
      <div className="discovery-form-actions"><Button>{t('discovery.apply')}</Button></div>
    </form></section>
    {userId&&ready&&<section className="discovery-presets"><h2>{t('discovery.presets')}</h2>{multi&&<p className="discovery-help">{t('catalogue.multiPresetLimit')}</p>}{presets.error?<ErrorState error={presets.error} retry={()=>{void presets.refetch()}}/>:<div className="discovery-presets-grid"><label className="discovery-field"><span>{t('discovery.choosePreset')}</span><select value={selected} onChange={e=>applyPreset(e.target.value)}><option value="">{t('discovery.choosePreset')}</option>{presets.data?.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="discovery-field"><span>{t('discovery.presetName')}</span><input value={name} onChange={e=>setName(e.target.value)} maxLength={100}/></label><div className="discovery-preset-actions"><Button variant="secondary" disabled={multi||!name.trim()||write.isPending} onClick={()=>write.mutate({path:'/me/saved-filters',method:'POST',body:{name,query:queryFromParams(params,location.pathname),request_id:crypto.randomUUID()}})}>{t('discovery.saveNew')}</Button>{preset&&<><Button variant="secondary" disabled={multi||!name.trim()||write.isPending} onClick={()=>write.mutate({path:`/me/saved-filters/${preset.id}`,method:'PATCH',body:{name,query:queryFromParams(params,location.pathname),expected_version:preset.version}})}>{t('common.save')}</Button><Button variant="ghost" onClick={()=>{setOpen(false);setDeleting(true)}}>{t('common.remove')}</Button></>}</div></div>}</section>}
    </div></Modal><Modal open={Boolean(random)} onOpenChange={open=>{if(!open)setRandom(null)}} title={random?.title??t('discovery.random')} description={t('catalogue.coverage')}>{random&&<Button onClick={()=>{navigate(`/${random.media_type}/${random.id}`);setRandom(null)}}>{t('home.details')}</Button>}</Modal>
    <Modal open={deleting} onOpenChange={setDeleting} title={t('discovery.removePreset')}><div className="flex gap-3"><Button variant="secondary" onClick={()=>setDeleting(false)}>{t('common.cancel')}</Button><Button disabled={!preset||write.isPending} onClick={()=>{if(preset)write.mutate({path:`/me/saved-filters/${preset.id}?expected_version=${preset.version}`,method:'DELETE'})}}>{t('common.remove')}</Button></div></Modal>
  </>
}
