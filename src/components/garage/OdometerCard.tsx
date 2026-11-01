import { Check, Gauge, Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL, formatKm } from "@/lib/garage/logic";
import { garage } from "@/lib/garage/store";
import { VEHICLE_LABELS, type Vehicle } from "@/lib/garage/types";

import { ConfirmDelete } from "./ConfirmDelete";
import { VEHICLE_ICONS } from "./kind-meta";

export interface OdometerCardProps {
  vehicle: Vehicle;
  total: number;
  count: number;
  onEdit: () => void;
}

export function OdometerCard({ vehicle, total, count, onEdit }: OdometerCardProps) {
  const [km, setKm] = useState("");
  const Icon = VEHICLE_ICONS[vehicle.kind];
  const digits = String(vehicle.currentKm).padStart(6, "0").split("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = Number(km);
    if (km === "" || !Number.isInteger(value) || value < 0 || value > 9_999_999) {
      toast.error("Informe um km válido");
      return;
    }
    if (value < vehicle.currentKm) toast.warning("Km menor que o anterior — ajustado mesmo assim");
    else toast.success(`Km atualizado para ${formatKm(value)}`);
    garage.setKm(vehicle.id, value);
    setKm("");
  }

  return (
    <section aria-label="Hodômetro" className="relative overflow-hidden rounded-2xl bg-ink p-5 text-ink-foreground shadow-card sm:p-6">
      <div className="hazard-stripe absolute inset-x-0 top-0 h-1.5" aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Icon className="size-6" /></span>
          <div>
            <h2 className="text-xl font-bold leading-tight">{vehicle.name}</h2>
            <p className="font-mono text-xs uppercase tracking-widest opacity-60">{VEHICLE_LABELS[vehicle.kind]}{vehicle.plate && ` · ${vehicle.plate}`}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Editar veículo" className="hover:bg-ink-foreground/10 hover:text-ink-foreground"><Pencil /></Button>
          <ConfirmDelete title={`Excluir ${vehicle.name}?`} description="Todos os registros deste veículo também serão apagados." onConfirm={() => { garage.removeVehicle(vehicle.id); toast.success("Veículo excluído"); }}>
            <Button size="icon" variant="ghost" aria-label="Excluir veículo" className="hover:bg-destructive/20 hover:text-destructive"><Trash2 /></Button>
          </ConfirmDelete>
        </div>
      </div>

      <div className="mt-6 flex items-end gap-1.5" aria-label={`Quilometragem atual: ${formatKm(vehicle.currentKm)}`}>
        {digits.map((d, i) => (
          <span key={`${digits.length}-${i}`} className="grid h-12 w-8 place-items-center rounded-md bg-ink-foreground/10 font-mono text-2xl font-bold sm:h-14 sm:w-10 sm:text-3xl">{d}</span>
        ))}
        <span className="mb-1 ml-1 font-mono text-sm opacity-60">km</span>
      </div>

      <form onSubmit={submit} className="mt-5 flex gap-2">
        <label htmlFor="odo-km" className="sr-only">Novo km</label>
        <div className="relative flex-1">
          <Gauge className="absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-50" aria-hidden />
          <Input id="odo-km" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))} placeholder="Atualizar km do painel" className="border-ink-foreground/20 bg-ink-foreground/5 pl-9 font-mono text-ink-foreground placeholder:text-ink-foreground/40" />
        </div>
        <Button type="submit" aria-label="Salvar km"><Check /></Button>
      </form>

      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-ink-foreground/10 pt-4">
        <div><dt className="text-xs uppercase tracking-wider opacity-60">Total gasto</dt><dd className="font-mono text-lg font-semibold">{formatBRL(total)}</dd></div>
        <div><dt className="text-xs uppercase tracking-wider opacity-60">Registros</dt><dd className="font-mono text-lg font-semibold">{count}</dd></div>
      </dl>
    </section>
  );
}
