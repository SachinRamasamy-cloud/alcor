import messages from '../../content/en/common.json'

export type MessageKey = keyof typeof messages
export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
  return messages[key].replace(/\{(\w+)\}/g, (_, name: string) => {
    if (!(name in params)) throw new Error(`Missing message parameter: ${key}.${name}`)
    return String(params[name])
  })
}

export function unitCount(count: number | null, mediaType: 'anime' | 'manga') {
  if (count === null) return t(mediaType === 'anime' ? 'media.unknownEpisodes' : 'media.unknownChapters')
  const category = new Intl.PluralRules('en').select(count) === 'one' ? 'one' : 'other'
  const unit = mediaType === 'anime' ? 'episodeCount' : 'chapterCount'
  return t(`media.${unit}.${category}`, { count: new Intl.NumberFormat('en').format(count) })
}

export const formatDate = (date: string) => new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(date))
