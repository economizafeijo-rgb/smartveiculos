import { CarFront, Gauge, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ModernDashboardHeader({ vehicleCount, totalSpent, onAdd }: { vehicleCount: number; totalSpent: number; onAdd: () => void }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-700/30 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl sm:p-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">SmartVeículos • Minha garagem</p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Seu veículo, sempre em dia.</h2>
          <p className="mt-2 max-w-lg text-sm text-slate-300">Manutenções, quilometragem e custos organizados em um só lugar.</p>
        </div>
        <Button onClick={onAdd} className="bg-sky-400 text-slate-950 hover:bg-sky-300"><Plus className="mr-2 size-4" /> Novo veículo</Button>
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-4"><CarFront className="mb-3 text-sky-300" /><div className="text-2xl font-bold">{vehicleCount}</div><p className="text-xs text-slate-300">Veículos cadastrados</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-4"><Gauge className="mb-3 text-sky-300" /><div className="text-2xl font-bold">{totalSpent.toLocaleString("pt-BR", {style:"currency",currency:"BRL"})}</div><p className="text-xs text-slate-300">Total de manutenções</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-4"><ShieldCheck className="mb-3 text-sky-300" /><div className="text-lg font-bold">Tudo organizado</div><p className="text-xs text-slate-300">Histórico acessível por veículo</p></div>
      </div>
    </section>
  );
}
