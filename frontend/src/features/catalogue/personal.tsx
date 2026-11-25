import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../shared/auth'
import { useBackend } from '../../shared/api/backend'
import type { Media } from '../../shared/api/client'
import { resolveMedia } from '../../shared/api/identity'
import { CollectionPicker } from '../collections'
import { PersonalDetails } from '../library'
import { Tracker } from '../tracking'
import { ErrorState, Loading } from '../../shared/ui'

export function PersonalMedia({ media }: { media: Media }) {
  const { userId } = useAuth()
  const { ready } = useBackend()
  const resolved = useQuery({
    queryKey: ['private', userId, 'source-identity', media.id], enabled: Boolean(userId && ready),
    queryFn: () => resolveMedia(media,userId!),
    staleTime: Infinity, retry: false,
  })
  if (!userId) return <Tracker media={media} />
  if (!ready) return null
  if (resolved.isPending) return <Loading />
  if (resolved.error) return <ErrorState error={resolved.error} retry={() => { void resolved.refetch() }} />
  return <><CollectionPicker media={resolved.data} /><PersonalDetails media={resolved.data} /><Tracker media={resolved.data} /></>
}
