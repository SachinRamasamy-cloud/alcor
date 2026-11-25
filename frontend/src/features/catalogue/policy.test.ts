import {expect,it} from 'vitest'
import {resolveDiscoveryMode} from './policy'
it('uses explicit URL mode before saved preference before the approved discovery default',()=>{
  expect(resolveDiscoveryMode(null,'a',undefined)).toBe('new_to_me')
  expect(resolveDiscoveryMode(null,'a','hide_watched')).toBe('hide_watched')
  expect(resolveDiscoveryMode('all','a','new_to_me')).toBe('all')
  expect(resolveDiscoveryMode('hide_watched','a','all')).toBe('hide_watched')
  expect(resolveDiscoveryMode('invalid','a','all')).toBe('all')
})
it('keeps explicit title search and guests on Show All without overriding explicit member mode',()=>{
  expect(resolveDiscoveryMode(null,'a','new_to_me',true)).toBe('all')
  expect(resolveDiscoveryMode('new_to_me','a','all',true)).toBe('new_to_me')
  expect(resolveDiscoveryMode(null,null,undefined)).toBe('all')
  expect(resolveDiscoveryMode('hide_watched',null,undefined)).toBe('all')
})
