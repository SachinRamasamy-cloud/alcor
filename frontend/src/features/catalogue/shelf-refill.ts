import {useQuery,useQueryClient} from '@tanstack/react-query'
import type {Media} from '../../shared/api/client'
import {aniShelfWindow,type ShelfKind,type ShelfWindow} from '../../shared/api/anilist'
import {useAuth} from '../../shared/auth'
import {sameTitle} from '../../shared/api/identity'
import {exclusions} from './personal-page'
import type {DiscoveryMode} from './policy'
import {useDiscoveryVisibility,visibleTitles} from './visibility'

export type ShelfPools={pools:Record<string,Media[]>;limited:string[];exhausted:string[]}
const target=(kind:ShelfKind,key:string)=>kind==='home'&&key==='manga'?6:12

export async function refillShelves(kind:ShelfKind,initial:Record<string,Media[]>,mode:DiscoveryMode,owner:string,signal:AbortSignal,
  source:(page:number,keys?:string[])=>Promise<ShelfWindow>,exclude=exclusions):Promise<ShelfPools>{
  const pools=Object.fromEntries(Object.entries(initial).map(([key,items])=>[key,[...items]]))
  const more:Record<string,boolean>=Object.fromEntries(Object.keys(pools).map(key=>[key,true]))
  for(let page=1;page<=3;page++){
    signal.throwIfAborted()
    const active=Object.keys(pools).filter(key=>more[key]&&pools[key].length<target(kind,key))
    if(!active.length)break
    const window=active.length===Object.keys(pools).length?await source(page):await source(page,active)
    signal.throwIfAborted()
    const candidates=visibleTitles(active.flatMap(key=>window[key].items),[])
    const excluded=await exclude(candidates,mode,owner,signal)
    signal.throwIfAborted()
    for(const key of active){
      more[key]=window[key].hasMore
      for(const item of visibleTitles(window[key].items,excluded))if(!pools[key].some(previous=>sameTitle(previous,item)))pools[key].push(item)
    }
    if(Object.keys(pools).every(key=>pools[key].length>=target(kind,key)||!more[key]))break
  }
  const short=Object.keys(pools).filter(key=>pools[key].length<target(kind,key))
  return {pools,limited:short.filter(key=>more[key]),exhausted:short.filter(key=>!more[key])}
}

export function useDiscoveryShelves(kind:ShelfKind,initial:Record<string,Media[]>,mode:DiscoveryMode,partial=true){
  const {userId}=useAuth(),queries=useQueryClient()
  const visibility=useDiscoveryVisibility(Object.values(initial).flat(),mode)
  const base=Object.fromEntries(Object.entries(initial).map(([key,items])=>[key,visibleTitles(items.filter(item=>visibility.items.some(candidate=>sameTitle(candidate,item))),[])]))
  const needsFill=partial&&visibility.personal&&!visibility.pending&&!visibility.unavailable&&Object.keys(base).some(key=>base[key].length<initial[key].length&&base[key].length<target(kind,key))
  const references=Object.values(initial).flat().map(item=>`${item.media_type}:${item.id}`).join(',')
  const query=useQuery({queryKey:['private',userId,'shelf-refill',mode,kind,references],enabled:needsFill,
    queryFn:({signal})=>refillShelves(kind,base,mode,userId!,signal,(page,keys)=>queries.fetchQuery({
      queryKey:['public','anilist','shelf-window',kind,page,...(keys?[keys.slice().sort().join(',')]:[])],queryFn:({signal:publicSignal})=>aniShelfWindow(kind,page,publicSignal,keys),staleTime:300000,retry:false,
    })),staleTime:30000,retry:false})
  const data=needsFill?query.data:undefined
  // Apply the current overlay again: an acknowledged write can precede refetch.
  const pools=data?Object.fromEntries(Object.entries(data.pools).map(([key,items])=>[key,items.filter(item=>!initial[key].some(original=>sameTitle(original,item))||base[key].some(eligible=>sameTitle(eligible,item)))])):base
  return {...visibility,shelves:Object.fromEntries(Object.entries(pools).map(([key,items])=>[key,items.slice(0,target(kind,key))])),
    refilling:needsFill&&query.isPending,refillError:needsFill?query.error:null,retryRefill:query.refetch,
    limited:data?.limited??[],exhausted:data?.exhausted??[]}
}
