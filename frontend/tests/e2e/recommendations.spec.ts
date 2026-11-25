import {test,expect} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const sections=['latest','popular','trending','top','ongoing']
const title=(id:number)=>({id,type:'ANIME',isAdult:false,title:{english:`Story ${id}`},description:'Fixture source synopsis.',status:'FINISHED',format:'TV',episodes:12,averageScore:80,genres:['Fantasy'],coverImage:{large:`https://s4.anilist.co/test/${id}.svg`}})
const favorite=(id:number)=>({id:`d98b77b7-5378-4e2e-9c96-18737b47f5${String(id).padStart(2,'0')}`,media_type:'anime',title:`Story ${id}`,source_ids:{anilist:String(id)},genres:['Fantasy'],external_id:String(id),source:'anilist'})
for(const width of [375,1440])test(`recommendation preview keeps its exact paginated source at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000})
  const unhandled:string[]=[],edges:number[][]=[]
  await page.route('https://graphql.anilist.co',async route=>{
    const {query,variables}=route.request().postDataJSON()
    expect(route.request().headers().authorization).toBeUndefined()
    if(query.includes('AlcorRecommendations')){
      const ids=Object.keys(variables).filter(key=>key.startsWith('seed')).map(key=>variables[key] as number);edges.push(ids)
      await route.fulfill({json:{data:Object.fromEntries(ids.map((id,index)=>[`s${index}`,{...title(id),recommendations:{pageInfo:{hasNextPage:false},nodes:[10,11,...Array.from({length:22},(_,i)=>(id===1?12:34)+i)].map(target=>({rating:1,mediaRecommendation:title(target)}))}}]))}});return
    }
    if(query.includes('AlcorBrowse')){await route.fulfill({json:{data:Object.fromEntries(sections.map(key=>[key,{media:Array.from({length:12},(_,i)=>title(100+i))}]))}});return}
    if(query.includes('AlcorShelfWindow')){
      const keys=sections.filter(key=>query.includes(`${key}:`));if(query.includes('airing:'))keys.push('airing')
      await route.fulfill({json:{data:Object.fromEntries(keys.map(key=>[key,{media:Array.from({length:24},(_,i)=>title(100+i)),pageInfo:{hasNextPage:false}}]))}});return
    }
    if(query.includes('AlcorCatalogue')){await route.fulfill({json:{data:{Page:{media:Array.from({length:24},(_,i)=>title(70+i)),pageInfo:{hasNextPage:false}}}}});return}
    unhandled.push(query);await route.abort()
  })
  await page.route('**/api/v1/**',async route=>{
    const request=route.request(),url=new URL(request.url()),path=url.pathname
    if(path.endsWith('/preferences')){expect(request.method()).toBe('GET');await route.fulfill({json:{data:{discovery_mode:'new_to_me',preferred_genres:['Fantasy'],preferred_themes:[],preferred_studios:[],favorite_media_ids:[favorite(1).id,favorite(2).id]},version:1}});return}
    if(path.endsWith('/favorites')){const ids=url.searchParams.getAll('ids');await route.fulfill({json:{data:[favorite(1),favorite(2)].filter(item=>!ids.length||ids.includes(item.id)),total:2,preferences_version:1,next_cursor:null}});return}
    if(path.endsWith('/setup')){await route.fulfill({json:{preferences:{data:{preferred_genres:['Fantasy']}},favorites:[]}});return}
    if(path.endsWith('/discovery-exclusions')){const body=request.postDataJSON();expect(body.mode).toBe('new_to_me');await route.fulfill({json:body.candidates.some((item:{anilist_id:number})=>item.anilist_id===10)?[10]:[]});return}
    if(path.endsWith('/media-status')||path.endsWith('/continue-watching')||path.endsWith('/continue-reading')||path.endsWith('/watch-sessions')){await route.fulfill({json:[]});return}
    unhandled.push(`${request.method()} ${path}`);await route.fulfill({status:404,json:{error:{code:'NOT_FOUND'}}})
  })
  await page.route('https://s4.anilist.co/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#ddd"/></svg>'}))
  await page.goto('/tests/e2e/recommendations-preview.html')
  const rail=page.getByRole('region',{name:'Based on your favourites'})
  await expect(rail.getByRole('article')).toHaveCount(12)
  await expect(rail.getByRole('article',{name:'Story 10',exact:true})).toHaveCount(0)
  await expect(rail.getByText('Because you favourited Story 1 and 1 other titles.')).toBeVisible()
  await expect(page.getByRole('heading',{name:'Trending now'})).toBeVisible()
  await expect(page.getByRole('region',{name:'You may like'}).getByRole('article')).toHaveCount(12)
  const link=rail.locator('..').getByRole('link',{name:'View all'}),href=await link.getAttribute('href'),params=new URL(href!,'http://fixture').searchParams
  expect(params.get('kind')).toBe('favorites');expect(params.get('mode')).toBe('new_to_me');expect(params.get('type')).toBe('anime');expect(params.getAll('seed')).toEqual([favorite(1).id,favorite(2).id]);expect(params.get('version')).toBe('1')
  await link.click()
  await expect(page.getByRole('heading',{name:'Based on your favourites',level:1})).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(24)
  const first=await page.getByRole('article').evaluateAll(cards=>cards.map(card=>card.getAttribute('aria-labelledby')))
  await page.getByRole('navigation',{name:'Pagination'}).getByRole('button',{name:'Next',exact:true}).click()
  await expect(page.getByRole('article')).toHaveCount(21)
  const second=await page.getByRole('article').evaluateAll(cards=>cards.map(card=>card.getAttribute('aria-labelledby')))
  expect(new Set([...first,...second]).size).toBe(45);expect(edges).toEqual([[1,2]])
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  const issues=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(issues.violations.map(issue=>issue.id)).toEqual([])
  expect(unhandled).toEqual([])
  await page.screenshot({path:test.info().outputPath('recommendation-page.png')})
})
