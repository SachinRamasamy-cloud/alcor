import { api, type Media } from '../../shared/api/client'
import { sameTitle } from '../../shared/api/identity'
import type { components } from '../../shared/api/schema'
type Entry=components['schemas']['LibraryEntry']
type Pending={media:Media;resolve:(value:Entry|null)=>void;reject:(reason:unknown)=>void}
const pending=new Map<string,Pending[]>()

// Query caches remain account/title scoped; simultaneous visible-card reads share
// a bounded, read-only request. Never resolve metadata just to draw a bookmark.
export function readSavedStatus(media:Media,accountId:string):Promise<Entry|null>{
  return new Promise((resolve,reject)=>{
    const batch=pending.get(accountId)
    if(batch){batch.push({media,resolve,reject});return}
    pending.set(accountId,[{media,resolve,reject}])
    setTimeout(()=>{const jobs=pending.get(accountId)??[];pending.delete(accountId);void flush(jobs,accountId)},20)
  })
}
async function flush(jobs:Pending[],accountId:string){
  for(let offset=0;offset<jobs.length;offset+=100){
    const batch=jobs.slice(offset,offset+100),params=new URLSearchParams()
    for(const {media} of batch){
      const id=media.source_ids?.anilist??/^anilist-(\d+)$/.exec(media.id)?.[1]
      params.append(id?'anilist_ids':'ids',id??media.id)
    }
    try{
      const entries=await api<Entry[]>(`/me/media-status?${params}`,{accountId})
      for(const job of batch)job.resolve(entries.find(entry=>sameTitle(entry.media,job.media))??null)
    }catch(error){for(const job of batch)job.reject(error)}
  }
}
