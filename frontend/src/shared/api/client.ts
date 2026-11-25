import type { components } from './schema'
import { t, type MessageKey } from '../content'

export type Media = components['schemas']['Media']
export type CataloguePage = components['schemas']['CataloguePage']
export type HomeResponse = components['schemas']['HomeResponse']
export type EpisodePage = components['schemas']['EpisodePage']
const base = import.meta.env.VITE_API_BASE_URL ?? ''
let backendReady = true
export function setBackendReady(value: boolean) { backendReady = value }
let tokenProvider: () => Promise<{ token: string; userId: string } | null> = async () => null
export function setTokenProvider(provider: typeof tokenProvider) { tokenProvider = provider }

const errorKeys: Record<string, MessageKey> = {
  NOT_FOUND: 'errors.notFound', INVALID_REQUEST: 'errors.invalid', INVALID_CURSOR: 'errors.invalid',
  UPSTREAM_UNAVAILABLE: 'errors.unavailable', CONFLICT: 'errors.conflict',
  RATE_LIMITED: 'errors.rateLimit', UNAUTHORIZED: 'errors.auth', AUTH_UNAVAILABLE: 'auth.unconfigured',
  UNSUPPORTED_FILTER: 'discovery.unsupportedFilter',
  FAVORITE_LIMIT: 'favorites.limit',
  COMPLETION_UNAVAILABLE: 'tracking.completionUnavailable',
  COMPLETION_REQUIRES_SESSION: 'tracking.completionRequiresSession',
  RECOMMENDATIONS_UNAVAILABLE: 'recommendations.unavailable',
  RECOMMENDATION_CONTEXT_CHANGED: 'recommendations.contextChanged',
  LIBRARY_QUERY_UNAVAILABLE: 'library.queryUnavailable',
  BACKEND_WAKING: 'backend.actionUnavailable', PROVIDER_NOT_CONFIGURED: 'catalogue.providerPending',
}
export class ApiError extends Error {
  constructor(public status: number, public code: string, public requestId?: string, public retryAfterSeconds?: number) {
    super(t(errorKeys[code] ?? 'errors.generic'))
  }
}

export async function api<T>(path: string, options: RequestInit & { accountId?: string } = {}): Promise<T> {
  if (path.startsWith('/me') && !backendReady) throw new ApiError(503, 'BACKEND_WAKING')
  const { accountId, ...requestOptions } = options
  const session = await tokenProvider()
  if (accountId && session?.userId !== accountId) throw new ApiError(401, 'UNAUTHORIZED')
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (session) headers.set('Authorization', `Bearer ${session.token}`)
  let response: Response
  try {
    response = await fetch(`${base}/api/v1${path}`, { ...requestOptions, headers, signal: options.signal ?? AbortSignal.timeout(15000) })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    if (path.startsWith('/me')) window.dispatchEvent(new Event('alcor:backend-unavailable'))
    throw new Error(t('errors.network'), { cause: error })
  }
  if (!response.ok) {
    if (path.startsWith('/me') && [502, 504].includes(response.status)) window.dispatchEvent(new Event('alcor:backend-unavailable'))
    const body = await response.json().catch(() => ({}))
    if (path.startsWith('/me') && ['BACKEND_WAKING','LIMITER_UNAVAILABLE'].includes(body.error?.code)) window.dispatchEvent(new Event('alcor:backend-unavailable'))
    const retry=response.headers.get('Retry-After')
    const seconds=retry&&/^\d+$/.test(retry)?Number(retry):retry?Math.max(0,Math.ceil((Date.parse(retry)-Date.now())/1000)):undefined
    throw new ApiError(response.status, body.error?.code ?? 'UNKNOWN', body.error?.request_id,seconds!==undefined&&Number.isFinite(seconds)?seconds:undefined)
  }
  return response.status === 204 ? undefined as T : response.json().catch(()=>{
    if(path.startsWith('/me'))window.dispatchEvent(new Event('alcor:backend-unavailable'))
    throw new ApiError(503,'UPSTREAM_UNAVAILABLE')
  })
}
