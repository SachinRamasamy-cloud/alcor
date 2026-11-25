import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {MemoryRouter,useLocation} from 'react-router-dom'
import {DiscoveryModeControl} from './mode-control'
const state=vi.hoisted(()=>({owner:'a' as string|null}))
vi.mock('../../shared/auth',()=>({useAuth:()=>({userId:state.owner})}))
afterEach(()=>{cleanup();vi.unstubAllGlobals();state.owner='a'})
function Scene(){const location=useLocation();return <><DiscoveryModeControl mode="new_to_me"/><output>{location.search}</output></>}
it('changes only the explicit mode, preserves filters and clears continuation without a private write',async()=>{
  const request=vi.fn();vi.stubGlobal('fetch',request)
  render(<MemoryRouter initialEntries={['/?genre=Fantasy&page=3&cursor=f:2:0']}><Scene/></MemoryRouter>)
  fireEvent.keyDown(screen.getByRole('button',{name:'Discovery mode'}),{key:'ArrowDown'})
  fireEvent.click(await screen.findByRole('menuitemradio',{name:'Show all'}))
  expect(screen.getByRole('status').textContent).toBe('?genre=Fantasy&mode=all')
  expect(request).not.toHaveBeenCalled()
})
it('preserves guest controls and sends no personal mode operation',()=>{
  state.owner=null;render(<MemoryRouter><Scene/></MemoryRouter>)
  expect(screen.queryByRole('button',{name:'Discovery mode'})).toBeNull()
})
