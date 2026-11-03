import {QrCode,ExternalLink} from 'lucide-react';
import type {DemoArea} from '@/lib/demo/demo-data';

export const DEMO_PUBLIC_ORIGIN='https://smartveiculos.lovable.app';
export function demoQrUrl(area?:DemoArea):string{
 return DEMO_PUBLIC_ORIGIN+(area?'/demonstracao?area='+encodeURIComponent(area):'/');
}
/** QR codifica APENAS endereços públicos. Nunca números de pedidos ou dados de clientes. */
export function demoQrImage(url:string):string{
 if(!url.startsWith(DEMO_PUBLIC_ORIGIN))throw Error('Somente URLs públicas do SmartVeículos');
 return 'https://api.qrserver.com/v1/create-qr-code/?size=208x208&margin=12&format=png&data='+encodeURIComponent(url);
}
export function DemoQRCode({area,label,compact=false}:{area?:DemoArea;label:string;compact?:boolean}){
 const url=demoQrUrl(area);
 return <div className={'sv-demo-qr flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm '+(compact?'':'sm:flex-col sm:items-stretch sm:p-4')}>
  <div className={'grid shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-white p-2 '+(compact?'size-24':'size-28 sm:mx-auto sm:size-36')}>
   <img src={demoQrImage(url)} width="208" height="208" loading="lazy" referrerPolicy="no-referrer"
    alt={'QR Code para abrir '+label+' no SmartVeículos'} className="h-full w-full object-contain"
    onError={event=>{event.currentTarget.style.visibility='hidden'}}/>
  </div>
  <div className="min-w-0 flex-1 space-y-1">
   <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-700"><QrCode size={14}/> QR Code próprio</span>
   <p className="text-xs font-black leading-5 text-slate-900">{label}</p>
   <a href={url} className="inline-flex max-w-full items-center gap-1 break-all text-[11px] font-bold text-orange-700 underline underline-offset-2 hover:text-orange-900">
    Abrir acesso <ExternalLink size={12} className="shrink-0"/>
   </a>
  </div>
 </div>;
}
