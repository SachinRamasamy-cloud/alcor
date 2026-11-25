import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Plus } from 'lucide-react'
import type { components } from '../../shared/api/schema'
import { api, type Media } from '../../shared/api/client'
import { useAuth } from '../../shared/auth'
import { useFeedback } from '../../shared/feedback'
import { t } from '../../shared/content'
import { Button } from '../../shared/ui'

export type Entry = components['schemas']['LibraryEntry']
export type LibraryPageData = components['schemas']['LibraryPage']
type Result = components['schemas']['LibraryMutation']
export function useLibrary(wishlist: boolean, cursor = '', status = '') {
  const { userId } = useAuth()
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  if (status && !wishlist) params.set('status', status)
  return useQuery({ queryKey: ['private', userId, wishlist ? 'wishlist' : 'library', cursor, status], enabled: Boolean(userId), queryFn: ({ signal }) => api<LibraryPageData>(`/me/${wishlist ? 'wishlist' : 'library'}?${params}`, { signal, accountId: userId! }), staleTime: 30000 })
}
export function useLibraryWrite() {
  const queries = useQueryClient()
  const notify = useFeedback()
  const { userId } = useAuth()
  return useMutation({
    scope: { id: `library:${userId}` },
    mutationFn: async ({ id, status, version, remove = false }: { id: string; status?: Entry['status']; version?: number; remove?: boolean }) => {
      if (!userId) throw new Error(t('errors.auth'))
      return api<Result>(remove ? `/me/wishlist/${id}?expected_version=${version}` : `/me/library/${id}`, { accountId: userId, method: remove ? 'DELETE' : 'PUT', body: remove ? undefined : JSON.stringify({ status, expected_version: version }) })
    },
    onSuccess: result => { if (result.changed) notify(t(result.entry.deleted_at ? 'wishlist.removed' : result.entry.status === 'planned' ? 'wishlist.added' : 'library.saved')) },
    onError: (error: Error) => notify(error.message),
    onSettled: () => { void queries.invalidateQueries({ queryKey: ['private', userId] }) },
  })
}
export function SaveButton({ media, kind = 'wishlist', compact = false }: { media: Media; kind?: 'wishlist' | 'library'; compact?: boolean }) {
  const { userId, requireSignIn } = useAuth()
  const write = useLibraryWrite()
  const save = () => {
    if (!userId) requireSignIn(kind, { kind, mediaId: media.id })
    else write.mutate({ id: media.id, status: kind === 'wishlist' ? 'planned' : 'in_progress' })
  }
  if (compact) return <button className="card-save" aria-label={t('media.wishlistLabel', { title: media.title })} disabled={write.isPending} onClick={save}><Bookmark size={17} /></button>
  return <Button variant={kind === 'wishlist' ? 'secondary' : 'primary'} disabled={write.isPending} onClick={save}>{kind === 'wishlist' ? <Bookmark size={16} /> : <Plus size={16} />}{t(kind === 'wishlist' ? 'media.addWishlist' : 'media.addLibrary')}</Button>
}
