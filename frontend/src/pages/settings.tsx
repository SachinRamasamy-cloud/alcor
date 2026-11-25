import { useState } from 'react'
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { api } from '../shared/api/client'
import type { components } from '../shared/api/schema'
import { useAuth } from '../shared/auth'
import { useFeedback } from '../shared/feedback'
import { t } from '../shared/content'
import { Button,ErrorState,Loading } from '../shared/ui'
import { PersonalNav } from '../widgets/personal-nav'
import { usePreferences,type PreferencesRead } from '../features/preferences'

function PreferenceForm({saved,userId}:{saved:PreferencesRead;userId:string}){
  const [draft,setDraft]=useState(saved)
  const queries=useQueryClient(),notify=useFeedback()
  const write=useMutation({mutationFn:()=>api<PreferencesRead>('/me/preferences',{method:'PATCH',accountId:userId,body:JSON.stringify({expected_version:draft.version,data:draft.data})}),onSuccess:value=>{setDraft(value);notify(t('settings.saved'))},onError:(error:Error)=>notify(error.message),onSettled:()=>{void queries.invalidateQueries({queryKey:['private',userId]})}})
  const set=<K extends keyof typeof draft.data>(key:K,value:typeof draft.data[K])=>setDraft({...draft,data:{...draft.data,[key]:value}})
  return <form onSubmit={e=>{e.preventDefault();write.mutate()}} className="my-6 max-w-2xl space-y-6"><label className="block text-sm">{t('settings.timezone')}<input className="mt-2 block min-h-11 w-full rounded border border-line px-3" value={draft.data.timezone} onChange={e=>set('timezone',e.target.value)} required/></label><label className="block text-sm">{t('settings.motion')}<select className="ml-3 min-h-11 rounded border border-line px-3" value={draft.data.motion} onChange={e=>set('motion',e.target.value as typeof draft.data.motion)}><option value="system">{t('settings.systemMotion')}</option><option value="reduced">{t('settings.reducedMotion')}</option><option value="full">{t('settings.standardMotion')}</option></select></label>{([['notifications','settings.notifications'],['include_planned','settings.includePlanned'],['spoiler_mode','settings.spoilers']] as const).map(([key,label])=><label key={key} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={draft.data[key]} onChange={e=>set(key,e.target.checked)}/>{t(label)}</label>)}{([['preferred_genres','settings.genres'],['preferred_themes','settings.themes'],['preferred_studios','settings.studios']] as const).map(([key,label])=><label className="block text-sm" key={key}>{t(label)}<input className="mt-2 block min-h-11 w-full rounded border border-line px-3" value={(draft.data[key]??[]).join(', ')} onChange={e=>set(key,e.target.value.split(',').map(v=>v.trim()))}/></label>)}{([['positive_rating_min','settings.positiveRating',1,10],['minimum_rating_votes','settings.minimumVotes',1,100000000],['preferred_max_units','settings.maxLength',1,100000]] as const).map(([key,label,min,max])=><label className="block text-sm" key={key}>{t(label)}<input className="mt-2 block min-h-11 w-full rounded border border-line px-3" type="number" min={min} max={max} value={draft.data[key]??''} onChange={e=>set(key,e.target.value?Number(e.target.value):null)}/></label>)}<p className="text-xs text-muted">{t('settings.evidenceHelp')}</p><div className="flex gap-3"><Button disabled={write.isPending}>{t('common.save')}</Button><Button type="button" variant="secondary" onClick={()=>setDraft(saved)}>{t('personal.reload')}</Button></div>{draft.version!==saved.version&&<p role="status">{t('errors.conflict')}</p>}</form>
}
export function SettingsPage(){
  const {userId,requireSignIn}=useAuth()
  const prefs=usePreferences()
  return <div className="shell page-body"><PersonalNav/><div className="page-heading"><h1>{t('settings.title')}</h1></div>{!userId?<div className="state-box"><p>{t('auth.library')}</p><Button onClick={()=>requireSignIn()}>{t('nav.signIn')}</Button></div>:prefs.isPending?<Loading variant="settings"/>:prefs.error?<ErrorState error={prefs.error} retry={()=>{void prefs.refetch()}}/>:<PreferenceForm key={userId} userId={userId} saved={prefs.data}/>}</div>
}
type Profile=components['schemas']['ProfileRead']
function ProfileForm({profile,userId}:{profile:Profile;userId:string}){
  const [draft,setDraft]=useState(profile)
  const queries=useQueryClient(),notify=useFeedback()
  const write=useMutation({mutationFn:()=>api<Profile>('/me',{method:'PATCH',accountId:userId,body:JSON.stringify({display_name:draft.display_name,expected_version:draft.version})}),onSuccess:value=>{setDraft(value);notify(t('settings.profileSaved'))},onError:(error:Error)=>notify(error.message),onSettled:()=>{void queries.invalidateQueries({queryKey:['private',userId]})}})
  return <form className="max-w-xl space-y-5" onSubmit={e=>{e.preventDefault();write.mutate()}}><p className="text-sm text-muted">{t('settings.privateProfile')}</p><label className="block text-sm">{t('settings.displayName')}<input className="mt-2 block min-h-11 w-full rounded border border-line px-3" maxLength={80} value={draft.display_name} onChange={e=>setDraft({...draft,display_name:e.target.value})}/></label><div className="flex gap-3"><Button disabled={write.isPending}>{t('common.save')}</Button><Button type="button" variant="secondary" onClick={()=>setDraft(profile)}>{t('personal.reload')}</Button></div></form>
}
export function ProfilePage(){
  const {userId,requireSignIn}=useAuth()
  const profile=useQuery({queryKey:['private',userId,'profile'],enabled:Boolean(userId),queryFn:({signal})=>api<Profile>('/me',{signal,accountId:userId!})})
  return <div className="shell page-body"><PersonalNav/><div className="page-heading"><h1>{t('settings.profile')}</h1></div>{!userId?<div className="state-box"><Button onClick={()=>requireSignIn()}>{t('nav.signIn')}</Button></div>:profile.isPending?<Loading variant="profile"/>:profile.error?<ErrorState error={profile.error} retry={()=>{void profile.refetch()}}/>:<ProfileForm key={userId} userId={userId} profile={profile.data}/>}</div>
}
