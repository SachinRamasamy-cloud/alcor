import { createContext, useContext, useState, type ReactNode } from 'react'
import { t } from '../content'
import { Modal } from '../ui'

type Reason = 'wishlist' | 'library' | 'progress'
const AuthContext = createContext<{ requireSignIn: (reason?: Reason) => void }>({ requireSignIn: () => {} })
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [reason, setReason] = useState<Reason | null>(null)
  return <AuthContext.Provider value={{ requireSignIn: (value = 'library') => setReason(value) }}>{children}
    <Modal open={reason !== null} onOpenChange={open => { if (!open) setReason(null) }} title={t('auth.title')} description={t(reason === 'wishlist' ? 'auth.wishlist' : reason === 'progress' ? 'auth.progress' : 'auth.library')}>
      <p className="text-sm text-muted">{t('auth.unconfigured')}</p><p className="mt-3 text-xs text-muted">{t('auth.guest')}</p>
    </Modal>
  </AuthContext.Provider>
}
