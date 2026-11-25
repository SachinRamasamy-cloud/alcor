import { useQuery } from '@tanstack/react-query'
import { api, ApiError, type Media, type EpisodePage } from '../../shared/api/client'
import { aniBrowse,aniCatalogue, aniDetails, aniHome } from '../../shared/api/anilist'
import { useAuth } from '../../shared/auth'
import { useBackend } from '../../shared/api/backend'
import { personalPage } from './personal-page'
export { SearchField } from './search-field'
import { aniZipEpisodes } from '../../shared/api/anizip'
import { needsLocalFilters,supportsSavedFilters } from './custom-filters'

export const homeOptions = { queryKey: ['public', 'anilist', 'home'], queryFn: ({signal}: {signal:AbortSignal}) => aniHome(signal), staleTime: 300000, retry: false as const }
export const useHome = (enabled=true) => useQuery({...homeOptions,enabled})
export const useBrowse=(type:'anime'|'manga')=>useQuery({queryKey:['public','anilist','browse',type],queryFn:({signal})=>aniBrowse(type,signal),staleTime:300000,retry:false})
export function useCatalogue(path: string, params: URLSearchParams) {
  const {userId} = useAuth()
  const {ready} = useBackend()
  const mode = params.get('mode')
  const memory = params.get('memory') === 'true'
  const personal = memory || Boolean(userId && ready && ['hide_watched', 'new_to_me'].includes(mode ?? ''))
  const query=useQuery({ queryKey: personal ? ['private', userId, 'anilist-catalogue', path, params.toString()] : ['public', 'anilist', path, params.toString()], queryFn: async ({signal}) => {
    if (memory) {
      if(!supportsSavedFilters(params))throw new ApiError(422,'UNSUPPORTED_FILTER')
      const query = new URLSearchParams(params)
      if(path==='/anime'||path==='/manga') query.set('media_type',path.slice(1))
      return api<import('../../shared/api/client').CataloguePage>(`/me/discover?${query}`,{signal,accountId:userId??'signed-out'})
    }
    if (personal || needsLocalFilters(params)) return personalPage(path, params, personal?userId!:null, signal)
    const publicParams = new URLSearchParams(params)
    if (publicParams.get('cursor')?.startsWith('f:')) publicParams.delete('cursor')
    return aniCatalogue(path, publicParams, signal)
  }, staleTime: 120000, retry: false })
  return {...query,personalUnavailable:Boolean(userId&&!ready&&['hide_watched','new_to_me'].includes(mode??''))}
}
export const useMedia = (mediaType: string, id: string) => useQuery({
  queryKey: ['public', 'anilist', mediaType, id], queryFn: ({ signal }) => /^(anilist|mal)-/.test(id) ? aniDetails(mediaType, id, signal) : api<Media>(`/${mediaType}/${id}`, { signal }), staleTime: 900000, retry: false,
})
export const useEpisodes = (id: string, enabled: boolean) => useQuery({
  queryKey: ['public', 'episodes', id], queryFn: ({ signal }) => /^(anilist|mal)-/.test(id) ? aniZipEpisodes(id,signal) : api<EpisodePage>(`/anime/${id}/episodes`, { signal }), enabled, staleTime: 900000, retry:false,
})
export const useGenres = () => useQuery({ ...homeOptions, select: home => home.genres })
