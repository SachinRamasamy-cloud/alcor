import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { t } from '../content'

const FeedbackContext = createContext<(message: string) => void>(() => {})
export const useFeedback = () => useContext(FeedbackContext)
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [offline, setOffline] = useState(!navigator.onLine)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    window.addEventListener('online', update); window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); clearTimeout(timer.current) }
  }, [])
  const notify = (text: string) => { clearTimeout(timer.current); setMessage(text); timer.current = setTimeout(() => setMessage(''), 5000) }
  return <FeedbackContext.Provider value={notify}>
    {offline && <div role="status" className="notice">{t('warnings.offline')}</div>}{children}
    <div aria-live="polite" aria-atomic="true" className="toast-viewport"><AnimatePresence>{message && <m.div key={message} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="toast">{message}</m.div>}</AnimatePresence></div>
  </FeedbackContext.Provider>
}
