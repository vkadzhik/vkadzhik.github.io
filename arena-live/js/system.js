import { TOKENS } from "./tokens.js";
const $ = s => document.querySelector(s);

// theme tokens: split swatch light | dark
$("#theme-tokens").innerHTML = TOKENS.theme.map(t => `
  <div class="sw"><div class="sw__c"><span style="background:${t.lightHex}"></span><span style="background:${t.darkHex}"></span></div>
  <div class="sw__t"><b>${t.name}</b><code>${t.css}</code><small>${t.light.slice(1, -1)} · ${t.dark.slice(1, -1)}</small></div></div>`).join("");

// primitives grouped by family
const fam = {};
for (const p of TOKENS.primitives) (fam[p.name.split("/")[0]] ??= []).push(p);
$("#primitives").innerHTML = Object.entries(fam).map(([f, list]) => `
  <div class="ramp"><div class="ramp__n">${f}</div><div class="ramp__s">${list.map(p => `<span style="background:${p.value}" title="${p.name} ${p.value}"><i>${p.name.split("/")[1]}</i></span>`).join("")}</div></div>`).join("");

// typography
$("#type-list").innerHTML = TOKENS.type.map(t => `
  <div class="ty"><div class="ty__m"><b>${t.name}</b><small>${t.size}/${t.lh} · ${t.font.split(" ").pop()}</small></div>
  <div class="ty__s" style="font:var(${t.css});letter-spacing:var(${t.css}-tracking)${t.name === "Overline" ? ";text-transform:uppercase" : ""}">${/Numeric/.test(t.name) ? "3 660 ₽ · 2.15" : t.name === "Overline" ? "Лига чемпионов" : "Арсенал — Лилль, 21:00"}</div></div>`).join("");

// spacing & radius
$("#space-list").innerHTML = TOKENS.size.filter(s => s.name.startsWith("space")).map(s => `<div class="sp"><code>${s.css}</code><span style="width:${s.value * 3}px"></span><small>${s.value}</small></div>`).join("");
$("#radius-list").innerHTML = TOKENS.size.filter(s => s.name.startsWith("radius")).map(s => `<div class="rd"><span style="border-radius:var(${s.css})"></span><code>${s.css}</code><small>${s.value === 999 ? "pill" : s.value + " px"}</small></div>`).join("");

// event rows (static specimens, same classes as the widget)
const logo = (src, ini, c) => src ? `<img src="${src}" alt="" width="20" height="20">` : `<span class="logo logo--ini" style="--tc:${c}">${ini}</span>`;
const team = (n, s, l, ini, c, cls = "") => `<div class="team ${cls}">${logo(l, ini, c)}<span class="team__n" title="${n}">${n}</span><span class="team__s">${s}</span></div>`;
const odd = (l, v, cls = "") => `<button class="odd ${cls}" tabindex="-1"><small>${l}</small><b>${v}</b></button>`;
const L = "https://a.espncdn.com/i/teamlogos/soccer/500/";
$("#row-demo").innerHTML = `
  <header class="lg__h"><div class="lg__btn"><span class="lg__ic"><svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m12 8 3.3 2.4-1.3 3.9h-4l-1.3-3.9z" fill="currentColor"/></svg></span><span class="lg__r">Европа</span><span class="lg__n">Лига чемпионов УЕФА</span><span class="pill pill--live">1 live</span><span class="lg__c">4</span></div>
  <div class="lg__cols"><span>П1</span><span>X</span><span>П2</span></div></header>
  <div class="lg__body">
  <article class="ev is-live"><div class="ev__st live"><span class="live-tag">LIVE</span><span>67'</span></div><div class="ev__teams">${team("Sabah FK", 1, L + "21922.png")}${team("Slavia Prague", 0, L + "494.png")}</div><div class="ev__odds">${odd("П1", "1.31")}${odd("X", "4.00", "is-on")}${odd("П2", "23.00")}</div></article>
  <article class="ev is-picked"><div class="ev__st"><span>21:00</span></div><div class="ev__teams">${team("Atlético Madrid", "", L + "1068.png")}${team("Manchester United", "", L + "360.png")}</div><div class="ev__odds">${odd("П1", "1.83")}${odd("X", "3.85")}${odd("П2", "4.20", "is-on")}</div></article>
  <article class="ev"><div class="ev__st"><span>21:00</span></div><div class="ev__teams">${team("Borussia Mönchengladbach Reserves U23 Development Squad", "", "", "BMG", "#00a650")}${team("Club Atlético Independiente", "", "", "IND", "#e2001a")}</div><div class="ev__odds">${odd("П1", "2.15")}${odd("X", "3.55")}${odd("П2", "3.35")}</div></article>
  <article class="ev"><div class="ev__st muted"><span>Завершён · ОТ</span></div><div class="ev__teams">${team("Los Angeles Rams", 34, "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/lar.png", "", "", "is-lost")}${team("Buffalo Bills", 37, "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/buf.png", "", "", "is-won")}</div><div class="ev__odds"><span class="odd odd--off"><small>П1</small>—</span><span class="odd odd--off"><small>X</small>—</span><span class="odd odd--off"><small>П2</small>—</span></div></article>
  </div>`;

$("#theme").addEventListener("click", () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("arena-theme", root.dataset.theme); } catch {}
});
