import { useQuery } from '@tanstack/react-query'
import { api,type Media } from '../../shared/api/client'
import type { components } from '../../shared/api/schema'
import { useAuth } from '../../shared/auth'
import { useBackend } from '../../shared/api/backend'

export type SetupRead=components['schemas']['SetupRead']
export type IntelligenceProfile=components['schemas']['IntelligenceProfile']
export const storyTraits=['intelligent_protagonist','power_progression','world_building','mystery','revenge','reincarnation','political_strategy','emotional','comedy'] as const
export type SetupDraft={displayName:string;genres:string[];answers:IntelligenceProfile;favorites:Media[]}
export const defaultAnswers=():IntelligenceProfile=>({schema_version:1,setup_status:'completed',started_year:null,media_types:[],favorite_anime_ids:[],story_traits:[],disliked_genres:[],excluded_genres:[],series_status:'any',max_anime_episodes:null})
export function useSetup(){
  const {userId}=useAuth(),{ready}=useBackend()
  return useQuery({queryKey:['private',userId,'setup'],enabled:Boolean(userId&&ready),queryFn:({signal})=>api<SetupRead>('/me/setup',{signal,accountId:userId!}),staleTime:30000})
}
export { sameTitle } from '../../shared/api/identity'
