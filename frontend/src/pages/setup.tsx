import { useMutation,useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../shared/auth'
import { api } from '../shared/api/client'
import { resolveMediaId } from '../shared/api/identity'
import { t } from '../shared/content'
import { Button,ErrorState,Loading } from '../shared/ui'
import { useSetup,defaultAnswers,type SetupDraft,type SetupRead } from '../features/profile'
import { useGenres } from '../features/catalogue'
import { ProfileSetupWizard } from '../widgets/profile-setup'

export function SetupPage(){
  const {userId,requireSignIn}=useAuth(),setup=useSetup(),genres=useGenres(),queries=useQueryClient(),navigate=useNavigate()
  const [resetKey,setResetKey]=useState(0)
  const write=useMutation({mutationFn:async({draft,skip}:{draft:SetupDraft;skip:boolean})=>{
    if(!userId||!setup.data)throw new Error(t('errors.auth'))
    const saved=setup.data
    const ids:string[]=[]
    if(!skip)for(const favorite of draft.favorites)ids.push(await resolveMediaId(favorite.id,userId))
    return api<SetupRead>('/me/setup',{accountId:userId,method:'PUT',body:JSON.stringify({display_name:skip?saved.profile.display_name:draft.displayName,expected_profile_version:saved.profile.version,expected_preferences_version:saved.preferences.version,data:{...saved.preferences.data,preferred_genres:skip?saved.preferences.data.preferred_genres:draft.genres,intelligence_profile:skip?{...(saved.preferences.data.intelligence_profile??defaultAnswers()),setup_status:'skipped'}:{...draft.answers,setup_status:'completed',favorite_anime_ids:ids}}})})
  },onSuccess:value=>{queries.setQueryData(['private',userId,'setup'],value);void queries.invalidateQueries({queryKey:['private',userId]});navigate('/profile',{replace:true})}})
  if(!userId)return <div className="shell page-body state-box"><h1>{t('setup.title')}</h1><p>{t('auth.library')}</p><Button onClick={()=>requireSignIn()}>{t('nav.signIn')}</Button></div>
  if(setup.isPending||genres.isPending)return <Loading variant="setup" page/>
  if(setup.error||genres.error)return <ErrorState error={setup.error??genres.error} retry={()=>{void setup.refetch();void genres.refetch()}}/>
  return <div className="shell page-body"><ProfileSetupWizard key={`${userId}:${resetKey}`} initial={setup.data} genres={genres.data??[]} busy={write.isPending} error={write.error} onSave={(draft,skip)=>{if(skip&&setup.data.preferences.data.intelligence_profile){navigate('/profile');return}write.mutate({draft,skip})}}/>{write.error&&<Button variant="secondary" onClick={async()=>{await setup.refetch();write.reset();setResetKey(value=>value+1)}}>{t('personal.reload')}</Button>}</div>
}
