import type {Media} from '../../shared/api/client'
import {t} from '../../shared/content'
import {SelectMenu} from '../../shared/ui/select-menu'
import {useGenres} from '../catalogue'

export function FavoriteFeedFilters({pool,source,genres,onSource,onGenres,onNext,onFirst,onReset}:{
  pool:Media[];source:string;genres:string[];onSource:(value:string)=>void;onGenres:(values:string[])=>void;onNext?:()=>void;onFirst?:()=>void;onReset:()=>void;
}){
  const catalogue=useGenres()
  const options=[...new Set([...(catalogue.data??pool.flatMap(media=>media.genres)),...genres])].sort((a,b)=>a.localeCompare(b))
  return <div className="recommendation-filters" role="group" aria-label={t('recommendations.filters')}>
    <SelectMenu label={t('recommendations.basedOn')} placeholder={t('recommendations.mixFavorites')} multiple={false}
      options={[{value:'mix',label:t('recommendations.mixFavorites')},...pool.map(media=>({value:media.id,label:media.title}))]} values={[source||'mix']} onChange={values=>onSource(values[0]==='mix'?'':values[0])}/>
    <SelectMenu label={t('catalogue.genre')} placeholder={t('catalogue.allGenres')} options={options.map(value=>({value,label:value}))} values={genres} onChange={onGenres}/>
    <div className="recommendation-filter-actions">
      {onFirst&&<button className="button button-secondary" onClick={onFirst}>{t('recommendations.firstFavorites')}</button>}
      {onNext&&<button className="button button-secondary" onClick={onNext}>{t('recommendations.nextFavorites')}</button>}
      {(source||genres.length>0)&&<button className="reset-button" onClick={onReset}>{t('catalogue.reset')}</button>}
    </div>
  </div>
}
