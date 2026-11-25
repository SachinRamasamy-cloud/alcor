import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { LibraryPage } from './account'
import { SaveButton } from '../features/library'
import {CompleteTitle} from '../features/library/complete'
import { setTokenProvider, type Media } from '../shared/api/client'

const state = vi.hoisted(() => ({ userId: 'account-a' as string | null, notify: vi.fn(), signIn: vi.fn() }))
vi.mock('../shared/auth', () => ({ authClient: null, useAuth: () => ({ userId: state.userId, loading: false, requireSignIn: state.signIn }) }))
vi.mock('../shared/feedback', () => ({ useFeedback: () => state.notify }))
const media = { id: '76aaad3c-0eb9-5e5c-a47c-d190a2b1300f', title: 'Test title', media_type: 'anime', score: null, total_units: null, format: 'TV', year: null, image_url: null } as Media
const entry = { media, status: 'planned', version: 7, deleted_at: null }
function mount(child = <LibraryPage />) {
  const queries = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(<QueryClientProvider client={queries}><BrowserRouter>{child}</BrowserRouter></QueryClientProvider>)
  return queries
}
beforeEach(() => { history.replaceState(null, '', '/wishlist'); state.userId = 'account-a'; vi.clearAllMocks(); setTokenProvider(async () => state.userId ? { token: 'test-only', userId: state.userId } : null) })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
describe('library integration', () => {
  it('publishes confirmed saved state to cached aliases before a slow background refresh',async()=>{
    let reads=0,refresh!:(response:Response)=>void
    const confirmed={...entry,media:{...media,source_ids:{anilist:'123'}}}
    vi.stubGlobal('fetch',vi.fn(async(_url,init)=>{
      if(init.method==='PUT')return new Response(JSON.stringify({entry:confirmed,changed:true}))
      if(++reads===1)return new Response('[]')
      return new Promise<Response>(resolve=>{refresh=resolve})
    }))
    const queries=mount(<SaveButton media={media}/>)
    const alias=['private','account-a','media-status','anime','anilist-123']
    const other=['private','account-b','media-status','anime','anilist-123']
    queries.setQueryData(alias,null);queries.setQueryData(other,null)
    await waitFor(()=>expect(screen.getByRole('button',{name:'Add to wishlist'})).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button',{name:'Add to wishlist'}))
    await waitFor(()=>expect(refresh).toBeTypeOf('function'))
    expect(screen.getByRole('button',{name:'In wishlist'})).toHaveAttribute('aria-pressed','true')
    expect(queries.getQueryData(alias)).toEqual(confirmed)
    expect(queries.getQueryData(other)).toBeNull()
    await act(async()=>refresh(new Response(JSON.stringify([confirmed]))))
  })
  it('hides a previous account management dialog on account switch',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify(state.userId==='account-a'?{data:[entry],total:1}:{data:[],total:0}))))
    const queries=new QueryClient({defaultOptions:{queries:{retry:false}}})
    const tree=()=> <QueryClientProvider client={queries}><BrowserRouter><LibraryPage/></BrowserRouter></QueryClientProvider>
    const view=render(tree())
    fireEvent.click(await screen.findByRole('button',{name:'Manage Test title'}))
    expect(screen.getByRole('dialog')).toBeVisible()
    state.userId='account-b';view.rerender(tree())
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('does not announce or close a newer account dialog for a late completion response',async()=>{
    let complete!:(response:Response)=>void
    const closed=vi.fn()
    vi.stubGlobal('fetch',vi.fn(async(_url,init)=>init.method==='POST'?new Promise<Response>(resolve=>{complete=resolve}):new Response(JSON.stringify([{id:'session',active:true,version:4}]))))
    const queries=new QueryClient({defaultOptions:{queries:{retry:false}}})
    const tree=()=> <QueryClientProvider client={queries}><CompleteTitle entry={{...entry,status:'in_progress'} as import('../features/library').Entry} onComplete={closed}/></QueryClientProvider>
    const view=render(tree())
    await waitFor(()=>expect(screen.getByRole('button',{name:'Mark as completed'})).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button',{name:'Mark as completed'}));fireEvent.click(screen.getByRole('button',{name:'Mark as completed'}))
    await waitFor(()=>expect(complete).toBeTypeOf('function'))
    state.userId='account-b';view.rerender(tree())
    await act(async()=>complete(new Response('{}')))
    expect(closed).not.toHaveBeenCalled();expect(state.notify).not.toHaveBeenCalled()
  })
  it('shows the same saved status on compact and detail buttons and versions Start watching',async()=>{
    let status='planned'
    const fetcher=vi.fn(async(url,init)=>{
      if(init.method==='PUT'){expect(JSON.parse(init.body)).toEqual({status:'in_progress',expected_version:7});status='in_progress';return new Response(JSON.stringify({entry:{...entry,status},changed:true}))}
      expect(String(url)).toContain('/media-status?');return new Response(JSON.stringify([{...entry,status}]))
    })
    vi.stubGlobal('fetch',fetcher)
    mount(<><SaveButton media={media}/><SaveButton media={media} compact/><SaveButton media={media} kind="library"/></>)
    expect(await screen.findByRole('button',{name:'In wishlist'})).toHaveAttribute('aria-pressed','true')
    expect(screen.getByRole('button',{name:'In wishlist: Test title'})).toBeDisabled()
    fireEvent.click(screen.getByRole('button',{name:'Add to library'}))
    await waitFor(()=>expect(screen.getAllByRole('button',{name:'In your library'})).toHaveLength(2))
    expect(screen.getByRole('button',{name:'In your library: Test title'})).toHaveAttribute('aria-pressed','true')
  })
  it('confirms completion through the active session with its version and no invented marks',async()=>{
    const fetcher=vi.fn(async(url,init)=>new Response(JSON.stringify(String(url).includes('/watch-sessions')?(init.method==='POST'?{id:'session',version:5}:[{id:'session',active:true,version:4}]):{data:[{...entry,status:'in_progress'}],total:1})))
    vi.stubGlobal('fetch',fetcher);mount()
    fireEvent.click(await screen.findByRole('button',{name:'Manage Test title'}))
    await waitFor(()=>expect(screen.getByRole('button',{name:'Mark as completed'})).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button',{name:'Mark as completed'}))
    expect(fetcher.mock.calls.some(([,init])=>init.method==='POST')).toBe(false)
    fireEvent.click(screen.getByRole('button',{name:'Mark as completed'}))
    await waitFor(()=>expect(state.notify).toHaveBeenCalledWith('Marked as completed.'))
    const call=fetcher.mock.calls.find(([,init])=>init.method==='POST')!
    expect(String(call[0])).toContain('/watch-sessions/session/complete')
    expect(JSON.parse(call[1].body)).toEqual({expected_version:4})
  })
  it('sends expected version and refreshes account-scoped data after starting', async () => {
    const fetcher = vi.fn().mockImplementation((_url, init) => Promise.resolve(new Response(JSON.stringify(init.method === 'PUT' ? { entry: { ...entry, status: 'in_progress' }, changed: true } : { data: [entry], total: 1, next_cursor: null }), { status: 200 })))
    vi.stubGlobal('fetch', fetcher)
    const queries = mount()
    fireEvent.click(await screen.findByRole('button',{name:'Manage Test title'}))
    fireEvent.click(await screen.findByRole('button', { name: 'Start watching' }))
    await waitFor(() => expect(state.notify).toHaveBeenCalledWith('Added to your library.'))
    const write = fetcher.mock.calls.find(([, init]) => init.method === 'PUT')!
    expect(JSON.parse(write[1].body)).toEqual({ status: 'in_progress', expected_version: 7 })
    expect(queries.getQueryCache().getAll()[0].queryKey.slice(0, 2)).toEqual(['private', 'account-a'])
  })
  it('renders API failure as an error rather than an empty wishlist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'UPSTREAM_UNAVAILABLE' } }), { status: 503 })))
    mount()
    expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable')
    expect(screen.queryByText('Your wishlist is empty')).toBeNull()
  })
  it('keeps status inside the canonical card and requires confirmation before removal',async()=>{
    const fetcher=vi.fn(async(_url,init)=>new Response(JSON.stringify(init.method==='DELETE'?{entry:{...entry,deleted_at:'2026-11-25T00:00:00Z'},changed:true}:{data:[entry],total:1,next_cursor:null})))
    vi.stubGlobal('fetch',fetcher);mount()
    const manage=await screen.findByRole('button',{name:'Manage Test title'})
    expect(screen.getByText('Planned').closest('.media-card')).toBeTruthy()
    fireEvent.click(manage);fireEvent.click(screen.getByRole('button',{name:'Remove'}))
    expect(screen.getByRole('heading',{name:'Remove from wishlist?'})).toBeVisible()
    expect(fetcher.mock.calls.some(([,init])=>init.method==='DELETE')).toBe(false)
    fireEvent.click(screen.getByRole('button',{name:'Remove'}))
    await waitFor(()=>expect(state.notify).toHaveBeenCalledWith('Removed from wishlist.'))
    expect(String(fetcher.mock.calls.find(([,init])=>init.method==='DELETE')![0])).toContain('expected_version=7')
  })
  it('guest action requests sign-in without a write', async () => {
    state.userId = null
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher)
    mount(<SaveButton media={media} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add to wishlist' }))
    expect(state.signIn).toHaveBeenCalledWith('wishlist', { kind: 'wishlist', mediaId: media.id })
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('emits wishlist motion only after a changed server response',async()=>{
    let complete!:(response:Response)=>void
    vi.stubGlobal('fetch',vi.fn((url)=>String(url).includes('/media-status?')?Promise.resolve(new Response('[]')):new Promise<Response>(resolve=>{complete=resolve})))
    const effect=vi.fn();window.addEventListener('alcor:confirmed-save-motion',effect)
    try{
      mount(<SaveButton media={media} compact/>)
      await waitFor(()=>expect(screen.getByRole('button',{name:'Add Test title to wishlist'})).not.toBeDisabled())
      fireEvent.click(screen.getByRole('button',{name:'Add Test title to wishlist'}))
      await waitFor(()=>expect(complete).toBeTypeOf('function'))
      expect(effect).not.toHaveBeenCalled()
      await act(async()=>complete(new Response(JSON.stringify({entry,changed:true}))))
      await waitFor(()=>expect(effect).toHaveBeenCalledOnce())
      expect((effect.mock.calls[0][0] as CustomEvent).detail).toMatchObject({scopeKey:'account-a',target:'wishlist'})
    }finally{window.removeEventListener('alcor:confirmed-save-motion',effect)}
  })
  it('does not celebrate a previous account response after account switching',async()=>{
    let complete!:(response:Response)=>void
    vi.stubGlobal('fetch',vi.fn((url)=>String(url).includes('/media-status?')?Promise.resolve(new Response('[]')):new Promise<Response>(resolve=>{complete=resolve})))
    const effect=vi.fn();window.addEventListener('alcor:confirmed-save-motion',effect)
    try{
      const queries=new QueryClient()
      const tree=<QueryClientProvider client={queries}><BrowserRouter><SaveButton media={media}/></BrowserRouter></QueryClientProvider>
      const view=render(tree)
      await waitFor(()=>expect(screen.getByRole('button',{name:'Add to wishlist'})).not.toBeDisabled())
      fireEvent.click(screen.getByRole('button',{name:'Add to wishlist'}))
      await waitFor(()=>expect(complete).toBeTypeOf('function'))
      state.userId='account-b'
      view.rerender(<QueryClientProvider client={queries}><BrowserRouter><SaveButton media={media}/></BrowserRouter></QueryClientProvider>)
      await act(async()=>complete(new Response(JSON.stringify({entry,changed:true}))))
      await waitFor(()=>expect(screen.getByRole('button',{name:'Add to wishlist'})).not.toBeDisabled())
      expect(effect).not.toHaveBeenCalled();expect(state.notify).not.toHaveBeenCalledWith('Added to wishlist.')
    }finally{window.removeEventListener('alcor:confirmed-save-motion',effect)}
  })
  it.each([false, true])('does not announce a save for no-op or failed write (failure=%s)', async failure => {
    const effect=vi.fn();window.addEventListener('alcor:confirmed-save-motion',effect)
    vi.stubGlobal('fetch', vi.fn((url)=>Promise.resolve(new Response(JSON.stringify(String(url).includes('/media-status?')?[]:failure ? { error: { code: 'CONFLICT' } } : { entry, changed: false }), { status: String(url).includes('/media-status?')?200:failure ? 409 : 200 }))))
    mount(<SaveButton media={media} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add to wishlist' })).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: 'Add to wishlist' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add to wishlist' })).not.toBeDisabled())
    expect(state.notify).not.toHaveBeenCalledWith('Added to wishlist.')
    expect(effect).not.toHaveBeenCalled();window.removeEventListener('alcor:confirmed-save-motion',effect)
  })
})
