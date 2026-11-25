import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { t } from '../content'
import { Button } from '../ui'

export type EmailMode = 'login' | 'signup' | 'reset'
export function EmailForm({busy,ready,notice,error,onSubmit,onChange}:{busy:boolean;ready:boolean;notice:'confirm'|'reset'|null;error?:string|null;onSubmit:(mode:EmailMode,email:string,password:string)=>Promise<void>;onChange:(mode:EmailMode)=>void}) {
  const [mode,setMode]=useState<EmailMode>('login')
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('')
  const [visible,setVisible]=useState(false),[mismatch,setMismatch]=useState(false)
  const id=useId()
  function change(next:EmailMode){setMode(next);setPassword('');setConfirmation('');setVisible(false);setMismatch(false);onChange(next)}
  if(notice)return <div className="auth-confirmation"><p role="status">{t(notice==='confirm'?'auth.confirmEmail':'auth.resetSent')}</p><Button type="button" variant="secondary" onClick={()=>change('login')}>{t('auth.backToLogin')}</Button></div>
  return <>{mode!=='reset'&&<div className="auth-mode-tabs" aria-label={t('auth.accountOptions')}>{(['login','signup'] as const).map(value=><button type="button" key={value} aria-pressed={mode===value} disabled={busy} onClick={()=>change(value)}>{t(value==='login'?'auth.emailLogin':'auth.createAccount')}</button>)}</div>}
    <form className="auth-email-form" onSubmit={event=>{event.preventDefault();if(mode==='signup'&&password!==confirmation){setMismatch(true);return}setMismatch(false);void onSubmit(mode,email.trim(),password)}}>
      <div className="auth-form-field"><label htmlFor={`${id}-email`}>{t('auth.email')}</label><input id={`${id}-email`} type="email" autoComplete="email" value={email} disabled={busy} onChange={event=>setEmail(event.target.value)} required/></div>
      {mode!=='reset'&&<div className="auth-form-field"><label htmlFor={`${id}-password`}>{t('auth.password')}</label><div className="auth-password-field"><input id={`${id}-password`} type={visible?'text':'password'} autoComplete={mode==='signup'?'new-password':'current-password'} value={password} disabled={busy} onChange={event=>setPassword(event.target.value)} required/><button className="icon-button" type="button" aria-label={t(visible?'auth.hidePassword':'auth.showPassword')} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div>}
      {mode==='signup'&&<div className="auth-form-field"><label htmlFor={`${id}-confirmation`}>{t('auth.confirmPassword')}</label><input id={`${id}-confirmation`} type="password" autoComplete="new-password" value={confirmation} disabled={busy} onChange={event=>setConfirmation(event.target.value)} required/></div>}
      {(mismatch||error)&&<p role="alert" className="auth-field-error">{mismatch?t('auth.passwordMismatch'):error}</p>}
      <Button disabled={busy||!ready} aria-busy={busy}>{t(busy?'auth.working':mode==='signup'?'auth.createAccount':mode==='reset'?'auth.sendReset':'auth.emailLogin')}</Button>
      {mode!=='signup'&&<button type="button" className="auth-text-button" disabled={busy} onClick={()=>change(mode==='reset'?'login':'reset')}>{t(mode==='reset'?'auth.backToLogin':'auth.forgotPassword')}</button>}
    </form></>
}
