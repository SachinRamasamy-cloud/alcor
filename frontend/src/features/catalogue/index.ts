import { useQuery } from '@tanstack/react-query'
import { api, type CataloguePage, type HomeResponse, type Media, type EpisodePage } from '../../shared/api/client'

export const useHome = () => useQuery({ queryKey: ['public', 'home'], queryFn: ({ signal }) => api<HomeResponse>('/home', { signal }), staleTime: 300000 })
export const useCatalogue = (path: string, params: URLSearchParams) => useQuery({
  queryKey: ['public', path, params.toString()],
  queryFn: ({ signal }) => api<CataloguePage>(`${path}?${params}`, { signal }), staleTime: 120000,
})
export const useMedia = (mediaType: string, id: string) => useQuery({
  queryKey: ['public', mediaType, id], queryFn: ({ signal }) => api<Media>(`/${mediaType}/${id}`, { signal }), staleTime: 900000,
})
export const useEpisodes = (id: string, enabled: boolean) => useQuery({
  queryKey: ['public', 'episodes', id], queryFn: ({ signal }) => api<EpisodePage>(`/anime/${id}/episodes`, { signal }), enabled, staleTime: 600000,
})
export const useGenres = () => useQuery({ queryKey: ['public', 'genres'], queryFn: ({ signal }) => api<string[]>('/genres', { signal }), staleTime: 86400000 })
