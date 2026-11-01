import { RECORD_KINDS, type RecordKind, type ServiceRecord } from "./types";

/** A partir de quantos km restantes o serviço passa a ser "em breve". */
export const DUE_SOON_KM = 1000;

export type DueState = "ok" | "soon" | "overdue";

export interface DueStatus {
  state: DueState;
  /** Km restantes até o próximo serviço (negativo = atrasado). */
  remainingKm: number;
}

export function dueStatus(currentKm: number, nextKm: number, soonKm: number = DUE_SOON_KM): DueStatus {
  const remainingKm = nextKm - currentKm;
  if (remainingKm <= 0) return { state: "overdue", remainingKm };
  if (remainingKm <= soonKm) return { state: "soon", remainingKm };
  return { state: "ok", remainingKm };
}

/** Mais recente primeiro: data, depois km. */
export function sortRecords(records: readonly ServiceRecord[]): ServiceRecord[] {
  return [...records].sort((a, b) => (a.date === b.date ? b.km - a.km : b.date.localeCompare(a.date)));
}

/** Último registro de um tipo (maior km; empate decide pela data). */
export function latestOfKind(records: readonly ServiceRecord[], kind: RecordKind): ServiceRecord | undefined {
  return records
    .filter((r) => r.kind === kind)
    .reduce<ServiceRecord | undefined>((best, r) => {
      if (!best) return r;
      if (r.km !== best.km) return r.km > best.km ? r : best;
      return r.date > best.date ? r : best;
    }, undefined);
}

export interface UpcomingService {
  kind: RecordKind;
  record: ServiceRecord;
  nextKm: number;
  status: DueStatus;
}

/**
 * Para cada tipo de serviço, considera só o registro mais recente.
 * Se ele tiver "próximo km", gera um lembrete. Um serviço mais novo sem
 * próximo km substitui o lembrete anterior.
 */
export function upcomingServices(records: readonly ServiceRecord[], currentKm: number): UpcomingService[] {
  const result: UpcomingService[] = [];
  for (const kind of RECORD_KINDS) {
    const record = latestOfKind(records, kind);
    if (record && record.nextKm !== null) {
      result.push({ kind, record, nextKm: record.nextKm, status: dueStatus(currentKm, record.nextKm) });
    }
  }
  return result.sort((a, b) => a.status.remainingKm - b.status.remainingKm);
}

export function totalCost(records: readonly ServiceRecord[]): number {
  return Math.round(records.reduce((sum, r) => sum + r.cost, 0) * 100) / 100;
}

/** O hodômetro só avança: um registro antigo não reduz o km atual. */
export function nextOdometer(currentKm: number, recordKm: number): number {
  return Math.max(currentKm, recordKm);
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const kmFmt = new Intl.NumberFormat("pt-BR");

export const formatBRL = (v: number): string => brl.format(v);
export const formatKm = (v: number): string => `${kmFmt.format(v)} km`;
export const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
