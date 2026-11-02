import {DeveloperCredit} from '@/components/ui/DeveloperCredit';
import {createFileRoute} from '@tanstack/react-router';
import {useEffect,useState,type FormEvent} from 'react';
import {ArrowLeft,ArrowRight,Bike,Building2,CarFront,CheckCircle2,Eye,EyeOff,LockKeyhole,ShieldCheck,Store,Wrench} from 'lucide-react';
import {supabase} from '@/lib/supabase/client';
import {authRedirectUrl} from '@/lib/supabase/auth-redirects';
import {RegistrationProfilePicker} from '@/components/auth/RegistrationProfilePicker';
import {businessSegmentFromProfile,REGISTRATION_PROFILES,type RegistrationProfile} from '@/lib/business/registration-profiles';
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
 const chosen=BUSINESS_SEGMENTS.find(x=>x.id===segment);
 const selectedProfile=REGISTRATION_PROFILES.find(x=>x.id===profile);
 const needsProfile=mode==='register'&&registrationStep==='profile';
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
    // O CNPJ selecionado identifica qual unidade empresarial abrir, além do login do responsável.
    if(segment)window.sessionStorage.setItem('smartveiculos:selected-business',JSON.stringify({cnpj:cleanCnpj(cnpj),segment,trade_name:company.trim()}));
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
 return <div className="sv-auth-page flex flex-col bg-[#F1F4F8] text-slate-900">
  <header className="z-10 shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2.5"><a href="/" className="flex items-center gap-2 font-black"><span className="grid size-10 place-items-center rounded-xl bg-slate-900 text-orange-400"><Store size={20}/></span>Smart<span className="text-orange-600">Veículos</span></a><a className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900" href="/"><ArrowLeft size={16}/> Início</a></div></header>
  <main className="sv-auth-layout mx-auto grid min-h-0 w-full max-w-6xl flex-1 items-center gap-5 px-4 py-3 sm:px-6 lg:grid-cols-[.92fr_1.08fr] lg:gap-7 lg:py-4">
   <aside className="sv-auth-aside sv-intro-item sv-intro-item--2 relative hidden h-full max-h-[605px] overflow-hidden rounded-3xl p-6 text-white shadow-xl lg:flex lg:flex-col lg:justify-center xl:p-8" style={{backgroundImage:'url(https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1100&fit=crop&q=80)'}}><div className="relative z-10"><div className="grid size-14 place-items-center rounded-2xl bg-orange-500 text-slate-950">{segment==='parts_bikes'?<Bike size={30}/>:segment==='parts_cars'?<CarFront size={30}/>:segment==='workshop'?<Wrench size={30}/>:<LockKeyhole size={30}/>}</div><p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-orange-300">Área de acesso</p><h1 className="mt-2 text-3xl font-black leading-tight xl:text-4xl">{chosen?.label??'Sua garagem. Sua história. Seu controle.'}</h1><p className="mt-3 text-sm leading-6 text-slate-200">{chosen?.description??'Organize revisões, manutenção, consumo, custos e os detalhes dos seus carros e motos.'}</p><div className="mt-6 space-y-3">{[
 ['Acesso com e-mail e senha','Sua identidade é protegida pelo Supabase Auth.'],
 [segment?'Cadastro empresarial por CNPJ':'Espaço privado por proprietário',segment?'Validação oficial do dígito verificador, inclusive no formato alfanumérico.':'Somente você acessa suas fichas autenticadas.'],
 ['Permissões por perfil','Dados de empresas e clientes separados no banco de dados.']
 ].map(([a,b])=><div key={a} className="sv-auth-proof sv-auth-aside-glass flex gap-3 rounded-xl px-3 py-2"><ShieldCheck className="shrink-0 text-orange-400" size={21}/><div><p className="font-extrabold">{a}</p><p className="mt-0.5 text-xs leading-5 text-slate-300">{b}</p></div></div>)}</div></div></aside>
   <section className="sv-auth-card sv-intro-item sv-intro-item--3 mx-auto w-full max-w-[560px] rounded-3xl px-5 py-4 sm:px-7 sm:py-5">
    <div className="mb-3 flex gap-1 rounded-xl bg-slate-100 p-1"><button type="button" onClick={()=>{setMode('login');setError('');setMessage('');}} className={'sv-nav-action w-1/2 rounded-lg py-3 text-sm font-extrabold '+(mode==='login'?'bg-white text-slate-950 shadow-sm':'text-slate-500')}>Entrar</button><button type="button" onClick={()=>{setMode('register');setRegistrationStep(search.segment?'details':'profile');setError('');setMessage('');}} className={'w-1/2 rounded-lg py-3 text-sm font-extrabold '+(mode==='register'?'bg-white text-slate-950 shadow-sm':'text-slate-500')}>Criar conta</button></div>
    <p className="text-xs font-extrabold uppercase tracking-wider text-orange-600">{mode==='register'?'Escolha seu perfil':segment?'Acesso empresarial':'Área do cliente'}</p><h2 className="mt-1 text-2xl font-black">{mode==='login'?'Bem-vindo de volta':needsProfile?'Escolha seu ramo':'Comece com sua conta'}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{needsProfile?'Selecione como pretende usar a plataforma. O próximo passo será personalizado.':segment?'O CNPJ identifica a empresa. O acesso usa o e-mail e a senha do responsável.':'Uma conta para administrar seus carros e motos.'}</p>
    {account&&<div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900"><span className="flex items-center gap-2"><CheckCircle2 size={17}/> Sessão: {account}</span><a href={target} className="font-bold underline">Continuar</a></div>}
    {error&&<div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {message&&<div role="status" className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{message}</div>}
    {needsProfile?<div className="mt-4">
      <RegistrationProfilePicker selected={profile} onSelect={p=>{setProfile(p);setError('');}} onContinue={()=>{if(profile)setRegistrationStep('details');}}/>
     </div>:<>
    {mode==='register'&&profile&&<div className="sv-profile-summary mt-3 flex items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5">
      <span className="min-w-0 text-xs font-semibold text-slate-700"><span className="text-orange-800">Seu ramo:</span> {selectedProfile?.label}</span>
      <button type="button" className="shrink-0 rounded-lg border border-orange-200 bg-white px-2.5 py-1.5 text-[11px] font-extrabold text-orange-800 hover:bg-orange-100" onClick={()=>setRegistrationStep('profile')}>Alterar</button>
    </div>}
    <form key={mode+'-'+(profile??'none')} onSubmit={submit} className="sv-tab-content mt-3 space-y-2.5">
     {mode==='register'&&segment&&<><div>{field('Nome fantasia da empresa',<input className={input} required minLength={3} maxLength={120} placeholder="Ex.: Autopeças Central" value={company} onChange={e=>setCompany(e.target.value)}/>)}</div></>}{segment&&<><div>{field('CNPJ numérico ou alfanumérico',<input className={input} required maxLength={20} autoComplete="off" placeholder="00.000.000/0000-00" value={cnpj} onChange={e=>setCnpj(e.target.value.toUpperCase())}/>)}</div>{cnpj&&<div className={'text-xs font-semibold '+(validateCnpj(cnpj)?'text-emerald-700':'text-orange-700')}>{validateCnpj(cnpj)?'Dígitos verificadores válidos. A situação cadastral ainda precisará ser verificada.':'Confira o CNPJ e os dois dígitos verificadores.'}</div>}</>}
     {field('E-mail',<input className={input} required type="email" autoComplete="email" placeholder="voce@empresa.com.br" value={email} onChange={e=>setEmail(e.target.value)}/>)}
     {field('Senha',<div className="relative"><input className={input+' pr-12'} required minLength={mode==='register'?6:1} type={showPassword?'text':'password'} autoComplete={mode==='register'?'new-password':'current-password'} placeholder={mode==='register'?'Mínimo de 6 caracteres':'Sua senha'} value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className="absolute right-3 top-3 text-slate-500" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Ocultar senha':'Mostrar senha'}>{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></div>)}
     <button disabled={working||Boolean(segment&&!validateCnpj(cnpj))} className="sv-action-primary flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold disabled:opacity-50">{working?'Processando...':mode==='login'?'Entrar na minha conta':'Cadastrar conta'}<ArrowRight size={17}/></button>
    </form>
    {mode==='login'&&<div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3"><button type="button" onClick={()=>void resetPassword()} className="text-xs font-semibold text-orange-700 underline">Esqueci minha senha</button><button type="button" onClick={()=>setShowResend(true)} className="text-xs font-semibold text-slate-700 underline">Não consigo confirmar meu e-mail</button></div>}
    {mode==='login'&&showResend&&<div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm"><p className="font-bold text-orange-950">E-mail não confirmado?</p><p className="mt-1 text-xs leading-6 text-orange-900">Confirme o endereço no campo E-mail acima. O link será enviado com destino ao site SmartVeículos.</p><button type="button" disabled={resending} onClick={()=>void resendConfirmation()} className="mt-3 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-50">{resending?'Enviando...':'Reenviar e-mail de confirmação'}</button></div>}
    {segment&&<p className="mt-6 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">CNPJ com dígitos válidos não confirma empresa ativa ou representação legal. O cadastro empresarial será analisado antes de habilitar a operação comercial. <a href="https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cadastro-nacional-de-pessoas-juridicas-cnpj" rel="noopener noreferrer" target="_blank" className="font-bold underline">Receita Federal</a>.</p>}
    </>}
    <div className="mt-3 border-t border-slate-100 pt-2 text-center text-xs text-slate-500">Escolheu a área errada? <a href="/" className="font-extrabold text-orange-700 underline">Voltar às soluções</a></div>
   </section>
  </main>
  <footer className="shrink-0 px-5 pb-1 text-center"><DeveloperCredit compact /></footer>
 </div>;
}
