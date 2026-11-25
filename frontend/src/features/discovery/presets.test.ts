import {expect,it} from 'vitest'
import {queryFromParams} from '.'
it.each(['released=true&sort=year','sort=trending','format=TV&format=Movie'])('rejects unsupported saved-filter views without dropping %s',query=>{
  expect(()=>queryFromParams(new URLSearchParams(query),'/search')).toThrow()
})
it('preserves supported media type, multi-genre values and scalar filters',()=>{
  const query=queryFromParams(new URLSearchParams('type=anime&include_genres=Action&include_genres=Fantasy&format=TV&year=2024&sort=score'),'/search')
  expect(query).toMatchObject({media_type:'anime',include_genres:['Action','Fantasy'],format:'TV',year:2024,sort:'score'})
  expect(query).not.toHaveProperty('type')
})
