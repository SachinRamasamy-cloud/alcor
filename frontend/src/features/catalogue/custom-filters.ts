import type { Media } from '../../shared/api/client'

const normalized = (value:string)=>value.normalize('NFKC').trim().toLocaleLowerCase('en')
export const multiValueFields=['format','year','season','status'] as const
export const hasMultipleValues=(params:URLSearchParams)=>multiValueFields.some(key=>params.getAll(key).length>1)
export const supportsSavedFilters=(params:URLSearchParams)=>!hasMultipleValues(params)&&params.getAll('genre').length<2&&params.getAll('studio').length<2&&params.get('released')!=='true'&&params.get('sort')!=='trending'
export function sourceFilterParams(params:URLSearchParams){
  const next=new URLSearchParams(params);next.delete('page')
  if(next.get('genre_match')==='any'){next.delete('include_genres');next.delete('genre')}
  for(const key of multiValueFields)if(next.getAll(key).length>1)next.delete(key)
  return next
}
export function needsLocalFilters(params:URLSearchParams) {
  return Boolean(hasMultipleValues(params)||params.getAll('genre').length>1||params.get('studio') || params.getAll('include_genres').length>1 || params.getAll('include_themes').length>1 || params.get('genre_match')==='any' || params.get('has_score')==='true' || params.get('has_image')==='true')
}
export function matchesCustomFilters(media:Media,params:URLSearchParams) {
  const genres=(media.genres??[]).map(normalized),themes=(media.themes??[]).map(normalized)
  const includes=[...params.getAll('include_genres'),...params.getAll('genre')].map(normalized)
  const included=includes.length===0 || (params.get('genre_match')==='any'?includes.some(g=>genres.includes(g)):includes.every(g=>genres.includes(g)))
  const any=(key:string,value:string|null|undefined)=>!params.has(key)||params.getAll(key).some(item=>value!=null&&normalized(item)===normalized(value))
  const formats=params.getAll('format')
  const formatMatch=!formats.length||formats.some(format=>normalized(format)===normalized(media.format??'')||(format==='Manga'&&['Manga','Manhwa','Manhua'].includes(media.format??'')))
  return included && formatMatch && any('year',media.year?.toString()) && any('season',media.season) && any('status',media.status) && params.getAll('exclude_genres').every(g=>!genres.includes(normalized(g)))
    && params.getAll('include_themes').every(tag=>themes.includes(normalized(tag)))
    && params.getAll('exclude_themes').every(tag=>!themes.includes(normalized(tag)))
    && (!params.get('studio') || params.getAll('studio').some(selected=>media.studios?.some(studio=>normalized(studio)===normalized(selected))))
    && (params.get('has_score')!=='true' || media.score!=null)
    && (params.get('has_image')!=='true' || Boolean(media.image_url))
}
