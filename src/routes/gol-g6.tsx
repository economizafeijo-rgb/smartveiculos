import { createFileRoute } from '@tanstack/react-router';
import { GolDashboard } from '@/components/garage/GolDashboard';

export const Route = createFileRoute('/gol-g6')({
 head:()=>({meta:[
  {title:'Gol G6 Seleção 1.6 2014 | SmartVeículos'},
  {name:'description',content:'Ficha técnica, histórico de manutenção, consumo gasolina e etanol, odômetro e biblioteca de diagnósticos do Gol G6 Seleção 1.6.'}
 ]}),
 component:GolDashboard,
});
