import {Link} from 'react-router-dom'
import {Bookmark} from 'lucide-react'
import {useLibrary} from '../features/library'
import {FlyTarget} from '../shared/motion'
import {t} from '../shared/content'

export function WishlistTarget(){
  const query=useLibrary(true)
  return <Link to="/wishlist" className="icon-button header-wishlist" aria-label={t('nav.wishlist')}><FlyTarget name="wishlist"><Bookmark size={18}/>{query.data&&query.data.total>0&&<span className="wishlist-count" aria-hidden="true">{query.data.total}</span>}</FlyTarget></Link>
}
