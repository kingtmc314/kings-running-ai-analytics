// =============================================================
// King's Running AI Analytics — Core Data Types & Utilities
// =============================================================

export const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxzbZ7TVsvpkfJncRRLz3r_QCO2GO4aAbRpWDDEfCgY7N5Mha_8RQg71G_wT9DZKbqvLg/exec";

export const MAX_HR = 202;

// ─── Types ────────────────────────────────────────────────────

export interface RunLog {
  _row: number;
  Date: string;
  "Distance (km)": string;
  Hour: string;
  Minutes: string;
  Second: string;
  "Running Type": string;
  "Average Heart Rate": string;
  "Maximum Heart Rate": string;
  Running_Shoes?: string;
  "Running Shoes"?: string;
  "Shoes Name"?: string;
  Shoes?: string;
  Calories?: string;
  "Average Cadence"?: string;
  "Max Cadence"?: string;
  "Average Pace"?: string;
  "Ground Contact Time"?: string;
  Temperature?: string;
  Humidity?: string;
  "Wind Speed"?: string;
  Notes?: string;
  [key: string]: string | number | undefined;
}

export interface Shoe {
  _row: number;
  Shoes: string;
  "Shoes Name"?: string;
  "Shoes Brand": string;
  "Shoes Price"?: string;
  "Purchase Date"?: string;
  "First Use"?: string;
  "Retired Date"?: string;
  Status?: string;
  ItemPhoto?: string;
  [key: string]: string | number | undefined;
}

export interface Race {
  _row: number;
  賽事: string;
  日期: string;
  "距離 (km)": string;
  完成?: boolean | string;
  "Overall Place"?: string;
  "Age Group Place"?: string;
  logData?: Partial<RunLog>;
  [key: string]: string | number | boolean | Partial<RunLog> | undefined;
}

export interface BodyStat {
  _row: number;
  Date: string;
  Height?: string;
  Weight?: string;
  BMI?: string;
  BodyFat?: string;
  FatMass?: string;
  FFM?: string;
  MuscleMass?: string;
  TrunkMass?: string;
  Protein?: string;
  BoneMass?: string;
  BodyWater?: string;
  BodyWaterPercent?: string;
  BMR?: string;
  VisceralFat?: string;
  [key: string]: string | number | undefined;
}

export interface SleepRecord {
  _row: number;
  Date: string;
  Score?: string;
  "Resting Heart Rate"?: string;
  "Body Battery"?: string;
  "Pulse Ox"?: string;
  Respiration?: string;
  "Skin Temp Change"?: string;
  Stress?: string;
  Quality?: string;
  Duration?: string;
  "Sleep Need"?: string;
  Bedtime?: string;
  "Wake Time"?: string;
  [key: string]: string | number | undefined;
}

export interface HeartRateRecord {
  _row: number;
  Date: string;
  Resting: string;
  High?: string;
  [key: string]: string | number | undefined;
}

// ─── HR Zone Calculation ──────────────────────────────────────

export interface HRZones {
  Z1: string;
  Z2: string;
  Z3: string;
  Z4: string;
  Z5: string;
}

export function calculateHRZoneRanges(restingHR: number): HRZones {
  const hrr = MAX_HR - restingHR;
  return {
    Z1: `${Math.round(restingHR + hrr * 0.59)} - ${Math.round(restingHR + hrr * 0.74)}`,
    Z2: `${Math.round(restingHR + hrr * 0.74)} - ${Math.round(restingHR + hrr * 0.84)}`,
    Z3: `${Math.round(restingHR + hrr * 0.84)} - ${Math.round(restingHR + hrr * 0.88)}`,
    Z4: `${Math.round(restingHR + hrr * 0.88)} - ${Math.round(restingHR + hrr * 0.95)}`,
    Z5: `${Math.round(restingHR + hrr * 0.95)} - ${MAX_HR}`,
  };
}

export function getHRZone(avgHR: number, restingHR: number) {
  if (!avgHR || !restingHR) return { zone: "-", color: "text-slate-500", bg: "bg-slate-500/20" };
  const hrr = MAX_HR - restingHR;
  const percent = (avgHR - restingHR) / hrr;
  if (percent < 0.59) return { zone: "< Z1", color: "text-slate-400", bg: "bg-slate-400/20" };
  if (percent < 0.74) return { zone: "Z1", color: "text-blue-400", bg: "bg-blue-400/20" };
  if (percent < 0.84) return { zone: "Z2", color: "text-emerald-400", bg: "bg-emerald-400/20" };
  if (percent < 0.88) return { zone: "Z3", color: "text-amber-400", bg: "bg-amber-400/20" };
  if (percent < 0.95) return { zone: "Z4", color: "text-orange-400", bg: "bg-orange-400/20" };
  return { zone: "Z5", color: "text-red-400", bg: "bg-red-400/20" };
}

// ─── Date Utilities ───────────────────────────────────────────

export function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const str = String(s).trim();
  // DD/MM/YYYY
  const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  // YYYY-MM-DD
  const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return new Date(+ymd[1], +ymd[2] - 1, +ymd[3]);
  // ISO 8601 with time (e.g. 2026-05-04T16:00:00.000Z)
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${m}/${y}`;
}

export function formatDateDisplay(s: string | undefined): string {
  const d = parseDate(s);
  if (!d) return "-";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Shoe Utilities ───────────────────────────────────────────

export function getShoeName(log: Partial<RunLog>): string {
  if (!log) return "";
  return (
    (log as Record<string, string>)["Running Shoes"] ||
    (log as Record<string, string>)["Running_Shoes"] ||
    (log as Record<string, string>)["Shoes Name"] ||
    (log as Record<string, string>)["Shoes"] ||
    ""
  );
}

export function parsePrice(price: string | undefined): number {
  if (!price) return 0;
  return parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0;
}

export const STATUS_ORDER: Record<string, number> = {
  "In Use": 1,
  "Not Yet Opened": 2,
  Retired: 3,
};

// ─── Time Utilities ───────────────────────────────────────────

export function secondsToHMS(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function paceToString(paceSec: number): string {
  if (!paceSec || paceSec <= 0) return "-:--";
  const m = Math.floor(paceSec / 60);
  const s = Math.round(paceSec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function logToSeconds(log: Partial<RunLog>): number {
  const raw = log as unknown as Record<string, unknown>;
  const h = parseInt(String(raw["Hour"] ?? "0")) || 0;
  const m = parseInt(String(raw["Minutes"] ?? "0")) || 0;
  const s = parseFloat(String(raw["Second"] ?? "0")) || 0;
  return h * 3600 + m * 60 + s;
}

// ─── Run Type Colors ──────────────────────────────────────────

export const RUN_TYPE_COLORS: Record<string, string> = {
  Easy: "#3b82f6",
  Interval: "#ef4444",
  Long: "#a855f7",
  Race: "#eab308",
  Recovery: "#10b981",
  Trail: "#78716c",
  Fartlek: "#ec4899",
  Tempo: "#f97316",
  Sprint: "#06b6d4",
  "Heart Rate": "#ef4444",
  "Time Trial": "#8b5cf6",
  "Theadmill (Gym)": "#64748b",
};

export const RUN_TYPE_BADGE: Record<string, string> = {
  Easy: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Interval: "bg-red-500/20 text-red-300 border-red-500/30",
  Long: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Race: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Recovery: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Trail: "bg-stone-500/20 text-stone-300 border-stone-500/30",
  Fartlek: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Tempo: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Sprint: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Heart Rate": "bg-red-500/20 text-red-300 border-red-500/30",
  "Time Trial": "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "Theadmill (Gym)": "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

// ─── Apparent Temperature ─────────────────────────────────────

export function calcApparentTemp(T: number, H: number, W: number): number {
  return parseFloat((1.07 * T + 0.2 * H * 100 - 0.65 * W - 2.7).toFixed(1));
}

// ─── Shoe Score (AI) ─────────────────────────────────────────

export function scoreShoe(
  shoeName: string,
  isXC: boolean,
  dist: number,
  isHotWet: boolean
): number {
  let score = 0;
  const n = shoeName.toLowerCase();
  if (isXC) {
    if (n.includes("speedgoat") || n.includes("clifton") || n.includes("trail")) score += 30;
    if (n.includes("kayano") || n.includes("novablast")) score += 10;
  } else {
    if (dist <= 10) {
      if (n.includes("adios pro") || n.includes("metaspeed") || n.includes("vaporfly") || n.includes("sc elite")) score += 30;
      if (n.includes("superblast") || n.includes("magic speed")) score += 20;
      if (n.includes("evo sl") || n.includes("boston")) score += 10;
    } else if (dist <= 21.1) {
      if (n.includes("adios pro") || n.includes("metaspeed") || n.includes("superblast") || n.includes("sc elite")) score += 30;
      if (n.includes("vaporfly") || n.includes("magic speed")) score += 20;
    } else {
      if (n.includes("adios pro") || n.includes("superblast") || n.includes("sc elite")) score += 30;
      if (n.includes("metaspeed") || n.includes("vaporfly")) score += 20;
    }
    if (isHotWet && (n.includes("metaspeed") || n.includes("adios pro 4"))) score += 10;
  }
  return score;
}

// ─── AI Race Prediction ───────────────────────────────────────

export interface RacePrediction {
  race: Race;
  selectedShoe: string;
  alternatives: string[];
  why: string;
  dataAnalysis: string;
  raceStrategy: string;
  predictedMin: string;
  predictedMax: string;
  paceMin: string;
  paceMax: string;
}

export interface AIAnalysis {
  intro: { title: string; p1: string; p2: string; p3: string };
  predictions: RacePrediction[];
}

export function generateAiAnalysis(
  logs: RunLog[],
  shoes: Shoe[],
  races: Race[],
  bodyStats: BodyStat[],
  sleeps: SleepRecord[],
  heartRates: HeartRateRecord[]
): AIAnalysis {
  const now = new Date();

  // Latest metrics
  const sortedHR = [...heartRates].sort(
    (a, b) => (parseDate(b.Date)?.getTime() || 0) - (parseDate(a.Date)?.getTime() || 0)
  );
  const latestRestingHR = sortedHR.length > 0 ? parseFloat(sortedHR[0].Resting) : 60;

  const sortedBody = [...bodyStats].sort(
    (a, b) => (parseDate(b.Date)?.getTime() || 0) - (parseDate(a.Date)?.getTime() || 0)
  );
  const latestWeight = sortedBody.length > 0 ? parseFloat(sortedBody[0].Weight || "0") : 0;

  const sortedSleep = [...sleeps].sort(
    (a, b) => (parseDate(b.Date)?.getTime() || 0) - (parseDate(a.Date)?.getTime() || 0)
  );
  const latestSleep = sortedSleep[0];
  const sleepText =
    latestSleep?.Score
      ? `Your recent sleep score of ${latestSleep.Score} and resting HR of ${latestRestingHR} bpm indicates excellent recovery.`
      : `Your resting HR of ${latestRestingHR} bpm indicates good recovery.`;

  // Best 10K for baseline
  const raceLogs = logs.filter((l) => l["Running Type"] === "Race");
  let best10kSec = 0;
  raceLogs.forEach((l) => {
    const dist = parseFloat(l["Distance (km)"] || "0");
    if (dist >= 9.5 && dist <= 10.5) {
      const sec = logToSeconds(l);
      if (sec > 0 && (best10kSec === 0 || sec < best10kSec)) best10kSec = sec;
    }
  });

  // Fallback: use recent tempo pace
  if (!best10kSec) {
    const tempoLogs = logs
      .filter((l) => l["Running Type"] === "Tempo" && parseFloat(l["Distance (km)"] || "0") > 0)
      .sort((a, b) => (parseDate(b.Date)?.getTime() || 0) - (parseDate(a.Date)?.getTime() || 0));
    if (tempoLogs.length > 0) {
      const tl = tempoLogs[0];
      const paceStr = tl["Average Pace"] || "";
      const pm = paceStr.match(/(\d+):(\d+)/);
      if (pm) {
        const paceSec = parseInt(pm[1]) * 60 + parseInt(pm[2]);
        best10kSec = paceSec * 10;
      }
    }
  }

  if (!best10kSec) best10kSec = 3600; // 60 min fallback

  // In-use shoes
  const inUseShoes = shoes.filter((s) => s.Status === "In Use").map((s) => s.Shoes || s["Shoes Name"] || "");

  // Past races for narrative
  const pastRaces = races
    .filter((r) => {
      const d = parseDate(r.日期);
      return d && d < now && r.完成;
    })
    .sort((a, b) => (parseDate(b.日期)?.getTime() || 0) - (parseDate(a.日期)?.getTime() || 0));

  let intro: AIAnalysis["intro"];
  if (pastRaces.length > 0) {
    const latest = pastRaces[0];
    const matchedLog = logs.find(
      (l) =>
        formatDate(parseDate(l.Date) || new Date()) === formatDate(parseDate(latest.日期) || new Date()) &&
        l["Running Type"] === "Race"
    );
    const dist = parseFloat(latest["距離 (km)"]);
    const shoe = matchedLog ? getShoeName(matchedLog) : "your shoes";
    const time = matchedLog ? secondsToHMS(logToSeconds(matchedLog)) : "--:--";
    const pace = matchedLog
      ? paceToString((logToSeconds(matchedLog) / 60) / dist)
      : "-:--";
    intro = {
      title: `Massive congratulations on your recent performance at the ${latest.賽事}!`,
      p1: `According to your newly updated log, you finished ${dist}km in **${time}**, holding a fantastic average pace of **${pace}/km** with your **${shoe}**.`,
      p2: latestWeight > 0
        ? `You also successfully brought your weight to ${latestWeight}kg, which is clearly paying off in your performance. ${sleepText}`
        : sleepText,
      p3: `Since we now have hard, real-world data, we can make highly accurate, data-driven predictions for your upcoming races using strictly your **"In Use"** shoe rotation.`,
    };
  } else {
    intro = {
      title: `Welcome to your Personalized AI Coach!`,
      p1: `I've analyzed your ${logs.length} logged activities, sleep data, and your current "In Use" shoe rotation.`,
      p2: `Based on your training volume and recent metrics (${sleepText}), we can project your optimal race strategies.`,
      p3: `Here is your detailed race strategy and prediction for your upcoming events:`,
    };
  }

  // Upcoming races
  const upcomingRaces = races
    .filter((r) => {
      const d = parseDate(r.日期);
      return d && d >= now;
    })
    .sort((a, b) => (parseDate(a.日期)?.getTime() || 0) - (parseDate(b.日期)?.getTime() || 0));

  const predictions: RacePrediction[] = upcomingRaces.map((race) => {
    const dist = parseFloat(race["距離 (km)"] || "10");
    const isXC = race.賽事.includes("越野") || race.賽事.includes("Trail") || race.賽事.toLowerCase().includes("trail");
    const raceDateObj = parseDate(race.日期);
    const raceMonth = raceDateObj ? raceDateObj.getMonth() + 1 : 1;
    const isHotWet = raceMonth >= 5 && raceMonth <= 9;

    // Score shoes
    const scored = inUseShoes
      .map((name) => ({ name, score: scoreShoe(name, isXC, dist, isHotWet) }))
      .sort((a, b) => b.score - a.score);

    const selectedShoe = scored[0]?.name || inUseShoes[0] || "Your race shoe";
    const alternatives = scored.slice(1, 4).map((s) => s.name);

    let why = "";
    const sn = selectedShoe.toLowerCase();
    if (isXC) {
      why = `${selectedShoe} is chosen for its trail-specific grip and cushioning, essential for off-road terrain.`;
    } else if (dist <= 10) {
      if (sn.includes("adios pro") || sn.includes("metaspeed")) {
        why = `${selectedShoe} is chosen for its breathability and speed profile, perfect for ${isHotWet ? "hot/humid" : "cool"} conditions in month ${raceMonth} while maximizing your pace.`;
      } else {
        why = `${selectedShoe} offers aggressive energy return. Your target pace requires mechanical advantage, and the ${isHotWet ? "warm" : "cool"} weather will ${isHotWet ? "require good breathability" : "prevent overheating"}.`;
      }
    } else {
      why = `For a runner tackling over ${dist <= 21.1 ? "2 hours" : "4 hours"}, the geometry and cushioning of the ${selectedShoe} provides superior leg-saving protection compared to a harsh racing flat.`;
    }

    let dataAnalysis = "";
    const weightText = latestWeight > 0 ? `dropping from 90.6kg to ${latestWeight}kg and ` : "";
    if (dist <= 10) {
      dataAnalysis = `If you continue your current trajectory (${weightText}improving your tempo pace), a strong performance is highly realistic. Your recent bests show you have the lactate threshold to push hard.`;
    } else if (dist <= 21.1) {
      dataAnalysis = `Your recent best equivalent 10k time projects well for this distance. With a proper taper, your aerobic base is strong enough to maintain a steady threshold pace.`;
    } else {
      dataAnalysis = `Your recent best equivalent 10k time projects well for this distance. With a proper taper, your aerobic base is strong enough to maintain a steady threshold pace.`;
    }

    let raceStrategy = "";
    if (isXC) {
      raceStrategy = `Start conservatively on the first climb. Find your rhythm on technical sections. Push hard on any flat or downhill stretches in the final third.`;
    } else if (dist <= 10) {
      raceStrategy = `Start at a controlled pace for the first 3km to let your legs warm up. From km 4 to ${Math.round(dist * 0.8)}, lock into your target race pace, and empty the tank on the last ${Math.round(dist * 0.2)}km.`;
    } else if (dist <= 21.1) {
      raceStrategy = `This is an endurance test. Aim to hold a steady, conservative pace for the first ${Math.round(dist * 0.7)}km. The cushioning will keep your calves from cramping in the final ${Math.round(dist * 0.3)}km.`;
    } else {
      raceStrategy = `This is an endurance test. Aim to hold a steady, conservative pace for the first ${Math.round(dist * 0.6)}km. The cushioning will keep your calves from cramping in the final ${Math.round(dist * 0.4)}km.`;
    }

    // Prediction using Riegel formula: T2 = T1 × (D2/D1)^1.06
    let predictedSec = best10kSec * Math.pow(dist / 10, 1.06);
    if (isXC) predictedSec *= 1.2;
    if (isHotWet) predictedSec *= 1.03;

    const minSec = predictedSec * 0.98;
    const maxSec = predictedSec * 1.02;

    return {
      race,
      selectedShoe,
      alternatives,
      why,
      dataAnalysis,
      raceStrategy,
      predictedMin: secondsToHMS(minSec),
      predictedMax: secondsToHMS(maxSec),
      paceMin: paceToString((minSec / 60) / dist),
      paceMax: paceToString((maxSec / 60) / dist),
    };
  });

  return { intro, predictions };
}
