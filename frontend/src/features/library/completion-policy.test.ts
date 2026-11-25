import {expect,it} from 'vitest'
import {fromAniList} from '../../shared/api/anilist'
import {completionUnavailable} from './completion-policy'

it.each(['RELEASING','Currently Airing','Publishing','NOT_YET_RELEASED','NOT_YET_AIRED'])('blocks whole-title completion of %s without blocking progress',status=>{
  expect(completionUnavailable(fromAniList({id:1,type:'ANIME',title:{english:'Example'},status}))).toBe(true)
})
it.each(['FINISHED','Finished Airing',undefined])('preserves explicit historical assertions for %s',status=>{
  expect(completionUnavailable(fromAniList({id:1,type:'ANIME',title:{english:'Example'},status}))).toBe(false)
})
