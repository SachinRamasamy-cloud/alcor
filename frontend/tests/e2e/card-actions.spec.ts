import {test,expect} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
for(const width of [375,1440])test(`card completion keeps the locked layout and moves focus safely at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000})
  let recorded=false,acknowledge!:(()=>void)
  const writes:unknown[]=[],unhandled:string[]=[]
  await page.route('**/api/v1/**',async route=>{
    const request=route.request(),url=new URL(request.url())
    const media={id:'d98b77b7-5378-4e2e-9c96-18737b47f501',media_type:'anime',title:'Card story 1',source_ids:{anilist:'701'},genres:['Fantasy'],source:{name:'AniList'},total_units:12}
    const entry={media,status:'completed',ever_completed:true,version:1,rating:null,notes:null,tags:[],favorite:false,priority:'normal',deleted_at:null}
    if(request.method()==='PUT'){
      writes.push(request.postDataJSON());await new Promise<void>(resolve=>{acknowledge=resolve});recorded=true
      await route.fulfill({json:{entry,changed:true}});return
    }
    if(url.pathname.endsWith('/media-status')){await route.fulfill({json:recorded?[entry]:[]});return}
    if(url.pathname.endsWith('/discovery-exclusions')){await route.fulfill({json:recorded?[701]:[]});return}
    if(url.pathname.endsWith('/watch-sessions')){await route.fulfill({json:[]});return}
    if(url.pathname.endsWith('/collections')){await route.fulfill({json:{data:[]}});return}
    if(url.pathname.endsWith('/favorites')){await route.fulfill({json:{data:[],total:0,preferences_version:0,next_cursor:null}});return}
    unhandled.push(url.pathname);await route.fulfill({status:404,json:{error:{code:'NOT_FOUND'}}})
  })
  await page.route('https://s4.anilist.co/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#ddd"/></svg>'}))
  await page.goto('/tests/e2e/card-actions-preview.html')
  const card=page.locator('.media-card').filter({has:page.locator('.card-title',{hasText:'Card story 1'})}),trigger=card.getByRole('button',{name:'Manage Card story 1'})
  await expect(card).toBeVisible();await trigger.focus()
  const bounds=await trigger.boundingBox();expect(bounds!.height).toBe(44);expect(bounds!.width).toBe(44)
  await trigger.press('Enter')
  const dialog=page.getByRole('dialog',{name:'Card story 1'}),complete=dialog.getByRole('button',{name:'Mark watched',exact:true})
  await expect(complete).toBeEnabled();expect(writes).toEqual([])
  const issues=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(issues.violations.map(issue=>issue.id)).toEqual([])
  await page.screenshot({path:test.info().outputPath('card-actions.png')})
  await complete.click();await expect(dialog).toContainText('history and dates will stay unspecified')
  await dialog.getByRole('button',{name:'Mark as completed',exact:true}).click()
  await expect.poll(()=>writes.length).toBe(1);expect(writes).toEqual([{status:'completed'}])
  await expect(card).toBeVisible();await expect(dialog.getByRole('button',{name:'Mark as completed',exact:true})).toBeDisabled()
  acknowledge()
  await expect(card).toHaveCount(0);await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('heading',{name:'Discovery titles'})).toBeFocused()
  await page.getByRole('button',{name:'Show all',exact:true}).click()
  await expect(card.getByText('Completed',{exact:true})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await trigger.focus();await trigger.press('Enter');await expect(dialog.getByRole('button',{name:'Mark watched',exact:true})).toBeDisabled()
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused()
  await trigger.press('Enter');await page.locator('button').filter({hasText:'Switch fixture account'}).click({force:true})
  await expect(dialog).toHaveCount(0);expect(writes).toHaveLength(1);expect(unhandled).toEqual([])
})
