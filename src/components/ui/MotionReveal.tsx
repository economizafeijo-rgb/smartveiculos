import {useEffect, useRef, type CSSProperties, type ReactNode} from 'react';

/**
 * Progressive, one-time entrance when a section approaches the viewport.
 * The content remains visible when JavaScript, the observer, or motion is unavailable.
 */
export function MotionReveal({children,delay=0,className=''}:{
 children:ReactNode;delay?:number;className?:string;
}){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const element=ref.current;
  if(!element||typeof window==='undefined'||!('IntersectionObserver' in window))return;
  if(typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  // Do not hide elements already in view or on back/forward page restore.
  if(element.getBoundingClientRect().top<=window.innerHeight*0.92)return;
  element.classList.add('sv-reveal-pending');
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting)){
    element.classList.remove('sv-reveal-pending');
    observer.disconnect();
   }
  },{rootMargin:'0px 0px 72px 0px',threshold:0});
  observer.observe(element);
  return ()=>{observer.disconnect();element.classList.remove('sv-reveal-pending');};
 },[]);
 return <div ref={ref} className={'sv-reveal '+className}
  style={{'--sv-reveal-delay':Math.max(0,Math.min(delay,300))+'ms'} as CSSProperties}>{children}</div>;
}
