// Season schedule builder: the matchups (real NBA formula or the save's own settings), laid out over the days with
// rest built in. Writes Hoop Land's own layout: season.schedule = [{ results: [game, ...] }, ...] one entry a day, regular
// games (gameType 0) with game ids 1, 2, 3... in day order and the All-Star day's special games last.
import { mulberry32 } from './progression.js';

const confOfDiv = (L, d) => (Array.isArray(L.divisions) && L.divisions.length ? Math.floor(d / (L.divisions.length / Math.max(1, (L.conferences || [0, 0]).length))) : 0);

// How many times each pair meets. 'nba': division 4, conference 4 against six and 3 against four (rotating), other
// conference 2 = 82. 'save': the save's own divisionGames / conferenceGames / nonConferenceGames.
export function matchups(L, mode = 'nba', seed = 1) {
  const rng = mulberry32(seed ^ 0x5c4ed);
  const T = L.teams.map(t => t.id), div = new Map(L.teams.map(t => [t.id, t.division]));
  const conf = id => confOfDiv(L, div.get(id));
  const S = L.season, pairs = [];
  const add = (a, b, n) => { for (let i = 0; i < n; i++) pairs.push(i % 2 ? [b, a] : [a, b]); };
  if (mode === 'save') {
    for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
      const a = T[i], b = T[j];
      add(a, b, div.get(a) === div.get(b) ? S.divisionGames : conf(a) === conf(b) ? S.conferenceGames : S.nonConferenceGames);
    }
    return pairs;
  }
  // NBA: inside each conference, every team plays four of its non-division opponents three times (not four). Pick
  // those "short" pairs so each team has exactly four (a 4-regular graph on its 10 non-division opponents), by
  // random restarts.
  const short = new Set();
  for (const c of [...new Set(T.map(conf))]) {
    const ids = T.filter(t => conf(t) === c);
    let best = null;
    for (let tries = 0; tries < 20000 && !best; tries++) {
      const need = new Map(ids.map(t => [t, 4])), pick = [];
      const cand = [];
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (div.get(ids[i]) !== div.get(ids[j])) cand.push([ids[i], ids[j], rng()]);
      cand.sort((x, y) => x[2] - y[2]);
      // Most-needy first each step.
      for (let k = 0; k < ids.length * 2; k++) {
        const open = cand.filter(([a, b]) => need.get(a) > 0 && need.get(b) > 0 && !pick.includes(`${a}-${b}`));
        if (!open.length) break;
        open.sort((x, y) => (need.get(y[0]) + need.get(y[1])) - (need.get(x[0]) + need.get(x[1])) || x[2] - y[2]);
        const [a, b] = open[0];
        pick.push(`${a}-${b}`); need.set(a, need.get(a) - 1); need.set(b, need.get(b) - 1);
        for (const e of cand) e[2] = rng();
      }
      if ([...need.values()].every(v => v === 0)) best = pick;
    }
    for (const k of best || []) short.add(k);
  }
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
    const a = T[i], b = T[j];
    add(a, b, div.get(a) === div.get(b) ? 4 : conf(a) === conf(b) ? (short.has(`${a}-${b}`) || short.has(`${b}-${a}`) ? 3 : 4) : 2);
  }
  // Odd series: balance home games so everyone gets 41 (flip the extra game's host where it helps).
  const home = new Map(T.map(t => [t, 0]));
  for (const [h] of pairs) home.set(h, home.get(h) + 1);
  for (let pass = 0; pass < 50; pass++) {
    let moved = false;
    for (const p of pairs) {
      const [h, a] = p;
      if (home.get(h) > home.get(a) + 1) { p[0] = a; p[1] = h; home.set(h, home.get(h) - 1); home.set(a, home.get(a) + 1); moved = true; }
    }
    if (!moved) break;
  }
  return pairs;
}

// Lay the games over `days` days. Every day has a target number of games (a full slate, a light one on `breaks`); the
// teams furthest behind pace go first, and a team that played yesterday (more so two days running) waits when it
// can. Nobody plays twice a day; a rematch waits a week when it can.
export function layout(pairs, days, seed = 1, breaks = []) {
  const rng = mulberry32(seed ^ 0x1a7);
  const teams = [...new Set(pairs.flat())], full = Math.floor(teams.length / 2);
  const left = new Map(teams.map(t => [t, 0]));
  for (const [h, a] of pairs) { left.set(h, left.get(h) + 1); left.set(a, left.get(a) + 1); }
  const brk = new Set(breaks), total = pairs.length;
  // Targets: light days at about 40% of a slate; the rest share what's left evenly.
  const light = Math.round(full * 0.4), heavy = days - brk.size;
  const base = (total - light * brk.size) / heavy;
  const target = []; let acc = 0, placedT = 0;
  for (let d = 0; d < days; d++) { if (brk.has(d)) { target.push(light); placedT += light; continue; } acc += base; const n = Math.min(full, Math.round(acc - (placedT - light * [...brk].filter(x => x < d).length))); target.push(n); placedT += n; }
  const last = new Map(), prev2 = new Map(), lastPair = new Map();
  let pool = pairs.map(([h, a]) => ({ h, a, r: rng() }));
  const out = [];
  for (let d = 0; d < days; d++) {
    const daysLeft = days - d, busy = new Set(), today = [];
    const urg = t => left.get(t) / daysLeft;
    const tired = t => (last.get(t) === d - 1 ? (prev2.get(t) === d - 2 ? 0.9 : 0.35) : 0);
    const score = g => {
      const k = g.h < g.a ? `${g.h}-${g.a}` : `${g.a}-${g.h}`;
      return urg(g.h) + urg(g.a) - tired(g.h) - tired(g.a) - (lastPair.get(k) >= d - 6 ? 0.5 : 0) + g.r * 0.05;
    };
    // Teams that must play today (as many games left as days) go first.
    pool.sort((x, y) => score(y) - score(x));
    const must = pool.filter(g => urg(g.h) >= 1 || urg(g.a) >= 1);
    const rest = [];
    const want = Math.max(target[d], 0);
    for (const g of [...must, ...pool.filter(g => !must.includes(g))]) {
      const forced = urg(g.h) >= 1 || urg(g.a) >= 1;
      if ((today.length < want || forced) && !busy.has(g.h) && !busy.has(g.a)) {
        today.push(g); busy.add(g.h); busy.add(g.a);
        for (const t of [g.h, g.a]) { left.set(t, left.get(t) - 1); if (last.get(t) === d - 1) prev2.set(t, d - 1); else prev2.delete(t); last.set(t, d); }
        lastPair.set(g.h < g.a ? `${g.h}-${g.a}` : `${g.a}-${g.h}`, d);
      } else rest.push(g);
    }
    pool = rest;
    out.push(today);
  }
  for (const g of pool) {   // shouldn't happen: the first day both are free, from the end
    let d = out.length - 1;
    while (d >= 0 && out[d].some(x => [x.h, x.a].includes(g.h) || [x.h, x.a].includes(g.a))) d--;
    if (d < 0) { out.push([]); d = out.length - 1; }
    out[d].push(g);
  }
  return out;
}

// Write a laid-out season into the save, keeping the game's own fields. The All-Star day (its special games) goes
// back near where it was; the trade deadline two days after; any non-game markers (games against team 0) stay on
// the same share of the season.
export function writeSchedule(L, dayGames, opts = {}) {
  const S = L.season, old = S.schedule || [];
  const all = old.flatMap(d => d.results || []);
  const tmpl = all.find(g => g.gameType === 0 && g.homeTeam && g.awayTeam) || { league: 0, gameType: 0, tId: 0, tRound: 0, homeScore: 0, awayScore: 0, winner: 0, potg: 0, periods: 0, totalPeriods: 0, homeRecord: [0, 0], awayRecord: [0, 0], forced: -1 };
  const special = all.filter(g => g.gameType !== 0);
  const markers = old.flatMap((d, i) => (d.results || []).filter(g => g.gameType === 0 && (!g.homeTeam || !g.awayTeam)).map(g => ({ g, at: i / Math.max(1, old.length - 1) })));
  const sched = dayGames.map(d => ({ results: d.map(x => ({ ...tmpl, homeTeam: x.h, awayTeam: x.a, homeRecord: [0, 0], awayRecord: [0, 0], homeScore: 0, awayScore: 0, winner: 0, potg: 0, periods: 0, totalPeriods: 0 })) }));
  const asAt = Math.min(sched.length, opts.allStarDay ?? Math.round((S.allStarWeekend || 57) / Math.max(1, old.length) * sched.length));
  if (special.length) { sched.splice(asAt, 0, { results: special }); S.allStarWeekend = asAt; S.tradeDeadline = Math.min(sched.length - 1, asAt + 2); }
  for (const m of markers) sched[Math.min(sched.length - 1, Math.round(m.at * (sched.length - 1)))].results.push(m.g);
  let id = 1;
  for (const d of sched) for (const g of d.results) if (g.gameType === 0 && g.homeTeam && g.awayTeam) g.gId = id++;
  for (const d of sched) for (const g of d.results) if (g.gameType !== 0) g.gId = id++;
  if (L.meta) L.meta.uGID = id - 1;
  S.schedule = sched;
  return sched;
}

// A team's rest: back-to-backs, days off, the longest run of games.
export function restReport(sched, id) {
  const days = [];
  sched.forEach((d, i) => { if (d.results.some(g => g.gameType === 0 && (g.homeTeam === id || g.awayTeam === id) && g.homeTeam && g.awayTeam)) days.push(i); });
  let b2b = 0, run = 1, maxRun = 1;
  for (let i = 1; i < days.length; i++) { if (days[i] - days[i - 1] === 1) { b2b++; run++; maxRun = Math.max(maxRun, run); } else run = 1; }
  return { games: days.length, b2b, off: sched.length - days.length, maxRun };
}
