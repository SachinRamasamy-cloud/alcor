import { afterEach, describe, expect, it, vi } from 'vitest'
import { aniHome, AniListTransport, fromAniList } from './anilist'

afterEach(() => {vi.useRealTimers();vi.unstubAllEnvs()})
describe('public AniList transport', () => {
  it('keeps unapproved production provider use disabled',async()=>{
    vi.stubEnv('PROD',true)
    vi.stubEnv('VITE_ANILIST_USE_APPROVED','false')
    await expect(aniHome()).rejects.toMatchObject({code:'PROVIDER_NOT_CONFIGURED'})
  })
  it('deduplicates reads and never sends account credentials', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: { result: 1 } })))
    const client = new AniListTransport(fetcher, 0)
    const results = await Promise.all([client.query('query { result }'), client.query('query { result }')])
    expect(results).toEqual([{ result: 1 }, { result: 1 }])
    expect(fetcher).toHaveBeenCalledTimes(1)
    const [, options] = fetcher.mock.calls[0]
    expect(options?.credentials).toBe('omit')
    expect(new Headers(options?.headers).has('Authorization')).toBe(false)
  })
  it('honors cooldown without sending queued requests or retry storms', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response('{}', { status: 429, headers: { 'Retry-After': '30' } }))
    const client = new AniListTransport(fetcher, 0)
    await expect(client.query('query { first }')).rejects.toMatchObject({ status: 429 })
    await expect(client.query('query { second }')).rejects.toMatchObject({ status: 429 })
    expect(fetcher).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(30001)
    await expect(client.query('query { third }')).rejects.toMatchObject({ status: 429 })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('spaces distinct requests and treats GraphQL errors as failure', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response(JSON.stringify({ data: null, errors: [{ message: 'Unavailable' }] })))
    const client = new AniListTransport(fetcher)
    await expect(client.query('query { first }')).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' })
    const second = expect(client.query('query { second }')).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' })
    await vi.advanceTimersByTimeAsync(2000)
    expect(fetcher).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(101)
    await second
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('renders descriptions as plain text and keeps source measures distinct', () => {
    const media = fromAniList({ id: 1, type: 'ANIME', title: { english: 'Example' }, averageScore: 85, popularity: 999, description: '<b>Safe</b><script>bad()</script><br>Text', coverImage: { large: 'javascript:alert(1)' } })
    expect(media.synopsis).toBe('Safe\nText')
    expect(media.image_url).toBeNull()
    expect(media.score).toBe(8.5)
    expect(media.rating_count).toBeNull()
    expect(media.popularity).toBeNull()
  })
  it('drops abandoned searches before they consume upstream quota', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response(JSON.stringify({data:{ok:true}})))
    const client = new AniListTransport(fetcher, 0)
    const abandoned = new AbortController()
    const result = expect(client.query('query { abandoned }', {}, abandoned.signal)).rejects.toMatchObject({name:'AbortError'})
    abandoned.abort()
    await result
    await expect(client.query('query { active }')).resolves.toEqual({ok:true})
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('keeps a shared request alive while another consumer still needs it', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response(JSON.stringify({data:{ok:true}})))
    const client = new AniListTransport(fetcher, 0)
    const abandoned = new AbortController()
    const first = expect(client.query('query { shared }', {}, abandoned.signal)).rejects.toMatchObject({name:'AbortError'})
    const second = client.query('query { shared }')
    abandoned.abort()
    await first
    await expect(second).resolves.toEqual({ok:true})
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
