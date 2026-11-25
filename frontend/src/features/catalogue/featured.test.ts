import {expect,it} from 'vitest'
import {fromAniList} from '../../shared/api/anilist'
import {qualifiesFeatured,selectFeatured} from './featured'
const valid=fromAniList({id:1,type:'ANIME',title:{english:'A released story'},status:'FINISHED',description:'A real source synopsis.',coverImage:{large:'https://s4.anilist.co/test/1.jpg'}})
it('requires released state, source content and approved artwork without a score threshold',()=>{
  expect(qualifiesFeatured({...valid,score:null})).toBe(true)
  for(const candidate of [{...valid,status:'NOT_YET_RELEASED'},{...valid,status:null},{...valid,synopsis:null},{...valid,image_url:null},{...valid,image_url:'https://untrusted.example/image.jpg'},{...valid,image_url:'https://user:secret@s4.anilist.co/image.jpg'},{...valid,title:' '}])expect(qualifiesFeatured(candidate)).toBe(false)
})
it('selects the first qualified eligible candidate and omits an unqualified-only hero',()=>{
  const upcoming={...valid,status:'NOT_YET_RELEASED'}
  expect(selectFeatured([upcoming,valid])).toBe(valid)
  expect(selectFeatured([upcoming])).toBeNull()
})
