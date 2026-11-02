import {AuthGate} from '@/components/auth/AuthGate';
import { createFileRoute } from '@tanstack/react-router';
import { CB650RDashboard } from '@/components/garage/CB650RDashboard';

export const Route = createFileRoute('/cb650r')({
 head:()=>({meta:[
  {title:'Honda CB650R 2024 — Revisões, pneus e manutenção | SmartVeículos'},
  {name:'description',content:'Painel da Honda CB650R 2024 com manual de revisões Honda, odômetro, corrente, pneus, abastecimentos e despesas.'}
 ]}),
 component:()=> <AuthGate next="/cb650r"><CB650RDashboard/></AuthGate>
});
