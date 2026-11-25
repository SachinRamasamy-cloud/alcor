import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('guest browses details and search; wishlist prompts without writing', async ({ page }) => {
  const writes: string[] = []
  page.on('request', request => { if (['PUT', 'POST', 'DELETE', 'PATCH'].includes(request.method())) writes.push(request.url()) })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Popular anime', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'View details', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Synopsis', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Add to wishlist', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('You can browse without signing in.')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Add to wishlist', exact: true })).toBeFocused()
  expect(writes).toEqual([])
  await page.goto('/search?q=Frieren')
  await expect(page.getByText('Results for Frieren', { exact: true })).toBeVisible()
  await expect(page.locator('.media-card')).toHaveCount(1)
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Search anime and manga' })).toHaveValue('Frieren')
})

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`public layout is accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Popular anime', exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(results.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) }))).toEqual([])
    await page.screenshot({ path: test.info().outputPath('home.png'), fullPage: true })
  })
}

test('upstream error is not presented as empty results', async ({ page }) => {
  await page.route('**/api/v1/search*', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'UPSTREAM_UNAVAILABLE', retryable: true } }) }))
  await page.goto('/search?q=anything')
  await expect(page.getByRole('alert')).toContainText('The service is temporarily unavailable.')
  await expect(page.getByText('No matching titles', { exact: true })).toHaveCount(0)
})

test('episode lookup failure offers a contextual retry', async ({ page }) => {
  await page.route('**/api/v1/anime/*/episodes', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'UPSTREAM_UNAVAILABLE', retryable: true } }) }))
  await page.goto('/')
  await page.getByRole('link', { name: 'View details', exact: true }).click()
  const section = page.locator('.episode-section')
  await expect(section.getByRole('alert')).toContainText('temporarily unavailable')
  await expect(section.getByRole('button', { name: 'Retry', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Synopsis', exact: true })).toBeVisible()
})
