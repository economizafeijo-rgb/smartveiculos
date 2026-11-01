import { createFileRoute } from "@tanstack/react-router";
import { Plus, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

import { AlertsPanel } from "@/components/garage/AlertsPanel";
import { OdometerCard } from "@/components/garage/OdometerCard";
import { RecordDialog } from "@/components/garage/RecordDialog";
import { RecordList } from "@/components/garage/RecordList";
import { VehicleDialog } from "@/components/garage/VehicleDialog";
import { VEHICLE_ICONS } from "@/components/garage/kind-meta";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { sortRecords, totalCost, upcomingServices } from "@/lib/garage/logic";
import { useGarage, useHydrated } from "@/lib/garage/store";
import type { RecordKind, ServiceRecord, Vehicle } from "@/lib/garage/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Garagem — controle de manutenção de carro e moto" },
      { name: "description", content: "Registre trocas de óleo, revisões, peças, manutenções e a quilometragem do seu carro ou moto, com lembretes do próximo serviço." },
      { property: "og:title", content: "Garagem — controle de manutenção de carro e moto" },
      { property: "og:description", content: "Trocas de óleo, revisões, peças e km do seu veículo em um só lugar, com lembretes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GaragePage,
});

type RecordDialogState = { open: boolean; record?: ServiceRecord | undefined; defaultKind?: RecordKind | undefined };
type VehicleDialogState = { open: boolean; vehicle?: Vehicle | undefined };

function GaragePage() {
  const hydrated = useHydrated();
  const { vehicles, records } = useGarage();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [vehicleDlg, setVehicleDlg] = useState<VehicleDialogState>({ open: false });
  const [recordDlg, setRecordDlg] = useState<RecordDialogState>({ open: false });

  // Estado derivado: se o selecionado foi excluído, cai no primeiro.
  const selected = vehicles.find((v) => v.id === selectedId) ?? vehicles[0];
  const vehicleRecords = useMemo(() => (selected ? sortRecords(records.filter((r) => r.vehicleId === selected.id)) : []), [records, selected]);
  const upcoming = useMemo(() => (selected ? upcomingServices(vehicleRecords, selected.currentKm) : []), [vehicleRecords, selected]);

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-ink text-primary"><Wrench className="size-5" /></span>
            <div>
              <h1 className="text-lg font-bold leading-none">Garagem</h1>
              <p className="text-xs text-muted-foreground">manutenção & quilometragem</p>
            </div>
          </div>
          {selected && (
            <Button onClick={() => setRecordDlg({ open: true })} className="shadow-pop"><Plus /> Registrar</Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {!hydrated ? (
          <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-72 w-full rounded-2xl" /></div>
        ) : vehicles.length === 0 ? (
          <EmptyState onAdd={() => setVehicleDlg({ open: true })} />
        ) : (
          <>
            <nav aria-label="Veículos" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {vehicles.map((v) => {
                const Icon = VEHICLE_ICONS[v.kind];
                const active = v.id === selected?.id;
                return (
                  <button key={v.id} type="button" onClick={() => setSelectedId(v.id)} aria-current={active ? "true" : undefined}
                    className={cn("flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active ? "border-ink bg-ink text-ink-foreground" : "bg-card hover:bg-secondary")}>
                    <Icon className="size-4" /> {v.name}
                  </button>
                );
              })}
              <button type="button" onClick={() => setVehicleDlg({ open: true })} className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Plus className="size-4" /> Veículo
              </button>
            </nav>

            {selected && (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                  <OdometerCard key={selected.id} vehicle={selected} total={totalCost(vehicleRecords)} count={vehicleRecords.length} onEdit={() => setVehicleDlg({ open: true, vehicle: selected })} />
                  <AlertsPanel items={upcoming} onQuickAdd={(kind) => setRecordDlg({ open: true, defaultKind: kind })} />
                </div>
                <RecordList key={selected.id} records={vehicleRecords} onEdit={(record) => setRecordDlg({ open: true, record })} />
              </div>
            )}
          </>
        )}
      </main>

      <VehicleDialog open={vehicleDlg.open} vehicle={vehicleDlg.vehicle} onOpenChange={(open) => setVehicleDlg((s) => ({ ...s, open }))} onSaved={setSelectedId} />
      {selected && (
        <RecordDialog open={recordDlg.open} vehicle={selected} record={recordDlg.record} defaultKind={recordDlg.defaultKind} onOpenChange={(open) => setRecordDlg((s) => ({ ...s, open }))} />
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const Car = VEHICLE_ICONS.carro;
  const Moto = VEHICLE_ICONS.moto;
  return (
    <section className="grid-paper relative overflow-hidden rounded-2xl border bg-card p-8 text-center shadow-card sm:p-14">
      <div className="hazard-stripe absolute inset-x-0 top-0 h-1.5" aria-hidden />
      <div className="mx-auto flex w-fit gap-3 text-primary"><Car className="size-10" /><Moto className="size-10" /></div>
      <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Comece pela sua garagem</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">Cadastre um carro ou uma moto e registre trocas de óleo, revisões, peças e a quilometragem.</p>
      <Button size="lg" className="mt-6 shadow-pop" onClick={onAdd}><Plus /> Adicionar veículo</Button>
    </section>
  );
}
