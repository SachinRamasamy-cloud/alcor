import type { components } from '../../shared/api/schema'
import type { Media } from '../../shared/api/client'
import { sameTitle } from '../../shared/api/identity'
type Preferences=components['schemas']['Preferences']
const normalize=(value:string)=>value.normalize('NFKC').trim().toLocaleLowerCase('en')

export function tasteParams(preferences:Preferences){
  const profile=preferences.intelligence_profile
  const excluded=profile?.excluded_genres??[]
  const genres=(preferences.preferred_genres??[]).filter(genre=>!excluded.some(value=>normalize(value)===normalize(genre)))
  const params=new URLSearchParams({mode:'new_to_me',sort:'popular',genre_match:'any'})
  genres.forEach(genre=>params.append('include_genres',genre))
  excluded.forEach(genre=>params.append('exclude_genres',genre))
  if(profile?.series_status&&profile.series_status!=='any')params.set('status',profile.series_status==='finished'?'FINISHED':'RELEASING')
  if(profile?.max_anime_episodes!=null)params.set('units_max',String(profile.max_anime_episodes))
  return {params,genres,personal:genres.length>0||excluded.length>0||params.has('status')||params.has('units_max')}
}

export function tasteItems(items:Media[],preferences:Preferences,favorites:Media[]){
  const {params,genres}=tasteParams(preferences)
  const excluded=(preferences.intelligence_profile?.excluded_genres??[]).map(normalize)
  return items.filter(media=>{
    if(media.media_type!=='anime'||favorites.some(favorite=>sameTitle(favorite,media)))return false
    const known=media.genres.map(normalize)
    if(excluded.some(genre=>known.includes(genre)))return false
    if(genres.length&&!genres.some(genre=>known.includes(normalize(genre))))return false
    if(params.has('status')&&media.status!==params.get('status'))return false
    if(params.has('units_max')&&(media.total_units==null||media.total_units>Number(params.get('units_max'))))return false
    return true
  })
}
