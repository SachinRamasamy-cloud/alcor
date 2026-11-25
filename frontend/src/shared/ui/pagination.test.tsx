import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Pagination } from './pagination'

afterEach(cleanup)
it('offers first, previous, numbered, next, last and validated page jumps',()=>{
  const change=vi.fn()
  render(<Pagination page={5} totalPages={12} onChange={change}/>)
  expect(screen.getByRole('button',{name:'Go to page 5'})).toHaveAttribute('aria-current','page')
  fireEvent.click(screen.getByRole('button',{name:/^First$/}));expect(change).toHaveBeenLastCalledWith(1)
  fireEvent.click(screen.getByRole('button',{name:/^Previous$/}));expect(change).toHaveBeenLastCalledWith(4)
  fireEvent.click(screen.getByRole('button',{name:/^Next$/}));expect(change).toHaveBeenLastCalledWith(6)
  fireEvent.click(screen.getByRole('button',{name:/^Last$/}));expect(change).toHaveBeenLastCalledWith(12)
  fireEvent.change(screen.getByRole('spinbutton',{name:'Go to page'}),{target:{value:'8'}})
  fireEvent.click(screen.getByRole('button',{name:/^Go$/}));expect(change).toHaveBeenLastCalledWith(8)
  fireEvent.change(screen.getByRole('spinbutton',{name:'Go to page'}),{target:{value:'13'}})
  expect(screen.getByRole('button',{name:/^Go$/})).toBeDisabled()
})
it('does not invent a last page or offer unavailable filtered jumps',()=>{
  const change=vi.fn()
  render(<Pagination page={3} hasNext availablePages={[1,2,3,4]} onChange={change}/>)
  expect(screen.queryByRole('button',{name:/^Last$/})).not.toBeInTheDocument()
  expect(screen.getByText('Page 3')).toBeVisible()
  fireEvent.change(screen.getByRole('spinbutton',{name:'Go to page'}),{target:{value:'8'}})
  expect(screen.getByRole('button',{name:/^Go$/})).toBeDisabled()
  expect(change).not.toHaveBeenCalled()
})
