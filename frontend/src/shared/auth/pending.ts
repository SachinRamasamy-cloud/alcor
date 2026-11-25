export type PendingAction = { kind: 'wishlist' | 'library'; mediaId: string; returnPath: string; expires: number; nonce: string }
const storageKey = 'alcor.pending.v1'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const mediaReference = /^(?:anilist-[1-9]\d{0,9}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i
export function clearPending() { sessionStorage.removeItem(storageKey) }
export function readPending(consume = false): PendingAction | null {
  const raw = sessionStorage.getItem(storageKey)
  if (consume) clearPending()
  try {
    const p = JSON.parse(raw ?? 'null') as PendingAction | null
    if (!p || !['wishlist', 'library'].includes(p.kind) || !mediaReference.test(p.mediaId) || !uuid.test(p.nonce) || !Number.isFinite(p.expires) || p.expires < Date.now() || p.expires > Date.now() + 600000 || typeof p.returnPath !== 'string' || !p.returnPath.startsWith('/') || p.returnPath.startsWith('//') || p.returnPath.includes('\\') || new URL(p.returnPath, location.origin).origin !== location.origin) return null
    return p
  } catch { return null }
}
export function savePending(kind: PendingAction['kind'], mediaId: string, returnPath: string) {
  clearPending()
  const value: PendingAction = { kind, mediaId, returnPath, nonce: crypto.randomUUID(), expires: Date.now() + 600000 }
  sessionStorage.setItem(storageKey, JSON.stringify(value))
  if (!readPending()) clearPending()
}
