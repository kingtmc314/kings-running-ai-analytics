// =============================================================
// King's Running AI Analytics — Global Data Context
// v1.1.0 — Supabase Integration
// =============================================================
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  RunLog, Shoe, Race, BodyStat, SleepRecord, HeartRateRecord,
  AIAnalysis, HRZones,
  calculateHRZoneRanges, generateAiAnalysis, parseDate, formatDate,
  STATUS_ORDER, logToSeconds,
} from "@/lib/runningData";
import {
  supabase,
  SupabaseRunLog, SupabaseShoe, SupabaseRace,
  SupabaseBodyComposition, SupabaseSleepLog, SupabaseHeartRateLog,
  fetchRunningLogs, fetchRunningShoes, fetchRaces,
  fetchBodyComposition, fetchSleepLogs, fetchHeartRateLogs,
  addRunningLog, updateRunningLog, deleteRunningLog,
  addRunningShoe, updateRunningShoe, deleteRunningShoe,
  addRace, updateRace, deleteRace,
  addBodyComposition, updateBodyComposition, deleteBodyComposition,
  addSleepLog, updateSleepLog, deleteSleepLog,
  addHeartRateLog, updateHeartRateLog, deleteHeartRateLog,
} from "@/lib/supabase";

// ─── Mapping helpers: Supabase → legacy RunLog/Shoe/Race types ──

function mapSupabaseRunLog(r: SupabaseRunLog): RunLog {
  return {
    _row: r.id,
    Date: r.date,
    "Distance (km)": String(r.distance_km ?? ""),
    Hour: String(r.hour ?? "0"),
    Minutes: String(r.minutes ?? "0"),
    Second: String(r.second ?? "0"),
    "Running Type": r.running_type ?? "",
    "Average Heart Rate": String(r.average_heart_rate ?? ""),
    "Maximum Heart Rate": String(r.maximum_heart_rate ?? ""),
    "Running Shoes": r.running_shoes ?? "",
    shoes_id: r.shoes_id,
    "Average Pace": r.average_pace ?? "",
    "Best Pace": r.best_pace ?? "",
    "Average Cadence": String(r.average_cadence ?? ""),
    "Max Cadence": String(r.max_cadence ?? ""),
    Calories: String(r.calories ?? ""),
    Temperature: String(r.temperature ?? ""),
    Humidity: String(r.humidity ?? ""),
    "Wind Speed": String(r.wind_speed ?? ""),
    Notes: r.notes ?? "",
    status: r.status ?? "",
    _supabaseId: r.id,
  } as unknown as RunLog;
}

function mapSupabaseShoe(s: SupabaseShoe): Shoe {
  return {
    _row: s.id,
    Shoes: s.shoes_name,
    "Shoes Name": s.shoes_name,
    "Shoes Brand": s.brand ?? "",
    "Shoes Model": s.model ?? "",
    Status: s.status ?? "",
    "Purchase Date": s.purchase_date ?? "",
    "Retired Date": s.retirement_date ?? "",
    initial_km: s.initial_km,
    Notes: s.notes ?? "",
    _supabaseId: s.id,
  } as unknown as Shoe;
}

function mapSupabaseRace(r: SupabaseRace): Race {
  return {
    _row: r.id,
    賽事: r.race_name,
    日期: r.date,
    "距離 (km)": String(r.distance_km ?? ""),
    完成: r.finish_time ? true : false,
    Location: r.location ?? "",
    Registration: r.registration ?? "",
    BibNo: r.bib_no ?? "",
    IsPB: r.is_pb ?? false,
    "Finish Time": r.finish_time ?? "",
    "Overall Place": String(r.overall_place ?? ""),
    "Age Group Place": String(r.age_group_place ?? ""),
    "Gender Group Place": String(r.gender_group_place ?? ""),
    "Running Shoes": r.running_shoes ?? "",
    shoes_id: r.shoes_id,
    Notes: r.notes ?? "",
    _supabaseId: r.id,
  } as unknown as Race;
}

function mapSupabaseBody(b: SupabaseBodyComposition): BodyStat {
  return {
    _row: b.id,
    Date: b.date,
    Weight: String(b.weight ?? ""),
    BMI: String(b.bmi ?? ""),
    BodyFat: String(b.bodyFatPct ?? ""),
    "Body Fat": String(b.bodyFatPct ?? ""),
    MuscleMass: String(b.muscleMass ?? ""),
    FatMass: String(b.fatMass ?? ""),
    VisceralFat: String(b.visceralFat ?? ""),
    BMR: String(b.bmr ?? ""),
    Notes: b.notes ?? "",
    _supabaseId: b.id,
  } as unknown as BodyStat;
}

function mapSupabaseSleep(s: SupabaseSleepLog): SleepRecord {
  return {
    _row: s.id,
    Date: s.date,
    Score: String(s.sleepScore ?? ""),
    "Resting Heart Rate": "",
    "Body Battery": String(s.bodyBattery ?? ""),
    "Sleep Quality": s.sleepQuality ?? "",
    "Sleep Duration": String(s.sleepDuration ?? ""),
    "Pulse Ox": String(s.pulseOx ?? ""),
    Respiration: String(s.respiration ?? ""),
    Notes: s.notes ?? "",
    _supabaseId: s.id,
  } as unknown as SleepRecord;
}

function mapSupabaseHR(h: SupabaseHeartRateLog): HeartRateRecord {
  return {
    _row: h.id,
    Date: h.date,
    Resting: String(h.restingHr ?? ""),
    High: String(h.highHr ?? ""),
    HRV: String(h.hrv ?? ""),
    AvgHR: String(h.avgHr ?? ""),
    _supabaseId: h.id,
  } as unknown as HeartRateRecord;
}

// ─── Context Shape ────────────────────────────────────────────

interface DataContextValue {
  // Raw data
  logs: RunLog[];
  shoes: Shoe[];
  races: Race[];
  bodyStats: BodyStat[];
  sleeps: SleepRecord[];
  heartRates: HeartRateRecord[];

  // Raw Supabase data (for components that need exact Supabase types)
  supabaseLogs: SupabaseRunLog[];
  supabaseShoes: SupabaseShoe[];
  supabaseRaces: SupabaseRace[];
  supabaseBodyStats: SupabaseBodyComposition[];
  supabaseSleeps: SupabaseSleepLog[];
  supabaseHeartRates: SupabaseHeartRateLog[];

  // Sync
  syncStatus: "idle" | "loading" | "success" | "error";
  errorMessage: string;
  fetchFromGoogle: () => Promise<void>; // kept for compatibility, now fetches from Supabase
  refreshData: () => Promise<void>;

  // Derived
  latestRestingHR: number;
  hrZones: HRZones | null;
  aiAnalysis: AIAnalysis | null;
  generateAI: () => void;

  // Setters (for Log Data tab)
  setLogs: React.Dispatch<React.SetStateAction<RunLog[]>>;
  setShoes: React.Dispatch<React.SetStateAction<Shoe[]>>;
  setRaces: React.Dispatch<React.SetStateAction<Race[]>>;
  setBodyStats: React.Dispatch<React.SetStateAction<BodyStat[]>>;
  setSleeps: React.Dispatch<React.SetStateAction<SleepRecord[]>>;
  setHeartRates: React.Dispatch<React.SetStateAction<HeartRateRecord[]>>;

  // Supabase CRUD — Running Logs
  addLog: (log: Omit<SupabaseRunLog, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateLog: (id: number, log: Partial<SupabaseRunLog>) => Promise<void>;
  deleteLog: (id: number) => Promise<void>;

  // Supabase CRUD — Running Shoes
  addShoe: (shoe: Omit<SupabaseShoe, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateShoe: (id: number, shoe: Partial<SupabaseShoe>) => Promise<void>;
  deleteShoe: (id: number) => Promise<void>;

  // Supabase CRUD — Races
  addRaceEntry: (race: Omit<SupabaseRace, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateRaceEntry: (id: number, race: Partial<SupabaseRace>) => Promise<void>;
  deleteRaceEntry: (id: number) => Promise<void>;

  // Supabase CRUD — Body Composition
  addBodyEntry: (body: Omit<SupabaseBodyComposition, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateBodyEntry: (id: number, body: Partial<SupabaseBodyComposition>) => Promise<void>;
  deleteBodyEntry: (id: number) => Promise<void>;

  // Supabase CRUD — Sleep Logs
  addSleepEntry: (sleep: Omit<SupabaseSleepLog, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateSleepEntry: (id: number, sleep: Partial<SupabaseSleepLog>) => Promise<void>;
  deleteSleepEntry: (id: number) => Promise<void>;

  // Supabase CRUD — Heart Rate Logs
  addHREntry: (hr: Omit<SupabaseHeartRateLog, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateHREntry: (id: number, hr: Partial<SupabaseHeartRateLog>) => Promise<void>;
  deleteHREntry: (id: number) => Promise<void>;

  // Computed helpers
  processedShoes: (Shoe & { totalDist: number; usageCount: number; parsedPrice: number; costPerKm: number; shoesName: string })[];
  processedRacesList: (Race & { timeSec: number; paceSec: number; logData: Partial<RunLog> })[];
  raceStats: {
    totalRaces: number;
    totalPB: number;
    bestTimes: Record<string, { race: Race; timeSec: number; paceSec: number; logData: Partial<RunLog> }>;
  };
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [bodyStats, setBodyStats] = useState<BodyStat[]>([]);
  const [sleeps, setSleeps] = useState<SleepRecord[]>([]);
  const [heartRates, setHeartRates] = useState<HeartRateRecord[]>([]);

  const [supabaseLogs, setSupabaseLogs] = useState<SupabaseRunLog[]>([]);
  const [supabaseShoes, setSupabaseShoes] = useState<SupabaseShoe[]>([]);
  const [supabaseRaces, setSupabaseRaces] = useState<SupabaseRace[]>([]);
  const [supabaseBodyStats, setSupabaseBodyStats] = useState<SupabaseBodyComposition[]>([]);
  const [supabaseSleeps, setSupabaseSleeps] = useState<SupabaseSleepLog[]>([]);
  const [supabaseHeartRates, setSupabaseHeartRates] = useState<SupabaseHeartRateLog[]>([]);

  const [syncStatus, setSyncStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);

  const refreshData = useCallback(async () => {
    setSyncStatus("loading");
    setErrorMessage("");
    try {
      const [logData, shoeData, raceData, bodyData, sleepData, hrData] = await Promise.all([
        fetchRunningLogs(),
        fetchRunningShoes(),
        fetchRaces(),
        fetchBodyComposition(),
        fetchSleepLogs(),
        fetchHeartRateLogs(),
      ]);

      setSupabaseLogs(logData);
      setSupabaseShoes(shoeData);
      setSupabaseRaces(raceData);
      setSupabaseBodyStats(bodyData);
      setSupabaseSleeps(sleepData);
      setSupabaseHeartRates(hrData);

      setLogs(logData.map(mapSupabaseRunLog));
      setShoes(shoeData.map(mapSupabaseShoe));
      setRaces(raceData.map(mapSupabaseRace));
      setBodyStats(bodyData.map(mapSupabaseBody));
      setSleeps(sleepData.map(mapSupabaseSleep));
      setHeartRates(hrData.map(mapSupabaseHR));

      setSyncStatus("success");
    } catch (err) {
      console.error("Supabase fetch error:", err);
      setSyncStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to fetch from Supabase.");
    }
  }, []);

  // fetchFromGoogle kept for compatibility — now fetches from Supabase
  const fetchFromGoogle = refreshData;

  useEffect(() => { refreshData(); }, [refreshData]);

  // ─── CRUD Operations ─────────────────────────────────────────

  const addLog = useCallback(async (log: Omit<SupabaseRunLog, "id" | "created_at" | "updated_at">) => {
    await addRunningLog(log);
    await refreshData();
  }, [refreshData]);

  const updateLog = useCallback(async (id: number, log: Partial<SupabaseRunLog>) => {
    await updateRunningLog(id, log);
    await refreshData();
  }, [refreshData]);

  const deleteLog = useCallback(async (id: number) => {
    await deleteRunningLog(id);
    await refreshData();
  }, [refreshData]);

  const addShoe = useCallback(async (shoe: Omit<SupabaseShoe, "id" | "created_at" | "updated_at">) => {
    await addRunningShoe(shoe);
    await refreshData();
  }, [refreshData]);

  const updateShoe = useCallback(async (id: number, shoe: Partial<SupabaseShoe>) => {
    await updateRunningShoe(id, shoe);
    await refreshData();
  }, [refreshData]);

  const deleteShoe = useCallback(async (id: number) => {
    await deleteRunningShoe(id);
    await refreshData();
  }, [refreshData]);

  const addRaceEntry = useCallback(async (race: Omit<SupabaseRace, "id" | "created_at" | "updated_at">) => {
    await addRace(race);
    await refreshData();
  }, [refreshData]);

  const updateRaceEntry = useCallback(async (id: number, race: Partial<SupabaseRace>) => {
    await updateRace(id, race);
    await refreshData();
  }, [refreshData]);

  const deleteRaceEntry = useCallback(async (id: number) => {
    await deleteRace(id);
    await refreshData();
  }, [refreshData]);

  const addBodyEntry = useCallback(async (body: Omit<SupabaseBodyComposition, "id" | "createdAt" | "updatedAt">) => {
    await addBodyComposition(body);
    await refreshData();
  }, [refreshData]);

  const updateBodyEntry = useCallback(async (id: number, body: Partial<SupabaseBodyComposition>) => {
    await updateBodyComposition(id, body);
    await refreshData();
  }, [refreshData]);

  const deleteBodyEntry = useCallback(async (id: number) => {
    await deleteBodyComposition(id);
    await refreshData();
  }, [refreshData]);

  const addSleepEntry = useCallback(async (sleep: Omit<SupabaseSleepLog, "id" | "createdAt" | "updatedAt">) => {
    await addSleepLog(sleep);
    await refreshData();
  }, [refreshData]);

  const updateSleepEntry = useCallback(async (id: number, sleep: Partial<SupabaseSleepLog>) => {
    await updateSleepLog(id, sleep);
    await refreshData();
  }, [refreshData]);

  const deleteSleepEntry = useCallback(async (id: number) => {
    await deleteSleepLog(id);
    await refreshData();
  }, [refreshData]);

  const addHREntry = useCallback(async (hr: Omit<SupabaseHeartRateLog, "id" | "createdAt" | "updatedAt">) => {
    await addHeartRateLog(hr);
    await refreshData();
  }, [refreshData]);

  const updateHREntry = useCallback(async (id: number, hr: Partial<SupabaseHeartRateLog>) => {
    await updateHeartRateLog(id, hr);
    await refreshData();
  }, [refreshData]);

  const deleteHREntry = useCallback(async (id: number) => {
    await deleteHeartRateLog(id);
    await refreshData();
  }, [refreshData]);

  // ─── Derived Data ─────────────────────────────────────────────

  const latestRestingHR = useMemo(() => {
    const sorted = [...heartRates].sort(
      (a, b) => (parseDate(b.Date)?.getTime() || 0) - (parseDate(a.Date)?.getTime() || 0)
    );
    return sorted.length > 0 ? parseFloat(String(sorted[0].Resting)) : 60;
  }, [heartRates]);

  const hrZones = useMemo(() => calculateHRZoneRanges(latestRestingHR), [latestRestingHR]);

  const generateAI = useCallback(() => {
    const result = generateAiAnalysis(logs, shoes, races, bodyStats, sleeps, heartRates);
    setAiAnalysis(result);
  }, [logs, shoes, races, bodyStats, sleeps, heartRates]);

  useEffect(() => {
    if (syncStatus === "success") generateAI();
  }, [syncStatus, generateAI]);

  // Processed shoes — use Supabase field names
  const processedShoes = useMemo(() => {
    return [...supabaseShoes].map((shoe) => {
      const shoesName = shoe.shoes_name || "";
      // Count km from running_logs
      const totalDist = supabaseLogs
        .filter((l) => l.running_shoes === shoesName || l.shoes_id === shoe.id)
        .reduce((acc, l) => acc + (l.distance_km || 0), 0) + (shoe.initial_km || 0);
      const usageCount = supabaseLogs.filter((l) => l.running_shoes === shoesName || l.shoes_id === shoe.id).length;
      const parsedPrice = 0; // price not in Supabase schema yet
      const costPerKm = 0;
      // Map to legacy Shoe type for compatibility
      const legacyShoe = mapSupabaseShoe(shoe);
      return { ...legacyShoe, totalDist, usageCount, parsedPrice, costPerKm, shoesName };
    }).sort((a, b) => {
      return (STATUS_ORDER[a.Status || ""] || 99) - (STATUS_ORDER[b.Status || ""] || 99);
    });
  }, [supabaseShoes, supabaseLogs]);

  // Processed races — use Supabase field names
  const processedRacesList = useMemo(() => {
    return supabaseRaces.map((race) => {
      const matchedLog = supabaseLogs.find(
        (l) =>
          formatDate(parseDate(l.date) || new Date()) === formatDate(parseDate(race.date) || new Date()) &&
          l.running_type === "Race"
      );
      const logData = matchedLog ? mapSupabaseRunLog(matchedLog) : {};
      const timeSec = matchedLog ? (matchedLog.hour || 0) * 3600 + (matchedLog.minutes || 0) * 60 + (matchedLog.second || 0) : 0;
      const dist = race.distance_km || 0;
      const paceSec = timeSec > 0 && dist > 0 ? (timeSec / 60) / dist * 60 : 0;
      const legacyRace = mapSupabaseRace(race);
      return { ...legacyRace, logData, timeSec, paceSec };
    });
  }, [supabaseRaces, supabaseLogs]);

  // Race stats / PBs
  const raceStats = useMemo(() => {
    const distMap: Record<string, { race: Race; timeSec: number; paceSec: number; logData: Partial<RunLog> }> = {};
    const DIST_KEYS: Record<string, string> = {
      "5": "5K", "5.0": "5K",
      "10": "10K", "10.0": "10K",
      "21.0975": "Half Marathon", "21.1": "Half Marathon", "21": "Half Marathon",
      "42.195": "Marathon", "42.2": "Marathon", "42": "Marathon",
    };
    processedRacesList.forEach((race) => {
      if (!race.timeSec || !race.完成) return;
      const rawDist = String(race["距離 (km)"] || "").trim();
      const distKey = DIST_KEYS[rawDist];
      if (!distKey) return;
      if (!distMap[distKey] || race.timeSec < distMap[distKey].timeSec) {
        distMap[distKey] = { race, timeSec: race.timeSec, paceSec: race.paceSec, logData: race.logData };
      }
    });
    return {
      totalRaces: processedRacesList.length,
      totalPB: Object.keys(distMap).length,
      bestTimes: distMap,
    };
  }, [processedRacesList]);

  return (
    <DataContext.Provider value={{
      logs, shoes, races, bodyStats, sleeps, heartRates,
      supabaseLogs, supabaseShoes, supabaseRaces, supabaseBodyStats, supabaseSleeps, supabaseHeartRates,
      syncStatus, errorMessage, fetchFromGoogle, refreshData,
      latestRestingHR, hrZones, aiAnalysis, generateAI,
      setLogs, setShoes, setRaces, setBodyStats, setSleeps, setHeartRates,
      addLog, updateLog, deleteLog,
      addShoe, updateShoe, deleteShoe,
      addRaceEntry, updateRaceEntry, deleteRaceEntry,
      addBodyEntry, updateBodyEntry, deleteBodyEntry,
      addSleepEntry, updateSleepEntry, deleteSleepEntry,
      addHREntry, updateHREntry, deleteHREntry,
      processedShoes, processedRacesList, raceStats,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
