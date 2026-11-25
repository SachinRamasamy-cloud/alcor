import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { t } from '../content'

type Props = {
  page: number; totalPages?: number | null; hasNext?: boolean; busy?: boolean
  availablePages?: number[]; onChange: (page: number) => void
}

export function Pagination({ page, totalPages, hasNext = false, busy = false, availablePages, onChange }: Props) {
  const [draft, setDraft] = useState('')
  const total = totalPages == null ? null : Math.max(1, totalPages)
  if (page <= 1 && (total === 1 || (!total && !hasNext))) return null
  const canVisit = (target: number) => target >= 1 && (!total || target <= total) && (!availablePages || availablePages.includes(target))
  const visit = (target: number) => { if (!busy && target !== page && canVisit(target)) { onChange(target); setDraft('') } }
  const window = total ? [1, page - 1, page, page + 1, total].filter(n => n >= 1 && n <= total) : availablePages ?? [page - 1, page, ...(hasNext ? [page + 1] : [])]
  const pages = [...new Set(window)].sort((a,b)=>a-b)
  const max = total ?? (availablePages ? Math.max(...availablePages) : page + (hasNext ? 1 : 0))
  return <nav className="pagination-control" aria-label={t('pagination.navigation')}>
    <p className="pagination-summary" aria-live="polite">{total ? t('pagination.pageOf', { page, total }) : t('pagination.page', { page })}</p>
    <div className="pagination-buttons">
      <button type="button" className="page-button" disabled={busy || page === 1} onClick={()=>visit(1)} aria-label={t('pagination.first')}><ChevronsLeft size={15}/><span>{t('pagination.first')}</span></button>
      <button type="button" className="page-button" disabled={busy || !canVisit(page-1)} onClick={()=>visit(page-1)} aria-label={t('pagination.previous')}><ChevronLeft size={15}/><span className="pagination-previous-label">{t('pagination.previous')}</span></button>
      <div className="pagination-numbers">{pages.flatMap((number,index)=>[
        ...(index && number-pages[index-1]>1 ? [<span className="page-ellipsis" aria-hidden="true" key={`gap-${number}`}>…</span>] : []),
        <button type="button" className={`page-button page-number${page===number?' selected':''}`} key={number} aria-label={t('pagination.goTo',{page:number})} aria-current={page===number?'page':undefined} disabled={busy || !canVisit(number)} onClick={()=>visit(number)}>{number}</button>,
      ])}</div>
      <button type="button" className="page-button" disabled={busy || (total ? page>=total : !hasNext) || !canVisit(page+1)} onClick={()=>visit(page+1)} aria-label={t('pagination.next')}><span>{t('pagination.next')}</span><ChevronRight size={15}/></button>
      {total && <button type="button" className="page-button" disabled={busy || page>=total} onClick={()=>visit(total)} aria-label={t('pagination.last')}><span>{t('pagination.last')}</span><ChevronsRight size={15}/></button>}
    </div>
    <form className="pagination-jump" onSubmit={event=>{event.preventDefault();const value=Number(draft);if(Number.isSafeInteger(value))visit(value)}}>
      <label>{t('pagination.jump')}<input type="number" inputMode="numeric" min={1} max={max} value={draft} onChange={event=>setDraft(event.target.value)} placeholder={String(page)} required aria-label={t('pagination.jump')}/></label>
      <button className="page-button" disabled={busy || !draft || !canVisit(Number(draft)) || !Number.isSafeInteger(Number(draft))}>{t('pagination.go')}</button>
    </form>
  </nav>
}
