import {createFileRoute} from '@tanstack/react-router';
import {useEffect,useState,type FormEvent} from 'react';
import {ArrowLeft,ArrowRight,Bike,Building2,CarFront,CheckCircle2,Eye,EyeOff,LockKeyhole,ShieldCheck,Store,Wrench} from 'lucide-react';
import {supabase} from '@/lib/supabase/client';
import {BUSINESS_SEGMENTS,cleanCnpj,formatCnpj,isBusinessSegment,validateCnpj,type BusinessSegment} from '@/lib/business/cnpj';

export const Route=createFileRoute('/acesso')({
 validateSearch:(q:Record<string,unknown>)=>({
  segment:typeof q['segment']==='string'&&isBusinessSegment(q['segment'])?q['segment'] as BusinessSegment:undefined,
  mode:q['mode']==='register'?'register' as const:'login' as const,
  next:typeof q['next']==='string'&&['/garagem','/cb650r','/gol-g6','/admin'].includes(q['next'])?q['next']:undefined
 }),
 head:()=>({meta:[{title:'Entrar ou criar conta | SmartVeículos'}]}),
 component:Access,
});
const input='w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100';
const field=(caption:string,child:React.ReactNode)=><label className="grid gap-1.5 text-xs font-bold text-slate-700">{caption}{child}</label>;
function Access(){
 const search=Route.useSearch();
 const segment=search.segment;
 const [mode,setMode]=useState<'login'|'register'>(search.mode);
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [showPassword,setShowPassword]=useState(false);
 const [company,setCompany]=useState('');
 const [cnpj,setCnpj]=useState('');
 const [working,setWorking]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [account,setAccount]=useState<string|null>(null);
 const chosen=BUSINESS_SEGMENTS.find(x=>x.id===segment);
 const target=segment?'/negocio?segment='+segment:(search.next??'/garagem');
 useEffect(()=>{
  if(!supabase)return;
  let active=true;
  void supabase.auth.getUser().then(({data})=>{if(active)setAccount(data.user?.email??null);});
  return()=>{active=false;};
 },[]);
 async function registerCompany(){
  if(!supabase||!segment)return;
  const key=cleanCnpj(cnpj);
  if(!validateCnpj(key))throw new Error('Os dígitos verificadores do CNPJ não conferem.');
  const {error}=await supabase.from('business_accounts').insert({trade_name:company.trim(),cnpj:key,segment});
  if(error)throw new Error(error.code==='23505'?'Este CNPJ já foi registrado para esse segmento. Contate o suporte para verificar a titularidade.':error.message);
 }
 async function submit(e:FormEvent){
  e.preventDefault();if(!supabase)return;
  setWorking(true);setError('');setMessage('');
  try{
   if(mode==='register'){
    if(password.length<10)throw new Error('Use uma senha forte com pelo menos 10 caracteres.');
    if(segment&&(!validateCnpj(cnpj)||company.trim().length<3))throw new Error('Informe o nome da empresa e um CNPJ com dígitos verificadores corretos.');
    const {data,error}=await supabase.auth.signUp({email:email.trim().toLowerCase(),password});
    if(error)throw error;
    if(data.session){
     if(segment)await registerCompany();
     window.location.assign(target);return;
    }
    setMessage('Conta solicitada. Confira o e-mail de confirmação do Supabase; após confirmar, entre novamente e conclua o cadastro da empresa. O CNPJ ainda não foi aprovado.');
    setMode('login');
   }else{
    const {data,error}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
    if(error)throw error;
    if(!data.user)throw new Error('Não foi possível confirmar sua sessão.');
    // O cadastro empresarial também pode ser finalizado na área /negocio.
    window.location.assign(target);
   }
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir. Tente novamente.');}
  finally{setWorking(false);}
 }
 async function resetPassword(){
  if(!supabase)return;setError('');setMessage('');
  if(!email.trim())return setError('Informe seu e-mail para recuperar a senha.');
  const {error}=await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
  if(error)setError(error.message);else setMessage('Se a conta estiver cadastrada, você receberá instruções de recuperação por e-mail.');
 }
 return <div className="min-h-screen bg-[#f4f6fa] text-slate-900">
  <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><a href="/" className="flex items-center gap-2 font-black"><span className="grid size-10 place-items-center rounded-xl bg-slate-900 text-orange-400"><Store size={20}/></span>Smart<span className="text-orange-600">Veículos</span></a><a className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900" href="/"><ArrowLeft size={16}/> Início</a></div></header>
  <main className="mx-auto grid min-h-[calc(100vh-76px)] max-w-6xl items-center gap-8 px-5 py-12 lg:grid-cols-2">
   <aside className="hidden rounded-3xl bg-[#111b2d] p-10 text-white shadow-xl lg:block"><div className="grid size-14 place-items-center rounded-2xl bg-orange-500 text-slate-950">{segment==='parts_bikes'?<Bike size={30}/>:segment==='parts_cars'?<CarFront size={30}/>:segment==='workshop'?<Wrench size={30}/>:<LockKeyhole size={30}/>}</div><p className="mt-9 text-xs font-extrabold uppercase tracking-[0.2em] text-orange-300">Área de acesso</p><h1 className="mt-3 text-4xl font-black leading-tight">{chosen?.label??'Sua garagem. Sua história. Seu controle.'}</h1><p className="mt-5 text-base leading-8 text-slate-300">{chosen?.description??'Organize revisões, manutenção, consumo, custos e os detalhes dos seus carros e motos.'}</p><div className="mt-12 space-y-5">{[
 ['Acesso com e-mail e senha','Sua identidade é protegida pelo Supabase Auth.'],
 [segment?'Cadastro empresarial por CNPJ':'Espaço privado por proprietário',segment?'Validação oficial do dígito verificador, inclusive no formato alfanumérico.':'Somente você acessa suas fichas autenticadas.'],
 ['Permissões por perfil','Dados de empresas e clientes separados no banco de dados.']
 ].map(([a,b])=><div key={a} className="flex gap-3"><ShieldCheck className="shrink-0 text-orange-400" size={21}/><div><p className="font-extrabold">{a}</p><p className="mt-1 text-sm text-slate-400">{b}</p></div></div>)}</div></aside>
   <section className="mx-auto w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-9">
    <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1"><button type="button" onClick={()=>{setMode('login');setError('');setMessage('');}} className={'w-1/2 rounded-lg py-3 text-sm font-extrabold '+(mode==='login'?'bg-white text-slate-950 shadow-sm':'text-slate-500')}>Entrar</button><button type="button" onClick={()=>{setMode('register');setError('');setMessage('');}} className={'w-1/2 rounded-lg py-3 text-sm font-extrabold '+(mode==='register'?'bg-white text-slate-950 shadow-sm':'text-slate-500')}>Criar conta</button></div>
    <p className="text-xs font-extrabold uppercase tracking-wider text-orange-600">{segment?'Acesso empresarial':'Área do cliente'}</p><h2 className="mt-2 text-2xl font-black">{mode==='login'?'Bem-vindo de volta':'Comece com sua conta'}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{segment?'O CNPJ identifica a empresa no cadastro. O acesso usa o e-mail e a senha do responsável.':'Uma conta para administrar seus carros e motos.'}</p>
    {account&&<div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"><span className="flex items-center gap-2"><CheckCircle2 size={17}/> Sessão: {account}</span><a href={target} className="font-bold underline">Continuar</a></div>}
    {error&&<div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {message&&<div role="status" className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{message}</div>}
    <form onSubmit={submit} className="mt-6 space-y-4">
     {mode==='register'&&segment&&<><div>{field('Nome fantasia da empresa',<input className={input} required minLength={3} maxLength={120} placeholder="Ex.: Autopeças Central" value={company} onChange={e=>setCompany(e.target.value)}/>)}</div><div>{field('CNPJ numérico ou alfanumérico',<input className={input} required maxLength={20} autoComplete="off" placeholder="00.000.000/0000-00" value={cnpj} onChange={e=>setCnpj(e.target.value.toUpperCase())}/>)}</div>{cnpj&&<div className={'text-xs font-semibold '+(validateCnpj(cnpj)?'text-emerald-700':'text-orange-700')}>{validateCnpj(cnpj)?'Dígitos verificadores válidos. A situação cadastral ainda precisará ser verificada.':'Confira o CNPJ e os dois dígitos verificadores.'}</div>}</>}
     {field('E-mail',<input className={input} required type="email" autoComplete="email" placeholder="voce@empresa.com.br" value={email} onChange={e=>setEmail(e.target.value)}/>)}
     {field('Senha',<div className="relative"><input className={input+' pr-12'} required minLength={mode==='register'?10:1} type={showPassword?'text':'password'} autoComplete={mode==='register'?'new-password':'current-password'} placeholder={mode==='register'?'Pelo menos 10 caracteres':'Sua senha'} value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className="absolute right-3 top-3 text-slate-500" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Ocultar senha':'Mostrar senha'}>{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></div>)}
     <button disabled={working||Boolean(mode==='register'&&segment&&!validateCnpj(cnpj))} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-black text-slate-950 hover:bg-orange-400 disabled:opacity-50">{working?'Processando...':mode==='login'?'Entrar na minha conta':'Cadastrar conta'}<ArrowRight size={17}/></button>
    </form>
    {mode==='login'&&<button type="button" onClick={()=>void resetPassword()} className="mt-4 text-xs font-semibold text-orange-700 underline">Esqueci minha senha</button>}
    {segment&&<p className="mt-6 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">CNPJ com dígitos válidos não confirma empresa ativa ou representação legal. O cadastro empresarial será analisado antes de habilitar a operação comercial. <a href="https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cadastro-nacional-de-pessoas-juridicas-cnpj" rel="noopener noreferrer" target="_blank" className="font-bold underline">Receita Federal</a>.</p>}
    <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">Escolheu a área errada? <a href="/" className="font-extrabold text-orange-700 underline">Voltar às soluções</a></div>
   </section>
  </main>
 </div>;
}
