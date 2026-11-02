import { useSyncExternalStore } from "react";

import { nextOdometer } from "./logic";
import {
  garageDataSchema,
  type GarageData,
  type RecordInput,
  type ServiceRecord,
  type Vehicle,
  type VehicleInput,
} from "./types";

/**
 * Armazenamento local (navegador). Os dados ficam só neste dispositivo.
 * Store externo + useSyncExternalStore: seguro para SSR (snapshot vazio no servidor).
 */
const STORAGE_KEY = "garagem:v1";
let storageOwner: string | null = null;
const scopedKey = () => storageOwner ? STORAGE_KEY + ":owner:" + storageOwner : STORAGE_KEY;
const EMPTY: GarageData = { version: 1, vehicles: [], records: [] };

let state: GarageData = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function readStorage(): GarageData {
  try {
    const raw = window.localStorage.getItem(scopedKey());
    if (!raw) return EMPTY;
    const parsed = garageDataSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY;
  } catch {
    return EMPTY;
  }
}

function ensureLoaded(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  state = readStorage();
}

function commit(next: GarageData): void {
  state = next;
  try {
    window.localStorage.setItem(scopedKey(), JSON.stringify(next));
  } catch {
    // Armazenamento cheio ou bloqueado: mantém em memória nesta sessão.
  }
  listeners.forEach((l) => l());
}

function onStorage(e: StorageEvent): void {
  if (e.key !== scopedKey()) return;
  state = readStorage();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  ensureLoaded();
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = (): GarageData => {
  ensureLoaded();
  return state;
};
const getServerSnapshot = (): GarageData => EMPTY;

export function useGarage(): GarageData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const noopSubscribe = () => () => {};
/** true depois da hidratação no navegador. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

const bumpKm = (vehicles: Vehicle[], vehicleId: string, km: number): Vehicle[] =>
  vehicles.map((v) => (v.id === vehicleId ? { ...v, currentKm: nextOdometer(v.currentKm, km) } : v));

/** Define a área de dados local da pessoa autenticada. Não transfere dados entre contas. */
export function setGarageAccount(userId:string|null):void{
 if(storageOwner===userId)return;
 storageOwner=userId;loaded=false;state=EMPTY;ensureLoaded();
 listeners.forEach(fn=>fn());
}
export const garage = {
  /** Migração voluntária dos dados anteriores ao login. Só importe se forem seus. */
  importLegacy():{vehiclesAdded:number;recordsAdded:number}{
   if(!storageOwner)throw Error('É necessário entrar na conta.');
   let parsed:unknown;
   try{parsed=JSON.parse(window.localStorage.getItem(STORAGE_KEY)||'null');}catch{throw Error('Arquivo local antigo inválido.');}
   const data=garageDataSchema.safeParse(parsed);
   if(!data.success)throw Error('Nenhum dado antigo válido encontrado neste navegador.');
   return this.mergeCloud(data.data);
  },
  /** Acrescenta registros ausentes, preservando a versão local de cada registro existente. */
  mergeCloud(input: GarageData): { vehiclesAdded: number; recordsAdded: number } {
    const data = garageDataSchema.parse(input);
    const current = getSnapshot();
    const vehicleIds = new Set(current.vehicles.map(v => v.id));
    const recordIds = new Set(current.records.map(r => r.id));
    const addedVehicles = data.vehicles.filter(v => !vehicleIds.has(v.id));
    const allVehicleIds = new Set([...current.vehicles, ...addedVehicles].map(v => v.id));
    const addedRecords = data.records.filter(r => !recordIds.has(r.id) && allVehicleIds.has(r.vehicleId));
    if (addedVehicles.length || addedRecords.length) commit({
      ...current,
      vehicles: [...current.vehicles, ...addedVehicles],
      records: [...current.records, ...addedRecords],
    });
    return { vehiclesAdded: addedVehicles.length, recordsAdded: addedRecords.length };
  },
  addVehicle(input: VehicleInput): Vehicle {
    const vehicle: Vehicle = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    commit({ ...getSnapshot(), vehicles: [...getSnapshot().vehicles, vehicle] });
    return vehicle;
  },
  updateVehicle(id: string, input: VehicleInput): void {
    const s = getSnapshot();
    commit({ ...s, vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...input } : v)) });
  },
  removeVehicle(id: string): void {
    const s = getSnapshot();
    commit({ ...s, vehicles: s.vehicles.filter((v) => v.id !== id), records: s.records.filter((r) => r.vehicleId !== id) });
  },
  setKm(id: string, km: number): void {
    const s = getSnapshot();
    commit({ ...s, vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, currentKm: km } : v)) });
  },
  addRecord(vehicleId: string, input: RecordInput): void {
    const s = getSnapshot();
    const record: ServiceRecord = { ...input, id: crypto.randomUUID(), vehicleId };
    commit({ ...s, records: [...s.records, record], vehicles: bumpKm(s.vehicles, vehicleId, input.km) });
  },
  updateRecord(id: string, input: RecordInput): void {
    const s = getSnapshot();
    const existing = s.records.find((r) => r.id === id);
    if (!existing) return;
    commit({
      ...s,
      records: s.records.map((r) => (r.id === id ? { ...r, ...input } : r)),
      vehicles: bumpKm(s.vehicles, existing.vehicleId, input.km),
    });
  },
  removeRecord(id: string): void {
    const s = getSnapshot();
    commit({ ...s, records: s.records.filter((r) => r.id !== id) });
  },
};
