import { useEffect,useRef,useState } from 'react'
import { Check,X,ArrowLeft,ArrowRight } from 'lucide-react'
import { SearchField,useCatalogue } from '../features/catalogue'
import { defaultAnswers,sameTitle,type SetupDraft,type SetupRead,type IntelligenceProfile } from '../features/profile'
import type { Media } from '../shared/api/client'
import { t,type MessageKey } from '../shared/content'
import { Button,ErrorState } from '../shared/ui'

export const storyTraits=['intelligent_protagonist','power_progression','world_building','mystery','revenge','reincarnation','political_strategy','emotional','comedy'] as const
const contentTypes=['anime','manga','manhwa','manhua','light_novel'] as const
function FavoritePicker({selected,onChange,busy}:{selected:Media[];onChange:(items:Media[])=>void;busy:boolean}){
  const [query,setQuery]=useState('')
  const results=useCatalogue('/anime',new URLSearchParams(query?{q:query}:{}))
  const contains=(media:Media)=>selected.some(item=>sameTitle(item,media))
  return <div className="favorite-picker"><p className="setup-help">{t('setup.favoritesHelp')}</p>
    <div className="favorite-selected">{selected.map(media=><span key={media.id}>{media.title}<button type="button" aria-label={t('setup.removeFavorite',{title:media.title})} disabled={busy} onClick={()=>onChange(selected.filter(item=>item.id!==media.id))}><X size={14}/></button></span>)}</div>
    <SearchField value={query} onCommit={setQuery} busy={results.isFetching} label={t('setup.searchFavorites')}/>
    {results.error?<ErrorState error={results.error} retry={()=>{void results.refetch()}}/>:<div className="favorite-results" role="group" aria-label={t('setup.favoriteResults')}>{results.isPending?Array.from({length:4},(_,i)=><div key={i} className="skeleton-block favorite-loading"/>):results.data.data.map(media=><button type="button" key={media.id} aria-pressed={contains(media)} disabled={busy||(!contains(media)&&selected.length>=10)} onClick={()=>onChange(contains(media)?selected.filter(item=>!sameTitle(item,media)):[...selected,media])}>{media.image_url&&<img src={media.image_url} alt="" width={40} height={60}/>}<span>{media.title}</span>{contains(media)&&<Check size={16} aria-hidden="true"/>}</button>)}</div>}
    {!results.isPending&&!results.error&&!results.data?.data.length&&<p className="setup-help">{t('catalogue.noResults')}</p>}
    <p className="setup-help" role="status">{t('setup.favoritesCount',{count:selected.length})}</p>
  </div>
}
function Choices({values,selected,onToggle,label,disabled}:{values:string[];selected:string[];onToggle:(value:string)=>void;label?:(value:string)=>string;disabled:boolean}){
  return <div className="setup-choices">{values.map(value=><button type="button" key={value} aria-pressed={selected.includes(value)} disabled={disabled} onClick={()=>onToggle(value)}>{selected.includes(value)&&<Check size={13} aria-hidden="true"/>}{label?label(value):value}</button>)}</div>
}
export function ProfileSetupWizard({initial,genres,busy=false,error,onSave}:{initial:SetupRead;genres:string[];busy?:boolean;error?:Error|null;onSave:(draft:SetupDraft,skip:boolean)=>void}){
  const [step,setStep]=useState(0)
  const [draft,setDraft]=useState<SetupDraft>(()=>({displayName:initial.profile.display_name,genres:initial.preferences.data.preferred_genres??[],answers:{...defaultAnswers(),...initial.preferences.data.intelligence_profile},favorites:initial.favorites??[]}))
  const [negativeMode,setNegativeMode]=useState<'disliked_genres'|'excluded_genres'>('disliked_genres')
  const region=useRef<HTMLDivElement>(null)
  const heading=useRef<HTMLDivElement>(null)
  useEffect(()=>{heading.current?.focus()},[step])
  const set=<K extends keyof IntelligenceProfile>(key:K,value:IntelligenceProfile[K])=>setDraft(previous=>({...previous,answers:{...previous.answers,[key]:value}}))
  const toggle=(values:string[],value:string)=>values.includes(value)?values.filter(item=>item!==value):[...values,value]
  function advance(){if(region.current?.querySelector<HTMLInputElement>('input:invalid')?.reportValidity()===false)return;if(step<2){setStep(step+1);region.current?.scrollIntoView?.({block:'start'})}else onSave(draft,false)}
  return <div className="setup-shell"><header className="setup-heading"><p className="eyebrow">{t('setup.eyebrow')}</p><h1>{t('setup.title')}</h1><p>{t('setup.intro')}</p></header>
    <ol className="setup-steps" aria-label={t('setup.progress')}>{(['setup.background','setup.taste','setup.fit'] as const).map((label,index)=><li key={label} aria-current={step===index?'step':undefined} data-complete={step>index}><span>{step>index?<Check size={16}/>:index+1}</span>{t(label)}</li>)}</ol>
    <div className="setup-panel" ref={region}><div className="setup-step-heading" ref={heading} tabIndex={-1}><h2>{t((['setup.background','setup.taste','setup.fit'] as const)[step])}</h2><p>{t('setup.questionRange',{from:step*3+1,to:step*3+3})}</p></div>
      {step===0&&<>
        <fieldset className="setup-question" disabled={busy}><legend>{t('setup.nameQuestion')}</legend><input aria-label={t('settings.displayName')} maxLength={80} value={draft.displayName} autoComplete="nickname" onChange={event=>setDraft({...draft,displayName:event.target.value})}/></fieldset>
        <fieldset className="setup-question" disabled={busy}><legend>{t('setup.yearQuestion')}</legend><p className="setup-help">{t('setup.yearHelp')}</p><input type="number" min={1} max={new Date().getFullYear()} inputMode="numeric" aria-label={t('setup.startYear')} value={draft.answers.started_year??''} onChange={event=>set('started_year',event.target.value?Number(event.target.value):null)}/></fieldset>
        <fieldset className="setup-question" disabled={busy}><legend>{t('setup.mediaQuestion')}</legend><Choices values={[...contentTypes]} selected={draft.answers.media_types??[]} disabled={busy} label={value=>t(`setup.type.${value}` as MessageKey)} onToggle={value=>set('media_types',toggle(draft.answers.media_types??[],value) as IntelligenceProfile['media_types'])}/></fieldset>
      </>}
      {step===1&&<>
        <fieldset className="setup-question" disabled={busy}><legend>{t('setup.favoritesQuestion')}</legend><FavoritePicker selected={draft.favorites} onChange={favorites=>setDraft({...draft,favorites})} busy={busy}/></fieldset>
        <fieldset className="setup-question" disabled={busy}><legend>{t('setup.genresQuestion')}</legend><Choices values={genres} selected={draft.genres} disabled={busy} onToggle={value=>setDraft({...draft,genres:toggle(draft.genres,value)})}/></fieldset>
        <fieldset className="setup-question" disabled={busy}><legend>{t('setup.storyQuestion')}</legend><Choices values={[...storyTraits]} selected={draft.answers.story_traits??[]} disabled={busy} label={value=>t(`setup.trait.${value}` as MessageKey)} onToggle={value=>set('story_traits',toggle(draft.answers.story_traits??[],value))}/></fieldset>
      </>}
      {step===2&&<>
        <fieldset className="setup-question" disabled={busy}><legend>{t('setup.avoidQuestion')}</legend><p className="setup-help">{t('setup.avoidHelp')}</p><div className="setup-negative-mode">{(['disliked_genres','excluded_genres'] as const).map(mode=><button type="button" key={mode} aria-pressed={negativeMode===mode} onClick={()=>setNegativeMode(mode)}>{t(mode==='disliked_genres'?'setup.softDislike':'setup.strictExclude')}</button>)}</div><Choices values={genres} selected={draft.answers[negativeMode]??[]} disabled={busy} onToggle={value=>{const other=negativeMode==='disliked_genres'?'excluded_genres':'disliked_genres';setDraft(previous=>({...previous,answers:{...previous.answers,[negativeMode]:toggle(previous.answers[negativeMode]??[],value),[other]:(previous.answers[other]??[]).filter(item=>item!==value)}}))}}/><p className="setup-help">{t('setup.avoidSummary',{soft:(draft.answers.disliked_genres??[]).join(', ')||t('setup.none'),strict:(draft.answers.excluded_genres??[]).join(', ')||t('setup.none')})}</p></fieldset>
        <fieldset className="setup-question" disabled={busy}><legend>{t('setup.statusQuestion')}</legend><select aria-label={t('setup.seriesStatus')} value={draft.answers.series_status??'any'} onChange={event=>set('series_status',event.target.value as IntelligenceProfile['series_status'])}>{(['any','finished','ongoing'] as const).map(status=><option key={status} value={status}>{t(`setup.status.${status}`)}</option>)}</select></fieldset>
        <fieldset className="setup-question" disabled={busy}><legend>{t('setup.lengthQuestion')}</legend><p className="setup-help">{t('setup.lengthHelp')}</p><input type="number" min={1} max={100000} inputMode="numeric" aria-label={t('setup.episodeLimit')} placeholder={t('setup.noLimit')} value={draft.answers.max_anime_episodes??''} onChange={event=>set('max_anime_episodes',event.target.value?Number(event.target.value):null)}/></fieldset>
      </>}
      {error&&<p role="alert" className="setup-error">{error.message}</p>}
      <footer className="setup-actions"><Button type="button" variant="ghost" disabled={busy} onClick={()=>onSave(draft,true)}>{t('setup.later')}</Button><div>{step>0&&<Button type="button" variant="secondary" disabled={busy} onClick={()=>setStep(step-1)}><ArrowLeft size={15}/>{t('common.back')}</Button>}<Button type="button" disabled={busy} onClick={advance}>{t(busy?'auth.working':step===2?'setup.save':'setup.continue')}<ArrowRight size={15}/></Button></div></footer>
    </div>
  </div>
}
