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
  // paceSec is seconds per km — convert to mm:ss
  const totalSec = Math.round(paceSec);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

export interface ShoeTableRow {
  rank: number;
  name: string;
  score: number;
  reason: string;
  totalKm: number;
  status: string;
}

export interface RacePrediction {
  race: Race;
  selectedShoe: string;
  alternatives: string[];
  why: string;
  dataAnalysis: string;
  raceStrategy: string;
  weatherNote: string;
  bodyNote: string;
  predictedMin: string;
  predictedMax: string;
  paceMin: string;
  paceMax: string;
  shoeTable: ShoeTableRow[];
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

  // Build shoe km lookup from logs
  const shoeKmMap: Record<string, number> = {};
  logs.forEach((l) => {
    const raw = l as unknown as Record<string, unknown>;
    const sname = String(raw["Running Shoes"] || "").trim();
    const d = parseFloat(String(raw["Distance (km)"] ?? "0")) || 0;
    if (sname) shoeKmMap[sname] = (shoeKmMap[sname] || 0) + d;
  });

  // Recent weather averages from last 30 runs
  const recentLogs = [...logs]
    .sort((a, b) => (parseDate(b.Date)?.getTime() || 0) - (parseDate(a.Date)?.getTime() || 0))
    .slice(0, 30);
  const temps = recentLogs.map((l) => parseFloat(String((l as unknown as Record<string, unknown>)["Temperature"] ?? ""))).filter((v) => !isNaN(v));
  const humids = recentLogs.map((l) => parseFloat(String((l as unknown as Record<string, unknown>)["Humidity"] ?? ""))).filter((v) => !isNaN(v));
  const avgRecentTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : null;
  const avgRecentHumidity = humids.length > 0 ? humids.reduce((a, b) => a + b, 0) / humids.length : null;

  // Latest body fat % and BMI
  const latestBodyFat = sortedBody.length > 0 ? parseFloat(String((sortedBody[0] as unknown as Record<string, unknown>)["Body Fat"] ?? (sortedBody[0] as unknown as Record<string, unknown>)["Body Fat %"] ?? "0")) : 0;
  const latestBMI = sortedBody.length > 0 ? parseFloat(String((sortedBody[0] as unknown as Record<string, unknown>)["BMI"] ?? "0")) : 0;

  // Recent 4-week training volume
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 3600 * 1000);
  const recentVolume = logs
    .filter((l) => { const d = parseDate(l.Date); return d && d >= fourWeeksAgo; })
    .reduce((sum, l) => sum + (parseFloat(String((l as unknown as Record<string, unknown>)["Distance (km)"] ?? "0")) || 0), 0);
  const weeklyVolume = recentVolume / 4;

  const predictions: RacePrediction[] = upcomingRaces.map((race) => {
    const dist = parseFloat(race["\u8ddd\u96e2 (km)"] || "10");
    const isXC = race["\u8cfd\u4e8b"].includes("\u8d8a\u91ce") || race["\u8cfd\u4e8b"].includes("Trail") || race["\u8cfd\u4e8b"].toLowerCase().includes("trail");
    const raceDateObj = parseDate(race["\u65e5\u671f"]);
    const raceMonth = raceDateObj ? raceDateObj.getMonth() + 1 : 1;
    const isHotWet = raceMonth >= 5 && raceMonth <= 9;
    const isCoolDry = raceMonth <= 2 || raceMonth >= 11;

    // Shoe scoring & table
    const allShoesForTable = shoes.map((s) => {
      const sname = s.Shoes || s["Shoes Name"] || "";
      const score = scoreShoe(sname, isXC, dist, isHotWet);
      const km = shoeKmMap[sname] || parseFloat(String((s as unknown as Record<string, unknown>)["TOTAL"] ?? "0")) || 0;
      const sn = sname.toLowerCase();
      let reason = "";
      if (isXC) {
        reason = sn.includes("speedgoat") || sn.includes("trail") ? "Trail-specific grip" : "Road shoe — not ideal for trail";
      } else if (dist <= 10) {
        if (sn.includes("adios pro") || sn.includes("metaspeed")) reason = "Carbon plate racer — optimal for short fast races";
        else if (sn.includes("superblast") || sn.includes("nova blast")) reason = "High-cushion trainer — good for tempo effort";
        else reason = "Versatile option for race day";
      } else if (dist <= 21.1) {
        if (sn.includes("adios pro") || sn.includes("metaspeed")) reason = "Carbon plate — excellent for HM pace";
        else if (sn.includes("superblast")) reason = "Cushioned racer — strong HM choice";
        else reason = "Suitable for half marathon distance";
      } else {
        if (sn.includes("superblast") || sn.includes("nimbus") || sn.includes("gel")) reason = "Max cushion — protects legs in final 10km";
        else if (sn.includes("adios pro")) reason = "Carbon plate — aggressive but demanding over 42km";
        else reason = "Adequate for marathon distance";
      }
      if (isHotWet && (sn.includes("metaspeed") || sn.includes("adios pro 4"))) reason += " · breathable upper for heat";
      if (km > 600) reason += " · \u26a0 high mileage (" + km.toFixed(0) + "km)";
      return { rank: 0, name: sname, score, reason, totalKm: km, status: s.Status || "" };
    });
    allShoesForTable.sort((a, b) => b.score - a.score);
    allShoesForTable.forEach((r, i) => { r.rank = i + 1; });
    const shoeTable = allShoesForTable;

    const scoredInUse = allShoesForTable.filter((s) => s.status === "In Use");
    const selectedShoe = scoredInUse[0]?.name || inUseShoes[0] || "Your race shoe";
    const alternatives = scoredInUse.slice(1, 4).map((s) => s.name);

    // Why this shoe
    let why = "";
    const sn = selectedShoe.toLowerCase();
    if (isXC) {
      why = `${selectedShoe} is chosen for its trail-specific grip and cushioning, essential for off-road terrain in ${isHotWet ? "hot/humid" : "cool"} conditions.`;
    } else if (dist <= 10) {
      if (sn.includes("adios pro") || sn.includes("metaspeed")) {
        why = `${selectedShoe} is chosen for its carbon-plate energy return and breathability — perfect for ${isHotWet ? "hot/humid" : "cool"} month-${raceMonth} conditions while maximizing your pace.`;
      } else {
        why = `${selectedShoe} offers aggressive energy return. Your target pace requires mechanical advantage, and the ${isHotWet ? "warm" : "cool"} weather will ${isHotWet ? "require good breathability" : "prevent overheating"}.`;
      }
    } else if (dist <= 21.1) {
      why = `For a half marathon, the ${selectedShoe} balances cushioning and responsiveness to maintain threshold pace through the final 5km.`;
    } else {
      why = `For a marathon, the ${selectedShoe}'s geometry and cushioning provides superior leg-saving protection — critical when fatigue sets in after km 30.`;
    }

    // Data Analysis
    const weightTrend = sortedBody.length >= 2
      ? parseFloat(sortedBody[sortedBody.length - 1].Weight || "0") - parseFloat(sortedBody[0].Weight || "0")
      : 0;
    const weightTrendText = weightTrend < -1 ? `weight down ${Math.abs(weightTrend).toFixed(1)}kg — ` : weightTrend > 1 ? `weight up ${weightTrend.toFixed(1)}kg — ` : "";
    let dataAnalysis = "";
    if (dist <= 10) {
      dataAnalysis = `Your 4-week training volume is ${weeklyVolume.toFixed(1)} km/week. ${weightTrendText}Your lactate threshold data from tempo runs supports a strong ${dist}km performance. Resting HR of ${latestRestingHR} bpm confirms good recovery.`;
    } else if (dist <= 21.1) {
      dataAnalysis = `Weekly volume of ${weeklyVolume.toFixed(1)} km/week provides a solid aerobic base for this distance. ${weightTrendText}Your Riegel-projected time from best 10K is reliable. Sleep score and resting HR indicate readiness.`;
    } else {
      dataAnalysis = `Marathon demands ${weeklyVolume.toFixed(1)} km/week base — ${weeklyVolume >= 50 ? "you're well-prepared" : "consider building volume before race day"}. ${weightTrendText}Body fat ${latestBodyFat > 0 ? latestBodyFat.toFixed(1) + "% and " : ""}resting HR ${latestRestingHR} bpm indicate ${latestRestingHR < 55 ? "excellent" : "good"} aerobic fitness.`;
    }

    // Weather Note
    let weatherNote = "";
    const expectedTemp = isHotWet ? (avgRecentTemp ?? 30) : (avgRecentTemp ?? 20);
    const expectedHumidity = isHotWet ? (avgRecentHumidity ?? 80) : (avgRecentHumidity ?? 60);
    if (isHotWet) {
      weatherNote = `Race month ${raceMonth} is typically hot and humid (avg ~${expectedTemp.toFixed(0)}\u00b0C, ~${expectedHumidity.toFixed(0)}% humidity based on your recent logs). Expect pace 3\u20135% slower than cool-weather equivalent. Pre-hydrate aggressively, start 10\u201315 sec/km slower than target, and use cooling stations.`;
    } else if (isCoolDry) {
      weatherNote = `Race month ${raceMonth} offers ideal cool, dry conditions (typically 12\u201318\u00b0C). This is your best window for a PB attempt. Dress in light layers and aim for negative splits.`;
    } else {
      weatherNote = `Race month ${raceMonth} has moderate conditions. Monitor race-day forecast — if temp exceeds 25\u00b0C, adjust target pace by +5\u20138 sec/km. Your training logs show avg ${avgRecentTemp?.toFixed(1) ?? "\u2014"}\u00b0C recently.`;
    }

    // Body & Fitness Note
    let bodyNote = "";
    const sleepScore = latestSleep?.Score ? parseInt(latestSleep.Score) : 0;
    const bodyBattery = latestSleep ? parseFloat(String((latestSleep as unknown as Record<string, unknown>)["Body Battery"] ?? "0")) : 0;
    bodyNote = `Current resting HR: ${latestRestingHR} bpm${latestRestingHR < 50 ? " (elite aerobic fitness)" : latestRestingHR < 60 ? " (good fitness)" : " (moderate fitness)"}. `;
    if (latestWeight > 0) bodyNote += `Weight: ${latestWeight}kg${latestBodyFat > 0 ? ", body fat " + latestBodyFat.toFixed(1) + "%" : ""}${latestBMI > 0 ? ", BMI " + latestBMI.toFixed(1) : ""}. `;
    if (sleepScore > 0) bodyNote += `Latest sleep score: ${sleepScore}/100${sleepScore >= 80 ? " \u2014 excellent recovery" : sleepScore >= 60 ? " \u2014 adequate recovery" : " \u2014 consider extra rest before race"}. `;
    if (bodyBattery > 0) bodyNote += `Body battery: ${bodyBattery}%${bodyBattery >= 70 ? " \u2014 fully charged" : bodyBattery >= 40 ? " \u2014 moderate energy" : " \u2014 low energy, prioritise sleep"}.`;

    // Race Strategy
    const heatPenalty = isHotWet ? " Add 5\u20138 sec/km to your target pace to account for heat." : "";
    const roadNote = isXC ? " Technical trail sections require shortened stride and high cadence." : " Road surface allows full stride length.";
    let raceStrategy = "";
    if (isXC) {
      raceStrategy = `Start conservatively on the first climb \u2014 heart rate will spike early on trail. Find your rhythm on technical sections with high cadence (180+ spm). Push hard on any flat or downhill stretches in the final third.${roadNote}${heatPenalty} Carry at least 500ml water if no aid stations within 5km.`;
    } else if (dist <= 10) {
      raceStrategy = `Km 1\u20132: Hold back 10 sec/km slower than target \u2014 resist the crowd surge. Km 3\u2013${Math.round(dist * 0.7)}: Lock into race pace (${paceToString((best10kSec / 60) / 10 * 60)} min/km target).${heatPenalty} Final ${Math.round(dist * 0.3)}km: Empty the tank \u2014 HR can go to Z4/Z5. ${weeklyVolume >= 40 ? "Your training volume supports a strong finish." : "Conserve energy \u2014 your volume is building."}${roadNote}`;
    } else if (dist <= 21.1) {
      raceStrategy = `Km 1\u20133: Start easy, 15 sec/km slower than goal pace. Km 4\u2013${Math.round(dist * 0.65)}: Settle into threshold pace.${heatPenalty} Km ${Math.round(dist * 0.65)}\u2013${Math.round(dist * 0.85)}: Maintain \u2014 this is where most runners fade. Final ${Math.round(dist * 0.15)}km: Negative split if energy allows. Hydrate at every station \u2014 ${isHotWet ? "critical in heat" : "even in cool weather"}.${roadNote}`;
    } else {
      raceStrategy = `Km 1\u201310: Run 20 sec/km slower than goal pace \u2014 discipline here wins the race. Km 10\u201330: Steady aerobic effort, HR in Z2\u2013Z3.${heatPenalty} Km 30\u201335: The wall zone \u2014 shorten stride, maintain cadence. Final 7km: Dig deep \u2014 ${selectedShoe}'s cushioning protects your legs here. Fuel every 45 min, hydrate every station.${roadNote}`;
    }

    // Prediction (Riegel formula: T2 = T1 x (D2/D1)^1.06)
    let predictedSec = best10kSec * Math.pow(dist / 10, 1.06);
    if (isXC) predictedSec *= 1.2;
    if (isHotWet) predictedSec *= 1.03;
    if (latestRestingHR < 50) predictedSec *= 0.98;
    if (weeklyVolume < 30 && dist > 21) predictedSec *= 1.05;

    const minSec = predictedSec * 0.98;
    const maxSec = predictedSec * 1.02;

    return {
      race,
      selectedShoe,
      alternatives,
      why,
      dataAnalysis,
      raceStrategy,
      weatherNote,
      bodyNote,
      predictedMin: secondsToHMS(minSec),
      predictedMax: secondsToHMS(maxSec),
      paceMin: paceToString((minSec / 60) / dist * 60),
      paceMax: paceToString((maxSec / 60) / dist * 60),
      shoeTable,
    };
  });

    return { intro, predictions };
}
