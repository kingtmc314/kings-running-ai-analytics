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

## Google Sheets → Supabase Data Migration (Body/Sleep/Heart Rate)

- [x] Fetch Body Composition data from Google Sheets
- [x] Fetch Sleep data from Google Sheets
- [x] Fetch Heart Rate data from Google Sheets
- [x] Transform and insert Body data into Supabase body_composition table (18 rows)
- [x] Transform and insert Sleep data into Supabase sleep_logs table (249 rows)
- [x] Transform and insert Heart Rate data into Supabase heart_rate_logs table (255 rows)
- [x] Verify row counts in Supabase match Google Sheets
- [x] Update version to v1.2.0 and save checkpoint

## Bug Fixes (v1.2.1)

- [x] Fix Heart Rate tab showing blank bpm values — TypeScript interfaces updated to use correct camelCase column names (restingHr, highHr, avgHr, hrv)
- [x] Fix Sleep tab showing blank values — TypeScript interfaces updated (sleepScore, bodyBattery, pulseOx, respiration, sleepQuality)
- [x] Fix Race Record tab showing all races as "Finished" — race status logic now correctly checks finish_time !== "False" (string) instead of truthy check
- [x] Update version to v1.2.1 and save checkpoint

## Version History
- v1.0.0 — Initial Google Sheets integration
- v1.1.0 — Supabase migration (complete)
- v1.2.0 — Body/Sleep/Heart Rate data migrated to Supabase
- v1.2.1 — Bug fixes: Heart Rate, Sleep, Race Record tabs all working correctly

## Vercel Migration (v1.3.0)
- [x] Replace Manus OAuth with Supabase Auth (email/password)
- [x] Create Login.tsx page with Supabase Auth sign-in
- [x] Create AuthGuard.tsx component for protected routes
- [x] Create useSupabaseAuth.ts hook (replaces useAuth)
- [x] Update server/_core/context.ts to verify Supabase JWT tokens
- [x] Update server/_core/trpc.ts to use Supabase User type
- [x] Update server/routers.ts to return Supabase user info
- [x] Stub out Manus OAuth (oauth.ts, sdk.ts) — no longer needed
- [x] Replace server/db.ts Drizzle/MySQL with Supabase-only stub
- [x] Update App.tsx with /login route and AuthGuard
- [x] Create vercel.json for Vercel deployment
- [x] Create api/server.ts Vercel serverless function entry point
- [x] Update build script to compile api/server.ts
- [x] Update auth.logout.test.ts to use Supabase User type
- [x] All 16 tests pass
- [x] Production build succeeds (dist/public + api/server.js)
- [x] Update version to v1.3.0
- [ ] Save checkpoint and push to GitHub
