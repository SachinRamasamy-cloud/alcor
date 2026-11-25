import { api, ApiError, type CataloguePage } from '../../shared/api/client'
import { aniCatalogue } from '../../shared/api/anilist'

// Scan a bounded source window, filter before constructing the displayed page,
// and preserve the exact unread source offset rather than dropping eligible items.
export async function personalPage(path: string, params: URLSearchParams, userId: string, signal?: AbortSignal, source = aniCatalogue, exclude = exclusions): Promise<CataloguePage> {
  const cursor = params.get('cursor')
  const match = cursor ? /^f:(\d+):(\d+)$/.exec(cursor) : null
  let page = match ? Number(match[1]) : 1
  let offset = match ? Number(match[2]) : 0
  if (cursor && !match || page < 1 || page > 10000 || offset > 24) throw new ApiError(422, 'INVALID_CURSOR')
  const data: CataloguePage['data'] = []
  for (let scanned = 0; scanned < 3; scanned++) {
    const next = new URLSearchParams(params)
    next.set('cursor', String(page))
    const result = await source(path, next, signal)
    const excluded = await exclude(result.data, params.get('mode')!, userId, signal)
    for (let i = offset; i < result.data.length; i++) {
      const item = result.data[i]
      if (!excluded.includes(Number(item.source_ids?.anilist))) data.push(item)
      if (data.length === 24) {
        const unread = i + 1 < result.data.length
        const more = unread || result.has_more
        return { ...result, data, has_more: more, next_cursor: more ? `f:${unread ? page : page + 1}:${unread ? i + 1 : 0}` : null }
      }
    }
    if (!result.has_more) return { ...result, data, has_more: false, next_cursor: null }
    page++; offset = 0
  }
  return { data, has_more: true, next_cursor: `f:${page}:0`, source: 'AniList', is_partial: true, is_stale: false }
}

async function exclusions(items: CataloguePage['data'], mode: string, userId: string, signal?: AbortSignal) {
  if (!items.length) return []
  return api<number[]>('/me/discovery-exclusions', { signal, accountId: userId, method: 'POST', body: JSON.stringify({ mode, candidates: items.map(m => ({ anilist_id: Number(m.source_ids?.anilist), mal_id: m.source_ids?.mal ? Number(m.source_ids.mal) : null, media_type: m.media_type })) }) })
}
