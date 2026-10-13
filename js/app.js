import { SPORTS, LEAGUES, leagueByKey, loadDay, loadSnapshot } from "./data.js";

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- icons ----------
const ICON = {
  all: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  soccer: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m12 8 3.3 2.4-1.3 3.9h-4l-1.3-3.9z" fill="currentColor"/><path d="M12 8V3.6M15.3 10.4l4.1-1.4M14 14.3l2.5 3.6M10 14.3l-2.5 3.6M8.7 10.4 4.6 9" stroke="currentColor" stroke-width="1.5"/>',
  hockey: '<path d="M6 3l6 12h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="9" cy="18.5" rx="4" ry="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  basketball: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 12h17M12 3.5v17M6 6c2.6 3 2.6 9 0 12M18 6c-2.6 3-2.6 9 0 12" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  football: '<ellipse cx="12" cy="12" rx="9" ry="5.6" transform="rotate(-35 12 12)" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m9.5 14.5 5-5M10.6 11.3l2 2M12.1 9.8l2 2M9.1 12.8l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  baseball: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7.5 5.2c1.8 3.9 1.8 9.7 0 13.6M16.5 5.2c-1.8 3.9-1.8 9.7 0 13.6" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  chev: '<path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  lock: '<rect x="6" y="11" width="12" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 11V8a3 3 0 0 1 6 0v3" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  x: '<path d="m7 7 10 10M17 7 7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  up: '<path d="m4 9 4-4 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  down: '<path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  ticket: '<path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 5v12" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2 2.5"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 9.5a4.3 4.3 0 0 1-.5 8.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m4 4 16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  search: '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
};
const icon = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 ${n === "up" || n === "down" ? 16 : 24} ${n === "up" || n === "down" ? 16 : 24}" aria-hidden="true">${ICON[n]}</svg>`;

// ---------- state ----------
const SIMS = [
  ["normal", "Норма"], ["loading", "Загрузка"], ["slow", "Медленная сеть"], ["partial", "Часть лиг упала"],
  ["error", "Нет связи"], ["moving", "Линия двигается"], ["empty", "Пустой день"], ["long", "Длинные названия"], ["nologo", "Без логотипов"],
];
const S = {
  day: 0, sport: "all", status: "all", q: "",
  sim: new URLSearchParams(location.search).get("state") || "normal",
  events: [], failed: [], loading: true, error: false, stale: false,
  source: "live", updatedAt: null, snapshotAt: null,
  collapsed: new Set(), slip: new Map(), stake: 500, slipOpen: false,
};
let reqId = 0, timer = null, moveTimer = null;
// Odds movement is measured against what the user has already seen in this session,
// not against the API's opening line (which can be days old and made every button "move").
const seenOdds = new Map(), moves = new Map();
function trackMoves(events) {
  const now = Date.now();
  for (const e of events) for (const out of ["home", "draw", "away"]) {
    const v = e.odds?.[out]?.cur; if (v == null) continue;
    const k = e.id + "|" + out, prev = seenOdds.get(k);
    if (prev != null && prev !== v) moves.set(k, { dir: v > prev ? "up" : "down", at: now });
    seenOdds.set(k, v);
  }
}

const dayStart = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off); return d; };
const fmtTime = iso => new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
const fmtDay = d => d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }).replace(".", "");
const fmtOdd = v => (v == null ? "—" : v.toFixed(2));

// ---------- simulation hooks ----------
function applySim(events) {
  if (S.sim === "empty") return [];
  if (S.sim === "nologo") return events.map(e => ({ ...e, home: { ...e.home, logo: "" }, away: { ...e.away, logo: "" } }));
  if (S.sim === "long") {
    const L = ["Borussia Mönchengladbach Reserves U23", "Wolverhampton Wanderers Football Club", "Club Atlético Independiente de Avellaneda", "Brighton & Hove Albion Women's Development"];
    return events.map((e, i) => ({ ...e, home: { ...e.home, name: i % 2 ? e.home.name : L[i % 4] }, away: { ...e.away, name: i % 3 ? e.away.name : L[(i + 1) % 4] } }));
  }
  return events;
}

// ---------- loading ----------
async function load({ force = false, quiet = false } = {}) {
  const id = ++reqId;
  clearInterval(moveTimer);
  if (!quiet) { S.loading = true; S.error = false; render(); }
  if (S.sim === "loading") return; // stays in skeleton on purpose
  const sim = {};
  if (S.sim === "error") sim.fail = "all";
  if (S.sim === "partial") sim.fail = new Set(["nhl", "nba", "mlb"]);
  if (S.sim === "slow") sim.delay = 2200;
  const res = await loadDay(dayStart(S.day), { sim, force });
  if (id !== reqId) return; // a newer request superseded this one
  const allFailed = res.failed.length === res.total;
  if (allFailed) {
    if (quiet && S.events.length) { S.stale = true; }
    else { S.error = true; S.events = []; }
  } else {
    trackOddsChanges(res.events); trackMoves(res.events);
    S.events = res.events; S.failed = res.failed; S.error = false; S.stale = false;
    S.source = "live"; S.updatedAt = new Date();
  }
  S.loading = false;
  render();
  schedule();
  startMoving();
}

// QA: simulate a live line — a few odds change every 4 s, so movement arrows and slip warnings can be shown on demand
function startMoving() {
  clearInterval(moveTimer);
  if (S.sim !== "moving") return;
  moveTimer = setInterval(() => {
    const pool = S.events.filter(e => e.odds && e.state !== "post");
    const picked = new Set(S.slip.keys());
    for (let n = 0; n < 5 && pool.length; n++) {
      const e = n < 2 && picked.size ? pool.find(x => picked.has(x.id)) || pool[(Math.random() * pool.length) | 0] : pool[(Math.random() * pool.length) | 0];
      const out = ["home", "away", "draw"][(Math.random() * 3) | 0];
      const o = e.odds[out]; if (!o) continue;
      const f = 1 + (Math.random() < .5 ? -1 : 1) * (0.04 + Math.random() * 0.1);
      e.odds = { ...e.odds, [out]: { ...o, cur: Math.max(1.01, Math.round(o.cur * f * 100) / 100) } };
    }
    trackOddsChanges(S.events); trackMoves(S.events); renderList(); renderSlip();
  }, 4000);
}

function schedule() {
  clearTimeout(timer);
  const hasLive = S.events.some(e => e.state === "in");
  if (S.source !== "live" || S.day !== 0 || S.sim !== "normal") return;
  timer = setTimeout(() => { if (!document.hidden) load({ force: true, quiet: true }); else schedule(); }, hasLive ? 30000 : 90000);
}

async function useSnapshot() {
  try {
    const snap = await loadSnapshot();
    S.events = snap.events; S.failed = []; S.error = false; S.loading = false; S.stale = false;
    S.source = "snapshot"; S.snapshotAt = new Date(snap.savedAt);
    S.day = 0; render();
  } catch { toast("Сохранённые данные тоже недоступны"); }
}

// ---------- bet slip ----------
const OUT = { home: "П1", draw: "X", away: "П2" };
function trackOddsChanges(next) {
  const byId = Object.fromEntries(next.map(e => [e.id, e]));
  for (const [k, it] of S.slip) {
    const e = byId[it.eventId];
    if (!e) continue;
    if (e.state === "post") { it.closed = true; continue; }
    const now = e.odds?.[it.out]?.cur;
    if (now == null) { it.suspended = true; continue; }
    it.suspended = false;
    if (now !== it.odd) it.changed = now;
  }
}
function toggleSel(e, out) {
  const key = e.id;
  const cur = S.slip.get(key);
  if (cur && cur.out === out) S.slip.delete(key);
  else S.slip.set(key, { eventId: e.id, out, odd: e.odds[out].cur, home: e.home.name, away: e.away.name, league: e.league });
  render();
}

// ---------- derived ----------
function filtered() {
  const q = S.q.trim().toLowerCase();
  const evs = applySim(S.events);
  return evs.filter(e =>
    (S.sport === "all" || e.sport === S.sport) &&
    (S.status === "all" || (S.status === "live" ? e.state === "in" : S.status === "pre" ? e.state === "pre" : e.state === "post")) &&
    (!q || (e.home.name + " " + e.away.name + " " + leagueByKey[e.league].name + " " + leagueByKey[e.league].region).toLowerCase().includes(q)));
}

function statusLabel(e) {
  const n = e.statusName, d = e.detail || "";
  if (e.state === "pre") {
    if (n === "STATUS_POSTPONED") return { text: "Перенесён", cls: "muted" };
    return { text: fmtTime(e.start), cls: "" };
  }
  if (e.state === "post") {
    if (n === "STATUS_POSTPONED") return { text: "Перенесён", cls: "muted" };
    if (n === "STATUS_CANCELED") return { text: "Отменён", cls: "muted" };
    const extra = /SO/.test(d) ? " · Б" : /Pen/i.test(d) ? " · пен." : /OT|AET/.test(d) ? " · ОТ" : "";
    return { text: "Завершён" + extra, cls: "muted" };
  }
  if (/HALFTIME|END_PERIOD|END_OF/.test(n) || /^(Halftime|HT)$/i.test(d)) return { text: "Перерыв", cls: "live" };
  switch (e.sport) {
    case "soccer": return { text: e.clock || d, cls: "live" };
    case "hockey": return { text: `${e.period}-й пер · ${e.clock}`, cls: "live" };
    case "basketball": case "football": return { text: `${e.period}-я чет · ${e.clock}`, cls: "live" };
    case "baseball": { const m = d.match(/(\d+)/); return { text: m ? `${m[1]}-й иннинг` : d, cls: "live" }; }
  }
  return { text: d, cls: "live" };
}

// ---------- render ----------
function render() {
  renderSrc(); renderQA(); renderSports(); renderDays(); renderStatus(); renderBanner(); renderList(); renderSlip();
}

function renderSrc() {
  const el = $("#src");
  if (S.loading && !S.events.length) { el.innerHTML = `<span class="dot dot--idle"></span>Подключаемся к источнику…`; return; }
  if (S.source === "snapshot") { el.innerHTML = `<span class="dot dot--warn"></span>Сохранённые данные · ${fmtDay(S.snapshotAt)}, ${S.snapshotAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} <button class="link" data-act="retry">Обновить</button>`; return; }
  if (S.error) { el.innerHTML = `<span class="dot dot--bad"></span>Нет связи с источником`; return; }
  const t = S.updatedAt ? S.updatedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "";
  if (S.stale) { el.innerHTML = `<span class="dot dot--warn"></span>Не удалось обновить · данные от ${t} <button class="link" data-act="retry">Повторить</button>`; return; }
  el.innerHTML = `<span class="dot dot--ok"></span>ESPN · обновлено в ${t}`;
}

function renderQA() {
  $("#qa-seg").innerHTML = SIMS.map(([k, n]) => `<button role="radio" aria-checked="${S.sim === k}" data-sim="${k}">${n}</button>`).join("");
}

function counts(list) {
  const c = { all: list.length, live: 0, pre: 0, post: 0 };
  for (const e of list) c[e.state === "in" ? "live" : e.state]++;
  return c;
}

function renderSports() {
  const base = applySim(S.events);
  const by = s => base.filter(e => s === "all" || e.sport === s);
  const items = [{ key: "all", name: "Все виды" }, ...SPORTS];
  $("#sports").innerHTML = items.map(s => {
    const list = by(s.key), live = list.filter(e => e.state === "in").length;
    const dis = s.key !== "all" && !list.length && !S.loading;
    return `<li><button class="sport${S.sport === s.key ? " is-on" : ""}${dis ? " is-empty" : ""}" data-sport="${s.key}" aria-pressed="${S.sport === s.key}">
      ${icon(s.key === "all" ? "all" : s.key, 20)}<span class="sport__n">${s.name}</span>
      ${live ? `<span class="pill pill--live" title="В игре">${live}</span>` : ""}<span class="sport__c">${S.loading ? "" : list.length}</span></button></li>`;
  }).join("");
}

function renderDays() {
  if (S.source === "snapshot") {
    $("#days").innerHTML = `<button role="tab" aria-selected="true"><span>Снимок</span><small>${fmtDay(S.snapshotAt)}</small></button>`;
    return;
  }
  const names = { "-1": "Вчера", "0": "Сегодня", "1": "Завтра" };
  $("#days").innerHTML = [-1, 0, 1].map(o => `<button role="tab" aria-selected="${S.day === o}" data-day="${o}"${S.source === "snapshot" && o !== 0 ? " disabled" : ""}>
    <span>${names[o]}</span><small>${fmtDay(dayStart(o))}</small></button>`).join("");
}

function renderStatus() {
  const base = applySim(S.events).filter(e => S.sport === "all" || e.sport === S.sport);
  const c = counts(base);
  const opts = [["all", "Все", c.all], ["live", "Live", c.live], ["pre", "Скоро", c.pre], ["post", "Завершены", c.post]];
  $("#status").innerHTML = opts.map(([k, n, v]) => `<button role="radio" aria-checked="${S.status === k}" data-status="${k}"${k === "live" ? ' class="is-live"' : ""}>
    ${k === "live" && v ? '<span class="pulse" aria-hidden="true"></span>' : ""}${n}${S.loading ? "" : `<span class="cnt">${v}</span>`}</button>`).join("");
}

function renderBanner() {
  const el = $("#banner");
  if (!S.loading && !S.error && S.failed.length && S.source === "live") {
    const names = S.failed.map(k => leagueByKey[k].name).join(", ");
    el.innerHTML = `<div class="banner banner--warn" role="alert">${icon("cloud", 20)}<div><b>Не все лиги загрузились: ${esc(names)}.</b> Остальные события показаны, их данные актуальны.</div><button class="btn btn--sm" data-act="retry">Повторить</button></div>`;
  } else if (S.source === "snapshot") {
    el.innerHTML = `<div class="banner banner--info" role="status"><div><b>Это сохранённые данные.</b> Счёт и коэффициенты не обновляются, ставки из этого режима не принимаются.</div><button class="btn btn--sm" data-act="retry">Подключиться снова</button></div>`;
  } else el.innerHTML = "";
}

function teamLine(t, e, side) {
  const won = e.state === "post" && t.winner, lost = e.state === "post" && !t.winner && (e.home.winner || e.away.winner);
  const ini = (t.abbr || t.name).slice(0, 3);
  // ESPN ships a separate dark-background version of most logos; without it dark crests vanish in the dark theme
  const dark = t.logo.includes("/500/") ? t.logo.replace("/500/", "/500-dark/") : "";
  const fallback = `this.replaceWith(Object.assign(document.createElement('span'),{className:'logo logo--ini',textContent:'${esc(ini)}'}))`;
  const logo = t.logo ? `<img class="lgo-l" src="${esc(t.logo)}" alt="" width="20" height="20" loading="lazy" onerror="${fallback}">` +
      (dark ? `<img class="lgo-d" src="${esc(dark)}" alt="" width="20" height="20" loading="lazy" onerror="this.previousElementSibling&&this.previousElementSibling.classList.add('lgo-any');this.remove()">` : "")
    : `<span class="logo logo--ini"${t.color ? ` style="--tc:${esc(t.color)}"` : ""}>${esc(ini)}</span>`;
  const score = e.state === "pre" ? "" : esc(t.score);
  return `<div class="team${won ? " is-won" : ""}${lost ? " is-lost" : ""}">${logo}<span class="team__n" title="${esc(t.name)}">${esc(t.name)}</span><span class="team__s">${score}</span></div>`;
}

function oddBtn(e, out) {
  const o = e.odds?.[out];
  const lbl = OUT[out];
  if (e.state === "post") return `<span class="odd odd--off" aria-hidden="true"><small>${lbl}</small>—</span>`;
  if (!o) {
    if (out === "draw" && e.odds && !e.odds.draw) return `<span class="odd odd--none" aria-hidden="true"></span>`;
    return `<span class="odd odd--lock" title="Приём ставок приостановлен"><small>${lbl}</small>${icon("lock", 14)}</span>`;
  }
  const on = S.slip.get(e.id)?.out === out;
  const m = moves.get(e.id + "|" + out);
  const mv = m && Date.now() - m.at < 15000 ? m.dir : "";
  return `<button class="odd${on ? " is-on" : ""}${mv ? " is-" + mv : ""}" aria-pressed="${on}" data-odd="${e.id}|${out}"
    aria-label="${lbl}: ${fmtOdd(o.cur)}${mv === "up" ? ", коэффициент вырос" : mv === "down" ? ", коэффициент снизился" : ""}">
    <small>${lbl}</small><b>${fmtOdd(o.cur)}</b>${mv ? `<i class="mv">${icon(mv, 12)}</i>` : ""}</button>`;
}

function row(e) {
  const st = statusLabel(e);
  const hasDraw = e.sport === "soccer";
  return `<article class="ev${e.state === "in" ? " is-live" : ""}${S.slip.has(e.id) ? " is-picked" : ""}">
    <div class="ev__st ${st.cls}">${e.state === "in" ? '<span class="live-tag">LIVE</span>' : ""}<span>${esc(st.text)}</span></div>
    <div class="ev__teams">${teamLine(e.home, e, "home")}${teamLine(e.away, e, "away")}</div>
    <div class="ev__odds${hasDraw ? "" : " is-2way"}">${oddBtn(e, "home")}${hasDraw ? oddBtn(e, "draw") : ""}${oddBtn(e, "away")}</div>
  </article>`;
}

function skeleton() {
  const r = () => `<div class="ev ev--sk"><div class="sk" style="width:44px"></div><div class="ev__teams"><div class="sk" style="width:62%"></div><div class="sk" style="width:48%"></div></div><div class="ev__odds"><div class="sk sk--odd"></div><div class="sk sk--odd"></div><div class="sk sk--odd"></div></div></div>`;
  return [3, 4, 2].map(n => `<section class="lg"><header class="lg__h"><div class="sk" style="width:180px;height:14px"></div></header>${Array.from({ length: n }, r).join("")}</section>`).join("");
}

function renderList() {
  const el = $("#list");
  el.setAttribute("aria-busy", S.loading);
  if (S.loading) { el.innerHTML = skeleton(); return; }
  if (S.error) {
    el.innerHTML = `<div class="state">
      <div class="state__ic state__ic--bad">${icon("cloud", 28)}</div>
      <h2>Не получилось загрузить матчи</h2>
      <p>Источник данных не ответил. Проверьте подключение или попробуйте ещё раз — иногда сервис ограничивает частоту запросов.</p>
      <div class="state__act"><button class="btn btn--primary" data-act="retry">Повторить</button><button class="btn" data-act="snapshot">Показать сохранённые</button></div></div>`;
    return;
  }
  const list = filtered();
  if (!list.length) {
    const any = applySim(S.events).length;
    const next = applySim(S.events).filter(e => e.state === "pre" && (S.sport === "all" || e.sport === S.sport)).sort((a, b) => a.start.localeCompare(b.start))[0];
    let title, text, act;
    if (!any) { title = "В этот день матчей нет"; text = "В отслеживаемых лигах нет событий. Загляните на соседний день."; act = `<button class="btn" data-day="${S.day === 1 ? 0 : 1}">${S.day === 1 ? "Сегодня" : "Завтра"}</button>`; }
    else if (S.status === "live" && !S.q) { title = "Сейчас никто не играет"; text = next ? `Ближайший матч — ${esc(next.home.short)} — ${esc(next.away.short)} в ${fmtTime(next.start)}.` : "Live-события появятся здесь, как только начнутся матчи."; act = `<button class="btn" data-status="pre">Показать предстоящие</button>`; }
    else { title = "Ничего не нашлось"; text = S.q ? `По запросу «${esc(S.q)}» нет событий с такими фильтрами.` : "С выбранными фильтрами событий нет."; act = `<button class="btn" data-act="reset">Сбросить фильтры</button>`; }
    el.innerHTML = `<div class="state"><div class="state__ic">${icon("search", 28)}</div><h2>${title}</h2><p>${text}</p><div class="state__act">${act}</div></div>`;
    return;
  }
  const groups = new Map();
  for (const e of list) { if (!groups.has(e.league)) groups.set(e.league, []); groups.get(e.league).push(e); }
  const order = LEAGUES.map(l => l.key);
  const keys = [...groups.keys()].sort((a, b) => {
    const la = groups.get(a).some(e => e.state === "in"), lb = groups.get(b).some(e => e.state === "in");
    return la !== lb ? (la ? -1 : 1) : order.indexOf(a) - order.indexOf(b);
  });
  const rank = { in: 0, pre: 1, post: 2 };
  el.innerHTML = keys.map(k => {
    const lg = leagueByKey[k], evs = groups.get(k).sort((a, b) => rank[a.state] - rank[b.state] || a.start.localeCompare(b.start));
    const live = evs.filter(e => e.state === "in").length, col = S.collapsed.has(k);
    const draw = lg.sport === "soccer";
    return `<section class="lg${col ? " is-col" : ""}">
      <header class="lg__h"><button class="lg__btn" data-col="${k}" aria-expanded="${!col}">
        <span class="lg__ic">${icon(lg.sport, 16)}</span><span class="lg__r">${esc(lg.region)}</span><span class="lg__n">${esc(lg.name)}</span>
        ${live ? `<span class="pill pill--live">${live} live</span>` : ""}<span class="lg__c">${evs.length}</span><span class="lg__chev">${icon("chev", 18)}</span></button>
        <div class="lg__cols${draw ? "" : " is-2way"}" aria-hidden="true"><span>П1</span>${draw ? "<span>X</span>" : ""}<span>П2</span></div></header>
      <div class="lg__body">${evs.map(row).join("")}</div></section>`;
  }).join("");
}

function renderSlip() {
  const items = [...S.slip.values()];
  const n = items.length;
  const blocked = items.some(i => i.changed != null || i.closed || i.suspended);
  const total = items.reduce((p, i) => p * i.odd, 1);
  const el = $("#slip");
  el.classList.toggle("is-open", S.slipOpen);
  $("#scrim").classList.toggle("is-on", S.slipOpen);
  const head = `<div class="slip__h"><h2>Купон ${n ? `<span class="pill">${n}</span>` : ""}</h2>
    ${n ? '<button class="link" data-act="clear">Очистить</button>' : ""}<button class="iconbtn slip__close" data-act="slip-close" aria-label="Свернуть купон">${icon("x", 18)}</button></div>`;
  if (!n) {
    el.innerHTML = head + `<div class="slip__empty">${icon("ticket", 32)}<p>Нажмите на коэффициент, чтобы добавить событие в купон</p></div>`;
  } else {
    const it = items.map(i => {
      const lg = leagueByKey[i.league];
      const outName = i.out === "home" ? i.home : i.out === "away" ? i.away : "Ничья";
      let warn = "";
      if (i.closed) warn = `<div class="it__w it__w--bad">Событие завершено — уберите его из купона</div>`;
      else if (i.suspended) warn = `<div class="it__w">Приём ставок на событие приостановлен</div>`;
      else if (i.changed != null) warn = `<div class="it__w">Коэффициент изменился: ${fmtOdd(i.odd)} → <b>${fmtOdd(i.changed)}</b></div>`;
      return `<li class="it${warn ? " has-w" : ""}"><div class="it__top"><span class="it__lg">${esc(lg.name)}</span><button class="iconbtn iconbtn--sm" data-rm="${i.eventId}" aria-label="Убрать из купона">${icon("x", 14)}</button></div>
        <div class="it__ev">${esc(i.home)} — ${esc(i.away)}</div>
        <div class="it__out"><span>${OUT[i.out]} · ${esc(outName)}</span><b>${fmtOdd(i.changed ?? i.odd)}</b></div>${warn}</li>`;
    }).join("");
    const win = Math.round(S.stake * total);
    el.innerHTML = head + `<ul class="slip__list">${it}</ul>
      <div class="slip__sum">
        <div class="row"><span>${n > 1 ? "Экспресс" : "Ординар"}</span><b>${fmtOdd(total)}</b></div>
        <label class="stake"><span>Сумма</span><input id="stake" inputmode="numeric" value="${S.stake}" aria-label="Сумма ставки"><span>₽</span></label>
        <div class="chips">${[100, 500, 1000, 5000].map(v => `<button class="chip${S.stake === v ? " is-on" : ""}" data-stake="${v}">${v.toLocaleString("ru-RU")}</button>`).join("")}</div>
        <div class="row row--win"><span>Возможный выигрыш</span><b>${win.toLocaleString("ru-RU")} ₽</b></div>
        ${blocked && items.some(i => i.changed != null) && !items.some(i => i.closed)
          ? '<button class="btn btn--primary btn--block" data-act="accept">Принять изменения</button>'
          : `<button class="btn btn--primary btn--block" data-act="bet"${blocked || S.source === "snapshot" ? " disabled" : ""}>Сделать ставку</button>`}
        <p class="slip__note">Демо-виджет: ставки не принимаются</p></div>`;
  }
  const bar = $("#slipbar");
  bar.hidden = !n;
  bar.innerHTML = `${icon("ticket", 20)}<span>Купон</span><span class="pill">${n}</span><b>${fmtOdd(total)}</b>`;
}

let toastT;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("is-on");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("is-on"), 2600);
}

// ---------- events ----------
document.addEventListener("click", ev => {
  const b = ev.target.closest("button, [data-act]");
  if (!b) return;
  const d = b.dataset;
  if (d.sport) { S.sport = d.sport; render(); }
  else if (d.day != null && !b.disabled) { S.day = +d.day; S.source = "live"; load(); }
  else if (d.status) { S.status = d.status; render(); }
  else if (d.sim) { S.sim = d.sim; const u = new URL(location); d.sim === "normal" ? u.searchParams.delete("state") : u.searchParams.set("state", d.sim); history.replaceState(null, "", u); S.source = "live"; load({ force: true }); }
  else if (d.col) { S.collapsed.has(d.col) ? S.collapsed.delete(d.col) : S.collapsed.add(d.col); render(); }
  else if (d.odd) { const [id, out] = d.odd.split("|"); const e = S.events.find(x => x.id === id); if (e) toggleSel(e, out); }
  else if (d.rm) { S.slip.delete(d.rm); render(); }
  else if (d.stake) { S.stake = +d.stake; render(); }
  else if (d.act === "retry") { S.source = "live"; if (S.sim === "error") S.sim = "normal"; load({ force: true }); }
  else if (d.act === "snapshot") useSnapshot();
  else if (d.act === "reset") { S.sport = "all"; S.status = "all"; S.q = ""; $("#q").value = ""; render(); }
  else if (d.act === "clear") { S.slip.clear(); render(); }
  else if (d.act === "accept") { for (const i of S.slip.values()) if (i.changed != null) { i.odd = i.changed; i.changed = null; } render(); }
  else if (d.act === "bet") toast("Это демо: ставки не принимаются");
  else if (d.act === "slip-close") { S.slipOpen = false; render(); }
});
$("#slipbar").addEventListener("click", () => { S.slipOpen = true; render(); });
$("#q").addEventListener("input", e => { S.q = e.target.value; renderList(); });
document.addEventListener("input", e => {
  if (e.target.id === "stake") {
    const v = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0;
    S.stake = Math.min(v, 1e7);
    const total = [...S.slip.values()].reduce((p, i) => p * i.odd, 1);
    const w = document.querySelector(".row--win b"); if (w) w.textContent = Math.round(S.stake * total).toLocaleString("ru-RU") + " ₽";
    document.querySelectorAll(".chip").forEach(c => c.classList.toggle("is-on", +c.dataset.stake === S.stake));
  }
});
$("#qa-toggle").addEventListener("click", e => {
  const qa = $("#qa"); qa.hidden = !qa.hidden; e.currentTarget.setAttribute("aria-expanded", !qa.hidden);
});
$("#theme").addEventListener("click", () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("arena-theme", root.dataset.theme); } catch {}
});
document.addEventListener("visibilitychange", () => { if (!document.hidden && S.updatedAt && Date.now() - S.updatedAt > 30000) load({ force: true, quiet: true }); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && S.slipOpen) { S.slipOpen = false; render(); } });

if (S.sim !== "normal") $("#qa").hidden = false, $("#qa-toggle").setAttribute("aria-expanded", "true");
load();
