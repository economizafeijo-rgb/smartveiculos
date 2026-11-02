import { supabase } from './client';
import { garageDataSchema, type GarageData } from '../garage/types';
import type { Fillup } from '../garage/fuel';

function client() {
  if (!supabase) throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.');
  return supabase;
}
async function currentUser() {
  const { data, error } = await client().auth.getUser();
  if (error || !data.user) throw new Error('Entre na sua conta antes de sincronizar.');
  return data.user.id;
}
async function readAll(table:'vehicles'|'service_records',orderField:'created_at'|'service_date'){
  const rows: Record<string,unknown>[]=[];
  const pageSize=500;
  for(let offset=0;;offset+=pageSize){
    const {data,error}=await client().from(table).select('*').order(orderField,{ascending:true}).range(offset,offset+pageSize-1);
    if(error)throw error;
    rows.push(...((data??[]) as Record<string,unknown>[]));
    if((data??[]).length<pageSize)break;
  }
  return rows;
}
export async function loadCloudGarage(): Promise<GarageData> {
  await currentUser();
  const [vehicles,records]=await Promise.all([
    readAll('vehicles','created_at'),
    readAll('service_records','service_date')
  ]);
  return garageDataSchema.parse({
    version:1,
    vehicles:vehicles.map(v=>({id:v.id,kind:v.kind,name:v.name,plate:v.plate,currentKm:v.current_km,createdAt:v.created_at})),
    records:records.map(r=>({id:r.id,vehicleId:r.vehicle_id,kind:r.kind,date:r.service_date,km:r.km,description:r.description,cost:Number(r.cost),nextKm:r.next_km}))
  });
}
/** Importação explícita; preserva dados locais e registros remotos. */
export async function importLocalGarage(data: GarageData): Promise<{vehicles:number;records:number}> {
  const parsed = garageDataSchema.parse(data);
  const owner = await currentUser();
  const vehicles = parsed.vehicles.map(v => ({id:v.id,owner_id:owner,kind:v.kind,name:v.name,plate:v.plate,current_km:v.currentKm,created_at:v.createdAt}));
  const records = parsed.records.map(r => ({id:r.id,owner_id:owner,vehicle_id:r.vehicleId,kind:r.kind,service_date:r.date,km:r.km,description:r.description,cost:r.cost,next_km:r.nextKm}));
  if(vehicles.length) {
    const {error} = await client().from('vehicles').upsert(vehicles,{onConflict:'id',ignoreDuplicates:true});
    if(error) throw error;
  }
  if(records.length) {
    const {error} = await client().from('service_records').upsert(records,{onConflict:'id',ignoreDuplicates:true});
    if(error) throw error;
  }
  return {vehicles:vehicles.length,records:records.length};
}
export async function sendMagicLink(email:string):Promise<void> {
  const {error} = await client().auth.signInWithOtp({email});
  if(error) throw error;
}
export async function signOut():Promise<void> {
  const {error} = await client().auth.signOut();
  if(error) throw error;
}

/** Recupera os abastecimentos do usuário autenticado. A tabela exige RLS. */
export async function loadCloudFillups(): Promise<Fillup[]> {
  const owner = await currentUser();
  const all: Fillup[] = [];
  const pageSize = 800;
  for (let offset=0; ;offset+=pageSize) {
    const { data, error } = await client().from('fuel_fillups').select('*')
      .eq('owner_id',owner).order('created_at',{ascending:true}).range(offset,offset+pageSize-1);
    if (error) throw error;
    const rows = data ?? [];
    for (const r of rows) {
      const item:Fillup={
        id:r.id,vehicleId:r.vehicle_id,date:r.fill_date,km:r.odometer_km,
        fuel:r.fuel as Fillup['fuel'],liters:Number(r.liters),
        pricePerLiter:Number(r.price_per_liter),fullTank:r.full_tank
      };
      if (!Number.isSafeInteger(item.km) || !Number.isFinite(item.liters) || item.liters<=0) {
        throw new Error('Dados de abastecimento inválidos recebidos do banco.');
      }
      all.push(item);
    }
    if(rows.length<pageSize)break;
  }
  return all;
}
/** Envia os dados locais para o backup do usuário, sem excluir dados remotos. */
export async function importLocalFillups(fillups: readonly Fillup[]): Promise<number> {
 const owner=await currentUser();
 if(!fillups.length)return 0;
 const rows=fillups.map(f=>({
  id:f.id,owner_id:owner,vehicle_id:f.vehicleId,fill_date:f.date,
  odometer_km:f.km,fuel:f.fuel,liters:f.liters,
  price_per_liter:f.pricePerLiter,full_tank:f.fullTank,
 }));
 for(let i=0;i<rows.length;i+=200){
  const {error}=await client().from('fuel_fillups').upsert(rows.slice(i,i+200),{onConflict:'id',ignoreDuplicates:true});
  if(error)throw error;
 }
 return rows.length;
}
