import { ApiError, type CataloguePage, type HomeResponse, type Media } from './client'

export const ANILIST_ENDPOINT = 'https://graphql.anilist.co'
const fields = `id idMal type title { romaji english native } synonyms description(asHtml: false)
  coverImage { large } format status season seasonYear startDate { year } episodes chapters
  averageScore popularity genres tags { name isAdult isGeneralSpoiler isMediaSpoiler }
  studios(isMain: true) { nodes { name } } siteUrl isAdult`

export type AniMedia = {
  id: number; idMal?: number | null; type: 'ANIME' | 'MANGA'
  title: { romaji?: string | null; english?: string | null; native?: string | null }
  synonyms?: string[]; description?: string | null; coverImage?: { large?: string | null }
  format?: string | null; status?: string | null; season?: string | null
  seasonYear?: number | null; startDate?: { year?: number | null }
  episodes?: number | null; chapters?: number | null; averageScore?: number | null
  popularity?: number | null; genres?: string[]; tags?: { name: string; isAdult?: boolean; isGeneralSpoiler?: boolean; isMediaSpoiler?: boolean }[]
  studios?: { nodes: { name: string }[] }; siteUrl?: string; isAdult?: boolean
}

// One queue per tab: below the documented temporary 30/minute quota. This is
// not a guarantee for other tabs/apps sharing the same IP; 429 remains authoritative.
export class AniListTransport {
  private pending = new Map<string, { promise: Promise<unknown>; controller: AbortController; subscribers: number }>()
  private tail: Promise<unknown> = Promise.resolve()
  private nextAt = 0
  private blockedUntil = 0
  constructor(private request: typeof fetch = (...args) => fetch(...args), private spacing = 2100) {}

  query<T>(query: string, variables: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) return Promise.reject(signal.reason)
    const key = JSON.stringify({ query, variables })
    const existing = this.pending.get(key)
    if (existing && !existing.controller.signal.aborted) return this.subscribe<T>(existing, signal)
    const controller = new AbortController()
    const job = this.tail.catch(() => {}).then(async () => {
      controller.signal.throwIfAborted()
      if (Date.now() < this.blockedUntil) throw new ApiError(429, 'RATE_LIMITED')
      const delay = this.nextAt - Date.now()
      if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay))
      controller.signal.throwIfAborted()
      this.nextAt = Date.now() + this.spacing
      const response = await this.request(ANILIST_ENDPOINT, {
        method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: key, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
      }).catch(error => { if (controller.signal.aborted) throw error; throw new ApiError(503, 'UPSTREAM_UNAVAILABLE') })
      const remaining = response.headers.get('X-RateLimit-Remaining')
      if (response.status === 429 || remaining === '0') {
        const retry = response.headers.get('Retry-After')
        const seconds = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : 0
        const date = retry && !seconds ? Date.parse(retry) : 0
        const reset = Number(response.headers.get('X-RateLimit-Reset')) * 1000
        this.blockedUntil = Math.max(Date.now() + (seconds || 60000), date || 0, reset || 0)
      }
      if (!response.ok) throw new ApiError(response.status, response.status === 429 ? 'RATE_LIMITED' : 'UPSTREAM_UNAVAILABLE')
      const body = await response.json()
      if (body.errors?.length || !body.data) throw new ApiError(503, 'UPSTREAM_UNAVAILABLE')
      return body.data as T
    })
    this.tail = job
    const record = { promise: job, controller, subscribers: 0 }
    this.pending.set(key, record)
    void job.finally(() => { if (this.pending.get(key) === record) this.pending.delete(key) }).catch(() => {})
    return this.subscribe<T>(record, signal)
  }

  private subscribe<T>(record: { promise: Promise<unknown>; controller: AbortController; subscribers: number }, signal?: AbortSignal): Promise<T> {
    record.subscribers++
    return new Promise<T>((resolve, reject) => {
      let finished = false
      const finish = () => {
        if (finished) return
        finished = true
        signal?.removeEventListener('abort', abort)
        record.subscribers--
        if (!record.subscribers) record.controller.abort()
      }
      const abort = () => { finish(); reject(signal?.reason) }
      signal?.addEventListener('abort', abort, { once: true })
      record.promise.then(value => { if (!finished) { finish(); resolve(value as T) } }, error => { if (!finished) { finish(); reject(error) } })
    })
  }
}

const transport = new AniListTransport()
function publicQuery<T>(query: string, variables?: Record<string, unknown>, signal?: AbortSignal) {
  // Local development is allowed. Production clearance is a separate recorded gate.
  if (import.meta.env.PROD && import.meta.env.VITE_ANILIST_USE_APPROVED !== 'true') {
    return Promise.reject(new ApiError(503, 'PROVIDER_NOT_CONFIGURED'))
  }
  return transport.query<T>(query, variables, signal)
}

function plainText(value: string | null | undefined) {
  const document = new DOMParser().parseFromString((value ?? '').replace(/<br\s*\/?>/gi, '\n'), 'text/html')
  document.querySelectorAll('script,style').forEach(node => node.remove())
  return document.body.textContent?.trim() || null
}
export function fromAniList(item: AniMedia): Media {
  const image = item.coverImage?.large
  const safeImage = image && /^https:\/\/s4\.anilist\.co\//.test(image) ? image : null
  return {
    id: `anilist-${item.id}`, external_id: `anilist:${item.id}`,
    media_type: item.type === 'MANGA' ? 'manga' : 'anime',
    title: item.title.english || item.title.romaji || item.title.native || String(item.id),
    original_title: item.title.native, aliases: [item.title.romaji, ...(item.synonyms ?? [])].filter((s): s is string => Boolean(s)),
    synopsis: plainText(item.description), image_url: safeImage,
    format: item.format === 'NOVEL' ? 'Light Novel' : item.format === 'MANGA' ? 'Manga' : item.format === 'MOVIE' ? 'Movie' : item.format === 'SPECIAL' ? 'Special' : item.format,
    status: item.status, season: item.season?.toLowerCase() as Media['season'], year: item.seasonYear ?? item.startDate?.year,
    score: item.averageScore == null ? null : item.averageScore / 10,
    // AniList popularity is list membership count, not a vote count or MAL rank.
    rating_count: null, popularity: null, total_units: item.type === 'MANGA' ? item.chapters : item.episodes,
    genres: item.genres ?? [], themes: item.tags?.filter(tag => !tag.isAdult && !tag.isGeneralSpoiler && !tag.isMediaSpoiler).map(tag => tag.name) ?? [],
    studios: item.studios?.nodes.map(studio => studio.name) ?? [],
    source: { name: 'AniList', url: `https://anilist.co/${item.type === 'MANGA' ? 'manga' : 'anime'}/${item.id}`, retrieved_at: new Date().toISOString(), is_fixture: false },
    source_ids: { anilist: String(item.id), ...(item.idMal ? { mal: String(item.idMal) } : {}) },
  }
}

export async function aniHome(signal?: AbortSignal): Promise<HomeResponse> {
  const result = await publicQuery<{ anime: { media: AniMedia[] }; manga: { media: AniMedia[] }; genres: string[] }>(
    `query AlcorHome { anime: Page(perPage: 12) { media(type: ANIME, isAdult: false, sort: POPULARITY_DESC) { ${fields} } }
      manga: Page(perPage: 6) { media(type: MANGA, isAdult: false, sort: POPULARITY_DESC) { ${fields} } } genres: GenreCollection }`, {}, signal)
  const anime = result.anime.media.filter(m => !m.isAdult).map(fromAniList)
  return { featured: anime[0] ?? null, anime, manga: result.manga.media.filter(m => !m.isAdult).map(fromAniList), genres: result.genres.filter(g => g !== 'Hentai'), is_fixture: false, is_partial: true }
}

export async function aniDetails(type: string, id: string, signal?: AbortSignal): Promise<Media> {
  const match = /^(anilist|mal)-(\d+)$/.exec(id)
  if (!match || Number(match[2]) < 1) throw new ApiError(404, 'NOT_FOUND')
  const result = await publicQuery<{ Media: AniMedia | null }>(`query AlcorDetails($id: Int, $idMal: Int, $type: MediaType) {
    Media(id: $id, idMal: $idMal, type: $type, isAdult: false) { ${fields} } }`,
  { [match[1] === 'mal' ? 'idMal' : 'id']: Number(match[2]), type: type.toUpperCase() }, signal)
  if (!result.Media || result.Media.isAdult) throw new ApiError(404, 'NOT_FOUND')
  return fromAniList(result.Media)
}

export async function aniCatalogue(path: string, params: URLSearchParams, signal?: AbortSignal): Promise<CataloguePage> {
  if(params.get('studio') || params.get('memory') === 'true') throw new ApiError(422, 'UNSUPPORTED_FILTER')
  const page = params.get('cursor') ? Number(params.get('cursor')) : 1
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000) throw new ApiError(422, 'INVALID_CURSOR')
  const variables: Record<string, unknown> = { page, type: path === '/anime' ? 'ANIME' : path === '/manga' ? 'MANGA' : undefined,
    search: params.get('q') || undefined,
    sort: ({ popular: 'POPULARITY_DESC', score: 'SCORE_DESC', title: 'TITLE_ROMAJI', year: 'START_DATE_DESC' })[params.get('sort') ?? 'popular'] ?? 'POPULARITY_DESC' }
  const declarations = ['$page: Int', '$type: MediaType', '$search: String', '$sort: [MediaSort]']
  const args = ['type: $type', 'search: $search', 'sort: $sort', 'isAdult: false']
  function arg(name: string, gqlType: string, value: unknown) {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) return
    declarations.push(`$${name}: ${gqlType}`); args.push(`${name}: $${name}`); variables[name] = value
  }
  const formats: Record<string, string> = { 'Light Novel': 'NOVEL', Manga: 'MANGA', Movie: 'MOVIE', Special: 'SPECIAL', TV: 'TV', OVA: 'OVA', ONA: 'ONA' }
  const format = params.get('format') ?? ''
  arg('format', 'MediaFormat', ['Manhwa','Manhua'].includes(format) ? 'MANGA' : formats[format])
  arg('countryOfOrigin', 'CountryCode', format === 'Manhwa' ? 'KR' : format === 'Manhua' ? 'CN' : undefined)
  arg('genre_in', '[String]', [...params.getAll('include_genres'), ...params.getAll('genre')])
  arg('genre_not_in', '[String]', params.getAll('exclude_genres'))
  arg('tag_in', '[String]', params.getAll('include_themes'))
  arg('tag_not_in', '[String]', params.getAll('exclude_themes'))
  arg('season', 'MediaSeason', params.get('season')?.toUpperCase())
  arg('status', 'MediaStatus', params.get('status')?.toUpperCase().replaceAll(' ', '_'))
  const year = params.get('year')
  const from = year || params.get('year_from'), to = year || params.get('year_to')
  if (from) arg('startDate_greater', 'FuzzyDateInt', Number(from) * 10000 - 1)
  if (to) arg('startDate_lesser', 'FuzzyDateInt', (Number(to) + 1) * 10000)
  if (params.has('score_min')) arg('averageScore_greater', 'Int', Math.ceil(Number(params.get('score_min')) * 10) - 1)
  if (params.has('units_max') && variables.type) arg(variables.type === 'MANGA' ? 'chapters_lesser' : 'episodes_lesser', 'Int', Number(params.get('units_max')) + 1)
  if(params.has('units_max') && !variables.type) throw new ApiError(422, 'UNSUPPORTED_FILTER')
  const result = await publicQuery<{ Page: { pageInfo: { hasNextPage: boolean }; media: AniMedia[] } }>(
    `query AlcorCatalogue(${declarations.join(', ')}) { Page(page: $page, perPage: 24) { pageInfo { hasNextPage } media(${args.join(', ')}) { ${fields} } } }`, variables, signal)
  return { data: result.Page.media.filter(m => !m.isAdult).map(fromAniList), has_more: result.Page.pageInfo.hasNextPage, next_cursor: result.Page.pageInfo.hasNextPage ? String(page + 1) : null, is_partial: true, is_stale: false, source: 'AniList' }
}

export function mediaPath(media: Media) {
  const reference = media.source_ids?.anilist ? `anilist-${media.source_ids.anilist}` : /^\d+$/.test(media.external_id) ? `mal-${media.external_id}` : media.id
  return `/${media.media_type}/${reference}`
}
