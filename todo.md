# King's Running AI Analytics — TODO

## Supabase Migration

- [x] Install @supabase/supabase-js
- [x] Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY secrets
- [x] Create client/src/lib/supabase.ts with all CRUD functions
- [x] Update DataContext.tsx to fetch from Supabase instead of Google Sheets
- [x] Update DataContext.tsx to add Supabase CRUD operations (add/update/delete)
- [x] Update LogDataTab to use Supabase CRUD (running_logs, running_shoes, races)
- [x] Update BodyFitnessTab to use Supabase CRUD via DataContext (body_composition)
- [x] Update SleepTab to use Supabase CRUD via DataContext (sleep_logs)
- [x] Update HeartRateTab to use Supabase CRUD via DataContext (heart_rate_logs)
- [x] Update processedShoes to use Supabase field names (shoes_name, brand, model, etc.)
- [x] Update processedRacesList to use Supabase field names (race_name, date, distance_km, etc.)
- [x] Update AI analysis to use Supabase field names (via DataContext mapping)
- [x] Add version number display to Dashboard sidebar (v1.1.0 · Supabase)
- [x] Write vitest tests for Supabase integration (10 tests, all passing)
- [x] Update ActivitiesTab edit/delete to use Supabase updateLog/deleteLog
- [x] Update ShoeLockerTab edit/delete to use Supabase updateShoe/deleteShoe
- [x] Update RaceRecordTab edit/delete to use Supabase updateRaceEntry/deleteRaceEntry
- [x] Remove all sheetsApi updateRow/deleteRow imports from all tabs
- [x] Save checkpoint

## Version History
- v1.0.0 — Initial Google Sheets integration
- v1.1.0 — Supabase migration (complete)

## Google Sheets → Supabase Data Migration (Body/Sleep/Heart Rate)

- [ ] Fetch Body Composition data from Google Sheets
- [ ] Fetch Sleep data from Google Sheets
- [ ] Fetch Heart Rate data from Google Sheets
- [ ] Transform and insert Body data into Supabase body_composition table
- [ ] Transform and insert Sleep data into Supabase sleep_logs table
- [ ] Transform and insert Heart Rate data into Supabase heart_rate_logs table
- [ ] Verify row counts in Supabase match Google Sheets
- [ ] Update version to v1.2.0 and save checkpoint
