import type {PortalArea} from '@/components/portal/PortalAreaDialog';

/** Link público de apresentação ou área real (nunca uma URL de login obrigatório).
 * A segurança das áreas privadas permanece a cargo de AuthGate/RLS.
 */
export function areaEntryPath(area:PortalArea,authenticated:boolean):string{
 if(!authenticated)return '/demonstracao?area='+encodeURIComponent(area);
 return area==='garage'?'/garagem':'/negocio?segment='+encodeURIComponent(area);
}

export function areaEntryLabel(area:PortalArea,authenticated:boolean):string{
 const name={
  parts_cars:'autopeças para carros',
  parts_bikes:'autopeças para motos',
  workshop:'oficinas e serviços',
  garage:'garagem digital'
 }[area];
 return authenticated?'Abrir minha área de '+name:'Explorar demonstração de '+name+' sem login';
}
