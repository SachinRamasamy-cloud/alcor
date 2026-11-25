import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {MemoryRouter,useLocation} from 'react-router-dom'
import {useCataloguePagination} from './pagination'
const state=vi.hoisted(()=>({userId:null as string|null,mode:'all'}))
vi.mock('../../shared/auth',()=>({useAuth:()=>({userId:state.userId})}))
afterEach(()=>{cleanup();state.userId=null;state.mode='all'})
function Pager(){const pager=useCataloguePagination('f:2:0',true,state.mode),location=useLocation();return <><output>{location.search}</output><button onClick={()=>pager.change(2)}>Next</button><button onClick={()=>pager.change(1)}>First</button></>}
function mount(){render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/anime?genre=Action']}><Pager/></MemoryRouter></QueryClientProvider>)}
it('preserves the original guest URL when returning to the first catalogue page',()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:'Next'}))
  expect(screen.getByRole('status')).toHaveTextContent('?genre=Action&page=2')
  fireEvent.click(screen.getByRole('button',{name:'First'}))
  expect(screen.getByRole('status').textContent).toBe('?genre=Action')
})
it('carries a signed-in default mode together with the exact personal cursor',()=>{
  state.userId='a';state.mode='new_to_me';mount();fireEvent.click(screen.getByRole('button',{name:'Next'}))
  const params=new URLSearchParams(screen.getByRole('status').textContent!)
  expect(params.get('genre')).toBe('Action');expect(params.get('mode')).toBe('new_to_me')
  expect(params.get('page')).toBe('2');expect(params.get('cursor')).toBe('f:2:0')
  fireEvent.click(screen.getByRole('button',{name:'First'}))
  const first=new URLSearchParams(screen.getByRole('status').textContent!)
  expect(first.get('mode')).toBe('new_to_me');expect(first.has('page')).toBe(false);expect(first.has('cursor')).toBe(false)
})
