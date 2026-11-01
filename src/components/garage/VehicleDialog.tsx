import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { garage } from "@/lib/garage/store";
import { VEHICLE_KINDS, VEHICLE_LABELS, vehicleInputSchema, type Vehicle, type VehicleInput, type VehicleKind } from "@/lib/garage/types";

import { FormField, fieldErrors, toNumber } from "./FormField";
import { VEHICLE_ICONS } from "./kind-meta";

export interface VehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | undefined;
  onSaved?: ((id: string) => void) | undefined;
}

export function VehicleDialog({ open, onOpenChange, vehicle, onSaved }: VehicleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* key remonta o formulário ao abrir, resetando os campos */}
        {open && <VehicleForm key={vehicle?.id ?? "new"} vehicle={vehicle} onDone={(id) => { onSaved?.(id); onOpenChange(false); }} />}
      </DialogContent>
    </Dialog>
  );
}

function VehicleForm({ vehicle, onDone }: { vehicle?: Vehicle | undefined; onDone: (id: string) => void }) {
  const [kind, setKind] = useState<VehicleKind>(vehicle?.kind ?? "carro");
  const [name, setName] = useState(vehicle?.name ?? "");
  const [plate, setPlate] = useState(vehicle?.plate ?? "");
  const [km, setKm] = useState(vehicle ? String(vehicle.currentKm) : "");
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleInput, string>>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = vehicleInputSchema.safeParse({ kind, name, plate, currentKm: toNumber(km) });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error.issues));
    if (vehicle) {
      garage.updateVehicle(vehicle.id, parsed.data);
      toast.success("Veículo atualizado");
      onDone(vehicle.id);
    } else {
      const created = garage.addVehicle(parsed.data);
      toast.success("Veículo adicionado");
      onDone(created.id);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <DialogHeader>
        <DialogTitle>{vehicle ? "Editar veículo" : "Novo veículo"}</DialogTitle>
        <DialogDescription>Cadastre o carro ou a moto que você quer acompanhar.</DialogDescription>
      </DialogHeader>

      <ToggleGroup type="single" value={kind} onValueChange={(v) => v && setKind(v as VehicleKind)} className="grid grid-cols-2 gap-2" aria-label="Tipo de veículo">
        {VEHICLE_KINDS.map((k) => {
          const Icon = VEHICLE_ICONS[k];
          return (
            <ToggleGroupItem key={k} value={k} variant="outline" className="h-14 gap-2 text-base data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground">
              <Icon className="size-5" /> {VEHICLE_LABELS[k]}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      <FormField id="v-name" label="Nome / modelo" error={errors.name}>
        <Input id="v-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Onix 2020, CG 160" maxLength={60} aria-invalid={!!errors.name} autoFocus />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField id="v-plate" label="Placa" error={errors.plate}>
          <Input id="v-plate" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="ABC1D23" maxLength={10} className="font-mono uppercase" />
        </FormField>
        <FormField id="v-km" label="Km atual" error={errors.currentKm}>
          <Input id="v-km" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))} placeholder="0" className="font-mono" aria-invalid={!!errors.currentKm} />
        </FormField>
      </div>

      <DialogFooter>
        <Button type="submit" className="w-full sm:w-auto">{vehicle ? "Salvar" : "Adicionar veículo"}</Button>
      </DialogFooter>
    </form>
  );
}
