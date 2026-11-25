import {afterEach,expect,it,vi} from 'vitest'
import {readSavedStatus} from './status'
import {setTokenProvider} from '../../shared/api/client'
import {fromAniList} from '../../shared/api/anilist'
afterEach(()=>vi.unstubAllGlobals())
it('batches source references and keeps account results separate without resolving metadata',async()=>{
  let account='first'
  setTokenProvider(async()=>({token:'fixture',userId:account}))
  const media=fromAniList({id:1,type:'ANIME',title:{english:'Test'}})
  const entry={media:{...media,id:'canonical'},status:'planned',version:3}
  const fetcher=vi.fn(async(url:RequestInfo|URL)=>{expect(String(url)).toContain('/me/media-status?');return new Response(JSON.stringify(account==='first'?[entry]:[]))})
  vi.stubGlobal('fetch',fetcher)
  const values=await Promise.all([readSavedStatus(media,account),readSavedStatus({...media,id:'anilist-2',source_ids:{anilist:'2'}},account)])
  expect(values).toEqual([entry,null]);expect(fetcher).toHaveBeenCalledOnce()
  expect(String(fetcher.mock.calls[0][0])).toContain('/media-status?anilist_ids=1&anilist_ids=2')
  account='second';expect(await readSavedStatus(media,account)).toBeNull()
})
