// =============================================================
// King's Running AI Analytics — Supabase Client
// Direct frontend connection to Life-OS Supabase
// =============================================================
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Supabase Table Types ──────────────────────────────────────

export interface SupabaseRunLog {
  id: number;
  date: string;
  running_type: string;
  running_shoes?: string;
  shoes_id?: number;
  distance_km: number;
  hour: number;
  minutes: number;
  second: number;
  average_pace?: string;
  best_pace?: string;
  average_heart_rate?: number;
  maximum_heart_rate?: number;
  average_cadence?: number;
  max_cadence?: number;
  avg_stride_length_m?: number;
  avg_vertical_ratio?: number;
  vertical_oscillation_cm?: number;
  avg_ground_contact_time_ms?: number;
  calories?: number;
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  apparent_temp?: number;
  status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseShoe {
  id: number;
  shoes_name: string;
  brand?: string;
  model?: string;
  status?: string;
  purchase_date?: string;
  retirement_date?: string;
  initial_km?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseRace {
  id: number;
  race_name: string;
  date: string;
  distance_km?: number;
  location?: string;
  registration?: string;
  bib_no?: string;
  is_pb?: boolean;
  finish_time?: string;
  overall_place?: number;
  age_group_place?: number;
  gender_group_place?: number;
  running_shoes?: string;
  shoes_id?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseBodyComposition {
  id: number;
  userId: number;
  date: string;
  weight?: number;
  bodyFatPct?: number;
  muscleMass?: number;
  fatMass?: number;
  visceralFat?: number;
  bmi?: number;
  bmr?: number;
  notes?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseSleepLog {
  id: number;
  userId: number;
  date: string;
  score?: number;
  resting_heart_rate?: number;
  body_battery_min?: number;
  body_battery_max?: number;
  deep_sleep_seconds?: number;
  rem_sleep_seconds?: number;
  stress_average?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseHeartRateLog {
  id: number;
  userId: number;
  date: string;
  resting_heart_rate?: number;
  max_heart_rate?: number;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Supabase API Functions ────────────────────────────────────

// Running Logs
export async function fetchRunningLogs(): Promise<SupabaseRunLog[]> {
  const { data, error } = await supabase
    .from("running_logs")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addRunningLog(log: Omit<SupabaseRunLog, "id" | "created_at" | "updated_at">): Promise<SupabaseRunLog> {
  const { data, error } = await supabase
    .from("running_logs")
    .insert(log)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRunningLog(id: number, log: Partial<SupabaseRunLog>): Promise<SupabaseRunLog> {
  const { data, error } = await supabase
    .from("running_logs")
    .update({ ...log, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRunningLog(id: number): Promise<void> {
  const { error } = await supabase.from("running_logs").delete().eq("id", id);
  if (error) throw error;
}

// Running Shoes
export async function fetchRunningShoes(): Promise<SupabaseShoe[]> {
  const { data, error } = await supabase
    .from("running_shoes")
    .select("*")
    .order("status", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addRunningShoe(shoe: Omit<SupabaseShoe, "id" | "created_at" | "updated_at">): Promise<SupabaseShoe> {
  const { data, error } = await supabase
    .from("running_shoes")
    .insert(shoe)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRunningShoe(id: number, shoe: Partial<SupabaseShoe>): Promise<SupabaseShoe> {
  const { data, error } = await supabase
    .from("running_shoes")
    .update({ ...shoe, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRunningShoe(id: number): Promise<void> {
  const { error } = await supabase.from("running_shoes").delete().eq("id", id);
  if (error) throw error;
}

// Races
export async function fetchRaces(): Promise<SupabaseRace[]> {
  const { data, error } = await supabase
    .from("races")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addRace(race: Omit<SupabaseRace, "id" | "created_at" | "updated_at">): Promise<SupabaseRace> {
  const { data, error } = await supabase
    .from("races")
    .insert(race)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRace(id: number, race: Partial<SupabaseRace>): Promise<SupabaseRace> {
  const { data, error } = await supabase
    .from("races")
    .update({ ...race, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRace(id: number): Promise<void> {
  const { error } = await supabase.from("races").delete().eq("id", id);
  if (error) throw error;
}

// Body Composition
export async function fetchBodyComposition(): Promise<SupabaseBodyComposition[]> {
  const { data, error } = await supabase
    .from("body_composition")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addBodyComposition(body: Omit<SupabaseBodyComposition, "id" | "createdAt" | "updatedAt">): Promise<SupabaseBodyComposition> {
  const { data, error } = await supabase
    .from("body_composition")
    .insert(body)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBodyComposition(id: number, body: Partial<SupabaseBodyComposition>): Promise<SupabaseBodyComposition> {
  const { data, error } = await supabase
    .from("body_composition")
    .update({ ...body, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBodyComposition(id: number): Promise<void> {
  const { error } = await supabase.from("body_composition").delete().eq("id", id);
  if (error) throw error;
}

// Sleep Logs
export async function fetchSleepLogs(): Promise<SupabaseSleepLog[]> {
  const { data, error } = await supabase
    .from("sleep_logs")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addSleepLog(sleep: Omit<SupabaseSleepLog, "id" | "createdAt" | "updatedAt">): Promise<SupabaseSleepLog> {
  const { data, error } = await supabase
    .from("sleep_logs")
    .insert(sleep)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSleepLog(id: number, sleep: Partial<SupabaseSleepLog>): Promise<SupabaseSleepLog> {
  const { data, error } = await supabase
    .from("sleep_logs")
    .update({ ...sleep, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSleepLog(id: number): Promise<void> {
  const { error } = await supabase.from("sleep_logs").delete().eq("id", id);
  if (error) throw error;
}

// Heart Rate Logs
export async function fetchHeartRateLogs(): Promise<SupabaseHeartRateLog[]> {
  const { data, error } = await supabase
    .from("heart_rate_logs")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addHeartRateLog(hr: Omit<SupabaseHeartRateLog, "id" | "createdAt" | "updatedAt">): Promise<SupabaseHeartRateLog> {
  const { data, error } = await supabase
    .from("heart_rate_logs")
    .insert(hr)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateHeartRateLog(id: number, hr: Partial<SupabaseHeartRateLog>): Promise<SupabaseHeartRateLog> {
  const { data, error } = await supabase
    .from("heart_rate_logs")
    .update({ ...hr, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteHeartRateLog(id: number): Promise<void> {
  const { error } = await supabase.from("heart_rate_logs").delete().eq("id", id);
  if (error) throw error;
}
