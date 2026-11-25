import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it } from 'vitest'
import { RouteSkeleton } from './skeleton'

afterEach(cleanup)
it.each([
  ['/', 'home'], ['/anime', 'catalogue'], ['/manga/anilist-1', 'details'],
  ['/library', 'library'], ['/wishlist', 'wishlist'], ['/collections', 'collections'],
  ['/history', 'history'], ['/statistics', 'statistics'], ['/profile', 'profile'], ['/settings', 'settings'],
])('keeps %s loading content in its page layout', (path, kind) => {
  const {container}=render(<MemoryRouter initialEntries={[path]}><RouteSkeleton/></MemoryRouter>)
  expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')
  expect(container.querySelector(`.skeleton-${kind}`)).toBeInTheDocument()
  expect(container.querySelector('.shell')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveAccessibleName('Loading…')
  expect(container).not.toHaveTextContent(/Loading/)
  expect(container.querySelector('.skeleton-block')).toBeInTheDocument()
  expect(container.querySelector('button,input,a')).not.toBeInTheDocument()
})
