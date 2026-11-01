import { z } from "zod";

/** Tipos de veículo suportados. */
export const VEHICLE_KINDS = ["carro", "moto"] as const;
export type VehicleKind = (typeof VEHICLE_KINDS)[number];

/** Categorias de registro de serviço. */
export const RECORD_KINDS = ["oleo", "revisao", "peca", "manutencao"] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];

export const RECORD_LABELS: Record<RecordKind, string> = {
  oleo: "Troca de óleo",
  revisao: "Revisão",
  peca: "Troca de peça",
  manutencao: "Manutenção",
};

export const VEHICLE_LABELS: Record<VehicleKind, string> = {
  carro: "Carro",
  moto: "Moto",
};

const km = z.number({ invalid_type_error: "Informe um número" }).int("Use números inteiros").min(0, "Não pode ser negativo").max(9_999_999, "Valor muito alto");

export const vehicleInputSchema = z.object({
  kind: z.enum(VEHICLE_KINDS),
  name: z.string().trim().min(1, "Dê um nome ao veículo").max(60, "Máximo de 60 caracteres"),
  plate: z.string().trim().toUpperCase().max(10, "Placa muito longa"),
  currentKm: km,
});
export type VehicleInput = z.infer<typeof vehicleInputSchema>;

export const vehicleSchema = vehicleInputSchema.extend({
  id: z.string(),
  createdAt: z.string(),
});
export type Vehicle = z.infer<typeof vehicleSchema>;

const recordBase = z.object({
  kind: z.enum(RECORD_KINDS),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  km,
  description: z.string().trim().max(300, "Máximo de 300 caracteres"),
  cost: z.number({ invalid_type_error: "Informe um valor" }).min(0, "Não pode ser negativo").max(10_000_000, "Valor muito alto"),
  nextKm: km.nullable(),
});

/** O próximo km, quando informado, precisa ser maior que o km do serviço. */
const nextKmAfterKm = (r: { km: number; nextKm: number | null }) => r.nextKm === null || r.nextKm > r.km;
const nextKmMessage = { message: "O próximo km deve ser maior que o km do serviço", path: ["nextKm"] };

export const recordInputSchema = recordBase.refine(nextKmAfterKm, nextKmMessage);
export type RecordInput = z.infer<typeof recordInputSchema>;

export const serviceRecordSchema = recordBase
  .extend({ id: z.string(), vehicleId: z.string() })
  .refine(nextKmAfterKm, nextKmMessage);
export type ServiceRecord = z.infer<typeof serviceRecordSchema>;

export const garageDataSchema = z.object({
  version: z.literal(1),
  vehicles: z.array(vehicleSchema),
  records: z.array(serviceRecordSchema),
});
export type GarageData = z.infer<typeof garageDataSchema>;
