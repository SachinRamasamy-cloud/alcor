import { describe, expect, it } from 'vitest'
import { readPending, savePending, clearPending } from './pending'

const id = '76aaad3c-0eb9-5e5c-a47c-d190a2b1300f'
describe('pending action contract', () => {
  it('stores and consumes one typed action', () => {
    savePending('wishlist', id, '/anime/' + id)
    expect(readPending(true)?.mediaId).toBe(id)
    expect(readPending()).toBeNull()
  })
  it('rejects expired, malformed and external actions', () => {
    savePending('wishlist', id, '/anime/' + id)
    const original = JSON.parse(sessionStorage.getItem('alcor.pending.v1')!)
    for (const change of [{ expires: 0 }, { returnPath: '//evil.example' }, { returnPath: '/\\evil.example' }, { kind: 'delete' }, { mediaId: 'x' }]) {
      sessionStorage.setItem('alcor.pending.v1', JSON.stringify({ ...original, ...change }))
      expect(readPending(true)).toBeNull()
    }
    clearPending()
  })
})
