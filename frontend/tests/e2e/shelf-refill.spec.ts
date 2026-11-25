import {test,expect} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const sections=['latest','popular','trending','top','ongoing']
for(const width of [375,1440])test(`personal shelves replace watched titles without the misleading notice at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000})
  const unhandled:string[]=[],windows:number[]=[]
  const title=(id:number)=>({id,type:'ANIME',title:{english:`Story ${id}`},status:'FINISHED',format:'TV',episodes:12,averageScore:80,genres:['Fantasy'],coverImage:{large:`https://s4.anilist.co/test/${id}.svg`}})
  let release!:(()=>void)
  await page.route('https://graphql.anilist.co',async route=>{
    const {query,variables}=route.request().postDataJSON()
    expect(route.request().headers().authorization).toBeUndefined()
    if(query.includes('AlcorBrowse')){await route.fulfill({json:{data:Object.fromEntries(sections.map(key=>[key,{media:Array.from({length:12},(_,i)=>title(i+1))}]))}});return}
    if(query.includes('AlcorShelfWindow')){
      windows.push(variables.page)
      if(windows.length===1)await new Promise<void>(resolve=>{release=resolve})
      const keys=query.includes('latest:')?sections:['anime','manga']
      await route.fulfill({json:{data:Object.fromEntries(keys.map(key=>[key,{media:Array.from({length:24},(_,i)=>({...title((variables.page-1)*24+i+1),type:key==='manga'?'MANGA':'ANIME'})),pageInfo:{hasNextPage:true}}]))}});return
    }
    if(query.includes('AlcorHome')){await route.fulfill({json:{data:{anime:{media:Array.from({length:12},(_,i)=>title(i+1))},manga:{media:[]},genres:['Fantasy']}}});return}
    unhandled.push(query);await route.abort()
  })
  await page.route('**/api/v1/**',async route=>{
    const request=route.request(),path=new URL(request.url()).pathname
    if(path.endsWith('/discovery-exclusions')){
      const body=request.postDataJSON();expect(body.mode).toBe('new_to_me');expect(body.candidates.length).toBeLessThanOrEqual(100)
      await route.fulfill({json:body.candidates.filter((item:{anilist_id:number})=>item.anilist_id<=24).map((item:{anilist_id:number})=>item.anilist_id)});return
    }
    if(path.endsWith('/preferences')){await route.fulfill({json:{data:{discovery_mode:'new_to_me'},version:0}});return}
    if(path.endsWith('/setup')){await route.fulfill({json:{preferences:{data:{}},favorites:[]}});return}
    if(path.endsWith('/media-status')){await route.fulfill({json:[]});return}
    if(path.endsWith('/watch-sessions')||path.endsWith('/continue-watching')||path.endsWith('/continue-reading')){await route.fulfill({json:[]});return}
    unhandled.push(path);await route.fulfill({status:404,json:{error:{code:'NOT_FOUND'}}})
  })
  await page.route('https://s4.anilist.co/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#ddd"/></svg>'}))
  await page.goto('/tests/e2e/shelf-refill-preview.html')
  await expect(page.getByText('Finding more titles outside your saved history…').first()).toBeVisible()
  await expect(page.getByText('No titles available in this section yet.')).toHaveCount(0)
  await expect.poll(()=>typeof release).toBe('function')
  release()
  const popular=page.getByRole('region',{name:'Most popular'})
  await expect(popular.getByRole('article')).toHaveCount(12)
  await expect(popular.getByRole('article',{name:'Story 25'})).toBeVisible()
  await expect(page.getByRole('article',{name:'Story 1',exact:true})).toHaveCount(0)
  expect(windows).toEqual([1,2])
  await expect(page.getByText('More titles may be available.',{exact:false})).toHaveCount(0)
  const link=popular.locator('..').getByRole('link',{name:'View all'})
  expect(await link.getAttribute('href')).toBe('/search?type=anime&sort=popular&mode=new_to_me')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  const issues=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(issues.violations.map(issue=>issue.id)).toEqual([])
  await page.screenshot({path:test.info().outputPath('refilled-browse.png')})
  await page.getByRole('link',{name:'Home fixture'}).click()
  await expect(page.getByRole('heading',{name:'Story 25',level:1})).toBeVisible()
  await expect(page.getByRole('region',{name:'Popular anime'}).getByRole('article')).toHaveCount(12)
  expect(windows).toEqual([1,2,1,2]);expect(unhandled).toEqual([])
})
