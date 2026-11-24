import type { components } from './schema'
import { t, type MessageKey } from '../content'

export type Media = components['schemas']['Media']
export type CataloguePage = components['schemas']['CataloguePage']
export type HomeResponse = components['schemas']['HomeResponse']
export type EpisodePage = components['schemas']['EpisodePage']
const base = import.meta.env.VITE_API_BASE_URL ?? ''
let tokenProvider: () => Promise<string | null> = async () => null
export function setTokenProvider(provider: typeof tokenProvider) { tokenProvider = provider }

const errorKeys: Record<string, MessageKey> = {
  NOT_FOUND: 'errors.notFound', INVALID_REQUEST: 'errors.invalid', INVALID_CURSOR: 'errors.invalid',
  UPSTREAM_UNAVAILABLE: 'errors.unavailable', CONFLICT: 'errors.conflict',
  RATE_LIMITED: 'errors.rateLimit', UNAUTHORIZED: 'errors.auth', AUTH_UNAVAILABLE: 'auth.unconfigured',
}
export class ApiError extends Error {
  constructor(public status: number, public code: string, public requestId?: string) {
    super(t(errorKeys[code] ?? 'errors.generic'))
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await tokenProvider()
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let response: Response
  try {
    response = await fetch(`${base}/api/v1${path}`, { ...options, headers, signal: options.signal ?? AbortSignal.timeout(15000) })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new Error(t('errors.network'), { cause: error })
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(response.status, body.error?.code ?? 'UNKNOWN', body.error?.request_id)
  }
  return response.status === 204 ? undefined as T : response.json()
}
