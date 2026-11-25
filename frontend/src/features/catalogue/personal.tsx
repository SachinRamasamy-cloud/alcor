import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../shared/auth'
import { useBackend } from '../../shared/api/backend'
import { api, type Media } from '../../shared/api/client'
import { CollectionPicker } from '../collections'
import { PersonalDetails } from '../library'
import { Tracker } from '../tracking'
import { ErrorState, Loading } from '../../shared/ui'

export function PersonalMedia({ media }: { media: Media }) {
  const { userId } = useAuth()
  const { ready } = useBackend()
  const match = /^anilist-(\d+)$/.exec(media.id)
  const resolved = useQuery({
    queryKey: ['private', userId, 'source-identity', media.id], enabled: Boolean(userId && ready),
    queryFn: () => match ? api<Media>('/me/media/resolve', { accountId: userId!, method: 'POST', body: JSON.stringify({ anilist_id: Number(match[1]) }) }) : Promise.resolve(media),
    staleTime: Infinity, retry: false,
  })
  if (!userId) return <Tracker media={media} />
  if (!ready) return null
  if (resolved.isPending) return <Loading />
  if (resolved.error) return <ErrorState error={resolved.error} retry={() => { void resolved.refetch() }} />
  return <><CollectionPicker media={resolved.data} /><PersonalDetails media={resolved.data} /><Tracker media={resolved.data} /></>
}
