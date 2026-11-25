import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth, authClient } from '../shared/auth'
import { clearPending, readPending } from '../shared/auth/pending'
import { api } from '../shared/api/client'
import { useLibrary, useLibraryWrite, type Entry } from '../features/library'
import { MediaCard } from '../entities/media'
import { t } from '../shared/content'
import { Button, ErrorState, Loading, Modal } from '../shared/ui'

const callbacks = new Map<string, Promise<string>>()
export function finishCallback(code: string) {
  if (!callbacks.has(code)) {
    callbacks.clear()
    callbacks.set(code, (async () => {
      if (!authClient) throw new Error(t('auth.unconfigured'))
      const { data, error } = await authClient.auth.exchangeCodeForSession(code)
      if (error || !data.session) { clearPending(); throw new Error(t('errors.auth')) }
      const pending = readPending(true)
      if (pending) {
        const current = (await authClient.auth.getSession()).data.session
        if (current?.user.id !== data.session.user.id) throw new Error(t('errors.auth'))
        await api(`/me/library/${pending.mediaId}`, { accountId: data.session.user.id, method: 'PUT', headers: { 'Idempotency-Key': pending.nonce }, body: JSON.stringify({ status: pending.kind === 'wishlist' ? 'planned' : 'in_progress' }) })
      }
      return pending?.returnPath ?? '/library'
    })())
  }
  return callbacks.get(code)!
}
export function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queries = useQueryClient()
  const [error, setError] = useState<Error | null>(null)
  useEffect(() => {
    const code = params.get('code')
    if (!code) { clearPending(); navigate('/', { replace: true }); return }
    let active = true
    void finishCallback(code).then(path => { if (active) { void queries.invalidateQueries({ queryKey: ['private'] }); navigate(path, { replace: true }) } }).catch(error => { if (active) setError(error instanceof Error ? error : new Error(t('errors.auth'))) })
    return () => { active = false }
  }, [params, navigate, queries])
  return error ? <ErrorState error={error} /> : <Loading />
}
export function LibraryPage() {
  const wishlist = useLocation().pathname === '/wishlist'
  const { userId, loading, requireSignIn } = useAuth()
  const [params, setParams] = useSearchParams()
  const entries = useLibrary(wishlist, params.get('cursor') ?? '', params.get('status') ?? '')
  const write = useLibraryWrite()
  const [remove, setRemove] = useState<Entry | null>(null)
  useEffect(() => { document.title = `${t(wishlist ? 'nav.wishlist' : 'nav.library')} · ALCOR` }, [wishlist])
  if (loading) return <Loading />
  return <div className="shell page-body"><div className="page-heading"><h1>{t(wishlist ? 'nav.wishlist' : 'nav.library')}</h1>{entries.data && <span className="text-sm text-muted">{entries.data.total}</span>}</div>
    {!userId ? <div className="state-box"><h2>{t('auth.title')}</h2><p>{t(wishlist ? 'auth.wishlist' : 'auth.library')}</p><Button onClick={() => requireSignIn(wishlist ? 'wishlist' : 'library')}>{t('nav.signIn')}</Button><p>{t('auth.guest')}</p></div> : <>
      {!wishlist && <label className="block mb-6 text-sm">{t('library.status')}<select className="ml-3 min-h-11 border border-line rounded px-3" value={params.get('status') ?? ''} onChange={e => setParams(e.target.value ? { status: e.target.value } : {})}><option value="">{t('library.all')}</option>{(['planned', 'in_progress', 'completed', 'on_hold', 'dropped', 'not_interested'] as const).map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}</select></label>}
      {entries.isPending ? <Loading /> : entries.error ? <ErrorState error={entries.error} retry={() => { void entries.refetch() }} /> : entries.data.data.length === 0 ? <div className="state-box"><h2>{t(wishlist ? 'wishlist.empty' : 'library.empty')}</h2><p>{t(wishlist ? 'wishlist.emptyBody' : 'library.emptyBody')}</p><Link className="button button-secondary" to="/anime">{t('catalogue.anime')}</Link></div> : <><div className="media-grid">{entries.data.data.map(entry => <div key={entry.media.id}><MediaCard media={entry.media} /><p className="my-3 text-xs text-muted">{t(`status.${entry.status}`)}</p>{entry.status === 'planned' && <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={write.isPending} onClick={() => write.mutate({ id: entry.media.id, status: 'in_progress', version: entry.version })}>{t(entry.media.media_type === 'anime' ? 'library.startWatching' : 'library.startReading')}</Button><Button variant="ghost" onClick={() => setRemove(entry)}>{t('common.remove')}</Button></div>}</div>)}</div><div className="pagination">{params.has('cursor') && <Button variant="secondary" onClick={() => setParams({})}>{t('catalogue.back')}</Button>}{entries.data.next_cursor && <Button variant="secondary" onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.set('cursor', entries.data.next_cursor!); return next })}>{t('catalogue.more')}</Button>}</div></>}
    </>}
    <Modal open={Boolean(remove)} onOpenChange={open => { if (!open) setRemove(null) }} title={t('wishlist.confirmRemove')} description={remove?.media.title}><div className="flex gap-3"><Button variant="secondary" onClick={() => setRemove(null)}>{t('common.cancel')}</Button><Button disabled={write.isPending} onClick={() => { if (remove) write.mutate({ id: remove.media.id, version: remove.version, remove: true }, { onSuccess: () => setRemove(null) }) }}>{t('common.remove')}</Button></div></Modal>
  </div>
}
