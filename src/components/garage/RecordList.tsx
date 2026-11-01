import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatBRL, formatDate, formatKm } from "@/lib/garage/logic";
import { garage } from "@/lib/garage/store";
import { RECORD_KINDS, RECORD_LABELS, type RecordKind, type ServiceRecord } from "@/lib/garage/types";

import { ConfirmDelete } from "./ConfirmDelete";
import { RECORD_ICONS } from "./kind-meta";

type Filter = RecordKind | "todos";

export interface RecordListProps {
  records: ServiceRecord[];
  onEdit: (record: ServiceRecord) => void;
}

export function RecordList({ records, onEdit }: RecordListProps) {
  const [filter, setFilter] = useState<Filter>("todos");
  const visible = filter === "todos" ? records : records.filter((r) => r.kind === filter);

  return (
    <section aria-labelledby="history-title" className="space-y-3">
      <div className="flex flex-col gap-3">
        <h2 id="history-title" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Histórico</h2>
        <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v as Filter)} className="flex flex-wrap justify-start gap-1" aria-label="Filtrar por tipo">
          <ToggleGroupItem value="todos" size="sm" className="rounded-full px-3 data-[state=on]:bg-ink data-[state=on]:text-ink-foreground">Todos</ToggleGroupItem>
          {RECORD_KINDS.map((k) => (
            <ToggleGroupItem key={k} value={k} size="sm" className="rounded-full px-3 data-[state=on]:bg-ink data-[state=on]:text-ink-foreground">{RECORD_LABELS[k]}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum registro {filter !== "todos" && `de ${RECORD_LABELS[filter].toLowerCase()} `}ainda.</p>
      ) : (
        <ol className="relative space-y-3 border-l-2 border-dashed border-border pl-5">
          {visible.map((r) => {
            const Icon = RECORD_ICONS[r.kind];
            return (
              <li key={r.id} className="relative animate-in fade-in slide-in-from-bottom-2 rounded-xl border bg-card p-4 shadow-card">
                <span className="absolute -left-[33px] top-4 grid size-6 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground" aria-hidden><Icon className="size-3" /></span>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{RECORD_LABELS[r.kind]}</p>
                    <p className="font-mono text-xs text-muted-foreground">{formatDate(r.date)} · {formatKm(r.km)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="mr-1 font-mono text-sm font-semibold">{formatBRL(r.cost)}</span>
                    <Button size="icon" variant="ghost" className="size-8" onClick={() => onEdit(r)} aria-label="Editar registro"><Pencil /></Button>
                    <ConfirmDelete title="Excluir registro?" description={`${RECORD_LABELS[r.kind]} de ${formatDate(r.date)} será removido.`} onConfirm={() => { garage.removeRecord(r.id); toast.success("Registro excluído"); }}>
                      <Button size="icon" variant="ghost" className="size-8 hover:text-destructive" aria-label="Excluir registro"><Trash2 /></Button>
                    </ConfirmDelete>
                  </div>
                </div>
                {r.description && <p className="mt-2 text-sm text-foreground/80">{r.description}</p>}
                {r.nextKm !== null && <p className="mt-2 inline-block rounded-md bg-accent px-2 py-0.5 font-mono text-xs text-accent-foreground">próximo: {formatKm(r.nextKm)}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
