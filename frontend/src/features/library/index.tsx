import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Check, Plus } from 'lucide-react'
import {readSavedStatus} from './status'
import {useLayoutEffect,useRef,type MouseEvent} from 'react'
import type { components } from '../../shared/api/schema'
import { api, type Media } from '../../shared/api/client'
import { resolveMediaId } from '../../shared/api/identity'
import { useBackend } from '../../shared/api/backend'
import { useAuth } from '../../shared/auth'
import { useFeedback } from '../../shared/feedback'
import { t } from '../../shared/content'
import { Button } from '../../shared/ui'
import {captureFlyOrigin,flyToTarget,type FlyOrigin} from '../../shared/motion'

export type Entry = components['schemas']['LibraryEntry']
export { PersonalDetails } from './details'
export type LibraryPageData = components['schemas']['LibraryPage']
type Result = components['schemas']['LibraryMutation']
export function useLibrary(wishlist: boolean, cursor = '', status = '', page = 1) {
  const { userId } = useAuth()
  const {ready}=useBackend()
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  else params.set('page',String(page))
  if (status && !wishlist) params.set('status', status)
  return useQuery({ queryKey: ['private', userId, wishlist ? 'wishlist' : 'library', cursor, status, page], enabled: Boolean(userId&&ready), queryFn: ({ signal }) => api<LibraryPageData>(`/me/${wishlist ? 'wishlist' : 'library'}?${params}`, { signal, accountId: userId! }), staleTime: 30000 })
}
export function useLibraryWrite() {
  const queries = useQueryClient()
  const notify = useFeedback()
  const { userId } = useAuth()
  const currentAccount=useRef(userId)
  useLayoutEffect(()=>{currentAccount.current=userId},[userId])
  return useMutation({
    scope: { id: `library:${userId}` },
    onMutate:()=>({accountId:userId}),
    mutationFn: async ({ id, status, version, remove = false, removeLibrary = false }: { id: string; status?: Entry['status']; version?: number; remove?: boolean; removeLibrary?: boolean; origin?:FlyOrigin }) => {
      if (!userId) throw new Error(t('errors.auth'))
      const canonical = await resolveMediaId(id, userId)
      return api<Result>(remove ? `/me/${removeLibrary?'library':'wishlist'}/${canonical}?expected_version=${version}` : `/me/library/${canonical}`, { accountId: userId, method: remove ? 'DELETE' : 'PUT', body: remove ? undefined : JSON.stringify({ status, expected_version: version }) })
    },
    onSuccess: (result,variables,context) => {
      if(!context.accountId||context.accountId!==currentAccount.current)return
      const entry=result.entry
      const references=[variables.id,entry.media.id,...(entry.media.source_ids?.anilist?[`anilist-${entry.media.source_ids.anilist}`]:[])]
      queries.setQueriesData<Entry|null>({predicate:query=>query.queryKey[0]==='private'&&query.queryKey[1]===context.accountId&&query.queryKey[2]==='media-status'&&query.queryKey[3]===entry.media.media_type&&references.includes(String(query.queryKey[4]))},entry.deleted_at?null:entry)
      if(result.changed){
        notify(t(entry.deleted_at?(variables.removeLibrary?'library.removed':'wishlist.removed'):entry.status==='planned'?'wishlist.added':'library.saved'))
        if(!entry.deleted_at&&!variables.remove&&['planned','in_progress'].includes(entry.status))flyToTarget({scopeKey:context.accountId,target:entry.status==='planned'?'wishlist':'library',origin:variables.origin,image:entry.media.image_url})
      }
    },
    onError: (error: Error,_variables,context) => {if(context?.accountId===currentAccount.current)notify(error.message)},
    onSettled: () => { void queries.invalidateQueries({ queryKey: ['private', userId] }) },
  })
}
export function SaveButton({ media, kind = 'wishlist', compact = false }: { media: Media; kind?: 'wishlist' | 'library'; compact?: boolean }) {
  const { userId, requireSignIn } = useAuth()
  const write = useLibraryWrite()
  const { ready } = useBackend()
  const saved=useQuery({queryKey:['private',userId,'media-status',media.media_type,media.id],enabled:Boolean(userId&&ready),queryFn:()=>readSavedStatus(media,userId!),staleTime:30000,retry:false})
  const entry=saved.data
  const already=Boolean(entry&&(kind==='wishlist'||entry.status!=='planned'))
  const disabled = write.isPending || Boolean(userId && (!ready||saved.isPending)) || already
  const label=already?t(entry?.status==='planned'?'media.inWishlist':entry?.status==='completed'?'status.completed':'media.inLibrary'):saved.error?t('media.retryStatus'):t(kind === 'wishlist' ? 'media.addWishlist' : 'media.addLibrary')
  const save = (event:MouseEvent<HTMLButtonElement>) => {
    if (!userId) requireSignIn(kind, { kind, mediaId: media.id })
    else if(saved.error)void saved.refetch()
    else if(!already)write.mutate({ id: media.id, status: kind === 'wishlist' ? 'planned' : 'in_progress',version:entry?.version,origin:captureFlyOrigin(event.currentTarget) })
  }
  if (compact) return <button className="card-save" aria-pressed={already} aria-label={already||saved.error?`${label}: ${media.title}`:t('media.wishlistLabel', { title: media.title })} title={userId && !ready ? t('backend.actionUnavailable') : label} disabled={disabled} onClick={save}><Bookmark size={17} fill={already?'currentColor':'none'} /></button>
  return <Button variant={kind === 'wishlist' ? 'secondary' : 'primary'} aria-pressed={already} title={userId && !ready ? t('backend.actionUnavailable') : undefined} disabled={disabled} onClick={save}>{already?<Check size={16}/>:kind === 'wishlist' ? <Bookmark size={16} /> : <Plus size={16} />}{label}</Button>
}
