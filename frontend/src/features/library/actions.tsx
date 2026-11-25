import {useLayoutEffect,useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {MoreHorizontal} from 'lucide-react'
import {SaveButton,useLibraryWrite,type Entry} from '.'
import {CompleteTitle} from './complete'
import {readSavedStatus} from './status'
import {PersonalDetails} from './details'
import {CollectionPicker} from '../collections'
import type {Media} from '../../shared/api/client'
import {resolveMedia} from '../../shared/api/identity'
import {mediaPath} from '../../shared/api/anilist'
import {useAuth} from '../../shared/auth'
import {useBackend} from '../../shared/api/backend'
import {t} from '../../shared/content'
import {Button,ErrorState,Loading,Modal} from '../../shared/ui'
import {captureFlyOrigin,type FlyOrigin} from '../../shared/motion'

export function useSavedEntry(media:Media){
  const {userId}=useAuth(),{ready}=useBackend()
  return useQuery({queryKey:['private',userId,'media-status',media.media_type,media.id],enabled:Boolean(userId&&ready),queryFn:()=>readSavedStatus(media,userId!),staleTime:30000,retry:false})
}
export function CardStatus({media}:{media:Media}){
  const {userId}=useAuth(),saved=useSavedEntry(media)
  return userId&&saved.data?<div className="card-context"><span className="personal-card-status">{t(`status.${saved.data.status}`)}</span></div>:null
}
function Management({media,entry,close,origin}:{media:Media;entry:Entry|null;close:()=>void;origin?:FlyOrigin}){
  const write=useLibraryWrite(),{userId}=useAuth(),account=useRef(userId)
  useLayoutEffect(()=>{account.current=userId;return()=>{account.current=null}},[userId])
  function change(status:Entry['status']){const owner=userId;write.mutate({id:media.id,status,version:entry?.version},{onSuccess:()=>{if(account.current===owner)close()}})}
  return <><div className="personal-dialog-actions">
    {(!entry||entry.status==='planned')&&<><SaveButton media={media} origin={origin} onSaved={close}/><Button disabled={write.isPending} onClick={()=>change('in_progress')}>{t(media.media_type==='anime'?'library.startWatching':'library.startReading')}</Button></>}
    {(!entry||['planned','in_progress','on_hold','dropped','completed'].includes(entry.status))&&<CompleteTitle media={media} entry={entry??undefined} label={t(media.media_type==='anime'?'library.markWatched':'library.markRead')} onComplete={close}/>}
    <Link className="button button-secondary" to={`${mediaPath(media)}#your-progress`}>{t('media.yourProgress')}</Link>
  </div><CollectionPicker media={media}/>{entry&&<PersonalDetails media={media}/>}</>
}
function ResolvedManagement({media,close,origin}:{media:Media;close:()=>void;origin?:FlyOrigin}){
  const {userId}=useAuth()
  const saved=useSavedEntry(media)
  const resolved=useQuery({queryKey:['private',userId,'source-identity',media.id],enabled:!saved.isPending&&!saved.error,queryFn:()=>saved.data?Promise.resolve(saved.data.media):resolveMedia(media,userId!),retry:false,staleTime:Infinity})
  if(resolved.isPending||saved.isPending)return <Loading/>
  if(resolved.error||saved.error)return <ErrorState error={resolved.error??saved.error} retry={()=>{void resolved.refetch();void saved.refetch()}}/>
  return <Management media={resolved.data} entry={saved.data??null} origin={origin} close={close}/>
}
function SignedInActions({media}:{media:Media}){
  const [open,setOpen]=useState(false),{ready}=useBackend(),saved=useSavedEntry(media)
  const [origin,setOrigin]=useState<FlyOrigin>()
  const [focusFallback,setFocusFallback]=useState<HTMLElement|null>(null)
  return <><button className="card-save" aria-label={t('media.manageLabel',{title:media.title})} title={ready?saved.data?t(`status.${saved.data.status}`):t('media.cardActions'):t('backend.actionUnavailable')} aria-haspopup="dialog" disabled={!ready} onClick={event=>{setOrigin(captureFlyOrigin(event.currentTarget));setFocusFallback(event.currentTarget.closest('section')?.querySelector<HTMLElement>('h2')??document.querySelector<HTMLElement>('h1'));setOpen(true)}}><MoreHorizontal size={18}/></button>
    <Modal open={open} onOpenChange={setOpen} title={media.title} focusFallback={focusFallback} description={saved.data?t(`status.${saved.data.status}`):t('media.cardActions')}>
      {open&&ready&&<ResolvedManagement media={media} origin={origin} close={()=>setOpen(false)}/>} {!ready&&<p role="status">{t('backend.actionUnavailable')}</p>}
    </Modal></>
}
export function CardActions({media}:{media:Media}){
  const {userId}=useAuth()
  return userId?<SignedInActions key={`${userId}:${media.id}`} media={media}/>:<SaveButton media={media} compact/>
}
