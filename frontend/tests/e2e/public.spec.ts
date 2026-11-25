import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockCatalogue, snapshots, titles } from './catalogue-fixture'

test.beforeEach(async ({page}) => { await mockCatalogue(page) })

test('favorite identity lookups honor cooldown and pace requests before setup can save',async({page})=>{
  const calls:{id:number;at:number}[]=[]
  await page.route('**/api/v1/me/media/resolve',async route=>{
    const id=route.request().postDataJSON().anilist_id
    calls.push({id,at:Date.now()})
    if(calls.length===1)return route.fulfill({status:429,headers:{'Retry-After':'1'},contentType:'application/json',body:'{"error":{"code":"RATE_LIMITED"}}'})
    return route.fulfill({contentType:'application/json',body:JSON.stringify({id:`verified-${id}`})})
  })
  await page.goto('/tests/e2e/setup-preview.html')
  const resolved=await page.evaluate(async()=>{
    // Test-only transport identity; every private request above is intercepted.
    // This is not a Supabase session and never reaches the actual API.
    const {resolveTestFavorites}=await import('/tests/e2e/setup-preview.tsx')
    return resolveTestFavorites()
  })
  expect(resolved).toEqual(['verified-1','verified-2','verified-3'])
  expect(calls.map(call=>call.id)).toEqual([1,1,2,3])
  for(let index=1;index<calls.length;index++)expect(calls[index].at-calls[index-1].at).toBeGreaterThanOrEqual(2500)
})

for(const width of [320,375,768,1440]) {
  test(`account controls share one aligned column at ${width}px`,async({page})=>{
    await page.route('**/api/v1/ready',route=>route.fulfill({contentType:'application/json',body:'{"status":"ready"}'}))
    await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/')
    await page.locator('.site-header').getByRole('button',{name:'Sign in',exact:true}).click()
    const dialog=page.getByRole('dialog')
    for(const mode of ['login','signup','reset'] as const){
      if(mode==='signup')await dialog.locator('.auth-mode-tabs').getByRole('button',{name:'Create account',exact:true}).click()
      if(mode==='reset'){await dialog.locator('.auth-mode-tabs').getByRole('button',{name:'Sign in',exact:true}).click();await dialog.getByRole('button',{name:'Forgot password?',exact:true}).click()}
      await expect(dialog.getByRole('heading',{level:2})).toHaveText(mode==='signup'?'Create account':mode==='reset'?'Reset password':'Sign in')
      const controls=dialog.locator('.auth-email-form input, .auth-email-form > span > button, .auth-provider-button')
      const boxes=await controls.evaluateAll(nodes=>nodes.map(node=>{const rect=node.getBoundingClientRect();return{x:rect.x,right:rect.right,height:rect.height}}))
      for(const box of boxes){expect(Math.abs(box.x-boxes[0].x)).toBeLessThan(1);expect(Math.abs(box.right-boxes[0].right)).toBeLessThan(1);expect(Math.abs(box.height-48)).toBeLessThan(1)}
      const gaps=await dialog.locator('.auth-form-field').evaluateAll(nodes=>nodes.map(node=>{const label=node.querySelector('label')!.getBoundingClientRect(),input=node.querySelector('input')!.getBoundingClientRect();return input.top-label.bottom}))
      for(const gap of gaps)expect(Math.abs(gap-8)).toBeLessThan(1)
      if(mode==='signup')await expect(dialog.getByRole('button',{name:'Forgot password?',exact:true})).toHaveCount(0)
      const title=await dialog.getByRole('heading',{level:2}).boundingBox(),close=await dialog.getByRole('button',{name:'Close',exact:true}).boundingBox()
      expect(Math.abs(title!.y+title!.height/2-close!.y-close!.height/2)).toBeLessThan(3)
      const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
      expect(accessibility.violations.map(v=>v.id)).toEqual([])
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
      await dialog.screenshot({path:test.info().outputPath(`aligned-${mode}.png`)})
    }
  })
}

test('account dialog stays within a short mobile viewport and can close after scrolling',async({page})=>{
  await page.route('**/api/v1/ready',route=>route.fulfill({contentType:'application/json',body:'{"status":"ready"}'}))
  await page.setViewportSize({width:375,height:560});await page.goto('/')
  const trigger=page.locator('.site-header').getByRole('button',{name:'Sign in',exact:true});await trigger.click()
  const dialog=page.getByRole('dialog');await dialog.locator('.auth-mode-tabs').getByRole('button',{name:'Create account',exact:true}).click()
  const box=await dialog.boundingBox();expect(box!.y).toBeGreaterThanOrEqual(15);expect(box!.y+box!.height).toBeLessThanOrEqual(545)
  expect(await dialog.evaluate(node=>node.scrollHeight>node.clientHeight)).toBeTruthy()
  await dialog.getByLabel('Confirm password',{exact:true}).fill('example-only')
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused()
})

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

for (const width of [320, 375, 640, 768, 1024, 1280, 1440, 1600, 1920]) {
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

for(const width of [375,1440]) {
  test(`dashboard shelves align and scroll at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:1000})
    await page.goto('/tests/e2e/dashboard-preview.html')
    await expect(page.getByRole('heading',{name:'Your dashboard',exact:true})).toBeVisible()
    await expect(page.getByRole('region',{name:'You may like',exact:true})).toBeVisible()
    await expect(page.getByRole('region',{name:'Your favorites',exact:true})).toBeVisible()
    const title=await page.getByRole('heading',{name:'Your dashboard',exact:true}).boundingBox(),firstCard=await page.locator('.media-card').first().boundingBox()
    expect(Math.abs(title!.x-firstCard!.x)).toBeLessThan(1)
    const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
    expect(accessibility.violations.map(v=>v.id)).toEqual([])
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
    if(width<768)expect(await page.getByRole('region',{name:'You may like',exact:true}).evaluate(node=>node.scrollWidth>node.clientWidth)).toBeTruthy()
    await page.screenshot({path:test.info().outputPath('dashboard.png'),fullPage:true})
  })
  test(`three-step profile setup is usable at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:1000})
    await page.goto('/tests/e2e/setup-preview.html')
    await expect(page.getByRole('heading',{level:1})).toHaveText('Make room for your kind of story.')
    const questions:string[]=[]
    for(let step=0;step<3;step++){
      await expect(page.locator('fieldset')).toHaveCount(3)
      questions.push(...await page.locator('legend').allTextContents())
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
      const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
      expect(accessibility.violations.map(v=>v.id)).toEqual([])
      await page.screenshot({path:test.info().outputPath(`setup-step-${step+1}.png`),fullPage:true})
      if(step===0){await page.getByLabel('Display name',{exact:true}).fill('Reader');await page.getByLabel('Year you started watching',{exact:true}).fill('2020')}
      if(step===1){await page.getByRole('group',{name:'Anime to choose as favorites'}).getByRole('button').first().click();await page.getByRole('group',{name:/5\./}).getByRole('button',{name:'Fantasy',exact:true}).click()}
      if(step<2)await page.getByRole('button',{name:'Continue',exact:true}).click()
    }
    expect(questions).toHaveLength(9)
    await page.getByRole('button',{name:'Strictly exclude',exact:true}).click()
    await page.getByRole('button',{name:'Romance',exact:true}).click()
    await page.getByLabel('Maximum anime episodes',{exact:true}).fill('24')
    await page.getByRole('button',{name:'Save my profile',exact:true}).click()
    const result=JSON.parse((await page.locator('#result').textContent())!)
    expect(result.name).toBe('Reader');expect(result.answers.excluded_genres).toEqual(['Romance']);expect(result.favorites).toHaveLength(1)
  })
  test(`email account forms fit and preserve private input at ${width}px`,async({page})=>{
    await page.route('**/api/v1/ready',route=>route.fulfill({contentType:'application/json',body:'{"status":"ready"}'}))
    await page.setViewportSize({width,height:900});await page.goto('/')
    await page.getByRole('button',{name:'Sign in',exact:true}).click()
    const dialog=page.getByRole('dialog')
    await dialog.locator('.auth-mode-tabs').getByRole('button',{name:'Create account',exact:true}).click()
    await dialog.getByLabel('Email address',{exact:true}).fill('reader@example.com')
    await dialog.getByLabel('Password',{exact:true}).fill('example-password')
    await dialog.getByLabel('Confirm password',{exact:true}).fill('different-password')
    await dialog.getByRole('button',{name:'Show password',exact:true}).click()
    await expect(dialog.getByLabel('Password',{exact:true})).toHaveAttribute('type','text')
    await dialog.locator('form').getByRole('button',{name:'Create account',exact:true}).click()
    await expect(dialog.getByRole('alert')).toContainText("passwords don't match")
    expect(await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}).includes('example-password'))).toBeFalsy()
    const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
    expect(accessibility.violations.map(v=>v.id)).toEqual([])
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
    await dialog.screenshot({path:test.info().outputPath('create-account.png')})
  })
  test(`sign-in keeps Google visible during backend startup at ${width}px`,async({page})=>{
    const gate={onDemand:false,release:undefined as undefined|(()=>void)}
    await page.route('**/api/v1/ready',async route=>{
      if(!gate.onDemand)return route.fulfill({status:503,contentType:'application/json',body:'{}'})
      await new Promise<void>(resolve=>{gate.release=resolve})
      return route.fulfill({contentType:'application/json',body:'{"status":"ready"}'})
    })
    await page.setViewportSize({width,height:900})
    await page.goto('/')
    await expect(page.locator('.media-card')).toHaveCount(18)
    await expect(page.locator('.auth-startup')).toHaveCount(0)
    gate.onDemand=true
    const trigger=page.getByRole('button',{name:'Sign in',exact:true})
    await trigger.click()
    const dialog=page.getByRole('dialog')
    const google=dialog.getByRole('button',{name:'Continue with Google',exact:true})
    await expect(google).toBeVisible()
    await expect(google).toBeDisabled()
    await expect(dialog.getByRole('status')).toContainText('Getting sign-in ready')
    await expect.poll(()=>Boolean(gate.release)).toBeTruthy()
    const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
    expect(accessibility.violations.map(v=>v.id)).toEqual([])
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
    await dialog.screenshot({path:test.info().outputPath('sign-in-starting.png')})
    gate.release!()
    await expect(dialog.locator('.auth-startup')).toHaveCount(0)
    await expect(google).toBeVisible()
    await expect(dialog.getByText("Google sign-in hasn't been enabled yet.",{exact:true})).toHaveCount(0)
    await expect(dialog.getByLabel('Email address',{exact:true})).toBeVisible()
    await expect(dialog.getByRole('button',{name:'Create account',exact:true})).toBeVisible()
    await dialog.screenshot({path:test.info().outputPath('sign-in-options.png')})
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
}

test('cards show complete metadata, hover or focus actions and balanced rows at wide widths',async({page})=>{
  await page.setViewportSize({width:1920,height:1000})
  await page.route('https://graphql.anilist.co',route=>{
    const {query}=route.request().postDataJSON()
    if(!query.includes('AlcorCatalogue'))return route.fallback()
    return route.fulfill({contentType:'application/json',body:JSON.stringify({data:{Page:{pageInfo:{hasNextPage:false,lastPage:1,total:24},media:Array.from({length:24},(_,i)=>({...titles[0],id:i+1,title:{english:`Card ${i+1}`},genres:['Action','Adventure'],episodes:12}))}}})})
  })
  await page.goto('/anime')
  const cards=page.locator('.media-card')
  await expect(cards).toHaveCount(24)
  const geometry=await cards.evaluateAll(nodes=>nodes.map(node=>{const rect=node.getBoundingClientRect();return {top:Math.round(rect.top),height:rect.height,width:rect.width}}))
  expect([...new Set(geometry.map(card=>card.top))]).toHaveLength(4)
  expect(geometry.filter(card=>card.top===geometry[0].top)).toHaveLength(6)
  expect(Math.max(...geometry.map(card=>card.height))-Math.min(...geometry.map(card=>card.height))).toBeLessThan(1)
  await expect(cards.first().getByText('12 episodes')).toBeVisible()
  const footer=cards.first().locator('.card-actions')
  await page.mouse.move(0,0)
  await expect(footer).toHaveCSS('opacity','0')
  await cards.first().locator('.poster-wrap a').focus()
  await expect(footer).toHaveCSS('opacity','1')
  await page.locator('.site-header .wordmark').focus()
  await expect(footer).toHaveCSS('opacity','0')
  await cards.first().hover()
  await expect(footer).toHaveCSS('opacity','1')
  const poster=await cards.first().locator('.poster-wrap').boundingBox(),actions=await footer.boundingBox()
  expect(actions!.y+actions!.height).toBeLessThanOrEqual(poster!.y+poster!.height)
  await expect(cards.first().getByRole('button',{name:'Add Card 1 to wishlist'})).toBeVisible()
  await cards.first().getByRole('button',{name:'Add Card 1 to wishlist'}).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(cards.first().getByRole('button',{name:'Add Card 1 to wishlist'})).toBeFocused()
  await page.screenshot({path:test.info().outputPath('cards-wide.png'),fullPage:true})
})

test('desktop hover shows only the corner save and keeps the artwork clickable',async({page})=>{
  await page.setViewportSize({width:1440,height:1000})
  await page.goto('/anime')
  await expect(page.locator('.card-title')).toHaveCount(12)
  const card=page.locator('.media-card').first()
  await page.mouse.move(0,0)
  await card.screenshot({path:test.info().outputPath('card-idle.png')})
  const idle=await card.boundingBox()
  await card.hover()
  const hovered=await card.boundingBox()
  expect(Math.abs(hovered!.width-idle!.width)).toBeLessThan(1)
  expect(Math.abs(hovered!.height-idle!.height)).toBeLessThan(1)
  const save=card.getByRole('button',{name:/^Add .* to wishlist$/})
  await expect(card.getByText('View details',{exact:true})).toHaveCount(0)
  const saveBox=await save.boundingBox(),frame=await card.boundingBox()
  expect(saveBox!.height).toBeGreaterThanOrEqual(44)
  expect(Math.abs(saveBox!.y-frame!.y-11)).toBeLessThan(2)
  expect(Math.abs(frame!.x+frame!.width-saveBox!.x-saveBox!.width-11)).toBeLessThan(2)
  const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
  expect(accessibility.violations.map(v=>v.id)).toEqual([])
  await card.screenshot({path:test.info().outputPath('card-hover.png')})
  const target=await card.locator('.card-title').getAttribute('href')
  const poster=await card.locator('.poster-wrap').boundingBox()
  await page.mouse.click(poster!.x+poster!.width/2,poster!.y+poster!.height/2)
  await expect(page).toHaveURL(target!)
})

for(const width of [320,375,640]) {
  test(`mobile home shelves scroll horizontally at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900})
    await page.goto('/')
    await expect(page.locator('.media-card')).toHaveCount(18)
    for(const title of ['Popular anime','Popular manga']) {
      const shelf=page.getByRole('region',{name:title,exact:true})
      await expect(shelf).toBeVisible()
      expect(await shelf.evaluate(node=>node.scrollWidth>node.clientWidth)).toBeTruthy()
      const cards=shelf.locator('.media-card')
      expect(await shelf.evaluate(node=>{
        const edge=node.getBoundingClientRect().right
        return [...node.querySelectorAll('.media-card')].some(card=>{const rect=card.getBoundingClientRect();return rect.left<edge&&rect.right>edge})
      })).toBeTruthy()
      await shelf.screenshot({path:test.info().outputPath(`${title.includes('anime')?'anime':'manga'}-shelf-start.png`)})
      const rows=await cards.evaluateAll(nodes=>nodes.map(node=>Math.round(node.getBoundingClientRect().top)))
      expect([...new Set(rows)]).toHaveLength(1)
      await shelf.focus()
      await page.keyboard.press('ArrowRight')
      await expect.poll(()=>shelf.evaluate(node=>node.scrollLeft)).toBeGreaterThan(0)
      await cards.last().locator('.card-title').focus()
      await expect(cards.last().locator('.card-title')).toBeInViewport()
      await expect(cards.last().locator('.card-actions')).toHaveCSS('opacity','1')
      await shelf.screenshot({path:test.info().outputPath(`${title.includes('anime')?'anime':'manga'}-shelf.png`)})
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
    await page.goto('/anime')
    await expect(page.locator('.media-card')).toHaveCount(12)
    await expect(page.locator('.media-card .card-title')).toHaveCount(12)
    expect(await page.locator('.media-grid').evaluate(node=>getComputedStyle(node).gridAutoFlow)).toBe('row')
  })
}

test('touch devices retain visible card actions at tablet widths',async({browser})=>{
  const page=await browser.newPage({viewport:{width:1024,height:1000},hasTouch:true,isMobile:true})
  try {
    await mockCatalogue(page)
    await page.goto('/anime')
    await expect(page.locator('.media-card')).toHaveCount(12)
    const card=page.locator('.media-card').first()
    await expect(card.locator('.card-actions')).toHaveCSS('opacity','1')
    const poster=await card.locator('.poster-wrap').boundingBox(),actions=await card.locator('.card-actions').boundingBox()
    expect(Math.abs(actions!.y-poster!.y-10)).toBeLessThan(2)
    expect(Math.abs(poster!.x+poster!.width-actions!.x-actions!.width-10)).toBeLessThan(2)
    await expect(card.getByText('View details',{exact:true})).toHaveCount(0)
    await card.getByRole('button',{name:/^Add .* to wishlist$/}).tap()
    await expect(page.getByRole('dialog')).toBeVisible()
  } finally { await page.close() }
})

test('card actions stay usable on a narrow screen and hover does not request more metadata',async({page})=>{
  let reads=0
  page.on('request',request=>{if(new URL(request.url()).origin==='https://graphql.anilist.co')reads++})
  await page.setViewportSize({width:320,height:900})
  await page.goto('/')
  await expect(page.locator('.media-card')).toHaveCount(18)
  const card=page.locator('.media-card').first()
  const save=card.getByRole('button',{name:/^Add .* to wishlist$/})
  await expect(save).toBeVisible()
  const footer=await card.locator('.card-actions').boundingBox(),button=await save.boundingBox()
  expect(button!.height).toBeGreaterThanOrEqual(44)
  expect(footer!.height).toBeLessThan(60)
  const baseline=reads
  expect(baseline).toBeGreaterThan(0)
  await card.locator('.poster-wrap').hover()
  await card.locator('.card-title').focus()
  expect(reads).toBe(baseline)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
})

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

for(const width of [320,375,768,1440]){
  test(`advanced filter fields align and retain their values at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900})
    await page.goto('/anime?q=test&page=2')
    const trigger=page.getByRole('button',{name:'Discovery options',exact:true})
    await trigger.click()
    const dialog=page.getByRole('dialog')
    const geometry=await dialog.locator('.discovery-filter-form > .discovery-field').evaluateAll(fields=>fields.map(field=>{
      const label=field.querySelector('span')!.getBoundingClientRect(),control=field.querySelector('input,select')!.getBoundingClientRect()
      return{x:control.x,right:control.right,y:control.y,height:control.height,gap:control.top-label.bottom}
    }))
    expect(geometry).toHaveLength(12)
    for(const control of geometry){expect(Math.abs(control.height-48)).toBeLessThan(1);expect(Math.abs(control.gap-8)).toBeLessThan(1)}
    for(let index=0;index<geometry.length;index++){
      const column=width<700?0:index%2
      expect(Math.abs(geometry[index].x-geometry[column].x)).toBeLessThan(1)
      expect(Math.abs(geometry[index].right-geometry[column].right)).toBeLessThan(1)
      if(width>=700&&index%2)expect(Math.abs(geometry[index].y-geometry[index-1].y)).toBeLessThan(1)
    }
    const title=await dialog.getByRole('heading',{name:'Discovery options',exact:true}).boundingBox(),close=await dialog.getByRole('button',{name:'Close',exact:true}).boundingBox()
    expect(Math.abs(title!.y+title!.height/2-close!.y-close!.height/2)).toBeLessThan(2)
    expect(await dialog.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBeTruthy()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
    expect(await page.locator('body').evaluate(node=>getComputedStyle(node).fontFamily)).toContain('Inter')
    await dialog.screenshot({path:test.info().outputPath('advanced-filters-top.png')})
    await dialog.locator('[name="include_genres"]').fill('Action, Comedy')
    await dialog.locator('[name="year_from"]').fill('2000')
    await dialog.locator('[name="year_to"]').fill('2025')
    await dialog.locator('[name="genre_match"]').selectOption('any')
    await dialog.locator('[name="has_score"]').check()
    const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
    expect(accessibility.violations.map(v=>v.id)).toEqual([])
    await dialog.getByRole('button',{name:'Apply filters',exact:true}).scrollIntoViewIfNeeded()
    await dialog.screenshot({path:test.info().outputPath('advanced-filters-bottom.png')})
    await dialog.getByRole('button',{name:'Apply filters',exact:true}).click()
    await expect(dialog).toHaveCount(0)
    const params=new URL(page.url()).searchParams
    expect(params.getAll('include_genres')).toEqual(['Action','Comedy'])
    expect(params.get('q')).toBe('test');expect(params.get('page')).toBeNull()
    expect(params.get('year_from')).toBe('2000');expect(params.get('year_to')).toBe('2025')
    expect(params.get('genre_match')).toBe('any');expect(params.get('has_score')).toBe('true')
    await expect(trigger).toBeFocused()
  })
}

test('footer has the generated brand, complete navigation and owner links',async({page})=>{
  await page.goto('/')
  const footer=page.getByRole('contentinfo')
  await expect(footer.getByText('Discover the unseen.',{exact:true})).toBeVisible()
  await expect(footer.getByRole('link',{name:'GitHub',exact:true})).toHaveAttribute('href','https://github.com/SachinRamasamy-cloud/alcor')
  await expect(footer.getByRole('link',{name:'LinkedIn',exact:true})).toHaveAttribute('href','https://www.linkedin.com/in/m-sachin-ramasamy-5146092b5/')
  for(const service of ['GitHub','LinkedIn']) {
    const icon=footer.getByRole('link',{name:service,exact:true}).locator('img.social-icon')
    await expect(icon).toBeVisible()
    await expect(icon).toHaveAttribute('alt','')
    await expect.poll(()=>icon.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0)
  }
  for(const path of ['/anime','/manga','/search','/discover','/library','/wishlist','/collections','/history','/statistics','/profile','/settings','/about','/help','/privacy','/terms','/data-sources','/status'])await expect(footer.locator(`a[href="${path}"]`)).toBeVisible()
  const mark=page.locator('.site-header .brand-mark')
  await expect(mark).toBeVisible()
  await expect.poll(()=>mark.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0)
  await footer.screenshot({path:test.info().outputPath('footer.png')})
})

test('direct episode details load without the personal API and separate extras',async({page})=>{
  await page.goto('/anime/anilist-152991')
  const section=page.locator('#episodes')
  await expect(section.getByRole('heading',{name:'Arrival',exact:true})).toBeVisible()
  await expect(section.locator('.episode-card h3').first()).toHaveText('Arrival')
  await expect(section.getByText('Episode 1',{exact:true})).toBeVisible()
  await expect(section.getByText('Episode information unavailable',{exact:true})).toHaveCount(0)
  await section.getByRole('button',{name:/^Extras/}).click()
  await expect(section.getByRole('heading',{name:'An Extra Story',exact:true})).toBeVisible()
  await expect(section.getByRole('heading',{name:'Arrival',exact:true})).toHaveCount(0)
})

test('episode source failures keep title details visible and offer retry',async({page})=>{
  await page.route('https://api.ani.zip/**',route=>route.fulfill({status:503,body:'{}'}))
  await page.goto('/anime/anilist-152991')
  await expect(page.getByRole('heading',{name:'Synopsis',exact:true})).toBeVisible()
  await expect(page.locator('#episodes').getByRole('alert')).toContainText('temporarily unavailable')
  await expect(page.locator('#episodes').getByRole('button',{name:'Retry',exact:true})).toBeVisible()
})

test('synopsis starts condensed and supports touch-friendly read more and show less',async({page})=>{
  await page.setViewportSize({width:375,height:900})
  await page.goto('/anime/anilist-152991')
  const button=page.getByRole('button',{name:'Read more',exact:true})
  await expect(button).toBeVisible()
  const paragraph=page.locator('.synopsis-copy')
  const collapsed=(await paragraph.boundingBox())!.height
  await button.click()
  await expect(page.getByRole('button',{name:'Show less',exact:true})).toHaveAttribute('aria-expanded','true')
  expect((await paragraph.boundingBox())!.height).toBeGreaterThan(collapsed)
  await page.getByRole('button',{name:'Show less',exact:true}).click()
  await expect(button).toHaveAttribute('aria-expanded','false')
  expect((await paragraph.boundingBox())!.height).toBeLessThanOrEqual(collapsed+1)
})

test('desktop synopsis expands on hover and collapses after leaving',async({page})=>{
  await page.setViewportSize({width:1440,height:1000})
  await page.goto('/anime/anilist-152991')
  await expect(page.getByRole('button',{name:'Read more',exact:true})).toBeVisible()
  await page.locator('.expandable-synopsis').hover()
  await expect(page.getByRole('button',{name:'Show less',exact:true})).toHaveAttribute('aria-expanded','true')
  await page.mouse.move(0,0)
  await expect(page.getByRole('button',{name:'Read more',exact:true})).toHaveAttribute('aria-expanded','false')
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
    await expect(skeleton).toHaveAccessibleName('Loading…')
    await expect(skeleton.getByText('Loading…',{exact:true})).toHaveCount(0)
    if(kind==='home') {
      const shelves=skeleton.locator('.mobile-media-rail')
      await expect(shelves).toHaveCount(2)
      for(const shelf of await shelves.all()) expect(await shelf.evaluate(node=>node.scrollWidth>node.clientWidth)).toBeTruthy()
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
    await page.screenshot({path:test.info().outputPath(`${kind}-skeleton.png`),fullPage:true})
  })
}
