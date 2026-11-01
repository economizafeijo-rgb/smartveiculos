import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatKm } from "@/lib/garage/logic";
import { garage } from "@/lib/garage/store";
import { RECORD_KINDS, RECORD_LABELS, recordInputSchema, type RecordInput, type RecordKind, type ServiceRecord, type Vehicle } from "@/lib/garage/types";

import { FormField, fieldErrors, toNumber } from "./FormField";
import { RECORD_ICONS, SUGGESTED_INTERVAL_KM } from "./kind-meta";

export interface RecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle;
  record?: ServiceRecord | undefined;
  defaultKind?: RecordKind | undefined;
}

export function RecordDialog({ open, onOpenChange, vehicle, record, defaultKind }: RecordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {open && <RecordForm key={record?.id ?? `new-${defaultKind ?? ""}`} vehicle={vehicle} record={record} defaultKind={defaultKind} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

function RecordForm({ vehicle, record, defaultKind, onDone }: { vehicle: Vehicle; record?: ServiceRecord | undefined; defaultKind?: RecordKind | undefined; onDone: () => void }) {
  const [kind, setKind] = useState<RecordKind>(record?.kind ?? defaultKind ?? "oleo");
  const [date, setDate] = useState(record?.date ?? today());
  const [km, setKm] = useState(String(record?.km ?? vehicle.currentKm));
  const [cost, setCost] = useState(record ? String(record.cost) : "");
  const [nextKm, setNextKm] = useState(record?.nextKm != null ? String(record.nextKm) : "");
  const [description, setDescription] = useState(record?.description ?? "");
  const [errors, setErrors] = useState<Partial<Record<keyof RecordInput, string>>>({});

  const interval = SUGGESTED_INTERVAL_KM[vehicle.kind][kind];
  const kmNum = toNumber(km);

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = recordInputSchema.safeParse({
      kind,
      date,
      km: kmNum,
      cost: cost.trim() === "" ? 0 : toNumber(cost),
      nextKm: nextKm.trim() === "" ? null : toNumber(nextKm),
      description,
    });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error.issues));
    if (record) garage.updateRecord(record.id, parsed.data);
    else garage.addRecord(vehicle.id, parsed.data);
    toast.success(record ? "Registro atualizado" : `${RECORD_LABELS[kind]} registrada`);
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <DialogHeader>
        <DialogTitle>{record ? "Editar registro" : "Novo registro"}</DialogTitle>
        <DialogDescription>{vehicle.name} · {formatKm(vehicle.currentKm)}</DialogDescription>
      </DialogHeader>

      <ToggleGroup type="single" value={kind} onValueChange={(v) => v && setKind(v as RecordKind)} className="grid grid-cols-2 gap-2" aria-label="Tipo de serviço">
        {RECORD_KINDS.map((k) => {
          const Icon = RECORD_ICONS[k];
          return (
            <ToggleGroupItem key={k} value={k} variant="outline" className="h-12 justify-start gap-2 px-3 data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground">
              <Icon className="size-4" /> {RECORD_LABELS[k]}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      <div className="grid grid-cols-2 gap-3">
        <FormField id="r-date" label="Data" error={errors.date}>
          <Input id="r-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today()} aria-invalid={!!errors.date} />
        </FormField>
        <FormField id="r-km" label="Km no serviço" error={errors.km}>
          <Input id="r-km" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))} className="font-mono" aria-invalid={!!errors.km} />
        </FormField>
        <FormField id="r-cost" label="Custo (R$)" error={errors.cost}>
          <Input id="r-cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="0,00" className="font-mono" aria-invalid={!!errors.cost} />
        </FormField>
        <FormField id="r-next" label="Próximo em (km)" error={errors.nextKm} hint="Opcional — gera lembrete">
          <Input id="r-next" inputMode="numeric" value={nextKm} onChange={(e) => setNextKm(e.target.value.replace(/\D/g, ""))} placeholder="—" className="font-mono" aria-invalid={!!errors.nextKm} />
        </FormField>
      </div>

      {interval && Number.isFinite(kmNum) && (
        <Button type="button" variant="outline" size="sm" onClick={() => setNextKm(String(kmNum + interval))}>
          Sugerir: +{formatKm(interval)} ({formatKm(kmNum + interval)})
        </Button>
      )}

      <FormField id="r-desc" label="Descrição / peças" error={errors.description}>
        <Textarea id="r-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: óleo 5W30 sintético + filtro, oficina do João" maxLength={300} rows={3} />
      </FormField>

      <DialogFooter>
        <Button type="submit" className="w-full sm:w-auto">{record ? "Salvar" : "Registrar"}</Button>
      </DialogFooter>
    </form>
  );
}
