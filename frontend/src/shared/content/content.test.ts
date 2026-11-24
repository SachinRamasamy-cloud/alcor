import { describe, expect, it } from 'vitest'
import { t, unitCount, type MessageKey } from './index'
import messages from '../../content/en/common.json'

describe('editorial contract', () => {
  it('formats zero, one, many and unknown counts without inventing totals', () => {
    expect(unitCount(0, 'anime')).toBe('0 episodes')
    expect(unitCount(1, 'anime')).toBe('1 episode')
    expect(unitCount(2000, 'anime')).toBe('2,000 episodes')
    expect(unitCount(null, 'manga')).toBe('Total chapters unknown')
  })
  it('requires named parameters and renders values as data', () => {
    expect(() => t('catalogue.resultsFor')).toThrow('Missing message parameter')
    expect(t('catalogue.resultsFor', { query: '<script>value</script>' })).toBe('Results for <script>value</script>')
  })
  it('resolves all registered keys and contains no promotional filler', () => {
    for (const key of Object.keys(messages) as MessageKey[]) {
      const params = Object.fromEntries([...messages[key].matchAll(/\{(\w+)\}/g)].map(match => [match[1], 'value']))
      expect(t(key, params)).not.toMatch(/\{\w+\}/)
      expect(t(key, params)).not.toMatch(/unlock|unleash|immersive|ultimate|revolutionary|oops!|hooray!/i)
    }
  })
})
