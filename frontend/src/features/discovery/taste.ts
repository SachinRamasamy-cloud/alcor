import type { components } from '../../shared/api/schema'
import type { Media } from '../../shared/api/client'
import { sameTitle } from '../../shared/api/identity'
import type {DiscoveryMode} from '../catalogue/policy'
import {matchesFeed} from '../recommendations/feed'
type Preferences=components['schemas']['Preferences']
const normalize=(value:string)=>value.normalize('NFKC').trim().toLocaleLowerCase('en')

export function tasteParams(preferences:Preferences,type:'anime'|'manga'='anime',mode:DiscoveryMode='new_to_me'){
  const profile=preferences.intelligence_profile
  const excluded=profile?.excluded_genres??[]
  const genres=(preferences.preferred_genres??[]).filter(genre=>!excluded.some(value=>normalize(value)===normalize(genre)))
  const params=new URLSearchParams({mode,sort:'popular',genre_match:'any'})
  genres.forEach(genre=>params.append('include_genres',genre))
  excluded.forEach(genre=>params.append('exclude_genres',genre))
  preferences.preferred_themes?.forEach(theme=>params.append('include_themes',theme))
  preferences.preferred_studios?.forEach(studio=>params.append('studio',studio))
  if(profile?.series_status&&profile.series_status!=='any')params.set('status',profile.series_status==='finished'?'FINISHED':'RELEASING')
  const limits=[preferences.preferred_max_units,type==='anime'?profile?.max_anime_episodes:null].filter((value):value is number=>value!=null)
  if(limits.length)params.set('units_max',String(Math.min(...limits)))
  return {params,genres,personal:genres.length>0||excluded.length>0||params.has('include_themes')||params.has('studio')||params.has('status')||params.has('units_max')}
}

export function tasteItems(items:Media[],preferences:Preferences,favorites:Media[],type:'anime'|'manga'='anime'){
  const {params}=tasteParams(preferences,type)
  return items.filter(media=>media.media_type===type&&!favorites.some(favorite=>sameTitle(favorite,media))&&matchesFeed(media,params))
}
