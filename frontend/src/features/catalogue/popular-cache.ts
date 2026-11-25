import type {QueryClient} from '@tanstack/react-query'
import type {Media} from '../../shared/api/client'
import type {ShelfWindow} from '../../shared/api/anilist'
import {visibleTitles} from './visibility'

// Browse Popular and Home Popular use the same public type/sort/adult predicate.
// Reuse only fresh raw windows; the caller still checks current owned eligibility.
export function popularCandidates(queries:QueryClient,initial:Media[],type:'anime'|'manga',now=Date.now()){
  const cached=queries.getQueryCache().findAll({queryKey:['public','anilist','shelf-window',type]})
    .filter(query=>query.state.dataUpdatedAt>=now-300000)
    .sort((a,b)=>Number(a.queryKey[4])-Number(b.queryKey[4]))
    .flatMap(query=>(query.state.data as ShelfWindow|undefined)?.popular?.items??[])
  return visibleTitles([...initial,...cached.filter(item=>item.media_type===type)],[])
}
