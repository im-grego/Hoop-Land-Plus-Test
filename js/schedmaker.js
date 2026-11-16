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
  const asDay = hadStar ? Math.round((S.allStarWeekend || dayFor('allStar', days)) / Math.max(1, old.length) * (days + 1)) : undefined;
  writeSchedule(L, out, { allStarDay: asDay });
  const count = new Map();
  for (const d of S.schedule) for (const g of d.results || []) if (g.gameType === 0 && g.homeTeam && g.awayTeam) for (const t of [g.homeTeam, g.awayTeam]) count.set(t, (count.get(t) || 0) + 1);
  return { days: S.schedule.length, count };
}

// Marquee candidates: every pair scored by rivalry (the app's rivals, strongest first) and how good both teams are.
// `rivalScore(a, b)` and `strength(id)` come from the app. Opening Night: the champion hosts first.
export function marqueeCandidates(L, { rivalScore, strength, champ = null }) {
  const T = L.teams, out = [];
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
    const a = T[i], b = T[j], r = rivalScore(a, b), s = (strength(a.id) + strength(b.id)) / 2;
    out.push({ a: a.id, b: b.id, score: r * 2 + (s - 75) / 2, r });
  }
  out.sort((x, y) => y.score - x.score);
  // Home side: the champion, else the better team.
  return out.map(x => { const hHome = x.a === champ ? x.a : x.b === champ ? x.b : strength(x.a) >= strength(x.b) ? x.a : x.b; return { ...x, h: hHome, aw: hHome === x.a ? x.b : x.a }; });
}
// The default slate: Opening Night two games (the champion's first), Christmas five; nobody twice on the same night.
export function defaultSlate(cands, champ = null) {
  const night = (n, first = null) => { const used = new Set(), pick = []; for (const c of [...(first ? cands.filter(x => x.h === first || x.aw === first).slice(0, 1) : []), ...cands]) { if (pick.length >= n) break; if (used.has(c.h) || used.has(c.aw) || pick.includes(c)) continue; pick.push(c); used.add(c.h); used.add(c.aw); } return pick; };
  const opening = night(2, champ);
  // Christmas: different matchups from Opening Night.
  const seen = new Set(opening.map(x => [x.h, x.aw].sort().join('-')));
  const rest = cands.filter(x => !seen.has([x.h, x.aw].sort().join('-')));
  const used = new Set(), christmas = [];
  for (const c of rest) { if (christmas.length >= 5) break; if (used.has(c.h) || used.has(c.aw)) continue; christmas.push(c); used.add(c.h); used.add(c.aw); }
  return { opening, christmas };
}
