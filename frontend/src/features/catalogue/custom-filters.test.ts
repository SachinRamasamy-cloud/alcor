import { expect,it } from 'vitest'
import { fromAniList } from '../../shared/api/anilist'
import { matchesCustomFilters } from './custom-filters'

const media=fromAniList({id:1,type:'ANIME',title:{english:'Example'},genres:['Action','Adventure'],studios:{nodes:[{name:'MAPPA'}]},averageScore:null})
it('applies explicit all/any genre semantics and missing-value choices locally',()=>{
  expect(matchesCustomFilters(media,new URLSearchParams('include_genres=Action&include_genres=Romance'))).toBe(false)
  expect(matchesCustomFilters(media,new URLSearchParams('include_genres=Action&include_genres=Romance&genre_match=any'))).toBe(true)
  expect(matchesCustomFilters(media,new URLSearchParams('studio=mappa'))).toBe(true)
  expect(matchesCustomFilters(media,new URLSearchParams('has_score=true'))).toBe(false)
  expect(matchesCustomFilters(media,new URLSearchParams('exclude_genres=adventure'))).toBe(false)
})
