import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { LibraryPage } from './account'
import { SaveButton } from '../features/library'
import { setTokenProvider, type Media } from '../shared/api/client'

const state = vi.hoisted(() => ({ userId: 'account-a' as string | null, notify: vi.fn(), signIn: vi.fn() }))
vi.mock('../shared/auth', () => ({ authClient: null, useAuth: () => ({ userId: state.userId, loading: false, requireSignIn: state.signIn }) }))
vi.mock('../shared/feedback', () => ({ useFeedback: () => state.notify }))
const media = { id: '76aaad3c-0eb9-5e5c-a47c-d190a2b1300f', title: 'Test title', media_type: 'anime', score: null, total_units: null, format: 'TV', year: null, image_url: null } as Media
const entry = { media, status: 'planned', version: 7, deleted_at: null }
function mount(child = <LibraryPage />) {
  const queries = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(<QueryClientProvider client={queries}><BrowserRouter>{child}</BrowserRouter></QueryClientProvider>)
  return queries
}
beforeEach(() => { history.replaceState(null, '', '/wishlist'); state.userId = 'account-a'; vi.clearAllMocks(); setTokenProvider(async () => state.userId ? { token: 'test-only', userId: state.userId } : null) })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
describe('library integration', () => {
  it('sends expected version and refreshes account-scoped data after starting', async () => {
    const fetcher = vi.fn().mockImplementation((_url, init) => Promise.resolve(new Response(JSON.stringify(init.method === 'PUT' ? { entry: { ...entry, status: 'in_progress' }, changed: true } : { data: [entry], total: 1, next_cursor: null }), { status: 200 })))
    vi.stubGlobal('fetch', fetcher)
    const queries = mount()
    fireEvent.click(await screen.findByRole('button', { name: 'Start watching' }))
    await waitFor(() => expect(state.notify).toHaveBeenCalledWith('Added to your library.'))
    const write = fetcher.mock.calls.find(([, init]) => init.method === 'PUT')!
    expect(JSON.parse(write[1].body)).toEqual({ status: 'in_progress', expected_version: 7 })
    expect(queries.getQueryCache().getAll()[0].queryKey.slice(0, 2)).toEqual(['private', 'account-a'])
  })
  it('renders API failure as an error rather than an empty wishlist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'UPSTREAM_UNAVAILABLE' } }), { status: 503 })))
    mount()
    expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable')
    expect(screen.queryByText('Your wishlist is empty')).toBeNull()
  })
  it('guest action requests sign-in without a write', async () => {
    state.userId = null
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher)
    mount(<SaveButton media={media} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add to wishlist' }))
    expect(state.signIn).toHaveBeenCalledWith('wishlist', { kind: 'wishlist', mediaId: media.id })
    expect(fetcher).not.toHaveBeenCalled()
  })
  it.each([false, true])('does not announce a save for no-op or failed write (failure=%s)', async failure => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(failure ? { error: { code: 'CONFLICT' } } : { entry, changed: false }), { status: failure ? 409 : 200 })))
    mount(<SaveButton media={media} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add to wishlist' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add to wishlist' })).not.toBeDisabled())
    expect(state.notify).not.toHaveBeenCalledWith('Added to wishlist.')
  })
})
