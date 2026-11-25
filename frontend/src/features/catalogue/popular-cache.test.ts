import {expect,it} from 'vitest'
import {QueryClient} from '@tanstack/react-query'
import {fromAniList} from '../../shared/api/anilist'
import {popularCandidates} from './popular-cache'
it('reuses ordered fresh raw popularity windows, without personal/private/stale candidates',()=>{
  const queries=new QueryClient(),now=1000000
  const media=(id:number)=>fromAniList({id,type:'ANIME',title:{english:String(id)}})
  queries.setQueryData(['public','anilist','shelf-window','anime',2],{popular:{items:[media(3)]}},{updatedAt:now})
  queries.setQueryData(['public','anilist','shelf-window','anime',1],{popular:{items:[media(1),media(2)]}},{updatedAt:now})
  queries.setQueryData(['public','anilist','shelf-window','anime',3],{popular:{items:[media(4)]}},{updatedAt:now-300001})
  queries.setQueryData(['private','other','shelf-refill','anime'],{pools:{popular:[media(5)]}})
  expect(popularCandidates(queries,[media(1)],'anime',now).map(item=>item.id)).toEqual(['anilist-1','anilist-2','anilist-3'])
  expect(popularCandidates(queries,[],'manga',now)).toEqual([])
})
