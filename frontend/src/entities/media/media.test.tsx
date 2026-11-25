import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { fromAniList } from '../../shared/api/anilist'
import { MediaCard, Poster } from './index'

afterEach(cleanup)
const media=fromAniList({id:1,type:'ANIME',title:{english:'A title with a complete accessible name'},format:'TV',seasonYear:2024,episodes:12,genres:['Action','Adventure'],coverImage:{large:'https://s4.anilist.co/example.jpg'}})

it('presents available metadata and keeps the supplied action independent from navigation',()=>{
  const save=vi.fn()
  render(<MemoryRouter><MediaCard media={media} actions={<button onClick={save}>Save title</button>}/></MemoryRouter>)
  expect(screen.getByRole('article',{name:media.title})).toBeInTheDocument()
  expect(screen.getByText('12 episodes')).toBeVisible()
  expect(screen.getByText('Action')).toBeVisible()
  expect(screen.getByRole('link',{name:media.title})).toHaveAttribute('href','/anime/anilist-1')
  expect(screen.queryByRole('link',{name:`View details for ${media.title}`})).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'Save title'}))
  expect(save).toHaveBeenCalledOnce()
})

it('does not display a rating badge for absent scores, while retaining a real zero score',()=>{
  const view=render(<MemoryRouter><MediaCard media={{...media,score:undefined}}/></MemoryRouter>)
  expect(view.container.querySelector('.score-pill')).not.toBeInTheDocument()
  view.rerender(<MemoryRouter><MediaCard media={{...media,score:0}}/></MemoryRouter>)
  expect(screen.getByLabelText('AniList score: 0')).toHaveTextContent('0.0')
})

it('replaces failed artwork with an accessible fallback and can retry a different source',()=>{
  const view=render(<Poster media={media}/>)
  fireEvent.error(view.container.querySelector('img')!)
  expect(screen.getByRole('img',{name:'Cover not available'})).toBeVisible()
  view.rerender(<Poster media={{...media,image_url:'https://s4.anilist.co/replacement.jpg'}}/>)
  expect(view.container.querySelector('img')).toHaveAttribute('src','https://s4.anilist.co/replacement.jpg')
})
