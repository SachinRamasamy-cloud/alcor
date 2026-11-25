import type {Media} from '../../shared/api/client'

export function qualifiesFeatured(media:Media){
  const status=(media.status??'').trim().toUpperCase().replaceAll(' ','_')
  if(!['FINISHED','FINISHED_AIRING','RELEASING','CURRENTLY_AIRING'].includes(status)||!media.title.trim()||!media.synopsis?.trim())return false
  try{const image=new URL(media.image_url??'');return image.protocol==='https:'&&['s4.anilist.co','cdn.myanimelist.net'].includes(image.hostname)&&!image.username&&!image.password}catch{return false}
}
export function selectFeatured(items:Media[]){return items.find(qualifiesFeatured)??null}
