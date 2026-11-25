import * as Menu from '@radix-ui/react-dropdown-menu'
import {Check,ChevronDown,X} from 'lucide-react'
import {useId} from 'react'
import {t} from '../content'
type Option={value:string;label:string}
export function SelectMenu({label,placeholder,options,values,onChange,multiple=true}:{label:string;placeholder:string;options:Option[];values:string[];onChange:(values:string[])=>void;multiple?:boolean}){
  const id=useId()
  const selected=options.filter(option=>values.includes(option.value))
  const summary=selected.length?selected.map(option=>option.label).join(', '):placeholder
  return <div className="select-field"><span id={id}>{label}</span><Menu.Root modal={false}><Menu.Trigger className="select-trigger" aria-labelledby={id} title={summary}><span>{summary}</span>{multiple&&values.length>1&&<small>{values.length}</small>}<ChevronDown size={15}/></Menu.Trigger><Menu.Portal><Menu.Content className="select-popup" sideOffset={7} collisionPadding={12} aria-label={label}>
    <Menu.Label className="select-popup-label">{label}</Menu.Label>
    {multiple&&<Menu.Item className="select-option" disabled={!values.length} onSelect={event=>{event.preventDefault();onChange([])}}><X size={14}/>{t('catalogue.clearSelection')}</Menu.Item>}
    <Menu.Separator className="select-separator"/>
    {multiple?options.map(option=><Menu.CheckboxItem className="select-option" key={option.value} checked={values.includes(option.value)} onSelect={event=>event.preventDefault()} onCheckedChange={checked=>onChange(checked?[...values,option.value]:values.filter(value=>value!==option.value))}><span className="select-check"><Menu.ItemIndicator><Check size={14}/></Menu.ItemIndicator></span>{option.label}</Menu.CheckboxItem>):<Menu.RadioGroup value={values[0]??''} onValueChange={value=>onChange([value])}>{options.map(option=><Menu.RadioItem className="select-option" key={option.value} value={option.value}><span className="select-check"><Menu.ItemIndicator><Check size={14}/></Menu.ItemIndicator></span>{option.label}</Menu.RadioItem>)}</Menu.RadioGroup>}
    <Menu.Separator className="select-separator"/><Menu.Item className="select-option select-done">{t('common.done')}</Menu.Item>
  </Menu.Content></Menu.Portal></Menu.Root></div>
}
