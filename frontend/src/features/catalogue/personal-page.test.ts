import { expect, it } from 'vitest'
import { fromAniList } from '../../shared/api/anilist'
import { personalPage } from './personal-page'
import type { CataloguePage } from '../../shared/api/client'

const items = Array.from({length:72},(_,i)=>fromAniList({id:i+1,type:'ANIME',title:{english:`Title ${i+1}`}}))
const source = async (_:string,params:URLSearchParams):Promise<CataloguePage> => {
  const page=Number(params.get('cursor'))
  return {page,data:items.slice((page-1)*24,page*24),has_more:page<3,next_cursor:page<3?String(page+1):null,source:'AniList',is_partial:true,is_stale:false}
}
it('excludes completed titles before assembling the final page and retains overflow',async()=>{
  const exclude=async()=>Array.from({length:30},(_,i)=>i+1)
  const params=new URLSearchParams('mode=hide_watched')
  const first=await personalPage('/anime',params,'owner',undefined,source,exclude)
  expect(first.data.map(m=>m.id)).toEqual(items.slice(30,54).map(m=>m.id))
  expect(first.next_cursor).toBe('f:3:6')
  params.set('cursor',first.next_cursor!)
  const second=await personalPage('/anime',params,'owner',undefined,source,exclude)
  expect(second.data.map(m=>m.id)).toEqual(items.slice(54).map(m=>m.id))
  expect(second.has_more).toBe(false)
})
it('removes scalar upstream restrictions for OR selection before paginating matched titles',async()=>{
  const params=new URLSearchParams('format=TV&format=Movie&year=2020&year=2024')
  const result=await personalPage('/anime',params,null,undefined,async(_path,upstream)=>{
    expect(upstream.has('format')).toBe(false);expect(upstream.has('year')).toBe(false)
    return {page:1,data:[{...items[0],format:'TV',year:2024},{...items[1],format:'OVA',year:2024},{...items[2],format:'Movie',year:2020}],has_more:false,next_cursor:null,source:'AniList',is_partial:true,is_stale:false}
  })
  expect(result.data.map(item=>item.id)).toEqual(['anilist-1','anilist-3'])
  expect(result.total_pages).toBeNull();expect(result.has_more).toBe(false)
})
