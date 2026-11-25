import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import type { Media } from '../../src/shared/api/client'
import type { AniMedia } from '../../src/shared/api/anilist'

export const snapshots: Media[] = JSON.parse(readFileSync(new URL('../../../backend/app/integrations/metadata/fixtures/catalogue.json', import.meta.url), 'utf8'))
// Test-only identities; these are not a claimed real AniList/MAL crosswalk.
export const titles: AniMedia[] = snapshots.map(m => ({
  id: 100000 + Number(m.external_id), idMal: Number(m.external_id), type: m.media_type === 'anime' ? 'ANIME' : 'MANGA',
  title: { english: m.title, native: m.original_title, romaji: m.aliases?.[0] }, description: m.synopsis,
  coverImage: { large: `https://s4.anilist.co/test/${m.external_id}.svg` },
  format: m.format?.toUpperCase().replace('LIGHT NOVEL', 'NOVEL'), status: 'FINISHED',
  averageScore: m.score == null ? null : m.score * 10, genres: m.genres, episodes: m.media_type === 'anime' ? m.total_units : null,
  chapters: m.media_type === 'manga' ? m.total_units : null, seasonYear: m.year, isAdult: false,
}))

export async function mockCatalogue(page: Page) {
  await page.route('**/api/v1/**', route => route.abort('connectionrefused'))
  await page.route('https://s4.anilist.co/test/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#d8dfd3"/><circle cx="150" cy="160" r="75" fill="#687b63"/><path d="M0 450L150 230L300 450" fill="#8f9b89"/></svg>' }))
  await page.route('https://graphql.anilist.co', route => {
    const { query, variables = {} } = route.request().postDataJSON()
    let data: unknown
    if (query.includes('AlcorHome')) data = { anime: { media: titles.filter(m => m.type === 'ANIME') }, manga: { media: titles.filter(m => m.type === 'MANGA') }, genres: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Mystery', 'Romance', 'Sci-Fi'] }
    else if (query.includes('AlcorDetails')) data = { Media: titles.find(m => variables.id ? m.id === variables.id : m.idMal === variables.idMal) }
    else data = { Page: { pageInfo: { hasNextPage: false }, media: titles.filter(m => (!variables.type || m.type === variables.type) && (!variables.search || JSON.stringify(m.title).toLowerCase().includes(variables.search.toLowerCase()))) } }
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data }) })
  })
}
