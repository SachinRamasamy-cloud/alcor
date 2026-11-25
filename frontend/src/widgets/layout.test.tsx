import {cleanup,fireEvent,render,screen,within} from '@testing-library/react'
import {MemoryRouter,Route,Routes} from 'react-router-dom'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {Layout} from './layout'
const state=vi.hoisted(()=>({userId:'owner' as string|null,signOut:vi.fn(async()=>{})}))
vi.mock('../shared/auth',()=>({useAuth:()=>({...state,requireSignIn:vi.fn()})}))
vi.mock('../shared/api/backend',()=>({useBackend:()=>({ready:true}),BackendNotice:()=>null}))
vi.mock('../features/profile',()=>({useSetup:()=>({data:{profile:{display_name:'Test Reader'}}})}))
vi.mock('../features/library',()=>({useLibrary:()=>({data:{total:0}})}))
vi.mock('./footer',()=>({Footer:()=>null}))
beforeEach(()=>vi.stubGlobal('scrollTo',vi.fn()))
afterEach(()=>{cleanup();state.userId='owner';vi.clearAllMocks();vi.unstubAllGlobals()})
function mount(){render(<MemoryRouter><Routes><Route element={<Layout/>}><Route index element={<h1>Home content</h1>}/></Route></Routes></MemoryRouter>)}
it('keeps Home in signed-in navigation and moves account destinations into the profile menu',async()=>{
  mount()
  const nav=screen.getByRole('navigation',{name:'Open menu'})
  expect(within(nav).getByRole('link',{name:'Home'})).toHaveAttribute('href','/')
  expect(within(nav).queryByRole('link',{name:'Dashboard'})).toBeNull()
  const trigger=screen.getByRole('button',{name:'Account menu'})
  fireEvent.keyDown(trigger,{key:'Enter'})
  expect(await screen.findByRole('menuitem',{name:'Dashboard'})).toHaveAttribute('href','/dashboard')
  expect(screen.getByRole('menuitem',{name:'Completed'})).toHaveAttribute('href','/library?status=completed')
  fireEvent.click(screen.getByRole('menuitem',{name:'Sign out'}))
  expect(state.signOut).toHaveBeenCalledOnce()
})
it('retains guest sign-in and contextual catalogue search',()=>{
  state.userId=null;mount()
  expect(screen.getByRole('button',{name:'Sign in'})).toBeVisible()
  expect(screen.queryByRole('button',{name:'Account menu'})).toBeNull()
})
