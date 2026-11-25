import { expect,it } from 'vitest'
import { fromAniList } from '../../shared/api/anilist'
import { matchesCustomFilters,needsLocalFilters } from './custom-filters'

const media=fromAniList({id:1,type:'ANIME',title:{english:'Example'},genres:['Action','Adventure'],studios:{nodes:[{name:'MAPPA'}]},averageScore:null})
it('applies explicit all/any genre semantics and missing-value choices locally',()=>{
  expect(matchesCustomFilters(media,new URLSearchParams('include_genres=Action&include_genres=Romance'))).toBe(false)
  expect(matchesCustomFilters(media,new URLSearchParams('include_genres=Action&include_genres=Romance&genre_match=any'))).toBe(true)
  expect(matchesCustomFilters(media,new URLSearchParams('studio=mappa'))).toBe(true)
  expect(matchesCustomFilters(media,new URLSearchParams('has_score=true'))).toBe(false)
  expect(matchesCustomFilters(media,new URLSearchParams('exclude_genres=adventure'))).toBe(false)
})
it('matches any selected format/year/season/status and combines fields with AND',()=>{
  const title={...media,format:'TV',year:2024,season:'spring' as const,status:'FINISHED'}
  const params=new URLSearchParams('format=Movie&format=TV&year=2023&year=2024&season=winter&season=spring&status=RELEASING&status=FINISHED')
  expect(needsLocalFilters(params)).toBe(true)
  expect(matchesCustomFilters(title,params)).toBe(true)
  expect(matchesCustomFilters({...title,year:2025},params)).toBe(false)
  expect(matchesCustomFilters({...title,year:null},params)).toBe(false)
  expect(matchesCustomFilters(title,new URLSearchParams('genre=Action&genre=Romance'))).toBe(false)
  expect(matchesCustomFilters(title,new URLSearchParams('genre=Action&genre=Romance&genre_match=any'))).toBe(true)
})
