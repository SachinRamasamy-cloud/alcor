import {QueryClient} from '@tanstack/react-query'
import {ApiError} from './client'

export function createAppQueryClient(){
  return new QueryClient({defaultOptions:{queries:{refetchOnWindowFocus:false,
    retry:(count,error)=>count<1&&(!(error instanceof ApiError)||error.status>=500)},
    mutations:{networkMode:'always',retry:false}}})
}
