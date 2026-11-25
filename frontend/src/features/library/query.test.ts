import {afterEach,expect,it,vi} from 'vitest'
import {setTokenProvider} from '../../shared/api/client'
import {readLibraryPage} from './query'

afterEach(()=>{vi.unstubAllGlobals();setTokenProvider(async()=>null)})
it('binds saved search, type, sort, status and numbered page to the owned read',async()=>{
  setTokenProvider(async()=>({token:'test-only',userId:'a'}))
  const context={q:'Amber _100%',media_type:'anime',status:'planned',sort:'title'}
  const request=vi.fn<typeof fetch>(async(url,options)=>{
    const params=new URL(String(url),'http://fixture').searchParams
    expect(Object.fromEntries(params)).toEqual({...context,page:'2'})
    expect(options?.method).toBeUndefined();expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer test-only')
    return new Response(JSON.stringify({data:[],total:0,page:2,total_pages:1,next_cursor:null,query_context:context}))
  });vi.stubGlobal('fetch',request)
  expect((await readLibraryPage(false,'','planned',2,{q:' Amber _100% ',media_type:'anime',sort:'title'},'a',new AbortController().signal)).query_context).toEqual(context)
  expect(request).toHaveBeenCalledOnce()
})
it('rejects old or mismatched runtime filter responses while preserving legacy default reads',async()=>{
  setTokenProvider(async()=>({token:'test-only',userId:'a'}))
  vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({data:[],total:0}))))
  await expect(readLibraryPage(false,'','',1,{q:'amber'},'a',new AbortController().signal)).rejects.toMatchObject({code:'LIBRARY_QUERY_UNAVAILABLE'})
  await expect(readLibraryPage(true,'','',1,{},'a',new AbortController().signal)).resolves.toMatchObject({total:0})
})
