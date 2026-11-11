// The NBA Cup (the in-season tournament). Pure logic: the app hands in the league and gets back the draw, the schedule
// moves that put every group game on a Cup night, the group tables read from the real results, and the knockout.
//
// - The draw (Opening Night): each conference split into groups of about five, one team from each pot (pots by last
//   season's record), drawn at random within the pot.
// - Group stage: every team plays each group opponent once, on Cup nights in November. Those are real games the game
//   plays: the app moves one regular-season meeting of each pairing onto a Cup night (swapping whatever was there to
//   the game's old day), so every team still plays the same 82.
// - Knockout: the group winners and one wildcard per conference (the best second-place team) are seeded 1-4 in each
//   conference: quarterfinals 1 v 4 and 2 v 3, the conference final, then East v West in Las Vegas. The app plays
//   these itself (the game can't host extra games), with line scores and box scores.
import { mulberry32 } from './progression.js';
import { box } from './olympics.js';

export const confOf = (L, t) => (t.division < Math.ceil(Math.max(2, (L.divisions || []).length || 6) / 2) ? 0 : 1);
const pairKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

// The draw. `rec(t)`: last season's win share (0-1). Returns { groups: [{ conf, name, teams: [tid] }] }.
export function drawGroups(L, rec, seed) {
  const rng = mulberry32(seed ^ 0xc0b);
  const groups = [];
  for (const conf of [0, 1]) {
    const teams = L.teams.filter(t => confOf(L, t) === conf).sort((a, b) => rec(b) - rec(a));
    const n = Math.max(1, Math.round(teams.length / 5));
    const gs = Array.from({ length: n }, (_, i) => ({ conf, name: `${conf ? 'West' : 'East'} ${'ABCDEF'[i]}`, teams: [] }));
    for (let i = 0; i < teams.length; i += n) {
      const pot = teams.slice(i, i + n);
      for (let j = pot.length - 1; j > 0; j--) { const k = Math.floor(rng() * (j + 1)); [pot[j], pot[k]] = [pot[k], pot[j]]; }
      // Fill the smallest groups first, so a short last pot spreads out.
      const order = [...gs].sort((a, b) => a.teams.length - b.teams.length);
      pot.forEach((t, j) => order[j].teams.push(t.id));
    }
    groups.push(...gs);
  }
  return { groups };
}

// Lay the (still unplayed) season out again with every group game on a Cup night: the same games (same opponents,
// same home and away), the All-Star day where it was. Each group plays a round robin, two games a round (one team
// rests), one round a Cup night; the rest of the schedule is filled around them the way the game lays its own out
// (teams with the most games left first, nobody twice in a day). Only before the season's first game.
// Returns { games: [{ day, home, away }] }.
export const CUP_ROUND_NIGHTS = [6, 10, 14, 18, 22];
export function placeCupGames(L, draw, seed) {
  const S = L.season;
  if (!Array.isArray(S.schedule) || !S.schedule.length) return null;
  const all = S.schedule.flatMap(d => d.results || []), reg = all.filter(g => g.gameType === 0), special = all.filter(g => g.gameType !== 0);
  if (reg.some(g => g.homeScore || g.awayScore)) return null;   // under way: leave it alone
  const rng = mulberry32(seed ^ 0xc0b2);
  // Round robin per group (the circle method; a bye when the group is odd), one round a Cup night.
  const nights = new Map(), used = new Set();
  const take = (a, b) => { const g = reg.find(x => !used.has(x) && pairKey(x.homeTeam, x.awayTeam) === pairKey(a, b)); if (g) used.add(g); return g; };
  for (const gr of draw.groups) {
    const t = [...gr.teams]; if (t.length % 2) t.push(null);
    const n = t.length;
    for (let r = 0; r < n - 1; r++) {
      const night = CUP_ROUND_NIGHTS[r % CUP_ROUND_NIGHTS.length] + Math.floor(r / CUP_ROUND_NIGHTS.length);
      for (let i = 0; i < n / 2; i++) {
        const a = t[i], b = t[n - 1 - i];
        if (a == null || b == null) continue;
        const g = take(a, b);
        if (g) (nights.get(night) || nights.set(night, []).get(night)).push(g);
      }
      t.splice(1, 0, t.pop());   // rotate everyone but the first
    }
  }
  // Fill the days: Cup games first on their nights, then the rest, most games left first, nobody twice a day.
  const left = new Map();
  for (const g of reg) for (const id of [g.homeTeam, g.awayTeam]) left.set(id, (left.get(id) || 0) + 1);
  let pool = reg.filter(g => !used.has(g)).sort(() => rng() - 0.5);
  const days = [];
  for (let day = 0; (pool.length || [...nights.keys()].some(k => k >= day)) && day < 400; day++) {
    const busy = new Set(), today = [];
    const add = g => { today.push(g); busy.add(g.homeTeam); busy.add(g.awayTeam); left.set(g.homeTeam, left.get(g.homeTeam) - 1); left.set(g.awayTeam, left.get(g.awayTeam) - 1); };
    for (const g of nights.get(day) || []) add(g);
    pool.sort((x, y) => (left.get(y.homeTeam) + left.get(y.awayTeam)) - (left.get(x.homeTeam) + left.get(x.awayTeam)));
    const rest = [];
    for (const g of pool) { if (!busy.has(g.homeTeam) && !busy.has(g.awayTeam)) add(g); else rest.push(g); }
    pool = rest;
    days.push(today);
  }
  // The All-Star day back where it was (nights before it keep their days), the trade deadline two days after.
  const sched = days.map(d => ({ results: d }));
  const at = Math.min(sched.length, S.allStarWeekend || Math.round(sched.length * 0.66));
  if (special.length) { sched.splice(at, 0, { results: special }); S.allStarWeekend = at; S.tradeDeadline = Math.min(sched.length - 1, at + 2); }
  S.schedule = sched;
  // Game ids 1, 2, 3... in day order (the game's own layout), the special games last.
  let id = 1;
  for (const d of sched) for (const g of d.results) if (g.gameType === 0) g.gId = id++;
  for (const d of sched) for (const g of d.results) if (g.gameType !== 0) g.gId = id++;
  if (L.meta) L.meta.uGID = id - 1;
  const out = [];
  sched.forEach((d, di) => d.results.forEach(g => { if (used.has(g)) out.push({ day: di, home: g.homeTeam, away: g.awayTeam }); }));
  return { games: out, missed: [] };
}

// A Cup game's result from the schedule (null until it's played).
export function resultOf(L, cg) {
  const g = (L.season.schedule?.[cg.day]?.results || []).find(x => x.homeTeam === cg.home && x.awayTeam === cg.away);
  if (!g || !(g.homeScore || g.awayScore)) return null;
  return { hs: g.homeScore, as: g.awayScore, winner: g.homeScore > g.awayScore ? cg.home : cg.away };
}

// Group tables: wins, point differential, points, head to head for two-way ties.
export function tables(L, cup) {
  return cup.draw.groups.map(gr => {
    const row = Object.fromEntries(gr.teams.map(t => [t, { tid: t, w: 0, l: 0, pf: 0, pa: 0, gp: 0 }]));
    const h2h = {};
    for (const cg of cup.games.filter(cg => gr.teams.includes(cg.home) && gr.teams.includes(cg.away))) {
      const r = resultOf(L, cg);
      if (!r) continue;
      const H = row[cg.home], A = row[cg.away];
      H.gp++; A.gp++; H.pf += r.hs; H.pa += r.as; A.pf += r.as; A.pa += r.hs;
      if (r.winner === cg.home) { H.w++; A.l++; } else { A.w++; H.l++; }
      h2h[`${r.winner}>${r.winner === cg.home ? cg.away : cg.home}`] = true;
    }
    const rows = Object.values(row).sort((x, y) => y.w - x.w || (h2h[`${y.tid}>${x.tid}`] ? 1 : h2h[`${x.tid}>${y.tid}`] ? -1 : 0) || (y.pf - y.pa) - (x.pf - x.pa) || y.pf - x.pf);
    return { ...gr, rows, done: rows.every(r => r.gp >= gr.teams.length - 1) };
  });
}

// Knockout seeds per conference: the group winners by record, then the wildcard (best second place).
export function seeds(L, cup) {
  const T = tables(L, cup), out = {};
  for (const conf of [0, 1]) {
    const gs = T.filter(g => g.conf === conf);
    const rank = a => a.sort((x, y) => y.w - x.w || (y.pf - y.pa) - (x.pf - x.pa) || y.pf - x.pf);
    out[conf] = [...rank(gs.map(g => g.rows[0])), rank(gs.map(g => g.rows[1]).filter(Boolean))[0]].filter(Boolean).slice(0, 4).map(r => r.tid);
  }
  return out;
}

// One NBA game: 48 minutes, about 114 a side, the better team favored by its strength edge.
function game(rng, A, B, stage) {
  const edge = (A.str - B.str) * 0.9 + 1.5, margin = edge + (rng() + rng() + rng() + rng() - 2) * 14;   // +1.5: the higher seed's floor
  const total = 228 + (rng() - 0.5) * 30;
  let sa = Math.round((total + margin) / 2), sb = Math.round((total - margin) / 2);
  const split = n => { const w = [0, 1, 2, 3].map(() => 0.8 + rng() * 0.4), sw = w.reduce((a, b) => a + b, 0), q = w.map(v => Math.floor(n * v / sw)); q[3] += n - q.reduce((a, b) => a + b, 0); return q; };
  const qa = split(sa), qb = split(sb);
  let ot = 0;
  while (sa === sb) { ot++; const oa = 8 + Math.floor(rng() * 9), ob = 8 + Math.floor(rng() * 9); qa.push(oa); qb.push(ob); sa += oa; sb += ob; }
  return { stage, a: A.c, b: B.c, sa, sb, ot, qa, qb, box: [box(rng, { ...A, cap: 0.15, capD: 0.09 }, sa, ot, 240), box(rng, { ...B, cap: 0.15, capD: 0.09 }, sb, ot, 240)] };
}
// The knockout. `teamOf(tid)` gives { c: tid, str, roster } (roster as the Olympics box scores take it).
export function runKnockout(cup, sd, teamOf, seed) {
  const rng = mulberry32(seed ^ 0xc0b3), T = id => teamOf(id), games = [];
  const win = G => (G.sa > G.sb ? G.a : G.b), lose = G => (G.sa > G.sb ? G.b : G.a);
  const confWinner = conf => {
    const s = sd[conf];
    const q1 = game(rng, T(s[0]), T(s[3]), `${conf ? 'West' : 'East'} Quarterfinal`), q2 = game(rng, T(s[1]), T(s[2]), `${conf ? 'West' : 'East'} Quarterfinal`);
    const a = win(q1), b = win(q2), [hi, lo] = s.indexOf(a) < s.indexOf(b) ? [a, b] : [b, a];
    const f = game(rng, T(hi), T(lo), `${conf ? 'West' : 'East'} Semifinal`);
    games.push(q1, q2, f);
    return win(f);
  };
  const e = confWinner(0), w = confWinner(1);
  const fin = game(rng, T(e), T(w), 'Championship');
  games.push(fin);
  // MVP: the champion's best line across its knockout games.
  const champ = win(fin), lines = new Map();
  for (const G of games) G.box.forEach((b, side) => { const c = side ? G.b : G.a; for (const r of b) { if (c !== champ || typeof r.k !== 'number') continue; const L = lines.get(r.k) || lines.set(r.k, { k: r.k, gp: 0, pts: 0, reb: 0, ast: 0 }).get(r.k); if (r.min > 0) L.gp++; L.pts += r.pts; L.reb += r.reb; L.ast += r.ast; } });
  const mvp = [...lines.values()].sort((a, b) => (b.pts + b.reb * 0.8 + b.ast) / Math.max(1, b.gp) - (a.pts + a.reb * 0.8 + a.ast) / Math.max(1, a.gp))[0] || null;
  return { games, champion: champ, runnerUp: lose(fin), semis: games.filter(G => /Semifinal/.test(G.stage)).map(lose), mvp };
}
