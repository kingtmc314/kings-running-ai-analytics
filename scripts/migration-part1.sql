-- Part 1: Users + Body Composition
INSERT INTO users ("openId", currency, theme, role) VALUES ('0b308f84-1dea-4277-bd59-91b4bb229f1c', 'HKD', 'dark', 'user') ON CONFLICT DO NOTHING;

DO $$
DECLARE v_user_id INTEGER;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE "openId" = '0b308f84-1dea-4277-bd59-91b4bb229f1c' LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found!';
  END IF;

  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2022-06-27', 90.6, 35.39, 38.1, 34.5, 31.5, NULL, NULL, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2023-09-07', 84, 32.8, 37.5, 31.5, 48.98, 1503, 14, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2023-11-04', 84.8, 32.31, 34, 28.8, 52.2, 1579, 12, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2023-11-05', 85.1, 32.43, 33, 28.1, 53.2, NULL, NULL, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2023-11-06', 85.4, 32.54, 33.1, 28.3, 53.4, NULL, NULL, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2023-11-07', 85.1, 32.43, 32.2, 27.4, 53.9, NULL, NULL, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2023-11-08', 84.8, 32.31, 33.8, 28.7, 52.3, NULL, NULL, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2023-11-09', 84.6, 32.24, 33, 27.9, 52.9, NULL, NULL, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2025-01-24', 86.7, 31.8, 33.8, 29.3, 50.9, 1940, 11, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2025-02-20', 80.6, 30.7, 30.2, 24.3, 52.65, 1585, 9, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2025-04-06', 84.2, 32.1, 29.1, 24.5, 56.6, 1708, 15, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2025-10-03', 85.2, 33.28, 33.1, 28.2, 54, 1636, 17, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2025-11-18', 85.4, 32.54, 32.4, 27.7, 54.5, NULL, NULL, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2026-01-23', 84.4, 32.2, 32.6, 27.5, 53.23, 1598, 11, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2026-02-27', 82.4, 32.2, 32.3, 26.6, 52.9, 1693, 16, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2026-03-17', 81.9, 32, 34, 28.6, 49.9, 1522, 9, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2026-04-11', 82.3, 32.1, 34.4, 28.3, 47.9, 1868.1, 11, 'google_sheets') ON CONFLICT DO NOTHING;
  INSERT INTO body_composition ("userId", date, weight, bmi, "bodyFatPct", "fatMass", "muscleMass", bmr, "visceralFat", source) VALUES (v_user_id, '2026-04-18', 81.6, 31.9, 32.3, 26.3, 48.5, 1880.8, 10, 'google_sheets') ON CONFLICT DO NOTHING;
END $$;

SELECT 'users' as t, COUNT(*) as n FROM users UNION ALL SELECT 'body_composition', COUNT(*) FROM body_composition;