import { api, ApiError, type Media } from './client'

const requestIdentity=(id:number,accountId:string)=>api<Media>('/me/media/resolve',{accountId,method:'POST',body:JSON.stringify({anilist_id:id})})

export class IdentityResolver {
  private tail:Promise<unknown>=Promise.resolve()
  private pending=new Map<string,Promise<Media>>()
  private nextAt=0
  // The existing shared server quota is 24/minute and 1/second. Its Redis
  // windows include their boundary, so leave one extra millisecond.
  private spacing=60000/24+1
  constructor(private request:(id:number,accountId:string)=>Promise<Media>=requestIdentity){}

  resolve(id:number,accountId:string):Promise<Media>{
    const key=`${accountId}:${id}`,existing=this.pending.get(key)
    if(existing)return existing
    const job=this.tail.catch(()=>{}).then(async()=>{
      for(let attempt=0;;attempt++){
        const delay=this.nextAt-Date.now()
        if(delay>0)await new Promise(resolve=>setTimeout(resolve,delay))
        this.nextAt=Date.now()+this.spacing
        try{return await this.request(id,accountId)}catch(error){
          if(error instanceof ApiError&&error.status===429&&error.retryAfterSeconds!==undefined){
            this.nextAt=Math.max(this.nextAt,Date.now()+error.retryAfterSeconds*1000+1)
            if(attempt===0)continue
          }
          throw error
        }
      }
    })
    this.pending.set(key,job)
    this.tail=job
    void job.finally(()=>{if(this.pending.get(key)===job)this.pending.delete(key)}).catch(()=>{})
    return job
  }
}

const resolver=new IdentityResolver()

export async function resolveMediaId(id: string, accountId: string): Promise<string> {
  const match = /^anilist-(\d+)$/.exec(id)
  if (!match) return id
  const media = await resolver.resolve(Number(match[1]),accountId)
  return media.id
}

export function resolveMedia(media:Media,accountId:string):Promise<Media>{
  const match=/^anilist-(\d+)$/.exec(media.id)
  return match?resolver.resolve(Number(match[1]),accountId):Promise.resolve(media)
}

export function sameTitle(a:Media,b:Media){return a.media_type===b.media_type&&(a.id===b.id||Boolean(a.source_ids?.anilist&&a.source_ids.anilist===b.source_ids?.anilist)||Boolean(a.source_ids?.mal&&a.source_ids.mal===b.source_ids?.mal))}
