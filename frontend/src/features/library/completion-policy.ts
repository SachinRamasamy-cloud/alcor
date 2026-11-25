import type {Media} from '../../shared/api/client'

// Display guard only; the backend validates its own stored metadata under locks.
export function completionUnavailable(media:Media){
  const status=(media.status??'').trim().toUpperCase().replaceAll(' ','_')
  return ['RELEASING','CURRENTLY_AIRING','PUBLISHING','CURRENTLY_PUBLISHING','NOT_YET_RELEASED','NOT_YET_AIRED'].includes(status)
}
