import { useEffect, useState } from 'react';
import { Cloud, CloudDownload, CloudUpload, LockKeyhole, LogOut, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { importLocalGarage, importLocalFillups, loadCloudGarage, loadCloudFillups, importBikeMeasurements, loadBikeMeasurements } from '@/lib/supabase/garage-cloud';
import { useBikeMeasurements, mergeBikeMeasurements } from '@/lib/garage/cb650r-state';
import { CB650R_NAME } from '@/lib/garage/cb650r-reference';
import { garage, useGarage } from '@/lib/garage/store';
import { mergeCloudFillups, useFillups } from '@/lib/garage/fuel';

const inputClass='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const actionClass='inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40';
type Task = 'backup'|'restore'|'signIn'|'signOut'|null;

/** Sincronização deliberada: nunca mescla ou apaga dados automaticamente na abertura da página. */
export function CloudSyncPanel({bikeProfile=false}:{bikeProfile?:boolean}) {
  const bikeState=useBikeMeasurements();
  const data=useGarage();
  const fillups=useFillups();
  const [account,setAccount]=useState<string|null>(null);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState<Task>(null);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [checked,setChecked]=useState(false);
  useEffect(()=>{
    if (!supabase) {setChecked(true);return;}
    let active=true;
    const refresh=async()=>{
      const {data:response}=await supabase!.auth.getUser();
      if(active){setAccount(response.user?.email??null);setChecked(true);}
    };
    void refresh();
    const {data:listener}=supabase.auth.onAuthStateChange(()=>{
      void refresh();
    });
    return ()=>{active=false;listener.subscription.unsubscribe();};
  },[]);

  async function signIn(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!supabase)return;
    setBusy('signIn');setError('');setMessage('');
    try {
      const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
      if(error)throw error;
      setPassword('');
      setMessage('Login realizado. Use as ações abaixo para enviar ou restaurar os dados.');
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível entrar.');}
    finally{setBusy(null);}
  }
  async function signOut(){
    if(!supabase)return;
    setBusy('signOut');setError('');setMessage('');
    try {const {error}=await supabase.auth.signOut();if(error)throw error;}
    catch(e){setError(e instanceof Error?e.message:'Não foi possível sair.');}
    finally{setBusy(null);}
  }
  async function backup(){
    setBusy('backup');setError('');setMessage('');
    try {
      // A ordem é necessária para respeitar as chaves estrangeiras.
      const done=await importLocalGarage(data);
      const count=await importLocalFillups(fillups);
      const ownBike=data.vehicles.find(v=>v.kind==='moto'&&v.name===CB650R_NAME);
      if(bikeProfile&&ownBike)await importBikeMeasurements(ownBike.id,bikeState);
      setMessage('Backup concluído: '+done.vehicles+' veículos, '+done.records+' manutenções e '+count+' abastecimentos processados.'+(bikeProfile&&ownBike?' Inspeções da CB650R incluídas.':'')+' Registros remotos existentes foram preservados.');
    }catch(e){setError(e instanceof Error?e.message:'O backup falhou. Seus dados locais foram preservados.');}
    finally{setBusy(null);}
  }
  async function restore(){
    setBusy('restore');setError('');setMessage('');
    try{
      // Primeiro buscar todos os conjuntos. Só então começar a importar para o dispositivo.
      const remote=await loadCloudGarage();
      const remoteFillups=await loadCloudFillups();
      const remoteBike=bikeProfile?remote.vehicles.find(v=>v.kind==='moto'&&v.name===CB650R_NAME):undefined;
      const remoteMeasurements=remoteBike?await loadBikeMeasurements(remoteBike.id):null;
      const restored=garage.mergeCloud(remote);
      const restoredFillups=mergeCloudFillups(remoteFillups);
      const addedMeasurements=remoteMeasurements?mergeBikeMeasurements(remoteMeasurements):0;
      setMessage('Restauração concluída: '+restored.vehiclesAdded+' veículos, '+restored.recordsAdded+' manutenções, '+restoredFillups+' abastecimentos e '+addedMeasurements+' medições recuperadas. Dados locais existentes não foram substituídos.');
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível restaurar. Os registros já salvos localmente foram preservados.');}
    finally{setBusy(null);}
  }

  return <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><Cloud size={22}/></span><div><h2 className="text-lg font-bold text-slate-900">Backup em nuvem</h2><p className="mt-0.5 text-sm text-slate-500">Sincronização manual e segura com o Supabase</p></div></div>
      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{account?'Conectado':'Dados locais'}</span>
    </div>
    {!supabase?<p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">A nuvem ainda não está configurada nesta instalação. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY às variáveis de ambiente da hospedagem e aplique as migrações no banco.</p>
    :!checked?<p className="mt-5 text-sm text-slate-500">Verificando sua sessão…</p>
    :!account?<form onSubmit={signIn} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <label className="text-xs font-semibold text-slate-700">E-mail<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} className={inputClass+' mt-1'}/></label>
      <label className="text-xs font-semibold text-slate-700">Senha<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} className={inputClass+' mt-1'}/></label>
      <button disabled={Boolean(busy)} className={actionClass+' self-end bg-blue-600 text-white hover:bg-blue-700'}><LockKeyhole size={16}/> Entrar</button>
      <p className="text-xs text-slate-500 sm:col-span-3">A senha é enviada ao Supabase Auth; não fica registrada nesta página.</p>
    </form>:
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-2 text-sm"><ShieldCheck size={17} className="text-emerald-600"/><span className="font-medium">{account}</span></div><button disabled={Boolean(busy)} onClick={()=>void signOut()} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"><LogOut size={15}/> Sair</button></div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button disabled={Boolean(busy)} onClick={()=>void backup()} className={actionClass+' bg-blue-600 text-white hover:bg-blue-700'}><CloudUpload size={17}/>{busy==='backup'?'Enviando…':'Enviar backup'}</button>
        <button disabled={Boolean(busy)} onClick={()=>void restore()} className={actionClass+' border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'}><CloudDownload size={17}/>{busy==='restore'?'Restaurando…':'Restaurar deste backup'}</button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">O backup envia apenas os registros que ainda não existem na nuvem. A restauração acrescenta dados ausentes sem sobrescrever os registros deste navegador. Alterações e exclusões entre dispositivos ainda não são sincronizadas automaticamente.</p>
    </div>}
    {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {message&&<p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
  </section>;
}
