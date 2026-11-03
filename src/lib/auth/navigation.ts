/** Navegação de sessão, sem compartilhamento de estado entre contas.
 * O destino de retorno é guardado somente para a conta que visitou a área.
 * Nenhum URL externo ou ID de veículo é persistido como destino.
 */
export const LAST_PRIVATE_PATH_KEY='smartveiculos:last-private-route:v1';
const ALLOWED=new Set(['/garagem','/negocio','/meus-atendimentos','/gol-g6','/cb650r','/admin','/admin-empresas']);
const BUSINESS=new Set(['parts_cars','parts_bikes','workshop']);

export function safePrivatePath(input:string):string|null{
 try{
  if(!input.startsWith('/')||input.startsWith('//')||input.includes('\\'))return null;
  const url=new URL(input,'https://smartveiculos.lovable.app');
  if(url.origin!=='https://smartveiculos.lovable.app'||!ALLOWED.has(url.pathname))return null;
  if(url.pathname==='/negocio'){
   const segment=url.searchParams.get('segment');
   return segment&&BUSINESS.has(segment)?'/negocio?segment='+segment:'/negocio';
  }
  return url.pathname;
 }catch{return null;}
}
export function rememberPrivateRoute(userId:string,path:string):void{
 if(typeof window==='undefined'||!userId)return;
 const safe=safePrivatePath(path);
 if(!safe)return;
 try{window.sessionStorage.setItem(LAST_PRIVATE_PATH_KEY,JSON.stringify({userId,path:safe}));}
 catch{/* Safari privado ou armazenamento indisponível */}
}
export function lastPrivateRoute(userId:string):string|null{
 if(typeof window==='undefined'||!userId)return null;
 try{
  const value:unknown=JSON.parse(window.sessionStorage.getItem(LAST_PRIVATE_PATH_KEY)??'null');
  if(!value||typeof value!=='object')return null;
  const entry=value as {userId?:unknown;path?:unknown};
  return entry.userId===userId&&typeof entry.path==='string'?safePrivatePath(entry.path):null;
 }catch{return null;}
}
export function returnToPanel(userId:string):string{
 if(typeof window==='undefined')return '/garagem';
 const previous=lastPrivateRoute(userId);
 if(previous)return previous;
 try{
  const raw=window.sessionStorage.getItem('smartveiculos:selected-business');
  if(raw){
   const selected:unknown=JSON.parse(raw);
   if(selected&&typeof selected==='object'){
    const segment=(selected as {segment?:unknown}).segment;
    if(typeof segment==='string'&&BUSINESS.has(segment))return '/negocio?segment='+segment;
   }
  }
 }catch{/* no persisted business selection */}
 return '/garagem';
}
export function clearReturnNavigation():void{
 if(typeof window==='undefined')return;
 try{
  window.sessionStorage.removeItem(LAST_PRIVATE_PATH_KEY);
  window.sessionStorage.removeItem('smartveiculos:selected-business');
 }catch{/* no persistent storage */}
}
