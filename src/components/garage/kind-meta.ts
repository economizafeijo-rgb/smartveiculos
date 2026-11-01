import { Car, ClipboardCheck, Cog, Droplet, Motorbike, Wrench, type LucideIcon } from "lucide-react";

import type { RecordKind, VehicleKind } from "@/lib/garage/types";

export const RECORD_ICONS: Record<RecordKind, LucideIcon> = {
  oleo: Droplet,
  revisao: ClipboardCheck,
  peca: Cog,
  manutencao: Wrench,
};

export const VEHICLE_ICONS: Record<VehicleKind, LucideIcon> = {
  carro: Car,
  moto: Motorbike,
};

/** Sugestão de intervalo (km) para o próximo serviço, por tipo de veículo. */
export const SUGGESTED_INTERVAL_KM: Record<VehicleKind, Partial<Record<RecordKind, number>>> = {
  carro: { oleo: 10000, revisao: 10000 },
  moto: { oleo: 3000, revisao: 6000 },
};
