import { api, type Media } from './client'

export async function resolveMediaId(id: string, accountId: string): Promise<string> {
  const match = /^anilist-(\d+)$/.exec(id)
  if (!match) return id
  const media = await api<Media>('/me/media/resolve', { accountId, method: 'POST', body: JSON.stringify({ anilist_id: Number(match[1]) }) })
  return media.id
}

export function sameTitle(a:Media,b:Media){return a.media_type===b.media_type&&(a.id===b.id||Boolean(a.source_ids?.anilist&&a.source_ids.anilist===b.source_ids?.anilist)||Boolean(a.source_ids?.mal&&a.source_ids.mal===b.source_ids?.mal))}
