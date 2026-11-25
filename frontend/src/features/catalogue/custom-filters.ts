import type { Media } from '../../shared/api/client'

const normalized = (value:string)=>value.normalize('NFKC').trim().toLocaleLowerCase('en')
export function needsLocalFilters(params:URLSearchParams) {
  return Boolean(params.get('studio') || params.getAll('include_genres').length>1 || params.getAll('include_themes').length>1 || params.get('genre_match')==='any' || params.get('has_score')==='true' || params.get('has_image')==='true')
}
export function matchesCustomFilters(media:Media,params:URLSearchParams) {
  const genres=(media.genres??[]).map(normalized),themes=(media.themes??[]).map(normalized)
  const includes=params.getAll('include_genres').map(normalized)
  const included=includes.length===0 || (params.get('genre_match')==='any'?includes.some(g=>genres.includes(g)):includes.every(g=>genres.includes(g)))
  return included && params.getAll('exclude_genres').every(g=>!genres.includes(normalized(g)))
    && params.getAll('include_themes').every(tag=>themes.includes(normalized(tag)))
    && params.getAll('exclude_themes').every(tag=>!themes.includes(normalized(tag)))
    && (!params.get('studio') || media.studios?.some(studio=>normalized(studio)===normalized(params.get('studio')!)))
    && (params.get('has_score')!=='true' || media.score!=null)
    && (params.get('has_image')!=='true' || Boolean(media.image_url))
}
