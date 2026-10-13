// Data layer: ESPN public scoreboard API → normalized events.
// Everything the UI needs goes through normalize(), so the snapshot and live data share one shape.

export const SPORTS = [
  { key: "soccer", name: "Футбол" },
  { key: "hockey", name: "Хоккей" },
  { key: "basketball", name: "Баскетбол" },
  { key: "football", name: "Американский футбол" },
  { key: "baseball", name: "Бейсбол" },
];

export const LEAGUES = [
  { key: "uefa.champions", sport: "soccer", region: "Европа", name: "Лига чемпионов УЕФА" },
  { key: "uefa.europa", sport: "soccer", region: "Европа", name: "Лига Европы УЕФА" },
  { key: "eng.1", sport: "soccer", region: "Англия", name: "Премьер-лига" },
  { key: "esp.1", sport: "soccer", region: "Испания", name: "Ла Лига" },
  { key: "ita.1", sport: "soccer", region: "Италия", name: "Серия A" },
  { key: "ger.1", sport: "soccer", region: "Германия", name: "Бундеслига" },
  { key: "fra.1", sport: "soccer", region: "Франция", name: "Лига 1" },
  { key: "usa.1", sport: "soccer", region: "США", name: "MLS" },
  { key: "nhl", sport: "hockey", region: "США и Канада", name: "НХЛ" },
  { key: "nba", sport: "basketball", region: "США", name: "НБА" },
  { key: "nfl", sport: "football", region: "США", name: "НФЛ" },
  { key: "mlb", sport: "baseball", region: "США", name: "MLB" },
];
export const leagueByKey = Object.fromEntries(LEAGUES.map(l => [l.key, l]));

const BASE = "https://site.api.espn.com/apis/site/v2/sports";
const TIMEOUT = 9000;

// American odds → decimal (the format European bettors read)
export function toDecimal(american) {
  const n = Number(String(american).replace("+", ""));
  if (!isFinite(n) || n === 0) return null;
  const d = n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
  return Math.round(d * 100) / 100;
}

function pickOdds(c) {
  const o = c.odds && c.odds[0];
  if (!o) return null;
  const side = (ml, legacy) => {
    const cur = ml && (ml.current?.odds ?? ml.close?.odds);
    const open = ml && (ml.open?.odds ?? ml.close?.odds);
    const curD = toDecimal(cur ?? legacy);
    if (!curD) return null;
    return { cur: curD, open: toDecimal(open ?? cur ?? legacy) ?? curD };
  };
  const ml = o.moneyline || {};
  const home = side(ml.home, o.homeTeamOdds?.moneyLine);
  const away = side(ml.away, o.awayTeamOdds?.moneyLine);
  const draw = side(ml.draw, o.drawOdds?.moneyLine);
  if (!home || !away) return null;
  return { home, draw, away, provider: o.provider?.displayName || o.provider?.name || "" };
}

const team = t => ({
  id: t.team?.id,
  name: t.team?.displayName || t.team?.name || "—",
  short: t.team?.shortDisplayName || t.team?.displayName || "—",
  abbr: t.team?.abbreviation || "",
  logo: t.team?.logo || "",
  color: t.team?.color ? "#" + t.team.color : "",
  score: t.score ?? "",
  winner: !!t.winner,
});

export function normalize(raw, leagueKey) {
  const lg = leagueByKey[leagueKey];
  return (raw.events || []).map(e => {
    const c = e.competitions?.[0] || {};
    const st = e.status || c.status || {};
    const comps = c.competitors || [];
    const home = comps.find(x => x.homeAway === "home") || comps[0] || {};
    const away = comps.find(x => x.homeAway === "away") || comps[1] || {};
    return {
      id: String(e.id),
      league: leagueKey,
      sport: lg.sport,
      start: e.date,
      state: st.type?.state || "pre",        // pre | in | post
      statusName: st.type?.name || "",
      detail: st.type?.shortDetail || "",
      clock: st.displayClock || "",
      period: st.period || 0,
      home: team(home),
      away: team(away),
      odds: pickOdds(c),
      venue: c.venue?.fullName || "",
    };
  });
}

// ESPN groups days by US Eastern time. A local calendar day can span two ET dates.
const etDate = d => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d).replaceAll("-", "");
export function etDatesForLocalDay(dayStart) {
  const end = new Date(dayStart.getTime() + 24 * 3600e3 - 1);
  return [...new Set([etDate(dayStart), etDate(end)])];
}

const cache = new Map(); // `${league}|${date}` → { at, events }

async function fetchJSON(url, signal) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  signal?.addEventListener("abort", () => ctl.abort());
  try {
    const r = await fetch(url, { signal: ctl.signal, cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// sim: optional simulation flags from the QA panel ({ fail: Set<leagueKey>|"all", delay: ms })
export async function loadDay(dayStart, { sim = {}, force = false } = {}) {
  const dates = etDatesForLocalDay(dayStart);
  const jobs = [];
  for (const lg of LEAGUES) for (const d of dates) jobs.push({ lg, d });
  const failed = new Set();
  const out = [];
  let i = 0;
  const worker = async () => {
    while (i < jobs.length) {
      const { lg, d } = jobs[i++];
      const key = lg.key + "|" + d;
      try {
        if (sim.delay) await new Promise(r => setTimeout(r, sim.delay));
        if (sim.fail === "all" || sim.fail?.has?.(lg.key)) throw new Error("simulated");
        const hit = cache.get(key);
        let evs;
        if (hit && !force && Date.now() - hit.at < 20000) evs = hit.events;
        else {
          const raw = await fetchJSON(`${BASE}/${lg.sport}/${lg.key}/scoreboard?dates=${d}`);
          evs = normalize(raw, lg.key);
          cache.set(key, { at: Date.now(), events: evs });
        }
        out.push(...evs);
      } catch (err) { failed.add(lg.key); }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  const from = dayStart.getTime(), to = from + 24 * 3600e3;
  const seen = new Set();
  const events = out.filter(e => {
    const t = Date.parse(e.start);
    if (seen.has(e.id) || t < from || t >= to) return false;
    seen.add(e.id); return true;
  });
  return { events, failed: [...failed], total: LEAGUES.length };
}

export async function loadSnapshot() {
  const r = await fetch("data/snapshot.json");
  return r.json();
}
