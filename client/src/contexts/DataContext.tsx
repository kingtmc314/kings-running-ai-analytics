// =============================================================
// King's Running AI Analytics — Global Data Context
// =============================================================
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  GOOGLE_SCRIPT_URL,
  RunLog, Shoe, Race, BodyStat, SleepRecord, HeartRateRecord,
  AIAnalysis, HRZones,
  calculateHRZoneRanges, generateAiAnalysis, parseDate, formatDate,
  getShoeName, parsePrice, STATUS_ORDER, logToSeconds, secondsToHMS, paceToString,
} from "@/lib/runningData";

// ─── Context Shape ────────────────────────────────────────────

interface DataContextValue {
  // Raw data
  logs: RunLog[];
  shoes: Shoe[];
  races: Race[];
  bodyStats: BodyStat[];
  sleeps: SleepRecord[];
  heartRates: HeartRateRecord[];

  // Sync
  syncStatus: "idle" | "loading" | "success" | "error";
  errorMessage: string;
  fetchFromGoogle: () => Promise<void>;

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

  // Computed helpers
  processedShoes: (Shoe & { totalDist: number; usageCount: number; parsedPrice: number })[];
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
  const [syncStatus, setSyncStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);

  const fetchFromGoogle = useCallback(async () => {
    setSyncStatus("loading");
    setErrorMessage("");
    let cleanUrl = GOOGLE_SCRIPT_URL.trim();
    if (!cleanUrl.endsWith("/exec")) cleanUrl = `${cleanUrl}/exec`;
    try {
      const [logRes, shoeRes, raceRes, bodyRes, sleepRes, hrRes] = await Promise.all([
        fetch(`${cleanUrl}?sheet=Running Log&t=${Date.now()}`),
        fetch(`${cleanUrl}?sheet=Running Shoes&t=${Date.now()}`),
        fetch(`${cleanUrl}?sheet=Race&t=${Date.now()}`),
        fetch(`${cleanUrl}?sheet=Body&t=${Date.now()}`),
        fetch(`${cleanUrl}?sheet=Sleep&t=${Date.now()}`).catch(() => ({ json: () => [] })),
        fetch(`${cleanUrl}?sheet=Heart Rate&t=${Date.now()}`).catch(() => ({ json: () => [] })),
      ]);
      const [logData, shoeData, raceData, bodyData, sleepData, hrData] = await Promise.all([
        logRes.json(), shoeRes.json(), raceRes.json(), bodyRes.json(), sleepRes.json(), hrRes.json(),
      ]);
      if (Array.isArray(logData)) setLogs(logData.map((l: Record<string, unknown>, i: number) => ({ ...l, _row: i + 2 } as unknown as RunLog)));
      if (Array.isArray(shoeData)) setShoes(shoeData.map((s: Record<string, unknown>, i: number) => ({ ...s, _row: i + 2 } as unknown as Shoe)));
      if (Array.isArray(raceData)) setRaces(raceData.map((r: Record<string, unknown>, i: number) => ({ ...r, _row: i + 2 } as unknown as Race)));
      if (Array.isArray(bodyData)) setBodyStats(bodyData.map((b: Record<string, unknown>, i: number) => ({ ...b, _row: i + 2 } as unknown as BodyStat)));
      if (Array.isArray(sleepData)) setSleeps(sleepData.map((s: Record<string, unknown>, i: number) => ({ ...s, _row: i + 2 } as unknown as SleepRecord)));
      if (Array.isArray(hrData)) setHeartRates(hrData.map((h: Record<string, unknown>, i: number) => ({ ...h, _row: i + 2 } as unknown as HeartRateRecord)));
      setSyncStatus("success");
    } catch (err) {
      console.error(err);
      setSyncStatus("error");
      setErrorMessage("Failed to fetch. Check URL.");
    }
  }, []);

  useEffect(() => { fetchFromGoogle(); }, [fetchFromGoogle]);

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

  // Processed shoes
  const processedShoes = useMemo(() => {
    return [...shoes].map((shoe) => {
      const raw = shoe as unknown as Record<string, string>;
      const name = raw["Shoes"] || raw["Shoes Name"] || "";
      const totalDist = logs
        .filter((l) => getShoeName(l) === name)
        .reduce((acc, l) => acc + (parseFloat(String((l as unknown as Record<string, string>)["Distance (km)"] || "0")) || 0), 0);
      const usageCount = logs.filter((l) => getShoeName(l) === name).length;
      const parsedPrice = parsePrice(raw["Shoes Price"]);
      return { ...shoe, totalDist, usageCount, parsedPrice };
    }).sort((a, b) => {
      const aRaw = a as unknown as Record<string, string>;
      const bRaw = b as unknown as Record<string, string>;
      return (STATUS_ORDER[aRaw["Status"] || ""] || 99) - (STATUS_ORDER[bRaw["Status"] || ""] || 99);
    });
  }, [shoes, logs]);

  // Processed races
  const processedRacesList = useMemo(() => {
    return races.map((race) => {
      const matchedLog = logs.find(
        (l) =>
          formatDate(parseDate(l.Date) || new Date()) === formatDate(parseDate(race.日期) || new Date()) &&
          l["Running Type"] === "Race"
      );
      const logData = matchedLog || {};
      const timeSec = matchedLog ? logToSeconds(matchedLog) : 0;
      const dist = parseFloat(race["距離 (km)"] || "0");
      const paceSec = timeSec > 0 && dist > 0 ? (timeSec / 60) / dist * 60 : 0;
      return { ...race, logData, timeSec, paceSec };
    });
  }, [races, logs]);

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
      syncStatus, errorMessage, fetchFromGoogle,
      latestRestingHR, hrZones, aiAnalysis, generateAI,
      setLogs, setShoes, setRaces, setBodyStats, setSleeps, setHeartRates,
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
