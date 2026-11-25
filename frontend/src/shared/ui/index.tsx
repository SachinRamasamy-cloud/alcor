import * as Dialog from '@radix-ui/react-dialog'
import { m } from 'motion/react'
import { X } from 'lucide-react'
import { useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { t } from '../content'

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return <m.span className="inline-flex" whileTap={{ scale: .97 }}><button className={`button button-${variant} ${className}`} {...props}>{children}</button></m.span>
}

export function Modal({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode }) {
  const descriptionId = useId()
  const returnFocus = useRef<HTMLElement | null>(null)
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content" aria-describedby={description ? descriptionId : undefined} onOpenAutoFocus={() => { returnFocus.current = document.activeElement as HTMLElement }} onCloseAutoFocus={event => { event.preventDefault(); if (returnFocus.current?.isConnected) returnFocus.current.focus() }}>
    <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
    {description && <Dialog.Description id={descriptionId} className="mt-3 text-sm leading-6 text-muted">{description}</Dialog.Description>}
    <Dialog.Close className="icon-button absolute right-3 top-3" aria-label={t('common.close')}><X size={19} /></Dialog.Close>
    <div className="mt-6">{children}</div>
  </Dialog.Content></Dialog.Portal></Dialog.Root>
}

export { Loading, RouteSkeleton } from './skeleton'
export function ErrorState({ error, retry }: { error?: Error | null; retry?: () => void }) {
  return <div role="alert" className="state-box"><h2>{error?.message ?? t('errors.generic')}</h2>{retry && <Button variant="secondary" onClick={retry}>{t('common.retry')}</Button>}</div>
}
