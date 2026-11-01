import { BellRing } from "lucide-react";

import { formatKm, type DueState, type UpcomingService } from "@/lib/garage/logic";
import { RECORD_LABELS, type RecordKind } from "@/lib/garage/types";
import { cn } from "@/lib/utils";

import { RECORD_ICONS } from "./kind-meta";

const STATE_STYLE: Record<DueState, { box: string; bar: string; label: string }> = {
  overdue: { box: "border-destructive/40 bg-destructive/10", bar: "bg-destructive", label: "Atrasado" },
  soon: { box: "border-warning/60 bg-warning/15", bar: "bg-warning", label: "Em breve" },
  ok: { box: "border-border bg-card", bar: "bg-success", label: "Em dia" },
};

export interface AlertsPanelProps {
  items: UpcomingService[];
  onQuickAdd: (kind: RecordKind) => void;
}

export function AlertsPanel({ items, onQuickAdd }: AlertsPanelProps) {
  return (
    <section aria-labelledby="alerts-title" className="space-y-3">
      <h2 id="alerts-title" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <BellRing className="size-4" /> Próximos serviços
      </h2>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Nenhum lembrete. Ao registrar um serviço, preencha “Próximo em (km)” para acompanhar aqui.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const s = STATE_STYLE[item.status.state];
            const Icon = RECORD_ICONS[item.kind];
            const span = item.nextKm - item.record.km;
            const used = Math.min(100, Math.max(0, ((span - item.status.remainingKm) / span) * 100));
            return (
              <li key={item.kind}>
                <button type="button" onClick={() => onQuickAdd(item.kind)} className={cn("w-full rounded-xl border p-4 text-left shadow-card transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", s.box)} aria-label={`${RECORD_LABELS[item.kind]}: ${s.label}. Registrar novo`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-semibold"><Icon className="size-4" /> {RECORD_LABELS[item.kind]}</span>
                    <span className="text-xs font-medium uppercase tracking-wider">{s.label}</span>
                  </div>
                  <p className="mt-2 font-mono text-sm">
                    {item.status.remainingKm > 0 ? `faltam ${formatKm(item.status.remainingKm)}` : `passou ${formatKm(-item.status.remainingKm)}`}
                    <span className="text-muted-foreground"> · aos {formatKm(item.nextKm)}</span>
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div className={cn("h-full rounded-full", s.bar)} style={{ width: `${used}%` }} />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
