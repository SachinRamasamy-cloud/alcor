import { expect,it } from 'vitest'
import { tasteItems,tasteParams } from './taste'
import { defaultAnswers } from '../profile'
import { fromAniList } from '../../shared/api/anilist'
import { sameTitle } from '../../shared/api/identity'
import type { components } from '../../shared/api/schema'
const preferences:components['schemas']['Preferences']={timezone:'UTC',motion:'system',notifications:false,include_planned:true,spoiler_mode:false,preferred_genres:['Fantasy','Romance'],intelligence_profile:{...defaultAnswers(),excluded_genres:['Romance'],disliked_genres:['Comedy'],series_status:'finished',max_anime_episodes:24}}
const media=(id:number,genres:string[],episodes:number|null=12)=>fromAniList({id,type:'ANIME',title:{english:`Title ${id}`},genres,episodes,status:'FINISHED'})
it('does not apply an anime episode limit as a manga chapter limit',()=>{
  const manga=fromAniList({id:33,type:'MANGA',title:{english:'Manga'},genres:['Fantasy'],chapters:300,status:'FINISHED'})
  expect(tasteParams(preferences,'manga').params.has('units_max')).toBe(false)
  expect(tasteItems([manga],preferences,[],'manga')).toEqual([manga])
})
it('applies strict exclusions before likes without inventing a weighted score or history year filter',()=>{
  const {params,genres,personal}=tasteParams(preferences)
  expect(genres).toEqual(['Fantasy']);expect(personal).toBe(true)
  expect(params.getAll('exclude_genres')).toEqual(['Romance'])
  expect(params.get('mode')).toBe('new_to_me')
  expect(params.get('status')).toBe('FINISHED')
  expect(params.get('units_max')).toBe('24')
  expect(params.has('year')).toBe(false)
})
it('keeps soft dislikes eligible, removes favorites and refuses unknown episode counts under an explicit limit',()=>{
  const favorite=media(1,['Fantasy'])
  const items=[favorite,media(2,['Fantasy','Comedy']),media(3,['Fantasy','Romance']),media(4,['Fantasy'],null),media(5,['Fantasy'],25)]
  expect(tasteItems(items,preferences,[favorite]).map(item=>item.id)).toEqual(['anilist-2'])
  expect(sameTitle({...favorite,source_ids:{mal:'1'}},{...favorite,id:'different',media_type:'manga',source_ids:{mal:'1'}})).toBe(false)
})
it('uses a general shelf when there is no explicit taste evidence',()=>{
  expect(tasteParams({...preferences,preferred_genres:[],intelligence_profile:null}).personal).toBe(false)
})
