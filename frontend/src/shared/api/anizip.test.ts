import { afterEach, expect, it, vi } from 'vitest'
import { aniZipEpisodes, parseAniZip } from './anizip'

afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()})
it('preserves exact episode keys, separates extras and does not invent precise release or final coverage',()=>{
  const result=parseAniZip({mappings:{anilist_id:7054},episodes:{'2':{episode:'2'},'001':{episode:'1',title:{en:'A beginning'},airDate:'2010-04-01',airDateUtc:null,image:'javascript:alert(1)'},S1:{title:{ja:'Special'},runtime:24}}},'anilist',7054)
  expect(result.data.map(ep=>ep.key)).toEqual(['001','2','S1'])
  expect(result.data[0]).toMatchObject({label:'1',released_at:null,air_date:'2010-04-01',image_url:null,kind:'regular'})
  expect(result.data[2].kind).toBe('extra')
  expect(result.coverage_complete).toBe(false)
  expect(result.confirmed_final_total).toBeNull()
})
it('rejects mismatched mapping and malformed episode structures',()=>{
  expect(()=>parseAniZip({mappings:{anilist_id:2},episodes:{}},'anilist',1)).toThrow()
  expect(()=>parseAniZip({mappings:{anilist_id:1},episodes:[] as never},'anilist',1)).toThrow()
})
it('fetches the public endpoint without personal credentials and keeps 404 distinct from server failure',async()=>{
  const fetcher=vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('{}',{status:404})).mockResolvedValueOnce(new Response('{}',{status:503}))
  vi.stubGlobal('fetch',fetcher)
  await expect(aniZipEpisodes('anilist-1')).resolves.toMatchObject({data:[],coverage_complete:false})
  await expect(aniZipEpisodes('anilist-1')).rejects.toMatchObject({code:'UPSTREAM_UNAVAILABLE'})
  expect(fetcher.mock.calls[0][0]).toBe('https://api.ani.zip/mappings?anilist_id=1')
  expect(fetcher.mock.calls[0][1]?.credentials).toBe('omit')
  expect(new Headers(fetcher.mock.calls[0][1]?.headers).has('Authorization')).toBe(false)
})
it('disables unapproved production use',async()=>{
  vi.stubEnv('PROD',true);vi.stubEnv('VITE_ANIZIP_USE_APPROVED','false')
  await expect(aniZipEpisodes('anilist-1')).rejects.toMatchObject({code:'PROVIDER_NOT_CONFIGURED'})
})
it('honors a provider cooldown without automatic repeated requests',async()=>{
  vi.useFakeTimers()
  const fetcher=vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('{}',{status:429,headers:{'Retry-After':'3'}})).mockResolvedValueOnce(new Response('{}',{status:404}))
  vi.stubGlobal('fetch',fetcher)
  await expect(aniZipEpisodes('anilist-1')).rejects.toMatchObject({code:'RATE_LIMITED'})
  await expect(aniZipEpisodes('anilist-2')).rejects.toMatchObject({code:'RATE_LIMITED'})
  expect(fetcher).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(3001)
  await expect(aniZipEpisodes('anilist-2')).resolves.toMatchObject({data:[]})
  vi.useRealTimers()
})
