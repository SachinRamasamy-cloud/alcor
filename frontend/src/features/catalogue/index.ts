import { useQuery } from '@tanstack/react-query'
import { api, type CataloguePage, type HomeResponse, type Media, type EpisodePage } from '../../shared/api/client'
import { useAuth } from '../../shared/auth'
import type { components } from '../../shared/api/schema'

export const useHome = () => useQuery({ queryKey: ['public', 'home'], queryFn: ({ signal }) => api<HomeResponse>('/home', { signal }), staleTime: 300000 })
export function useCatalogue(path:string,params:URLSearchParams){
  const {userId}=useAuth()
  const query=new URLSearchParams(params)
  if(userId&&(path==='/anime'||path==='/manga'))query.set('media_type',path.slice(1))
  if(!userId){query.delete('mode');query.delete('include_planned')}
  return useQuery<CataloguePage|components['schemas']['PersonalPage']>({queryKey:userId?['private',userId,'catalogue',path,query.toString()]:['public',path,query.toString()],queryFn:({signal})=>api(userId?`/me/discover?${query}`:`${path}?${query}`,{signal,accountId:userId??undefined}),staleTime:120000})
}
export const useMedia = (mediaType: string, id: string) => useQuery({
  queryKey: ['public', mediaType, id], queryFn: ({ signal }) => api<Media>(`/${mediaType}/${id}`, { signal }), staleTime: 900000,
})
export const useEpisodes = (id: string, enabled: boolean) => useQuery({
  queryKey: ['public', 'episodes', id], queryFn: ({ signal }) => api<EpisodePage>(`/anime/${id}/episodes`, { signal }), enabled, staleTime: 600000,
})
export const useGenres = () => useQuery({ queryKey: ['public', 'genres'], queryFn: ({ signal }) => api<string[]>('/genres', { signal }), staleTime: 86400000 })
