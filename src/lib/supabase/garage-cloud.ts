import { supabase } from './client';
import { garageDataSchema, type GarageData } from '../garage/types';

function client() {
  if (!supabase) throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.');
  return supabase;
}
async function currentUser() {
  const { data, error } = await client().auth.getUser();
  if (error || !data.user) throw new Error('Entre na sua conta antes de sincronizar.');
  return data.user.id;
}
export async function loadCloudGarage(): Promise<GarageData> {
  await currentUser();
  const [a,b] = await Promise.all([
    client().from('vehicles').select('*').order('created_at'),
    client().from('service_records').select('*').order('service_date', { ascending: false })
  ]);
  if(a.error) throw a.error;
  if(b.error) throw b.error;
  return garageDataSchema.parse({
    version:1,
    vehicles: (a.data ?? []).map(v => ({id:v.id,kind:v.kind,name:v.name,plate:v.plate,currentKm:v.current_km,createdAt:v.created_at})),
    records: (b.data ?? []).map(r => ({id:r.id,vehicleId:r.vehicle_id,kind:r.kind,date:r.service_date,km:r.km,description:r.description,cost:Number(r.cost),nextKm:r.next_km}))
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
