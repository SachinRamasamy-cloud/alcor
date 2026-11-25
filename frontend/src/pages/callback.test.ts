import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ exchange: vi.fn(), getSession: vi.fn(), api: vi.fn() }))
vi.mock('../shared/auth', () => ({ authClient: { auth: { exchangeCodeForSession: mocks.exchange, getSession: mocks.getSession } }, useAuth: vi.fn() }))
vi.mock('../shared/api/client', () => ({ api: mocks.api }))
import { finishCallback } from './account'
import { savePending } from '../shared/auth/pending'
beforeEach(() => {
  vi.clearAllMocks(); sessionStorage.clear()
  mocks.exchange.mockResolvedValue({ data: { session: { user: { id: 'a' } } } })
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'a' } } } })
  mocks.api.mockResolvedValue({ changed: true })
})
it('exchanges and resumes exactly once for repeated callback execution', async () => {
  savePending('wishlist', '76aaad3c-0eb9-5e5c-a47c-d190a2b1300f', '/anime')
  const result = await Promise.all([finishCallback('code-one'), finishCallback('code-one')])
  expect(result).toEqual(['/anime', '/anime'])
  expect(mocks.exchange).toHaveBeenCalledTimes(1)
  expect(mocks.api).toHaveBeenCalledTimes(1)
})
it('does not mutate after a canceled intent or a switched account', async () => {
  await finishCallback('code-canceled')
  expect(mocks.api).not.toHaveBeenCalled()
  savePending('wishlist', '76aaad3c-0eb9-5e5c-a47c-d190a2b1300f', '/anime')
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'b' } } } })
  await expect(finishCallback('code-switched')).rejects.toThrow()
  expect(mocks.api).not.toHaveBeenCalled()
})
