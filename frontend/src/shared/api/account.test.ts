import { afterEach, expect, it, vi } from 'vitest'
import { api, setTokenProvider } from './client'
afterEach(() => { setTokenProvider(async () => null); vi.unstubAllGlobals() })
it('rejects a queued account-A request after the session changes to B', async () => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher)
  setTokenProvider(async () => ({ token: 'test-only', userId: 'b' }))
  await expect(api('/me/library/title', { method: 'PUT', accountId: 'a' })).rejects.toMatchObject({ status: 401 })
  expect(fetcher).not.toHaveBeenCalled()
})
