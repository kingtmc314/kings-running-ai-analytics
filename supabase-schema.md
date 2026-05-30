# Supabase Life-OS Table Schema

## body_composition
- id: integer (NOT NULL)
- userId: integer (NOT NULL)
- date: date (NOT NULL)
- weight: numeric
- bodyFatPct: numeric
- muscleMass: numeric
- fatMass: numeric
- visceralFat: numeric
- bmi: numeric
- bmr: integer
- notes: text
- source: character varying
- createdAt: timestamp without time zone (NOT NULL)
- updatedAt: timestamp without time zone (NOT NULL)

## heart_rate_logs
- id: integer (NOT NULL)
- userId: integer (NOT NULL)
- date: date (NOT NULL)
- restingHr: integer
- highHr: integer
- hrv: integer
- avgHr: integer
- zone1: integer
- zone2: integer
- zone3: integer
- zone4: integer
- zone5: integer
- notes: text
- source: character varying
- createdAt: timestamp without time zone (NOT NULL)
- updatedAt: timestamp without time zone (NOT NULL)

## sleep_logs
- id: integer (NOT NULL)
- userId: integer (NOT NULL)
- date: date (NOT NULL)
- sleepScore: integer
- bodyBattery: integer
- pulseOx: numeric
- respiration: numeric
- stress: integer
- sleepQuality: character varying
- sleepDuration: numeric
- deepSleep: numeric
- remSleep: numeric
- lightSleep: numeric
- awakeDuration: numeric
- notes: text
- source: character varying
- createdAt: timestamp without time zone (NOT NULL)
- updatedAt: timestamp without time zone (NOT NULL)

## races
- id: bigint (NOT NULL)
- race_name: text (NOT NULL)
- date: date (NOT NULL)
- distance_km: numeric
- location: text
- registration: text
- bib_no: text
- is_pb: boolean
- finish_time: text
- overall_place: integer
- age_group_place: integer
- gender_group_place: integer
- running_shoes: text
- shoes_id: bigint
- notes: text
- created_at: timestamp with time zone
- updated_at: timestamp with time zone

## running_logs
- id: bigint (NOT NULL)
- (more columns at start - need to check)
- average_heart_rate: integer
- maximum_heart_rate: integer
- average_cadence: numeric
- max_cadence: numeric
- avg_stride_length_m: numeric
- avg_vertical_ratio: numeric
- vertical_oscillation_cm: numeric
- avg_ground_contact_time_ms: numeric
- calories: integer
- temperature: numeric
- humidity: numeric
- wind_speed: numeric
- apparent_temp: numeric
- status: text
- notes: text
- created_at: timestamp with time zone
- updated_at: timestamp with time zone

## running_shoes
- id: bigint (NOT NULL)
- shoes_name: text (NOT NULL)
- brand: text
- model: text
- (more columns - need to check)
