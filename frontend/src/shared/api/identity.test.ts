import {afterEach,expect,it,vi} from 'vitest'
import {api,ApiError,setBackendReady,setTokenProvider,type Media} from './client'
import {IdentityResolver} from './identity'

afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();setBackendReady(true);setTokenProvider(async()=>null)})
const media=(id:number)=>({id:`canonical-${id}`} as Media)

it('paces all ten sequential favorites below the existing 24/minute and 1/second limits',async()=>{
  vi.useFakeTimers()
  const starts:number[]=[]
  const request=vi.fn(async(id:number)=>{starts.push(Date.now());return media(id)})
  const resolver=new IdentityResolver(request)
  const result=(async()=>{const ids=[];for(let id=1;id<=10;id++)ids.push((await resolver.resolve(id,'owner')).id);return ids})()
  await vi.runAllTimersAsync()
  expect(await result).toHaveLength(10)
  expect(request).toHaveBeenCalledTimes(10)
  for(let index=1;index<starts.length;index++)expect(starts[index]-starts[index-1]).toBeGreaterThan(60000/24)
})

it('deduplicates an in-flight identity within its account and queues other accounts separately',async()=>{
  vi.useFakeTimers()
  const request=vi.fn(async(id:number)=>media(id))
  const resolver=new IdentityResolver(request)
  const first=resolver.resolve(1,'a'),duplicate=resolver.resolve(1,'a'),other=resolver.resolve(1,'b')
  expect(first).toBe(duplicate)
  await vi.advanceTimersByTimeAsync(1)
  expect(request).toHaveBeenCalledTimes(1)
  await vi.runAllTimersAsync()
  await Promise.all([first,duplicate,other])
  expect(request.mock.calls).toEqual([[1,'a'],[1,'b']])
})

it('honors server cooldown once without retrying unrelated failures or retry storms',async()=>{
  vi.useFakeTimers()
  const request=vi.fn().mockRejectedValueOnce(new ApiError(429,'RATE_LIMITED',undefined,5)).mockResolvedValueOnce(media(1))
  const resolver=new IdentityResolver(request)
  const result=resolver.resolve(1,'owner')
  await vi.advanceTimersByTimeAsync(5000)
  expect(request).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(1)
  expect(await result).toEqual(media(1))
  const blocked=vi.fn().mockRejectedValue(new ApiError(429,'RATE_LIMITED',undefined,1))
  const rejection=expect(new IdentityResolver(blocked).resolve(2,'owner')).rejects.toMatchObject({status:429})
  await vi.runAllTimersAsync();await rejection
  expect(blocked).toHaveBeenCalledTimes(2)
  const failed=vi.fn().mockRejectedValue(new ApiError(400,'INVALID_REQUEST'))
  await expect(new IdentityResolver(failed).resolve(3,'owner')).rejects.toMatchObject({status:400})
  expect(failed).toHaveBeenCalledTimes(1)
})

it('rechecks the current account before a delayed request and never sends its old token',async()=>{
  vi.useFakeTimers()
  let userId='a'
  setTokenProvider(async()=>({token:`test-${userId}`,userId}))
  vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify(media(1)))))
  const resolver=new IdentityResolver()
  await resolver.resolve(1,'a')
  const rejection=expect(resolver.resolve(2,'a')).rejects.toMatchObject({code:'UNAUTHORIZED'})
  userId='b'
  await vi.runAllTimersAsync();await rejection
  expect(fetch).toHaveBeenCalledTimes(1)
})

it('preserves retry headers without automatically replaying private writes',async()=>{
  vi.useFakeTimers()
  setTokenProvider(async()=>({token:'test-only',userId:'owner'}))
  const fetcher=vi.fn().mockResolvedValueOnce(new Response('{"error":{"code":"RATE_LIMITED"}}',{status:429,headers:{'Retry-After':'7'}})).mockResolvedValueOnce(new Response('{"error":{"code":"RATE_LIMITED"}}',{status:429,headers:{'Retry-After':new Date(Date.now()+10000).toUTCString()}}))
  vi.stubGlobal('fetch',fetcher)
  await expect(api('/me/setup',{accountId:'owner',method:'PUT',body:'{}'})).rejects.toMatchObject({retryAfterSeconds:7})
  expect(fetcher).toHaveBeenCalledTimes(1)
  await expect(api('/me/setup',{accountId:'owner',method:'PUT',body:'{}'})).rejects.toMatchObject({retryAfterSeconds:10})
  expect(fetcher).toHaveBeenCalledTimes(2)
})
