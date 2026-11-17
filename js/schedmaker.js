// The schedule maker (Schedule Release): the season built with the NBA's formula, with Opening Night and Christmas
// Day kept for the marquee games picked for them. Builds on schedgen.js (matchups, layout, writeSchedule).
import { matchups, layout, writeSchedule } from './schedgen.js';

// The real calendar the game days stand for: Opening Night to the last day of the regular season.
export const SEASON_DAYS = 174;   // Oct 20 to Apr 12
const REAL = { christmas: 66, mlk: 90, allStar: 120, deadline: 107 };   // days after Opening Night, as in 2026-27
export function realDate(yr, d, days) {
  const t = new Date(Date.UTC(yr - 1, 9, 20) + Math.round(d * (SEASON_DAYS / Math.max(1, days - 1))) * 86400000);
  return t.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
export const dayFor = (key, days) => Math.round(REAL[key] / SEASON_DAYS * (days - 1));

// Build: every pair's meetings (the save's mode or the NBA's), the pinned games pulled out, the rest laid over the other
// game days; Opening Night and Christmas hold only their pinned games. `pins` = [{ day, h, a }]. Returns the written schedule's length and per-team game counts.
export function buildSeason(L, { pins = [], seed = 1, mode = 'nba' } = {}) {
  const S = L.season, old = S.schedule || [];
  const hadStar = old.some(d => (d.results || []).some(g => g.gameType !== 0));
  const days = Math.max(60, old.length - (hadStar ? 1 : 0));
  const pairs = matchups(L, mode, seed);
  // Take each pinned game out of the pool (the same pair, either way round; the pinned home team keeps it).
  for (const p of pins) {
    const i = pairs.findIndex(([h, a]) => (h === p.h && a === p.a) || (h === p.a && a === p.h));
    if (i >= 0) pairs.splice(i, 1);
  }
  // Everything else over the other days; then Opening Night and Christmas go in as days of their own, with only
  // their marquee games (as on the real calendar).
  const held = [...new Set(pins.map(p => p.day))].sort((x, y) => x - y);
  const out = layout(pairs.map(([h, a]) => [h, a]), days - held.length, seed);
  for (const d of held) out.splice(d, 0, []);
  for (const p of pins) out[p.day].push({ h: p.h, a: p.a });
  // The All-Star break where it was (as a share of the season).
  // The All-Star break and the trade deadline where they fall on the real calendar (the deadline two weeks before the
  // break, as in the NBA), so the file matches the key dates.
  const asDay = hadStar ? dayFor('allStar', days) : undefined;
  writeSchedule(L, out, { allStarDay: asDay });
  if (hadStar) S.tradeDeadline = dayFor('deadline', days);
  const count = new Map();
  for (const d of S.schedule) for (const g of d.results || []) if (g.gameType === 0 && g.homeTeam && g.awayTeam) for (const t of [g.homeTeam, g.awayTeam]) count.set(t, (count.get(t) || 0) + 1);
  return { days: S.schedule.length, count };
}

// Marquee candidates: every pair, scored three ways. `rivalScore(a, b)` (the app's rivals, strongest first),
// `strength(id)` (how good the team is) and `stars(id)` (its star power: the league's top 20 players, the higher the
// better, full weight in their prime) come from the app.
// - Opening Night: the best teams, rivals preferred (the champion hosts first).
// - MLK Day: the top teams.
// - Christmas: the star matchups, both teams bringing stars.
export function marqueeCandidates(L, { rivalScore, strength, stars = () => 0, champ = null }) {
  const T = L.teams, out = [];
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
    const a = T[i], b = T[j], r = rivalScore(a, b), sa = strength(a.id), sb = strength(b.id), avg = (sa + sb) / 2, lo = Math.min(sa, sb);
    const pa = stars(a.id), pb = stars(b.id);
    out.push({ a: a.id, b: b.id, r,
      opening: (avg - 75) + (lo - 75) * 0.5 + r * 1.5,
      mlk: (avg - 75) + (lo - 75) * 0.75 + r * 0.4,
      xmas: pa + pb + Math.min(pa, pb) * 1.5 + (avg - 75) * 0.15 + r * 0.3 });
  }
  // Home side: the champion, else the better team.
  return out.map(x => { const hHome = x.a === champ ? x.a : x.b === champ ? x.b : strength(x.a) >= strength(x.b) ? x.a : x.b; return { ...x, score: x.opening, h: hHome, aw: hHome === x.a ? x.b : x.a }; });
}
const pairOf = x => [x.h, x.aw].sort((p, q) => p - q).join('-');
// One night's slate: `n` games by that night's score, nobody twice, no matchup already used (`seen`).
function slateFor(cands, key, n, seen, first = null) {
  const used = new Set(), pick = [];
  const order = [...cands].sort((x, y) => y[key] - x[key]);
  for (const c of [...(first != null ? order.filter(x => x.h === first || x.aw === first).slice(0, 1) : []), ...order]) {
    if (pick.length >= n) break;
    if (used.has(c.h) || used.has(c.aw) || pick.includes(c) || seen.has(pairOf(c))) continue;
    pick.push(c); used.add(c.h); used.add(c.aw);
  }
  for (const c of pick) seen.add(pairOf(c));
  return pick;
}
// The default slate: Opening Night three games (the champion's first), Christmas four, MLK Day four; no matchup twice.
export function defaultSlate(cands, champ = null) {
  const seen = new Set();
  const opening = slateFor(cands, 'opening', 3, seen, champ);
  const christmas = slateFor(cands, 'xmas', 4, seen);
  const mlk = slateFor(cands, 'mlk', 4, seen);
  return { opening, christmas, mlk };
}

// Any league (college too): the unplayed season laid out again with the pinned games on their days and everything
// else filled around them, the way the game lays its own out (teams with the most games left first, nobody twice in a
// day). The same games, home and away as they were; the special days (exhibitions, the All-Star day) back where they
// were. `pins` = [{ day, h, a }] (either way round). Returns { placed, days }.
export function placeAround(L, pins, seed = 1) {
  const S = L.season, old = S.schedule || [];
  const reg = [], special = [];
  old.forEach((d, i) => { const sp = (d.results || []).filter(g => !(g.gameType === 0 && g.homeTeam && g.awayTeam)); if (sp.length) special.push([i, sp]); for (const g of d.results || []) if (g.gameType === 0 && g.homeTeam && g.awayTeam) reg.push(g); });
  if (reg.some(g => g.homeScore || g.awayScore)) return { placed: 0, days: old.length };
  let s = seed >>> 0; const rng = () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const used = new Set(), nights = new Map();
  let placed = 0;
  for (const p of pins) {
    const g = reg.find(x => !used.has(x) && ((x.homeTeam === p.h && x.awayTeam === p.a) || (x.homeTeam === p.a && x.awayTeam === p.h)));
    if (!g) continue;
    used.add(g); (nights.get(p.day) || nights.set(p.day, []).get(p.day)).push(g); placed++;
  }
  const left = new Map();
  for (const g of reg) for (const id of [g.homeTeam, g.awayTeam]) left.set(id, (left.get(id) || 0) + 1);
  let pool = reg.filter(g => !used.has(g)).sort(() => rng() - 0.5);
  const days = [];
  for (let day = 0; (pool.length || [...nights.keys()].some(k => k >= day)) && day < 400; day++) {
    const busy = new Set(), today = [];
    const add = g => { today.push(g); busy.add(g.homeTeam); busy.add(g.awayTeam); left.set(g.homeTeam, left.get(g.homeTeam) - 1); left.set(g.awayTeam, left.get(g.awayTeam) - 1); };
    for (const g of nights.get(day) || []) if (!busy.has(g.homeTeam) && !busy.has(g.awayTeam)) add(g); else pool.push(g);
    pool.sort((x, y) => (left.get(y.homeTeam) + left.get(y.awayTeam)) - (left.get(x.homeTeam) + left.get(x.awayTeam)));
    const rest = [];
    for (const g of pool) { if (!busy.has(g.homeTeam) && !busy.has(g.awayTeam)) add(g); else rest.push(g); }
    pool = rest;
    days.push(today);
  }
  const sched = days.map(d => ({ results: d }));
  for (const [i, sp] of special) sched.splice(Math.min(i, sched.length), 0, { results: sp });
  S.schedule = sched;
  let id = 1;
  for (const d of sched) for (const g of d.results) if (g.gameType === 0) g.gId = id++;
  for (const d of sched) for (const g of d.results) if (g.gameType !== 0) g.gId = id++;
  if (L.meta) L.meta.uGID = id - 1;
  return { placed, days: sched.length };
}
