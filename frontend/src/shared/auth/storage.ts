// Supabase owns the single session record. Discard unneeded Google credentials.
export const sessionStorageAdapter = {
  getItem: (key: string) => localStorage.getItem(key),
  removeItem: (key: string) => localStorage.removeItem(key),
  setItem(key: string, value: string) {
    let sanitized = value
    try {
      const session = JSON.parse(value)
      if (session && typeof session === 'object') {
        delete session.provider_token
        delete session.provider_refresh_token
        sanitized = JSON.stringify(session)
      }
    } catch { /* PKCE verifier values are stored by the same SDK adapter. */ }
    localStorage.setItem(key, sanitized)
  },
}
