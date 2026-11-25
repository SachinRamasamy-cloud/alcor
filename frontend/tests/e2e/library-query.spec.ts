import {test,expect} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
for(const width of [375,1440])test(`saved search and sorting preserve the library grid at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000})
  const requests:Record<string,string>[]=[],unhandled:string[]=[]
  await page.route('**/api/v1/**',async route=>{
    const request=route.request(),url=new URL(request.url())
    if(!url.pathname.endsWith('/library')||request.method()!=='GET'){unhandled.push(`${request.method()} ${url.pathname}`);await route.abort();return}
    const params=url.searchParams;requests.push(Object.fromEntries(params))
    const matches=!params.get('q')||params.get('q')==='amber'
    const media={id:'37dc7e41-1292-4a48-a080-983d613e413d',title:'A saved story',media_type:'anime',source_ids:{anilist:'10'},source:{name:'AniList',url:'https://anilist.co/anime/10'},image_url:'https://s4.anilist.co/test/10.svg',genres:['Fantasy'],total_units:12}
    await route.fulfill({json:{data:matches?[{media,status:'planned',ever_completed:false,version:1}]:[],total:Number(matches),page:Number(params.get('page')??1),total_pages:1,next_cursor:null,query_context:{q:params.get('q')??'',media_type:params.get('media_type'),status:params.get('status'),sort:params.get('sort')??'id'}}})
  })
  await page.route('https://s4.anilist.co/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#ddd"/></svg>'}))
  await page.route('https://graphql.anilist.co',async route=>{unhandled.push('public provider');await route.abort()})
  await page.goto('/tests/e2e/library-query-preview.html')
  await expect(page.getByRole('article',{name:'A saved story'})).toBeVisible()
  const statusBounds=await page.getByRole('combobox',{name:'Your status'}).boundingBox(),typeBounds=await page.getByRole('button',{name:'Media type'}).boundingBox()
  expect(statusBounds&&typeBounds&&(statusBounds.x+statusBounds.width<=typeBounds.x||statusBounds.y+statusBounds.height<=typeBounds.y||typeBounds.y+typeBounds.height<=statusBounds.y||typeBounds.x+typeBounds.width<=statusBounds.x)).toBe(true)
  const search=page.getByRole('searchbox',{name:'Search saved titles and aliases'})
  await search.fill('amber');await search.press('Enter')
  await expect.poll(()=>requests.at(-1)?.q).toBe('amber')
  await page.getByRole('button',{name:'Sort saved titles'}).click();await page.getByRole('menuitemradio',{name:'Title (A–Z)'}).click()
  await expect.poll(()=>requests.at(-1)?.sort).toBe('title');expect(requests.at(-1)?.q).toBe('amber')
  await expect(page.getByRole('article',{name:'A saved story'})).toBeVisible()
  await search.fill('missing');await search.press('Enter')
  await expect(page.getByRole('heading',{name:'No saved titles match these filters.'})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  const issues=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(issues.violations.map(issue=>issue.id)).toEqual([])
  expect(unhandled).toEqual([])
  await page.screenshot({path:test.info().outputPath('saved-search.png')})
})
