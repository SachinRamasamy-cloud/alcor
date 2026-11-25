import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockCatalogue, snapshots, titles } from './catalogue-fixture'

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
  await expect(page.getByRole('searchbox', { name: 'Search anime and manga' })).toHaveValue('Frieren')
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
  await expect(page.locator('.backend-notice')).toHaveCount(0)
  await expect(page.locator('.media-card')).toHaveCount(18)
  await page.getByRole('link',{name:'View details',exact:true}).click()
  await expect(page).toHaveURL(/\/anime\/anilist-\d+$/)
  await expect(page.getByRole('heading',{name:'Synopsis',exact:true})).toBeVisible()
  await expect(page.getByText('AniList score',{exact:true})).toBeVisible()
  await page.goto('/manga')
  await expect(page.locator('.media-card')).toHaveCount(6)
})

test('numbered catalogue navigation supports last, first and custom page jumps',async({page})=>{
  await page.route('https://graphql.anilist.co',route=>{
    const {query,variables}=route.request().postDataJSON()
    if(!query.includes('AlcorCatalogue'))return route.fallback()
    const current=variables.page??1
    return route.fulfill({contentType:'application/json',body:JSON.stringify({data:{Page:{pageInfo:{hasNextPage:current<3,lastPage:3,total:72},media:Array.from({length:24},(_,i)=>({...titles[0],id:(current-1)*24+i+1,title:{english:`Page ${current} title ${i+1}`}}))}}})})
  })
  await page.goto('/anime?genre=Action')
  const nav=page.getByRole('navigation',{name:'Pagination'})
  await expect(nav.getByText('Page 1 of 3')).toBeVisible()
  await nav.getByRole('button',{name:'Last',exact:true}).click()
  await expect(nav.getByText('Page 3 of 3')).toBeVisible({timeout:10000})
  await expect(page).toHaveURL(/genre=Action.*page=3/)
  await nav.getByRole('spinbutton',{name:'Go to page'}).fill('2')
  await nav.getByRole('button',{name:'Go',exact:true}).click()
  await expect(nav.getByText('Page 2 of 3')).toBeVisible({timeout:10000})
  await nav.getByRole('button',{name:'First',exact:true}).click()
  await expect(nav.getByText('Page 1 of 3')).toBeVisible({timeout:10000})
  await expect(page).toHaveURL('/anime?genre=Action')
})

test('editing a search keeps focus and the caret after results update',async({page})=>{
  await page.goto('/search?q=Frieren')
  const input=page.getByRole('searchbox',{name:'Search anime and manga'})
  await input.focus()
  await input.press('End')
  await input.press('Backspace')
  await expect.poll(()=>new URL(page.url()).searchParams.get('q')).toBe('Friere')
  await expect(input).toBeFocused()
  await input.press('n')
  await expect(input).toHaveValue('Frieren')
  await expect.poll(()=>new URL(page.url()).searchParams.get('q')).toBe('Frieren')
  await expect(input).toBeFocused()
})

test('discovery options stay in a keyboard-accessible popup',async({page})=>{
  await page.goto('/anime')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText('Discovery mode',{exact:true})).toHaveCount(0)
  const trigger=page.getByRole('button',{name:'Discovery options',exact:true})
  await trigger.click()
  const dialog=page.getByRole('dialog')
  await expect(dialog.getByRole('combobox',{name:'Discovery mode',exact:true})).toBeVisible()
  await expect(dialog.getByRole('combobox',{name:'Included genres',exact:true})).toBeVisible()
  expect((await dialog.boundingBox())!.width).toBeGreaterThan(600)
  const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
  expect(accessibility.violations.map(v=>v.id)).toEqual([])
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await expect(page.locator('.backend-notice')).toHaveCount(0)
})

for(const width of [320,375,768,1024,1440]) {
  test(`catalogue and details align at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:1000})
    await page.goto('/anime')
    await expect(page.locator('.media-card')).toHaveCount(12)
    await page.getByRole('button',{name:'Discovery options',exact:true}).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
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
