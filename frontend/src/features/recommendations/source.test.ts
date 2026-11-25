import {afterEach,expect,it,vi} from 'vitest'
import {loadFeed} from './feed'
import {api,setTokenProvider} from '../../shared/api/client'

afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();setTokenProvider(async()=>null)})
const media=(id:number,type='ANIME')=>({id,type,isAdult:false,title:{english:`Story ${id}`},genres:['Fantasy']})
const seed=(id:number,nodes:unknown[],more=false)=>({id,type:'ANIME',title:{english:`Favourite ${id}`},recommendations:{pageInfo:{hasNextPage:more},nodes}})
it('batches public seed lookups, preserves provider order and origins, and filters history before publication',async()=>{
  vi.resetModules();const {aniRecommendations}=await import('../../shared/api/anilist')
  const fetcher=vi.fn<typeof fetch>(async(_url,options)=>{
    const body=JSON.parse(String(options?.body))
    expect(body.variables).toEqual({page:1,seed0:1,seed1:2})
    expect(body.query).toContain('sort: [RATING_DESC, ID]');expect(body.query).toContain('perPage: 24')
    expect(options?.credentials).toBe('omit');expect(new Headers(options?.headers).has('Authorization')).toBe(false)
    return new Response(JSON.stringify({data:{s0:seed(1,[{rating:5,mediaRecommendation:media(10)},{rating:3,mediaRecommendation:media(11)},{rating:99,mediaRecommendation:media(1)},null,{rating:2,mediaRecommendation:{...media(99),isAdult:true}}],true),s1:seed(2,[{rating:2,mediaRecommendation:media(10)},{rating:1,mediaRecommendation:media(12)},{rating:9,mediaRecommendation:media(13,'MANGA')}])}}))
  });vi.stubGlobal('fetch',fetcher)
  const window=await aniRecommendations([1,2],'anime',1)
  expect(window.items.map(item=>item.media.id)).toEqual(['anilist-10','anilist-11','anilist-12'])
  expect(window.items[0].origins.map(origin=>origin.anilistId)).toEqual([1,2]);expect(window.items[0].ratings).toEqual({'1':5,'2':2})
  expect(window.seedWindows?.['1'].items[0].origins.map(origin=>origin.anilistId)).toEqual([1])
  expect(window.seedWindows?.['2'].items[0].origins.map(origin=>origin.anilistId)).toEqual([2])
  const result=await loadFeed({source:async()=>({...window,hasMore:false}),filters:new URLSearchParams(),owner:'a',mode:'new_to_me',signal:new AbortController().signal,exclude:async()=>[10]})
  expect(result.items.map(item=>item.media.id)).toEqual(['anilist-11','anilist-12'])
  expect(window.items).toHaveLength(3);expect(fetcher).toHaveBeenCalledOnce()
})
it('treats missing/blocked connections as unavailable and never replaces them with popularity',async()=>{
  vi.resetModules();const {aniRecommendations}=await import('../../shared/api/anilist')
  const fetcher=vi.fn<typeof fetch>(async()=>new Response(JSON.stringify({data:{s0:{id:1,type:'ANIME',isRecommendationBlocked:true,recommendations:null}}})));vi.stubGlobal('fetch',fetcher)
  await expect(aniRecommendations([1],'anime',1)).rejects.toMatchObject({code:'RECOMMENDATIONS_UNAVAILABLE'})
  await expect(aniRecommendations([1,2,3,4],'anime',1)).rejects.toMatchObject({code:'INVALID_REQUEST'})
  expect(fetcher).toHaveBeenCalledOnce()
})
it('keeps production recommendations disabled without provider clearance',async()=>{
  vi.resetModules();const {aniRecommendations}=await import('../../shared/api/anilist')
  vi.stubEnv('PROD',true);vi.stubEnv('VITE_ANILIST_USE_APPROVED','false')
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher)
  await expect(aniRecommendations([1],'anime',1)).rejects.toMatchObject({code:'PROVIDER_NOT_CONFIGURED'})
  expect(fetcher).not.toHaveBeenCalled()
})
it('normalizes malformed successful proxy bodies as safe failures on both transports',async()=>{
  vi.resetModules();const {AniListTransport}=await import('../../shared/api/anilist')
  const fetcher=vi.fn<typeof fetch>(async()=>new Response('<html>internal proxy body</html>'))
  vi.stubGlobal('fetch',fetcher);setTokenProvider(async()=>({token:'test-only',userId:'a'}))
  await expect(new AniListTransport(fetcher,0).query('query { example }')).rejects.toMatchObject({code:'UPSTREAM_UNAVAILABLE',status:503})
  await expect(api('/me/library/test',{accountId:'a',method:'PUT'})).rejects.toMatchObject({code:'UPSTREAM_UNAVAILABLE',status:503})
  expect(fetcher).toHaveBeenCalledTimes(2)
})
