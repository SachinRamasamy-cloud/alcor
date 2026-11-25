import {test,expect} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
for(const width of [375,1440])test(`favorites use the shared cards without inventing consumption at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000})
  let favorite=false,version=0
  const writes:{path:string;body:unknown}[]=[],unhandled:string[]=[]
  const media={id:'d98b77b7-5378-4e2e-9c96-18737b47f501',external_id:'anilist:701',media_type:'anime',title:'Card story 1',source_ids:{anilist:'701'},genres:['Fantasy'],source:{name:'AniList',url:'https://anilist.co/anime/701',retrieved_at:'2026-11-25T00:00:00Z'},total_units:12,format:'TV',status:'FINISHED',image_url:'https://s4.anilist.co/test/1.svg'}
  await page.route('**/api/v1/**',async route=>{
    const request=route.request(),url=new URL(request.url())
    if(request.method()==='PUT'){
      writes.push({path:url.pathname,body:request.postDataJSON()});favorite=request.postDataJSON().favorite;version++
      await route.fulfill({json:{media_id:media.id,favorite,changed:true,preferences_version:version,entry:null,
        preferences:{version,data:{timezone:'UTC',motion:'system',notifications:false,include_planned:true,discovery_mode:'new_to_me',spoiler_mode:false,favorite_media_ids:favorite?[media.id]:[]}}}});return
    }
    if(url.pathname.endsWith('/favorites')){await route.fulfill({json:{data:favorite?[media]:[],total:Number(favorite),preferences_version:version,next_cursor:null}});return}
    if(url.pathname.endsWith('/discovery-exclusions')||url.pathname.endsWith('/media-status')||url.pathname.endsWith('/watch-sessions')){await route.fulfill({json:[]});return}
    if(url.pathname.endsWith('/collections')){await route.fulfill({json:{data:[]}});return}
    unhandled.push(url.pathname);await route.fulfill({status:404,json:{error:{code:'NOT_FOUND'}}})
  })
  await page.route('https://s4.anilist.co/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#ddd"/></svg>'}))
  await page.goto('/tests/e2e/card-actions-preview.html')
  const source=page.getByRole('article',{name:'Card story 1'})
  await source.getByRole('button',{name:'Manage Card story 1'}).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('dialog').getByRole('button',{name:'Add favorite',exact:true}).click()
  await expect(page.getByRole('dialog').getByRole('button',{name:'Remove favorite',exact:true})).toHaveAttribute('aria-pressed','true')
  expect(writes).toEqual([{path:`/api/v1/me/favorites/${media.id}`,body:{favorite:true,expected_preferences_version:0}}])
  await page.keyboard.press('Escape');await expect(source).toBeVisible()
  await expect(source.locator('.personal-card-status')).toHaveCount(0)
  await page.getByRole('link',{name:'Open favorites'}).click()
  await expect(page.getByRole('heading',{name:'Favorites',exact:true})).toBeVisible()
  const saved=page.getByRole('article',{name:'Card story 1'})
  await expect(saved).toBeVisible();await saved.getByRole('button',{name:'Manage Card story 1'}).focus()
  const bounds=await saved.getByRole('button',{name:'Manage Card story 1'}).boundingBox();expect(bounds!.width).toBe(44);expect(bounds!.height).toBe(44)
  const issues=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(issues.violations.map(issue=>issue.id)).toEqual([])
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await page.screenshot({path:test.info().outputPath('favorites.png'),fullPage:true})
  await page.keyboard.press('Enter');await page.getByRole('dialog').getByRole('button',{name:'Remove favorite',exact:true}).click()
  await expect(page.getByRole('heading',{name:'No favorites yet'})).toBeVisible()
  expect(writes).toHaveLength(2);expect(writes[1]).toEqual({path:`/api/v1/me/favorites/${media.id}`,body:{favorite:false,expected_preferences_version:1}})
  expect(writes.every(write=>write.path.includes('/me/favorites/'))).toBe(true);expect(unhandled).toEqual([])
})
