import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ listener: undefined as undefined | ((event: string, session: { user: { id: string } } | null) => void) }))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth: {
  onAuthStateChange: (listener: typeof mock.listener) => { mock.listener = listener; return { data: { subscription: { unsubscribe: () => {} } } } },
  getSession: async () => ({ data: { session: null } }),
  signOut: async () => { mock.listener?.('SIGNED_OUT', null) },
} }) }))
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test_only')
const { AuthProvider, useAuth } = await import('./index')
function Controls() { const auth = useAuth(); return <button onClick={() => { void auth.signOut() }}>{auth.userId ?? 'guest'}</button> }
afterEach(() => { cleanup(); vi.unstubAllEnvs() })
it('removes private cache on account switch and sign-out while retaining public metadata', async () => {
  const queries = new QueryClient()
  render(<QueryClientProvider client={queries}><AuthProvider><Controls /></AuthProvider></QueryClientProvider>)
  act(() => mock.listener?.('SIGNED_IN', { user: { id: 'a' } }))
  queries.setQueryData(['public', 'home'], { title: 'public' })
  queries.setQueryData(['private', 'a', 'library'], { notes: 'private-a' })
  act(() => mock.listener?.('SIGNED_IN', { user: { id: 'b' } }))
  expect(queries.getQueryData(['private', 'a', 'library'])).toBeUndefined()
  queries.setQueryData(['private', 'b', 'library'], { notes: 'private-b' })
  fireEvent.click(screen.getByRole('button', { name: 'b' }))
  await screen.findByRole('button', { name: 'guest' })
  expect(queries.getQueryData(['private', 'b', 'library'])).toBeUndefined()
  expect(queries.getQueryData(['public', 'home'])).toEqual({ title: 'public' })
})
