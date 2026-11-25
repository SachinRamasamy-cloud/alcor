import type {Entry} from '.'
import {t} from '../../shared/content'
export function libraryStatusLabel(entry:Entry){
  if(entry.status!=='in_progress')return t(`status.${entry.status}`)
  const reading=entry.media.media_type==='manga'
  return t(entry.active_session?.kind==='repeat'?reading?'status.rereading':'status.rewatching':reading?'status.reading':'status.watching')
}
