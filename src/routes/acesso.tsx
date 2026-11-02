import {DeveloperCredit} from '@/components/ui/DeveloperCredit';
import {createFileRoute} from '@tanstack/react-router';
import {useEffect,useState,type FormEvent} from 'react';
import {ArrowLeft,ArrowRight,Bike,Building2,CarFront,CheckCircle2,Eye,EyeOff,LockKeyhole,ShieldCheck,Store,Wrench} from 'lucide-react';
import {supabase} from '@/lib/supabase/client';
import {authRedirectUrl} from '@/lib/supabase/auth-redirects';
import {RegistrationProfilePicker} from '@/components/auth/RegistrationProfilePicker';
import {businessSegmentFromProfile,REGISTRATION_PROFILES,type RegistrationProfile} from '@/lib/business/registration-profiles';
import {BUSINESS_SEGMENTS,cleanCnpj,formatCnpj,isBusinessSegment,validateCnpj,type BusinessSegment} from '@/lib/business/cnpj';
import {businessAccessResult,type OwnedBusiness} from '@/lib/business/account-access';

export const Route=createFileRoute('/acesso')({
 validateSearch:(q:Record<string,unknown>)=>({
  segment:typeof q['segment']==='string'&&isBusinessSegment(q['segment'])?q['segment'] as BusinessSegment:undefined,
  mode:q['mode']==='register'?'register' as const:'login' as const,
  next:typeof q['next']==='string'&&['/garagem','/cb650r','/gol-g6','/admin','/meus-atendimentos'].includes(q['next'])?q['next']:undefined
 }),
 head:()=>({meta:[{title:'Entrar ou criar conta | SmartVeículos'}]}),
 component:Access,
});
const input='w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100';
const field=(caption:string,child:React.ReactNode)=><label className="grid gap-1.5 text-xs font-bold text-slate-700">{caption}{child}</label>;
function Access(){
 const search=Route.useSearch();
 const [mode,setMode]=useState<'login'|'register'>(search.mode);
 const [profile,setProfile]=useState<RegistrationProfile|null>(search.segment??null);
 const [registrationStep,setRegistrationStep]=useState<'profile'|'details'>(search.segment?'details':'profile');
 const segment=mode==='register'?businessSegmentFromProfile(profile):(businessSegmentFromProfile(profile)??search.segment);
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [showPassword,setShowPassword]=useState(false);
 const [company,setCompany]=useState('');
 const [cnpj,setCnpj]=useState('');
 const [working,setWorking]=useState(false);
 const [resending,setResending]=useState(false);
 const [showResend,setShowResend]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [account,setAccount]=useState<string|null>(null);
 const [accountId,setAccountId]=useState<string|null>(null);
 const chosen=BUSINESS_SEGMENTS.find(x=>x.id===segment);
 const selectedProfile=REGISTRATION_PROFILES.find(x=>x.id===profile);
 const needsProfile=mode==='register'&&registrationStep==='profile';
 const authVariant=mode==='login'?'sv-auth-card--login':needsProfile?'sv-auth-card--profiles':'sv-auth-card--details';
 const target=segment?'/negocio?segment='+segment:(search.next??'/garagem');
 useEffect(()=>{
  if(!supabase)return;
  let active=true;
  void supabase.auth.getUser().then(({data})=>{if(active){setAccount(data.user?.email??null);setAccountId(data.user?.id??null);}});
  return()=>{active=false;};
 },[]);
 /** O CNPJ não é credencial do Supabase: confirma empresa pertencente à conta validada.
  * Sem empresas nesse segmento, a conta abre o cadastro empresarial pendente.
  */
 async function verifyCompany(userId:string,companySegment:BusinessSegment,typedCnpj:string){
  if(!supabase)throw new Error('Autenticação indisponível.');
  const {data,error}=await supabase.from('business_accounts')
   .select('cnpj,segment').eq('owner_id',userId).eq('segment',companySegment);
  if(error)throw new Error('Não foi possível verificar o vínculo do CNPJ com esta conta. Tente novamente.');
  const state=businessAccessResult((data??[]) as OwnedBusiness[],typedCnpj,companySegment);
  if(state==='wrong-company')throw new Error('Este CNPJ não está vinculado à sua conta neste ramo. Confira o número ou entre com o e-mail do responsável.');
  return state;
 }
 async function continueSession(){
  if(!supabase||!accountId)return;
  setWorking(true);setError('');setMessage('');
  try{
   if(segment){
    const {data,error}=await supabase.from('business_accounts')
     .select('cnpj,segment').eq('owner_id',accountId).eq('segment',segment);
    if(error)throw error;
    const companies=(data??[]) as OwnedBusiness[];
    if(companies.length>1&&!validateCnpj(cnpj)){
     setError('Você tem mais de uma empresa neste ramo. Informe o CNPJ da unidade que deseja acessar.');return;
    }
    const chosenCnpj=validateCnpj(cnpj)?cleanCnpj(cnpj):companies[0]?.cnpj??'';
    if(chosenCnpj){
     const status=businessAccessResult(companies,chosenCnpj,segment);
     if(status==='wrong-company')throw new Error('Este CNPJ não pertence a esta conta.');
     window.sessionStorage.setItem('smartveiculos:selected-business',JSON.stringify({cnpj:cleanCnpj(chosenCnpj),segment}));
    }
   }
   window.location.assign(target);
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível acessar a empresa.');}
  finally{setWorking(false);}
 }
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
    if(!profile||registrationStep!=='details')throw new Error('Escolha seu ramo de atuação antes de cadastrar.');
    if(password.length<6)throw new Error('A senha deve ter pelo menos 6 caracteres. Recomendamos combinar letras, números e símbolos.');
    if(segment&&(!validateCnpj(cnpj)||company.trim().length<3))throw new Error('Informe o nome da empresa e um CNPJ com dígitos verificadores corretos.');
    if(account?.trim().toLowerCase()===email.trim().toLowerCase()){
     setMode('login');setMessage('Sua conta já está conectada. Use Continuar ou entre com outra conta.');return;
    }
    const {data,error}=await supabase.auth.signUp({email:email.trim().toLowerCase(),password,options:{
     emailRedirectTo:authRedirectUrl('/confirmar-email'),
     data:{intended_profile:profile}
    }});
    if(error){if(/already registered|user already exists|email exists/i.test(error.message)){setMode('login');setMessage('Se já possui cadastro, entre ou utilize a recuperação de senha.');return;}throw error;}
    if(data.user&&Array.isArray(data.user.identities)&&data.user.identities.length===0){setMode('login');setMessage('Se já possui cadastro, utilize Entrar ou Esqueci minha senha. Se for um novo cadastro, confira a confirmação no e-mail.');return;}
    if(segment)window.sessionStorage.setItem('smartveiculos:selected-business',JSON.stringify({
     cnpj:cleanCnpj(cnpj),segment,trade_name:company.trim()
    }));
    if(data.session){
     if(segment)await registerCompany();
     window.location.assign(target);return;
    }
    setMessage('Cadastro solicitado. Verifique sua caixa de entrada e clique em Confirmar e-mail. O link agora direciona para o SmartVeículos. Depois, entre com seu e-mail e senha.');
    setShowResend(true);
    setMode('login');
   }else{
    if(segment&&!validateCnpj(cnpj))throw new Error('Informe o CNPJ da empresa com dígitos verificadores válidos.');
    const {data,error}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
    if(error){if(/email not confirmed/i.test(error.message))setShowResend(true);throw error;}
    if(!data.user)throw new Error('Não foi possível confirmar sua sessão.');
    // A identidade é autenticada pelo Supabase e a unidade deve pertencer a ela.
    if(segment){
     const status=await verifyCompany(data.user.id,segment,cnpj);
     if(status==='setup')setMessage('Conta confirmada. Complete o cadastro da sua empresa para liberar os recursos comerciais.');
     window.sessionStorage.setItem('smartveiculos:selected-business',JSON.stringify({cnpj:cleanCnpj(cnpj),segment,trade_name:company.trim()}));
    }
    const metadataProfile=data.user.user_metadata?.['intended_profile'];
    const fallbackSegment=typeof metadataProfile==='string'&&isBusinessSegment(metadataProfile)?metadataProfile:undefined;
    window.location.assign(segment?target:search.next??(fallbackSegment?'/negocio?segment='+fallbackSegment:'/garagem'));
   }
  }catch(e){
   const reason=e instanceof Error?e.message:'Não foi possível concluir. Tente novamente.';
   if(/email not confirmed/i.test(reason))setError('Seu e-mail ainda não foi confirmado. Clique no link enviado pela plataforma ou solicite um novo abaixo.');
   else if(/invalid login credentials/i.test(reason))setError('E-mail ou senha incorretos. Confira os dados ou use Esqueci minha senha.');
   else if(/password.*(at least|characters|weak|minimum)|weak_password/i.test(reason))setError('A senha não atende às regras de segurança do servidor. Use ao menos 6 caracteres e, se solicitado, inclua letras, números e símbolos.');
   else if(/rate limit/i.test(reason))setError('Limite temporário de envios atingido. Aguarde antes de tentar novamente.');
   else setError(reason);
  }
  finally{setWorking(false);}
 }
 async function resetPassword(){
  if(!supabase)return;setError('');setMessage('');
  if(!email.trim())return setError('Informe seu e-mail para recuperar a senha.');
  const {error}=await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:authRedirectUrl('/redefinir-senha')});
  if(error)setError(error.message);else setMessage('Se a conta estiver cadastrada, você receberá instruções de recuperação por e-mail.');
 }
 async function resendConfirmation(){
  if(!supabase)return;
  if(!email.trim()){setError('Informe seu e-mail para reenviar a confirmação.');return;}
  setResending(true);setError('');setMessage('');
  try{
   const {error}=await supabase.auth.resend({type:'signup',email:email.trim().toLowerCase(),options:{emailRedirectTo:authRedirectUrl('/confirmar-email')}});
   if(error)throw error;
   setMessage('Se a conta ainda aguardar confirmação, um novo link será enviado para o e-mail informado.');
  }catch(e){
   const reason=e instanceof Error?e.message:'Erro ao solicitar novo link.';
   setError(/rate limit/i.test(reason)?'Limite de envio atingido. Aguarde antes de tentar novamente.':reason);
  }finally{setResending(false);}
 }
 return <div className="sv-auth-page sv-auth-cinematic flex flex-col text-slate-900">
  <header className="sv-auth-topbar relative z-10 shrink-0 border-b border-white/15"><div className="mx-auto flex h-[58px] max-w-[1460px] items-center justify-between px-4 sm:px-8"><a href="/" className="flex items-center gap-2.5 text-base font-black text-white sm:text-lg"><span className="grid size-10 place-items-center rounded-xl border border-orange-500/40 bg-[#142138]/90 text-orange-400 shadow-[0_5px_18px_-12px_rgba(249,115,22,.9)]"><Store size={21}/></span><span>Smart <span className="text-orange-400">Veículos</span></span></a><a className="sv-auth-home-link flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-slate-100 hover:text-orange-300" href="/"><ArrowLeft size={16}/> Início</a></div></header>
  <main className="sv-auth-layout relative z-10 mx-auto flex min-h-0 w-full max-w-[1120px] flex-1 items-center justify-center gap-8 px-3 py-3 sm:px-6 sm:py-4 lg:gap-10">
   <aside className="sv-auth-showcase hidden min-w-0 flex-1 text-white lg:block" aria-label="SmartVeículos: soluções automotivas">
    <span className="sv-auth-showcase-label">ECOSSISTEMA AUTOMOTIVO</span>
    <h1>Gestão inteligente. <span>Do seu jeito.</span></h1>
    <p>Autopeças, oficinas e a garagem de cada motorista conectadas em um único lugar.</p>
    <div className="sv-auth-showcase-features">
     <span><CarFront size={15} aria-hidden="true"/> Autopeças</span>
     <span><Wrench size={15} aria-hidden="true"/> Oficinas</span>
     <span><Bike size={15} aria-hidden="true"/> Seus veículos</span>
    </div>
   </aside>
   <section className={"sv-auth-card "+authVariant+" sv-intro-item sv-intro-item--3 mx-auto w-full rounded-[24px] px-4 py-4 sm:px-6 sm:py-5"} aria-label="Acesso SmartVeículos">
    <div className="sv-auth-tabs mb-3 flex gap-1 rounded-2xl bg-slate-200/80 p-1"><button type="button" onClick={()=>{setMode('login');setError('');setMessage('');}} className={'sv-auth-tab sv-nav-action w-1/2 rounded-xl px-3 py-2.5 text-sm font-extrabold '+(mode==='login'?'sv-auth-tab-selected bg-white text-slate-950 shadow-sm':'text-slate-600 hover:text-slate-900')}>Entrar</button><button type="button" onClick={()=>{setMode('register');setRegistrationStep(search.segment?'details':'profile');setError('');setMessage('');}} className={'sv-auth-tab w-1/2 rounded-xl px-3 py-2.5 text-sm font-extrabold '+(mode==='register'?'sv-auth-tab-selected bg-white text-slate-950 shadow-sm':'text-slate-600 hover:text-slate-900')}>Criar conta</button></div>
    <p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-700">{mode==='register'?needsProfile?'CADASTRO · PASSO 1 DE 2':'CADASTRO · PASSO 2 DE 2':segment?'Acesso empresarial':'Acesso pessoal'}</p><h2 className="mt-1 text-[clamp(1.5rem,3vw,2rem)] font-black leading-tight tracking-tight text-[#14213B]">{mode==='login'?segment?'Acesse sua empresa':'Acesse sua garagem':needsProfile?'Crie sua conta':'Finalize seu cadastro'}</h2><p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">{needsProfile?'Escolha como deseja utilizar a plataforma.':segment?'CNPJ da empresa + e-mail e senha do responsável.':'Seu espaço para acompanhar carros, motos e manutenções.'}</p>
    {account&&mode==='login'&&<div className="sv-auth-session mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/90 px-3.5 py-2 text-xs text-emerald-900"><span className="flex items-center gap-2"><CheckCircle2 size={17}/> Sessão: {account}</span><button type="button" disabled={working} onClick={()=>void continueSession()} className="rounded-md px-1.5 py-1 font-bold underline underline-offset-2 hover:bg-emerald-100 disabled:opacity-50">Continuar</button></div>}
    {error&&<div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {message&&<div role="status" className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{message}</div>}
    {needsProfile?<div className="mt-3">
      <RegistrationProfilePicker selected={profile} onSelect={p=>{setProfile(p);setError('');}} onContinue={()=>{if(profile)setRegistrationStep('details');}}/>
     </div>:<>
    {mode==='register'&&profile&&<div className="sv-profile-summary mt-3 flex items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5">
      <span className="min-w-0 text-xs font-semibold text-slate-700"><span className="text-orange-800">Seu ramo:</span> {selectedProfile?.label}</span>
      <button type="button" className="shrink-0 rounded-lg border border-orange-200 bg-white px-2.5 py-1.5 text-[11px] font-extrabold text-orange-800 hover:bg-orange-100" onClick={()=>setRegistrationStep('profile')}>Alterar</button>
    </div>}
    <form key={mode+'-'+(profile??'none')} onSubmit={submit} className="sv-tab-content mt-3 space-y-2.5">
     {mode==='register'&&segment&&<><div>{field('Nome fantasia da empresa',<input className={input} required minLength={3} maxLength={120} placeholder="Ex.: Autopeças Central" value={company} onChange={e=>setCompany(e.target.value)}/>)}</div></>}{segment&&<><div>{field('CNPJ da empresa (numérico ou alfanumérico)',<input className={input} required maxLength={20} autoComplete="off" placeholder="00.000.000/0000-00" value={cnpj} onChange={e=>setCnpj(e.target.value.toUpperCase())}/>)}</div>{cnpj&&<div className={'text-xs font-semibold '+(validateCnpj(cnpj)?'text-emerald-700':'text-orange-700')}>{validateCnpj(cnpj)?'Dígitos verificadores válidos. A situação cadastral ainda precisará ser verificada.':'Confira o CNPJ e os dois dígitos verificadores.'}</div>}</>}
     {field('E-mail',<input className={input} required type="email" autoComplete="email" placeholder="voce@empresa.com.br" value={email} onChange={e=>setEmail(e.target.value)}/>)}
     {field('Senha',<div className="relative"><input className={input+' pr-12'} required minLength={mode==='register'?6:1} type={showPassword?'text':'password'} autoComplete={mode==='register'?'new-password':'current-password'} placeholder={mode==='register'?'Mínimo de 6 caracteres':'Sua senha'} value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className="absolute right-3 top-3 text-slate-500" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Ocultar senha':'Mostrar senha'}>{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></div>)}
     <button disabled={working} className="sv-auth-primary flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold disabled:opacity-50">{working?'Processando...':mode==='login'?'Entrar na minha conta':'Cadastrar conta'}<ArrowRight size={17}/></button>
    </form>
    {mode==='login'&&<div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3"><button type="button" onClick={()=>void resetPassword()} className="text-xs font-semibold text-orange-700 underline">Esqueci minha senha</button><button type="button" onClick={()=>setShowResend(true)} className="text-xs font-semibold text-slate-700 underline">Não consigo confirmar meu e-mail</button></div>}
    {mode==='login'&&showResend&&<div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm"><p className="font-bold text-orange-950">E-mail não confirmado?</p><p className="mt-1 text-xs leading-6 text-orange-900">Confirme o endereço no campo E-mail acima. O link será enviado com destino ao site SmartVeículos.</p><button type="button" disabled={resending} onClick={()=>void resendConfirmation()} className="mt-3 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-50">{resending?'Enviando...':'Reenviar e-mail de confirmação'}</button></div>}
    {segment&&<details className="sv-auth-cnpj-note mt-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-600">
     <summary className="cursor-pointer font-bold text-slate-600">Como verificamos o CNPJ?</summary>
     <p className="mt-2 leading-5">Dígitos verificadores válidos não comprovam que a empresa está ativa nem que o titular da conta a representa. O cadastro passa por análise antes de liberar a operação comercial. <a href="https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cadastro-nacional-de-pessoas-juridicas-cnpj" rel="noopener noreferrer" target="_blank" className="font-bold underline">Receita Federal</a>.</p>
    </details>}
    </>}
    <div className="mt-3 border-t border-slate-100 pt-2 text-center text-xs text-slate-500">Escolheu a área errada? <a href="/" className="font-extrabold text-orange-700 underline">Voltar às soluções</a></div>
   </section>
  </main>
  <footer className="sv-auth-footer relative z-10 shrink-0 px-4 pb-2 text-center"><DeveloperCredit compact tone="dark" /></footer>
 </div>;
}
