import {useEffect} from 'react'
import {useSearchParams} from 'react-router-dom'
import {useAuth} from '../shared/auth'
import {useBackend} from '../shared/api/backend'
import {Button,ErrorState,Loading,Pagination} from '../shared/ui'
import {MediaGrid} from '../entities/media'
import {CardActions} from '../features/library/actions'
import {useDismissedRecommendations} from '../features/recommendations/feedback'
import {useCataloguePagination} from '../features/catalogue/pagination'
import {t} from '../shared/content'

export function DismissedRecommendationsPage(){const {userId}=useAuth();return <Content key={userId??'guest'}/>}
function Content(){
  const {userId,requireSignIn}=useAuth(),{ready}=useBackend(),[params,setParams]=useSearchParams(),query=useDismissedRecommendations(params.get('cursor')??'')
  const pager=useCataloguePagination(query.data?.next_cursor,Boolean(query.data?.next_cursor),undefined,true)
  useEffect(()=>{document.title=`${t('recommendations.dismissedTitle')} · ALCOR`},[])
  return <div className="shell page-body personal-page"><div className="page-heading"><h1>{t('recommendations.dismissedTitle')}</h1></div><p className="coverage-note">{t('recommendations.dismissedHelp')}</p>
    {!userId?<Button onClick={()=>requireSignIn()}>{t('nav.signIn')}</Button>:!ready?<p role="status">{t('backend.actionUnavailable')}</p>:query.isPending?<Loading variant="library"/>:query.error?<ErrorState error={query.error} retry={()=>{void query.refetch()}}/>:query.data.total===0?<p>{t('recommendations.noDismissals')}</p>:<>
      {query.data.data.length?<MediaGrid items={query.data.data.map(item=>item.media)} actions={media=><CardActions media={media} recommendationContext="management" feedbackVersion={query.data.data.find(item=>item.media.id===media.id)!.version}/>}/>:<Button variant="secondary" onClick={()=>setParams({})}>{t('pagination.first')}</Button>}
      <Pagination page={pager.page} hasNext={Boolean(query.data.next_cursor)} availablePages={pager.availablePages} busy={query.isFetching} onChange={pager.change}/>
    </>}
  </div>
}
