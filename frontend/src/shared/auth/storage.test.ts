import { expect, it } from 'vitest'
import { sessionStorageAdapter as storage } from './storage'
it('persists the Supabase session while discarding provider credentials', () => {
  storage.setItem('test-session', JSON.stringify({ access_token: 'test-only', provider_token: 'discard', provider_refresh_token: 'discard' }))
  expect(JSON.parse(storage.getItem('test-session')!)).toEqual({ access_token: 'test-only' })
  storage.removeItem('test-session')
})
it('preserves the SDK PKCE verifier representation', () => {
  storage.setItem('test-verifier', 'test-pkce-verifier')
  expect(storage.getItem('test-verifier')).toBe('test-pkce-verifier')
  storage.removeItem('test-verifier')
})
