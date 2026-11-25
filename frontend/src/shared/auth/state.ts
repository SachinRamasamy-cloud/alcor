import {createContext,useContext} from 'react'
import type {PendingAction} from './pending'
export type Reason='wishlist'|'library'|'progress'
export type AuthState={
  userId:string|null
  loading:boolean
  requireSignIn:(reason?:Reason,action?:{kind:PendingAction['kind'];mediaId:string})=>void
  signOut:()=>Promise<void>
}
export const AuthContext=createContext<AuthState>({userId:null,loading:false,requireSignIn:()=>{},signOut:async()=>{}})
export const useAuth=()=>useContext(AuthContext)
