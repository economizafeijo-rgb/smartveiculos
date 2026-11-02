/** Canonical public address used for Supabase confirmation/recovery emails.
 * Avoid localhost and ephemeral Lovable preview addresses in emails.
 * The domain MUST be allowlisted under Supabase Auth > URL Configuration.
 */
const DEFAULT_APP_ORIGIN='https://smartveiculos.lovable.app';

export function authRedirectUrl(path:'/confirmar-email'|'/redefinir-senha'):string{
 const supplied=import.meta.env['VITE_APP_URL'] as string|undefined;
 let origin=DEFAULT_APP_ORIGIN;
 if(supplied){
  try{
   const url=new URL(supplied);
   if(url.protocol==='https:'&&url.username===''&&url.password==='')origin=url.origin;
  }catch{/* Misconfigured VITE_APP_URL: use canonical public address. */}
 }
 return new URL(path,origin).toString();
}
export function safeAuthTarget(next:string|null):string{
 const allowed=['/garagem','/gol-g6','/cb650r','/admin','/meus-atendimentos'];
 return next&&allowed.includes(next)?next:'/garagem';
}
