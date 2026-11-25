import { usePreferences } from '../features/preferences'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../shared/api/client'
import type { components } from '../shared/api/schema'
import { useAuth } from '../shared/auth'
import { useFeedback } from '../shared/feedback'
import { t,type MessageKey } from '../shared/content'
import { Button, ErrorState, Loading } from '../shared/ui'
import { PersonalNav } from '../widgets/personal-nav'

const actions:Record<string,MessageKey>={
  'library.added':'reports.added','library.updated':'reports.updated','library.details':'reports.details','library.removed':'reports.removed','wishlist.removed':'reports.wishlistRemoved',
  'tracking.started':'reports.started','tracking.progress':'reports.progress','tracking.completed_assertion':'reports.completed','tracking.targets_added':'reports.targets','tracking.unit_details':'reports.unitDetails',
  'collection.created':'reports.collectionCreated','collection.renamed':'reports.collectionRenamed','collection.deleted':'reports.collectionDeleted','collection.item_saved':'reports.collectionItem','collection.item_removed':'reports.collectionRemoved','undo.applied':'reports.undone',
}
function Guest(){const {requireSignIn}=useAuth();return <div className="state-box"><p>{t('auth.library')}</p><Button onClick={()=>requireSignIn()}>{t('nav.signIn')}</Button></div>}
export function HistoryPage(){
  const {userId}=useAuth()
  const [params,setParams]=useSearchParams()
  const preferences=usePreferences()
  const queries=useQueryClient(),notify=useFeedback()
  const history=useQuery({queryKey:['private',userId,'history',params.toString()],enabled:Boolean(userId),queryFn:({signal})=>api<components['schemas']['HistoryPage']>(`/me/history?${params}`,{signal,accountId:userId!})})
  const undo=useMutation({mutationFn:({id,version}:{id:string;version:number})=>api(`/me/actions/${id}/undo`,{method:'POST',accountId:userId!,body:JSON.stringify({expected_version:version})}),onSuccess:()=>notify(t('reports.undoSuccess')),onError:(error:Error)=>notify(error.message),onSettled:()=>{void queries.invalidateQueries({queryKey:['private',userId]})}})
  const date=(value:string)=>new Intl.DateTimeFormat('en',{dateStyle:'medium',timeStyle:'short',timeZone:preferences.data?.data.timezone??'UTC'}).format(new Date(value))
  return <div className="shell page-body"><PersonalNav/><div className="page-heading"><h1>{t('reports.history')}</h1></div>{!userId?<Guest/>:history.isPending?<Loading/>:history.error?<ErrorState error={history.error} retry={()=>{void history.refetch()}}/>:<><p className="mb-5 text-xs text-muted">{t('reports.recordedDates')}</p>{!history.data.data.length?<p>{t('reports.noHistory')}</p>:<ol className="divide-y divide-line">{history.data.data.map(item=><li key={item.id} className="flex flex-wrap items-center gap-4 py-5"><div className="mr-auto"><p className="text-sm font-medium">{t(actions[item.action]??'reports.activity')}</p>{item.title&&<p className="mt-2 text-sm text-muted">{item.title}</p>}<time className="mt-2 block text-xs text-muted" dateTime={item.occurred_at}>{date(item.occurred_at)}</time></div>{item.undone?<span className="text-xs text-muted">{t('reports.undone')}</span>:item.can_undo&&item.expected_version!==null&&<Button variant="secondary" disabled={undo.isPending} onClick={()=>undo.mutate({id:item.id,version:item.expected_version!})}>{t('reports.undo')}</Button>}</li>)}</ol>}<div className="pagination">{params.has('cursor')&&<Button variant="secondary" onClick={()=>setParams({})}>{t('catalogue.back')}</Button>}{history.data.next_cursor&&<Button variant="secondary" onClick={()=>setParams({cursor:history.data.next_cursor!})}>{t('catalogue.more')}</Button>}</div></>}</div>
}
export function StatisticsPage(){
  const {userId}=useAuth()
  const stats=useQuery({queryKey:['private',userId,'statistics'],enabled:Boolean(userId),queryFn:({signal})=>api<components['schemas']['StatisticsRead']>('/me/statistics',{signal,accountId:userId!})})
  const number=(value:number)=>new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(value)
  const metrics:[MessageKey,number|null][] = stats.data ? [
    ['reports.titles',stats.data.library.titles],['reports.everCompleted',stats.data.library.ever_completed],['reports.inProgress',stats.data.library.in_progress],['reports.planned',stats.data.library.planned],['reports.favorites',stats.data.library.favorites],['reports.averageRating',stats.data.library.average_rating],['reports.uniqueEpisodes',stats.data.progress.unique_episodes],['reports.uniqueChapters',stats.data.progress.unique_chapters],['reports.watchingEvents',stats.data.progress.watching_events],['reports.readingEvents',stats.data.progress.reading_events],['reports.skipped',stats.data.progress.skipped],['reports.repeats',stats.data.repeat_sessions],
  ]:[]
  return <div className="shell page-body"><PersonalNav/><div className="page-heading"><h1>{t('reports.statistics')}</h1></div>{!userId?<Guest/>:stats.isPending?<Loading/>:stats.error?<ErrorState error={stats.error} retry={()=>{void stats.refetch()}}/>:<><p className="mb-6 text-sm text-muted">{t('reports.evidence')}</p><dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(([label,value])=><div key={label} className="rounded border border-line p-5"><dt className="text-xs text-muted">{t(label)}</dt><dd className="mt-4 text-2xl font-medium tabular-nums">{value===null?t('media.notAvailable'):number(value)}</dd></div>)}</dl><section className="my-10"><h2 className="text-xl font-medium">{t('reports.genres')}</h2><table className="mt-5 w-full max-w-xl text-left text-sm"><thead><tr><th className="py-3 font-medium">{t('catalogue.genre')}</th><th className="py-3 font-medium">{t('reports.titles')}</th></tr></thead><tbody>{stats.data.genres.map(group=><tr className="border-t border-line" key={group.name}><td className="py-3">{group.name}</td><td>{number(group.count)}</td></tr>)}</tbody></table></section><p className="text-sm text-muted">{t('reports.durationUnknown')}</p><Link className="subtle-link" to="/library">{t('nav.library')}</Link></>}</div>
}
