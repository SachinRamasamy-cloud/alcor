import {expect,it} from 'vitest'
import type {Entry} from '.'
import {libraryStatusLabel} from './labels'
it.each([
  ['anime','initial','Watching'],['manga','initial','Reading'],
  ['anime','repeat','Rewatching'],['manga','repeat','Rereading'],
] as const)('labels %s %s sessions using recorded session context', (media_type,kind,label)=>{
  const entry={media:{media_type},status:'in_progress',active_session:{kind}} as Entry
  expect(libraryStatusLabel(entry)).toBe(label)
  expect(libraryStatusLabel({...entry,status:'on_hold'})).toBe('On hold')
})
