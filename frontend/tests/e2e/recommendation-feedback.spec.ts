import {test,expect} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const canonical=(id:number)=>({id:`d98b77b7-5378-4e2e-9c96-18737b47f5${String(id).padStart(2,'0')}`,media_type:'anime',external_id:`anilist:${id}`,title:`Story ${id}`,source_ids:{anilist:String(id)},genres:['Fantasy'],source:{name:'AniList',url:`https://anilist.co/anime/${id}`},image_url:`https://s4.anilist.co/test/${id}.svg`,total_units:12})
for(const width of [375,1440])test(`dismiss and restore preserve the existing card dialog at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000})
  let dismissed=false,version=0
  const writes:unknown[]=[],unhandled:string[]=[]
  const state=()=>({media_id:canonical(10).id,dismissed,version,context:'favorites',updated_at:null})
  await page.route('https://graphql.anilist.co',async route=>{
    const {query}=route.request().postDataJSON();expect(query).toContain('AlcorRecommendations');expect(route.request().headers().authorization).toBeUndefined()
    await route.fulfill({json:{data:{s0:{id:1,type:'ANIME',title:{english:'Story 1'},recommendations:{pageInfo:{hasNextPage:false},nodes:[10,11].map(id=>({rating:1,mediaRecommendation:{id,type:'ANIME',isAdult:false,title:{english:`Story ${id}`},genres:['Fantasy'],coverImage:{large:`https://s4.anilist.co/test/${id}.svg`}}}))}}}}})
  })
  await page.route('**/api/v1/**',async route=>{
    const request=route.request(),url=new URL(request.url()),path=url.pathname
    if(path.endsWith('/preferences')){await route.fulfill({json:{data:{discovery_mode:'all',favorite_media_ids:[canonical(1).id]},version:1}});return}
    if(path.endsWith('/favorites')){const selected=url.searchParams.getAll('ids');await route.fulfill({json:{data:selected.length?[]:[canonical(1)],total:selected.length?0:1,preferences_version:1,next_cursor:null}});return}
    if(path.endsWith('/discovery-exclusions')){expect(request.postDataJSON()).toMatchObject({mode:'all',recommendation:true});await route.fulfill({json:dismissed?[10]:[]});return}
    if(path.endsWith('/media-status')){await route.fulfill({json:[]});return}
    if(path.endsWith('/watch-sessions')){await route.fulfill({json:[]});return}
    if(path.endsWith('/media/resolve')){expect(request.postDataJSON()).toEqual({anilist_id:10});await route.fulfill({json:canonical(10)});return}
    if(path.endsWith('/recommendation-feedback/read')){await route.fulfill({json:[{...state(),anilist_id:10}]});return}
    if(path.endsWith(`/recommendation-feedback/${canonical(10).id}`)){
      const body=request.postDataJSON();expect(body.expected_version).toBe(version);writes.push(body);dismissed=body.dismissed;version++
      await route.fulfill({json:{...state(),changed:true}});return
    }
    if(path.endsWith('/recommendation-feedback')){await route.fulfill({json:{data:dismissed?[{...state(),media:canonical(10)}]:[],total:Number(dismissed),next_cursor:null}});return}
    if(path.endsWith('/collections')){await route.fulfill({json:{data:[],total:0,next_cursor:null}});return}
    unhandled.push(`${request.method()} ${path}`);await route.fulfill({status:404,json:{error:{code:'NOT_FOUND'}}})
  })
  await page.route('https://s4.anilist.co/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#ddd"/></svg>'}))
  await page.goto('/tests/e2e/recommendation-feedback-preview.html')
  const rail=page.getByRole('region',{name:'Based on your favourites'})
  await expect(rail.getByRole('article')).toHaveCount(2)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  const trigger=rail.getByRole('button',{name:'Manage Story 10'});await trigger.focus();await trigger.press('Enter')
  const dialog=page.getByRole('dialog',{name:'Story 10'}),dismiss=dialog.getByRole('button',{name:'Dismiss recommendation'})
  await expect(dismiss).toBeEnabled();expect((await dismiss.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await dismiss.click();await expect(dialog).toHaveCount(0)
  await expect(rail.getByRole('article')).toHaveCount(1)
  await page.getByRole('link',{name:'Dismissed recommendations'}).click()
  await expect(page.getByRole('heading',{name:'Dismissed recommendations',level:1})).toBeVisible()
  const restoreTrigger=page.getByRole('button',{name:'Manage Story 10'});await restoreTrigger.focus();await restoreTrigger.press('Enter')
  const restore=page.getByRole('dialog',{name:'Story 10'}).getByRole('button',{name:'Restore recommendation'})
  await expect(restore).toBeEnabled();await restore.click()
  await expect(page.getByText('You have no dismissed recommendations.')).toBeVisible()
  expect(writes).toEqual([{dismissed:true,expected_version:0,context:'favorites'},{dismissed:false,expected_version:1,context:'management'}])
  expect(unhandled).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  const issues=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(issues.violations.map(issue=>issue.id)).toEqual([])
  await page.screenshot({path:test.info().outputPath('restored-recommendation.png')})
})
