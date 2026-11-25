import { useQuery } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { useState,type ReactNode } from 'react'
import { api } from '../../shared/api/client'
import type { components } from '../../shared/api/schema'
import { useAuth } from '../../shared/auth'
import { t } from '../../shared/content'
import { Button } from '../../shared/ui'

export type Preferences=components['schemas']['Preferences']
export type PreferencesRead=components['schemas']['PreferencesRead']
export function usePreferences(){
  const {userId}=useAuth()
  return useQuery({queryKey:['private',userId,'preferences'],enabled:Boolean(userId),queryFn:({signal})=>api<PreferencesRead>('/me/preferences',{signal,accountId:userId!}),staleTime:30000})
}
export function PreferenceEffects({children}:{children:ReactNode}){
  const query=usePreferences()
  return <MotionConfig reducedMotion={query.data?.data.motion==='reduced'?'always':'user'}>{children}</MotionConfig>
}
export function SpoilerText({children}:{children:ReactNode}){
  const query=usePreferences()
  const [revealed,setRevealed]=useState(false)
  return query.data?.data.spoiler_mode&&!revealed?<Button variant="secondary" onClick={()=>setRevealed(true)}>{t('settings.reveal')}</Button>:<>{children}</>
}
