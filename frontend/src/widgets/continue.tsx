import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useBackend } from '../shared/api/backend'
import { mediaPath } from '../shared/api/anilist'
import { useAuth } from '../shared/auth'
import { api, type Media } from '../shared/api/client'
import { t } from '../shared/content'
import { ErrorState } from '../shared/ui'

type ContinueItem = { session_id:string;version:number;media:Media;summary:{next_key:string|null;caught_up:boolean} }
function ContinueQueue({type}:{type:'anime'|'manga'}) {
  const {userId}=useAuth()
  const {ready}=useBackend()
  const query=useQuery({queryKey:['private',userId,'continue',type],enabled:Boolean(userId&&ready),queryFn:({signal})=>api<ContinueItem[]>(`/me/continue-${type==='anime'?'watching':'reading'}`,{signal,accountId:userId!})})
  if(!userId||!ready||query.isPending) return null
  if(query.error) return <ErrorState error={query.error} retry={()=>{void query.refetch()}}/>
  if(!query.data.length)return null
  return <section className="home-section"><div className="section-heading"><h2>{t(type==='anime'?'tracking.continueWatching':'tracking.continueReading')}</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{query.data.map(item=><Link key={item.session_id} to={mediaPath(item.media)} className="flex min-h-24 items-center gap-4 rounded border border-line p-3">{item.media.image_url&&<img src={item.media.image_url} alt="" width={48} height={72} className="h-18 w-12 rounded object-cover"/>}<div><p className="text-sm font-medium">{item.media.title}</p><p className="mt-2 text-xs text-muted">{item.summary.caught_up?t('tracking.caughtUp'):t('tracking.nextUnresolved',{label:item.summary.next_key!})}</p></div></Link>)}</div></section>
}
export function ContinueSections(){return <><ContinueQueue type="anime"/><ContinueQueue type="manga"/></>}
