import {useEffect} from 'react'
import {Link,useSearchParams} from 'react-router-dom'
import {useAuth} from '../shared/auth'
import {useBackend} from '../shared/api/backend'
import {t} from '../shared/content'
import {Button,ErrorState,Loading,Pagination} from '../shared/ui'
import {PersonalNav} from '../widgets/personal-nav'
import {MediaGrid} from '../entities/media'
import {CardActions,CardStatus} from '../features/library/actions'
import {useFavorites} from '../features/library/favorites'
import {useCataloguePagination} from '../features/catalogue/pagination'

export function FavoritesPage(){const {userId}=useAuth();return <FavoritesContent key={userId??'guest'}/>}
function FavoritesContent(){
  const {userId,requireSignIn}=useAuth(),{ready}=useBackend(),[params,setParams]=useSearchParams()
  const query=useFavorites(params.get('cursor')??'')
  const pager=useCataloguePagination(query.data?.next_cursor,Boolean(query.data?.next_cursor),undefined,true)
  useEffect(()=>{document.title=`${t('favorites.title')} · ALCOR`},[])
  return <div className="shell page-body personal-page"><PersonalNav/><div className="page-heading personal-heading"><div className="personal-title"><h1>{t('favorites.title')}</h1>{query.data&&<span className="personal-count">{query.data.total}</span>}</div><Link className="subtle-link" to="/profile">{t('settings.profile')}</Link></div>
    {!userId?<div className="state-box"><p>{t('favorites.signIn')}</p><Button onClick={()=>requireSignIn('library')}>{t('nav.signIn')}</Button></div>:!ready?<p role="status">{t('backend.actionUnavailable')}</p>:query.isPending?<Loading variant="library"/>:query.error?<ErrorState error={query.error} retry={()=>{void query.refetch()}}/>:query.data.total===0?<div className="state-box"><h2>{t('favorites.empty')}</h2><p>{t('favorites.emptyBody')}</p><Link className="button button-secondary" to="/anime">{t('nav.anime')}</Link></div>:<>
      {query.data.data.length?<MediaGrid items={query.data.data} actions={media=><CardActions media={media}/>} context={media=><CardStatus media={media}/>} />:<div className="state-box"><p>{t('favorites.pageEmpty')}</p><Button variant="secondary" onClick={()=>setParams({})}>{t('pagination.first')}</Button></div>}
      <Pagination page={pager.page} totalPages={Math.max(1,Math.ceil(query.data.total/24))} availablePages={pager.availablePages} hasNext={Boolean(query.data.next_cursor)} busy={query.isFetching} onChange={pager.change}/>
    </>}
  </div>
}
