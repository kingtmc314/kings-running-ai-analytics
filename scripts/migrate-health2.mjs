import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxNGLhTFOxjxEZ7zHRJXJLDxBVBHJvPFMFqVFjBjDnC5jbDSxwGJHAFJRKkdPALEBCL/exec';

async function fetchSheet(sheet) {
  const url = `${SCRIPT_URL}?action=getAll&sheet=${encodeURIComponent(sheet)}`;
  console.log(`Fetching sheet: ${sheet}`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const data = JSON.parse(text);
  return data.data || data;
}

function parseNum(val) {
  if (val === null || val === undefined || val === '' || val === '-') return null;
  const n = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function parseInt2(val) {
  if (val === null || val === undefined || val === '' || val === '-') return null;
  const n = parseInt(String(val).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function parseDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (!s || s === '-') return null;
  const parts = s.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  return s;
}

async function migrateBody() {
  console.log('\n=== Migrating Body Composition ===');
  let rows;
  try {
    rows = await fetchSheet('Body');
    console.log(`Fetched ${rows.length} rows`);
    if (rows.length > 0) console.log('Keys:', Object.keys(rows[0]));
  } catch (e) {
    console.error('Failed:', e.message);
    return;
  }

  const { data: existing } = await supabase.from('body_composition').select('date');
  const existingDates = new Set((existing || []).map(r => r.date));
  console.log(`Existing in Supabase: ${existingDates.size}`);

  const toInsert = [];
  for (const row of rows) {
    const date = parseDate(row['Date'] || row['date'] || row['日期']);
    if (!date) continue;
    if (existingDates.has(date)) { console.log(`  Skip duplicate: ${date}`); continue; }
    toInsert.push({
      date,
      weight: parseNum(row['Weight'] || row['weight'] || row['體重']),
      bodyFatPct: parseNum(row['Body Fat'] || row['Body Fat%'] || row['體脂率']),
      muscleMass: parseNum(row['Muscle Mass'] || row['muscleMass'] || row['肌肉量']),
      fatMass: parseNum(row['Fat Mass'] || row['fatMass'] || row['脂肪量']),
      visceralFat: parseNum(row['Visceral Fat'] || row['visceralFat'] || row['內臟脂肪']),
      bmi: parseNum(row['BMI'] || row['bmi']),
      bmr: parseInt2(row['BMR'] || row['bmr']),
      notes: row['Notes'] || row['notes'] || null,
      source: 'google_sheets',
    });
  }

  if (toInsert.length === 0) { console.log('No new records'); return; }
  console.log(`Inserting ${toInsert.length}...`);
  console.log('Sample:', JSON.stringify(toInsert[0], null, 2));

  const { data, error } = await supabase.from('body_composition').insert(toInsert).select('id, date');
  if (error) console.error('Error:', error.message, error.details, error.hint);
  else console.log(`✓ Inserted ${data.length} body composition records`);
}

async function migrateSleep() {
  console.log('\n=== Migrating Sleep Logs ===');
  let rows;
  try {
    rows = await fetchSheet('Sleep');
    console.log(`Fetched ${rows.length} rows`);
    if (rows.length > 0) console.log('Keys:', Object.keys(rows[0]));
  } catch (e) {
    console.error('Failed:', e.message);
    return;
  }

  const { data: existing } = await supabase.from('sleep_logs').select('date');
  const existingDates = new Set((existing || []).map(r => r.date));
  console.log(`Existing in Supabase: ${existingDates.size}`);

  const toInsert = [];
  for (const row of rows) {
    const date = parseDate(row['Date'] || row['date'] || row['日期']);
    if (!date) continue;
    if (existingDates.has(date)) continue;
    let quality = row['Sleep Quality'] || row['sleepQuality'] || row['Quality'] || row['睡眠質量'] || null;
    if (quality) quality = String(quality).trim();
    toInsert.push({
      date,
      sleepScore: parseInt2(row['Sleep Score'] || row['sleepScore'] || row['Score'] || row['睡眠分數']),
      bodyBattery: parseInt2(row['Body Battery'] || row['bodyBattery'] || row['身體電量']),
      pulseOx: parseNum(row['Pulse Ox'] || row['pulseOx'] || row['血氧'] || row['SpO2']),
      respiration: parseNum(row['Respiration'] || row['respiration'] || row['呼吸']),
      stress: parseInt2(row['Stress'] || row['stress'] || row['壓力']),
      sleepQuality: quality,
      sleepDuration: parseNum(row['Sleep Duration'] || row['sleepDuration'] || row['Duration'] || row['睡眠時長']),
      deepSleep: parseNum(row['Deep Sleep'] || row['deepSleep'] || row['深睡']),
      remSleep: parseNum(row['REM Sleep'] || row['remSleep'] || row['REM']),
      lightSleep: parseNum(row['Light Sleep'] || row['lightSleep'] || row['淺睡']),
      awakeDuration: parseNum(row['Awake Duration'] || row['awakeDuration'] || row['Awake'] || row['清醒時長']),
      notes: row['Notes'] || row['notes'] || null,
      source: 'google_sheets',
    });
  }

  if (toInsert.length === 0) { console.log('No new records'); return; }
  console.log(`Inserting ${toInsert.length}...`);
  console.log('Sample:', JSON.stringify(toInsert[0], null, 2));

  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50);
    const { data, error } = await supabase.from('sleep_logs').insert(batch).select('id, date');
    if (error) console.error(`Batch error:`, error.message, error.details, error.hint);
    else inserted += data.length;
  }
  console.log(`✓ Inserted ${inserted} sleep log records`);
}

async function migrateHeartRate() {
  console.log('\n=== Migrating Heart Rate Logs ===');
  let rows;
  try {
    rows = await fetchSheet('Heart Rate');
    console.log(`Fetched ${rows.length} rows`);
    if (rows.length > 0) console.log('Keys:', Object.keys(rows[0]));
  } catch (e) {
    console.error('Failed:', e.message);
    return;
  }

  const { data: existing } = await supabase.from('heart_rate_logs').select('date');
  const existingDates = new Set((existing || []).map(r => r.date));
  console.log(`Existing in Supabase: ${existingDates.size}`);

  const toInsert = [];
  for (const row of rows) {
    const date = parseDate(row['Date'] || row['date'] || row['日期']);
    if (!date) continue;
    if (existingDates.has(date)) continue;
    toInsert.push({
      date,
      restingHr: parseInt2(row['Resting HR'] || row['restingHr'] || row['Resting Heart Rate'] || row['靜息心率'] || row['Resting']),
      highHr: parseInt2(row['High HR'] || row['highHr'] || row['Max HR'] || row['最高心率'] || row['High']),
      hrv: parseInt2(row['HRV'] || row['hrv']),
      avgHr: parseInt2(row['Avg HR'] || row['avgHr'] || row['Average HR'] || row['平均心率'] || row['Avg']),
      zone1: parseInt2(row['Zone 1'] || row['zone1'] || row['Z1']),
      zone2: parseInt2(row['Zone 2'] || row['zone2'] || row['Z2']),
      zone3: parseInt2(row['Zone 3'] || row['zone3'] || row['Z3']),
      zone4: parseInt2(row['Zone 4'] || row['zone4'] || row['Z4']),
      zone5: parseInt2(row['Zone 5'] || row['zone5'] || row['Z5']),
      notes: row['Notes'] || row['notes'] || null,
      source: 'google_sheets',
    });
  }

  if (toInsert.length === 0) { console.log('No new records'); return; }
  console.log(`Inserting ${toInsert.length}...`);
  console.log('Sample:', JSON.stringify(toInsert[0], null, 2));

  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50);
    const { data, error } = await supabase.from('heart_rate_logs').insert(batch).select('id, date');
    if (error) console.error(`Batch error:`, error.message, error.details, error.hint);
    else inserted += data.length;
  }
  console.log(`✓ Inserted ${inserted} heart rate log records`);
}

async function main() {
  console.log('Starting Health Data Migration: Google Sheets → Supabase');
  await migrateBody();
  await migrateSleep();
  await migrateHeartRate();
  console.log('\n=== Migration Complete ===');
}

main().catch(console.error);
