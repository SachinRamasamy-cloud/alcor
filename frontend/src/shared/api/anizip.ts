import { ApiError, type EpisodePage } from './client'

type RawEpisode = {
  episode?: string; title?: Record<string,string|null>; overview?: string|null; summary?: string|null
  image?: string|null; runtime?: number|null; airDate?: string|null; airDateUtc?: string|null
  anidbEid?: number|string|null; tvdbId?: number|string|null
}
type ResponseBody = { mappings?: Record<string,unknown>; episodes?: Record<string,RawEpisode> }
const empty = ():EpisodePage=>({data:[],coverage_complete:false,confirmed_final_total:null,source:'AniZip'})

function imageUrl(value:string|null|undefined) {
  if(!value)return null
  try {
    const url=new URL(value)
    return url.protocol==='https:' && !url.username && !url.password && !url.port && ['artworks.thetvdb.com','image.tmdb.org','s4.anilist.co'].includes(url.hostname)?url.href:null
  } catch { return null }
}

export function parseAniZip(body:ResponseBody,namespace:'anilist'|'mal',id:number):EpisodePage {
  if(!body || typeof body!=='object')throw new ApiError(503,'UPSTREAM_UNAVAILABLE')
  if(String(body.mappings?.[`${namespace}_id`])!==String(id) || !body.episodes || Array.isArray(body.episodes) || typeof body.episodes!=='object')throw new ApiError(503,'UPSTREAM_UNAVAILABLE')
  const entries=Object.entries(body.episodes)
  if(entries.length>5000)throw new ApiError(503,'UPSTREAM_UNAVAILABLE')
  // JSON object enumeration puts "2" before non-index key "001". Sort numeric
  // episode labels for display without rewriting or merging their source keys.
  entries.sort(([leftKey,left],[rightKey,right])=>{
    const leftLabel=left?.episode??leftKey,rightLabel=right?.episode??rightKey
    const leftNumeric=/^\d+(?:\.\d+)?$/.test(leftLabel),rightNumeric=/^\d+(?:\.\d+)?$/.test(rightLabel)
    return leftNumeric&&rightNumeric?Number(leftLabel)-Number(rightLabel):leftNumeric?-1:rightNumeric?1:0
  })
  return { ...empty(), data:entries.map(([key,raw],index)=>{
    if(!key || key.length>128 || !raw || typeof raw!=='object' || Array.isArray(raw))throw new ApiError(503,'UPSTREAM_UNAVAILABLE')
    const released=typeof raw.airDateUtc==='string' && /T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:\d{2})$/.test(raw.airDateUtc) && Number.isFinite(Date.parse(raw.airDateUtc))?raw.airDateUtc:null
    const titles=raw.title??{}
    const title=typeof titles.en==='string'?titles.en:typeof titles['x-jat']==='string'?titles['x-jat']:typeof titles.ja==='string'?titles.ja:null
    const description=typeof raw.overview==='string'?raw.overview:typeof raw.summary==='string'?raw.summary:null
    return {key,order:index+1,label:typeof raw.episode==='string'?raw.episode:key,title,
      synopsis:description?.replace(/<[^>]*>/g,'').replace(/\n{3,}/g,'\n\n').trim()||null,
      image_url:imageUrl(raw.image),air_date:typeof raw.airDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(raw.airDate)?raw.airDate:null,
      released_at:released,runtime_minutes:typeof raw.runtime==='number'&&Number.isFinite(raw.runtime)&&raw.runtime>0?raw.runtime:null,
      source:'AniZip',source_episode_id:raw.anidbEid?`anidb:${raw.anidbEid}`:raw.tvdbId?`tvdb:${raw.tvdbId}`:null,
      kind:/^\d+$/.test(key)?'regular' as const:'extra' as const,filler:false,recap:false,
    }
  })}
}

let blockedUntil=0
export async function aniZipEpisodes(reference:string,signal?:AbortSignal):Promise<EpisodePage> {
  if(import.meta.env.PROD && import.meta.env.VITE_ANIZIP_USE_APPROVED!=='true')throw new ApiError(503,'PROVIDER_NOT_CONFIGURED')
  const match=/^(anilist|mal)-([1-9]\d*)$/.exec(reference)
  if(!match || Number(match[2])>2147483647)throw new ApiError(404,'NOT_FOUND')
  if(Date.now()<blockedUntil)throw new ApiError(429,'RATE_LIMITED')
  let response:Response
  try {
    response=await fetch(`https://api.ani.zip/mappings?${match[1]}_id=${match[2]}`,{credentials:'omit',referrerPolicy:'no-referrer',headers:{Accept:'application/json'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)})
  } catch(error) {
    if(signal?.aborted)throw error
    throw new ApiError(503,'UPSTREAM_UNAVAILABLE')
  }
  if(response.status===404)return empty()
  if(response.status===429){const retry=response.headers.get('Retry-After'),seconds=Number(retry);blockedUntil=Math.max(Date.now()+(seconds>0?seconds:60)*1000,retry?Date.parse(retry)||0:0);throw new ApiError(429,'RATE_LIMITED')}
  if(!response.ok)throw new ApiError(response.status,'UPSTREAM_UNAVAILABLE')
  const text=await response.text()
  if(text.length>4000000)throw new ApiError(503,'UPSTREAM_UNAVAILABLE')
  try {return parseAniZip(JSON.parse(text),match[1] as 'anilist'|'mal',Number(match[2]))}
  catch(error){if(error instanceof ApiError)throw error;throw new ApiError(503,'UPSTREAM_UNAVAILABLE')}
}
