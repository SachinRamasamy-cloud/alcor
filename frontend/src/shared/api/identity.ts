import { api, type Media } from './client'

export async function resolveMediaId(id: string, accountId: string): Promise<string> {
  const match = /^anilist-(\d+)$/.exec(id)
  if (!match) return id
  const media = await api<Media>('/me/media/resolve', { accountId, method: 'POST', body: JSON.stringify({ anilist_id: Number(match[1]) }) })
  return media.id
}
