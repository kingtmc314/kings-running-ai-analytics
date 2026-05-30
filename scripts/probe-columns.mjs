import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const sb = createClient(url, key);

async function testCols(table, cols) {
  const { data, error } = await sb.from(table).select(cols).limit(0);
  if (!error) {
    console.log(`✅ ${table} OK with: ${cols}`);
    return true;
  }
  console.log(`❌ ${table} fail: ${error.message.substring(0, 100)}`);
  return false;
}

// body_composition
await testCols("body_composition", "id,date,weight,bmi,body_fat,fat_mass,muscle_mass,bmr,visceral_fat,notes,created_at");
await testCols("body_composition", "id,date,weight_kg,bmi,body_fat_pct,fat_mass_kg,muscle_mass_kg,bmr,visceral_fat,notes,created_at");
await testCols("body_composition", "*");

// sleep_logs
await testCols("sleep_logs", "id,date,sleep_score,resting_heart_rate,body_battery,pulse_ox,respiration,quality,notes,created_at");
await testCols("sleep_logs", "id,date,score,resting_hr,body_battery,spo2,respiration_rate,quality,notes,created_at");
await testCols("sleep_logs", "*");

// heart_rate_logs
await testCols("heart_rate_logs", "id,date,resting_heart_rate,max_heart_rate,notes,created_at");
await testCols("heart_rate_logs", "id,date,resting_hr,max_hr,notes,created_at");
await testCols("heart_rate_logs", "id,date,resting,high,notes,created_at");
await testCols("heart_rate_logs", "*");
