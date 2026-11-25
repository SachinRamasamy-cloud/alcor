import {cleanup,render,screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach,expect,it,vi} from 'vitest'
import {WishlistTarget} from './wishlist-target'
const state=vi.hoisted(()=>({total:7 as number|undefined}))
vi.mock('../features/library',()=>({useLibrary:()=>({data:state.total===undefined?undefined:{total:state.total}})}))
afterEach(cleanup)
it('uses the server wishlist total and removes the badge when no account data is available',()=>{
  const view=render(<MemoryRouter><WishlistTarget/></MemoryRouter>)
  expect(screen.getByRole('link',{name:'Wishlist'})).toHaveAttribute('href','/wishlist')
  expect(view.container.querySelector('.wishlist-count')).toHaveTextContent('7')
  state.total=undefined;view.rerender(<MemoryRouter><WishlistTarget/></MemoryRouter>)
  expect(view.container.querySelector('.wishlist-count')).toBeNull()
})
