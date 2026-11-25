import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockCatalogue, snapshots } from './catalogue-fixture'

test.beforeEach(async ({page}) => { await mockCatalogue(page) })

test('guest browses details and search; wishlist prompts without writing', async ({ page }) => {
  const writes: string[] = []
  page.on('request', request => { if (request.url().includes('/api/') && ['PUT', 'POST', 'DELETE', 'PATCH'].includes(request.method())) writes.push(request.url()) })
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
  await page.route('https://graphql.anilist.co', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }))
  await page.goto('/search?q=anything')
  await expect(page.getByRole('alert')).toContainText('The service is temporarily unavailable.')
  await expect(page.getByText('No matching titles', { exact: true })).toHaveCount(0)
})

test('episode lookup failure offers a contextual retry', async ({ page }) => {
  const media = snapshots[0]
  await page.route(`**/api/v1/anime/${media.id}`, route => route.fulfill({contentType:'application/json',body:JSON.stringify(media)}))
  await page.route('**/api/v1/anime/*/episodes', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'UPSTREAM_UNAVAILABLE', retryable: true } }) }))
  await page.goto(`/anime/${media.id}`)
  const section = page.locator('.episode-section')
  await expect(section.getByRole('alert')).toContainText('temporarily unavailable')
  await expect(section.getByRole('button', { name: 'Retry', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Synopsis', exact: true })).toBeVisible()
})

test('public home, search and details remain usable while personal server is unavailable', async ({page}) => {
  await page.goto('/')
  await expect(page.locator('.backend-notice').getByRole('status')).toContainText('Personal features')
  await expect(page.locator('.media-card')).toHaveCount(18)
  await page.getByRole('link',{name:'View details',exact:true}).click()
  await expect(page).toHaveURL(/\/anime\/anilist-\d+$/)
  await expect(page.getByRole('heading',{name:'Synopsis',exact:true})).toBeVisible()
  await expect(page.getByText('AniList score',{exact:true})).toBeVisible()
  await page.goto('/manga')
  await expect(page.locator('.media-card')).toHaveCount(6)
})

for(const width of [320,375,768,1024,1440]) {
  test(`catalogue and details align at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:1000})
    await page.goto('/anime')
    await expect(page.locator('.media-card')).toHaveCount(12)
    await page.getByText('Advanced filters',{exact:true}).click()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
    const shell=await page.locator('.page-body').boundingBox()
    const grid=await page.locator('.media-grid').boundingBox()
    expect(Math.abs(shell!.x-grid!.x)).toBeLessThan(1)
    await page.screenshot({path:test.info().outputPath('catalogue.png'),fullPage:true})
    await page.locator('.card-title').first().click()
    await expect(page.getByRole('heading',{name:'Synopsis',exact:true})).toBeVisible()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
    await page.screenshot({path:test.info().outputPath('details.png'),fullPage:true})
  })
}

for(const [path,kind] of [['/','home'],['/anime','catalogue'],['/anime/anilist-152991','details']] as const) {
  test(`shows an aligned ${kind} skeleton while source data loads`,async({page})=>{
    await page.route('https://graphql.anilist.co',()=>new Promise(()=>{}))
    await page.setViewportSize({width:375,height:900})
    await page.emulateMedia({reducedMotion:'reduce'})
    await page.goto(path)
    const skeleton=page.locator(`.skeleton-${kind}`)
    await expect(skeleton).toBeVisible()
    await expect(skeleton.getByText('Loading…',{exact:true})).toHaveClass('sr-only')
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
    await page.screenshot({path:test.info().outputPath(`${kind}-skeleton.png`),fullPage:true})
  })
}
