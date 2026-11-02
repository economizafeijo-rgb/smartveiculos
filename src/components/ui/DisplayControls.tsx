import {useEffect,useState} from 'react';
import {Maximize2,Minimize2,Moon,Sun} from 'lucide-react';

const KEY='smartveiculos:display-theme';
type Theme='dark'|'light';

/** Controle global, disponível na homepage e nas áreas autenticadas.
 * Aplica tema na raiz do documento (inclusive diálogos renderizados em portal).
 * O navegador é o responsável por autorizar ou recusar o modo tela cheia.
 */
export function DisplayControls(){
 const [theme,setTheme]=useState<Theme>('light');
 const [ready,setReady]=useState(false);
 const [full,setFull]=useState(false);
 const [supported,setSupported]=useState(true);
 const [error,setError]=useState('');

 useEffect(()=>{
  let stored:Theme|null=null;
  try{const value=window.localStorage.getItem(KEY);if(value==='dark'||value==='light')stored=value;}catch{/* modo privado */}
  const initial:Theme=stored??(window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light');
  document.documentElement.classList.toggle('dark',initial==='dark');
  document.documentElement.setAttribute('data-sv-theme',initial);
  setTheme(initial);
  setReady(true);
  const update=()=>setFull(Boolean(document.fullscreenElement));
  update();
  setSupported(typeof document.documentElement.requestFullscreen==='function'&&typeof document.exitFullscreen==='function');
  document.addEventListener('fullscreenchange',update);
  const sync=(event:StorageEvent)=>{
   if(event.key!==KEY)return;
   const next=event.newValue;
   if(next!=='light'&&next!=='dark')return;
   setTheme(next);document.documentElement.classList.toggle('dark',next==='dark');
   document.documentElement.setAttribute('data-sv-theme',next);
  };
  window.addEventListener('storage',sync);
  return()=>{document.removeEventListener('fullscreenchange',update);window.removeEventListener('storage',sync);};
 },[]);

 function toggleTheme(){
  const next:Theme=theme==='light'?'dark':'light';
  setTheme(next);
  document.documentElement.classList.toggle('dark',next==='dark');
  document.documentElement.setAttribute('data-sv-theme',next);
  try{window.localStorage.setItem(KEY,next);}catch{/* escolha permanece na sessão */}
  setError('');
 }

 async function toggleFullscreen(){
  setError('');
  if(!supported){setError('Tela cheia indisponível neste navegador.');return;}
  try{
   if(document.fullscreenElement)await document.exitFullscreen();
   else await document.documentElement.requestFullscreen();
   setFull(Boolean(document.fullscreenElement));
  }catch{
   setError('O navegador não permitiu tela cheia. Tente pelo menu do navegador.');
  }
 }
 return <div className="sv-display-control-dock" role="group" aria-label="Controles de aparência e visualização">
  {error&&<div className="sv-display-control-error" role="status">{error}</div>}
  <div className="sv-display-control-inner">
   <span className="sv-display-control-caption">Visualização</span>
   <button type="button" onClick={toggleTheme} disabled={!ready}
    className="sv-display-control-button" aria-label={theme==='dark'?'Ativar modo claro':'Ativar modo escuro'} aria-pressed={theme==='dark'}
    title={theme==='dark'?'Ativar modo claro':'Ativar modo escuro'}>
    {theme==='dark'?<Sun size={17} aria-hidden="true"/>:<Moon size={17} aria-hidden="true"/>}
    <span>{theme==='dark'?'Modo claro':'Modo escuro'}</span>
   </button>
   <span className="sv-display-control-divider" aria-hidden="true"/>
   <button type="button" onClick={()=>void toggleFullscreen()} disabled={!ready}
    className="sv-display-control-button" aria-label={full?'Sair da tela cheia':'Ativar tela cheia'} aria-pressed={full}
    title={full?'Sair da tela cheia (Esc)':'Expandir para tela cheia'}>
    {full?<Minimize2 size={17} aria-hidden="true"/>:<Maximize2 size={17} aria-hidden="true"/>}
    <span>{full?'Sair da tela cheia':'Tela cheia'}</span>
   </button>
  </div>
 </div>;
}
