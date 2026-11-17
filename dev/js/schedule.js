// A regular-season schedule for any number of teams, the way the game lays its own out: 82 games a team from the
// league's own settings (divisionGames, conferenceGames, nonConferenceGames: 3, 4 and 2 in the NBA file; a league that
// grew trims conference games to 3 to stay at 82), 41 at home, about
// 88 game days with nobody playing twice in a day, and the All-Star day (the game's special games, alone) two-thirds of
// the way in, the trade deadline two days later. Game ids run 1, 2, 3... in day order, the special games last.
// The game builds the schedule before the expansion draft and never again, so a league that grew in the summer
// needs a new one (needsSchedule).

const GAMES = 82;

function rng32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Does the save's schedule leave a team out (an expansion team the game never scheduled)?
export function needsSchedule(L) {
  const days = L.season?.schedule;
  if (!Array.isArray(days) || !days.length) return false;
  const reg = days.flatMap(d => d.results || []).filter(g => g.gameType === 0);
  if (!reg.length || reg.some(g => g.homeScore || g.awayScore)) return false;   // already under way: leave it alone
  // Only a team with no games at all (a team the game never scheduled); stray placeholder games are left as they are.
  const seen = new Set(reg.flatMap(g => [g.homeTeam, g.awayTeam]));
  return L.teams.some(t => !seen.has(t.id));
}

// How many times each pair meets: { 'a-b': n } with a < b.
function matchups(teams, confOf, rnd, per = { div: 3, conf: 4, other: 2 }) {
  const n = {}, key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const left = new Map(teams.map(t => [t.id, GAMES]));
  for (let i = 0; i < teams.length; i++) for (let j = i + 1; j < teams.length; j++) {
    const a = teams[i], b = teams[j];
    const c = a.division === b.division ? per.div : confOf(a) === confOf(b) ? per.conf : per.other;
    n[key(a.id, b.id)] = c; left.set(a.id, left.get(a.id) - c); left.set(b.id, left.get(b.id) - c);
  }
  // Each team still short of 82 picks up a game (one over gives one back) with a team that needs the same: a
  // conference rival outside its division first (3 <-> 4, then 2 <-> 3), then across conferences (2 <-> 3). Pairings
  // stay between 2 and 4 games. Unequal conferences (after an expansion) need some of each.
  const ok = (a, b, sign) => {
    const c = n[key(a.id, b.id)], same = confOf(a) === confOf(b);
    if (a.division === b.division) return false;
    return sign > 0 ? c < (same ? 4 : 3) : c > 2;
  };
  const rank = (a, b) => (confOf(a) === confOf(b) ? 0 : 1);
  for (let pass = 0; pass < 2000; pass++) {
    const off = teams.filter(t => left.get(t.id) !== 0).sort((x, y) => Math.abs(left.get(y.id)) - Math.abs(left.get(x.id)) || rnd() - 0.5);
    if (!off.length) break;
    const a = off[0], sign = Math.sign(left.get(a.id));
    const cands = teams.filter(b => b !== a && ok(a, b, sign));
    // A partner that needs the same change; failing that, any partner (it then needs the opposite change itself, which
    // a later pass settles).
    const pc = x => sign * n[key(a.id, x.id)];   // trim the pairs that meet most, add to those that meet least
    let b = cands.filter(x => Math.sign(left.get(x.id)) === sign).sort((x, y) => rank(a, x) - rank(a, y) || pc(x) - pc(y) || Math.abs(left.get(y.id)) - Math.abs(left.get(x.id)) || rnd() - 0.5)[0];
    if (!b) b = cands.sort((x, y) => rank(a, x) - rank(a, y) || pc(x) - pc(y) || rnd() - 0.5)[0];
    if (!b) break;
    n[key(a.id, b.id)] += sign; left.set(a.id, left.get(a.id) - sign); left.set(b.id, left.get(b.id) - sign);
  }
  return n;
}

// The games: [{ home, away }], every team at 41 home games (as near as an odd number of meetings allows).
function homeAway(teams, n, rnd) {
  const home = new Map(teams.map(t => [t.id, 0])), out = [];
  const odd = [];
  for (const [k, c] of Object.entries(n)) {
    const [a, b] = k.split('-').map(Number);
    for (let i = 0; i < Math.floor(c / 2); i++) { out.push({ home: a, away: b }, { home: b, away: a }); home.set(a, home.get(a) + 1); home.set(b, home.get(b) + 1); }
    if (c % 2) odd.push([a, b]);
  }
  // The odd game of each pairing goes to whichever side has fewer home games so far.
  odd.sort(() => rnd() - 0.5);
  const oddGames = [];
  for (const [a, b] of odd) { const h = home.get(a) <= home.get(b) ? a : b; const g = { home: h, away: h === a ? b : a }; out.push(g); oddGames.push(g); home.set(h, home.get(h) + 1); }
  // Then flip odd games from a team with too many home games to one with too few, until everyone is at half.
  const games = new Map(teams.map(t => [t.id, 0]));
  for (const g of out) { games.set(g.home, games.get(g.home) + 1); games.set(g.away, games.get(g.away) + 1); }
  const over = id => home.get(id) - Math.floor(games.get(id) / 2);
  // A chain of odd games from a team with one too many home games to a team with one too few, each flipped, moves one
  // home game along it without changing anyone in between.
  for (let pass = 0; pass < 200; pass++) {
    const src = teams.find(t => over(t.id) > 0);
    if (!src) break;
    const prev = new Map([[src.id, null]]), queue = [src.id];
    let end = null;
    while (queue.length && end == null) {
      const u = queue.shift();
      for (const g of oddGames) if (g.home === u && !prev.has(g.away)) { prev.set(g.away, g); if (over(g.away) < 0) { end = g.away; break; } queue.push(g.away); }
    }
    if (end == null) break;
    for (let v = end; prev.get(v); ) { const g = prev.get(v); const u = g.home; [g.home, g.away] = [g.away, g.home]; v = u; }
    home.set(src.id, home.get(src.id) - 1); home.set(end, home.get(end) + 1);
  }
  return out;
}

// Spread the games over days: each day, the teams with the most games left go first, nobody twice in a day.
function toDays(games, teams, rnd) {
  const left = new Map(teams.map(t => [t.id, 0]));
  for (const g of games) { left.set(g.home, left.get(g.home) + 1); left.set(g.away, left.get(g.away) + 1); }
  let pool = [...games].sort(() => rnd() - 0.5);
  const days = [];
  while (pool.length && days.length < 400) {
    pool.sort((x, y) => (left.get(y.home) + left.get(y.away)) - (left.get(x.home) + left.get(x.away)));
    const busy = new Set(), today = [], rest = [];
    for (const g of pool) {
      if (!busy.has(g.home) && !busy.has(g.away)) { today.push(g); busy.add(g.home); busy.add(g.away); left.set(g.home, left.get(g.home) - 1); left.set(g.away, left.get(g.away) - 1); }
      else rest.push(g);
    }
    days.push(today); pool = rest;
  }
  return days;
}

// The new schedule for league L (its teams, conferences by division: the first half of L.divisions is the first
// conference). Rewrites L.season.schedule, allStarWeekend and tradeDeadline. Returns { days, games }.
export function buildSchedule(L, seed = 1) {
  const S = L.season, rnd = rng32(seed);
  const nDiv = Math.max(2, (L.divisions || []).length || 6), half = Math.ceil(nDiv / 2);
  const confOf = t => (t.division < half ? 0 : 1);
  const teams = L.teams.filter(t => t.id != null);
  const old = (S.schedule || []).flatMap(d => d.results || []);
  const tpl = old.find(g => g.gameType === 0) || { league: 0, gameType: 0, tId: 0, tRound: 0, homeScore: 0, awayScore: 0, winner: 0, potg: 0, periods: 0, totalPeriods: 0, homeRecord: [0, 0], awayRecord: [0, 0], forced: -1 };
  const special = old.filter(g => g.gameType !== 0);
  const num = (v, d) => (Number.isFinite(+v) && +v > 0 ? +v : d);
  const per = { div: num(S.divisionGames, 3), conf: num(S.conferenceGames, 4), other: num(S.nonConferenceGames, 2) };
  const days = toDays(homeAway(teams, matchups(teams, confOf, rnd, per), rnd), teams, rnd);
  // The All-Star day two-thirds of the way in, with only the special games on it.
  const at = Math.round(days.length * 0.66);
  let gid = 1;
  const mk = g => ({ ...tpl, homeTeam: g.home, awayTeam: g.away, gId: gid++, homeScore: 0, awayScore: 0, winner: 0, potg: 0, periods: 0, totalPeriods: 0, homeRecord: [0, 0], awayRecord: [0, 0], forced: -1 });
  const sched = days.map(d => ({ results: d.map(mk) }));
  const star = special.map(g => ({ ...g, gId: gid++, homeScore: 0, awayScore: 0, winner: 0, potg: 0 }));
  if (star.length) { sched.splice(at, 0, { results: star }); S.allStarWeekend = at; S.tradeDeadline = Math.min(sched.length - 1, at + 2); }
  S.schedule = sched;
  // The game hands out new game ids from its counter: it starts after the last one here.
  if (L.meta) L.meta.uGID = gid - 1;
  return { days: sched.length, games: gid - 1 };
}
