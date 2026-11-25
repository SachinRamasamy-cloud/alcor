import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Search, X } from 'lucide-react'
import { t } from '../../shared/content'

export function SearchField({ value, onCommit, busy = false, label=t('catalogue.searchPlaceholder') }: { value: string; onCommit: (value: string) => void; busy?: boolean;label?:string }) {
  const [state,setState]=useState({ source:value, draft:value })
  const timer=useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const composing=useRef(false)
  const input=useRef<HTMLInputElement>(null)
  // Synchronize browser Back/Forward without replacing the input DOM node.
  if(state.source!==value)setState({source:value,draft:value})
  useEffect(()=>{clearTimeout(timer.current);return()=>clearTimeout(timer.current)},[value])
  function schedule(draft:string) {
    clearTimeout(timer.current)
    if(!composing.current)timer.current=setTimeout(()=>onCommit(draft),300)
  }
  return <div className="search-input-group"><form className="search-field" role="search" onSubmit={event=>{event.preventDefault();clearTimeout(timer.current);onCommit(state.draft)}}>
    <Search size={20} aria-hidden="true"/>
    <input ref={input} name="query" type="search" autoComplete="off" maxLength={200} aria-label={label} placeholder={label} value={state.draft}
      onChange={event=>{const draft=event.target.value;setState(previous=>({...previous,draft}));schedule(draft)}}
      onCompositionStart={()=>{composing.current=true;clearTimeout(timer.current)}} onCompositionEnd={event=>{composing.current=false;schedule(event.currentTarget.value)}}/>
    {state.draft&&<button className="search-clear icon-button" type="button" aria-label={t('catalogue.clear')} onClick={()=>{clearTimeout(timer.current);setState(previous=>({...previous,draft:''}));onCommit('');input.current?.focus()}}><X size={16}/></button>}
    <button className="search-submit" aria-label={t('nav.search')} type="submit"><span>{t('nav.search')}</span><ArrowRight size={17}/></button>
  </form><p className="search-hint" aria-live="polite">{t(busy?'catalogue.searching':'catalogue.searchHint')}</p></div>
}
