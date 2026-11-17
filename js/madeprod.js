// Made-up production: a season line for a prospect the save has no college stats for (an NBA-only save's draft
// class, or a realistic class's player who isn't on a college roster here). It comes from his ratings, his role in
// his class (how good he is next to the others), his year in school (or a season overseas), his tendencies and some
// luck of his own, so it reads like a real season and can still surprise: production is judged against the class,
// the way real stats are. The app keeps each line once made, so it never changes after the draft.

const SK = ['LAY', 'DNK', 'INS', 'MID', 'TPT', 'FTS', 'DRB', 'PAS', 'ORE', 'DRE', 'STL', 'BLK'];
const cur = (p, k) => (Array.isArray(p.attributes?.[k]) ? p.attributes[k][0] : 8);
const tend = (p, k) => p.tendencies?.[k] ?? 0;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const skillSum = p => SK.reduce((a, k) => a + cur(p, k), 0);

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Year in school from the class file's pedigree line ("Four-star recruit · Sophomore", "International (France) · ...")
// or, without one, from his age.
export function schoolYear(p, ped = '') {
  const m = /International \(([^)]+)\)/.exec(ped || '');
  if (m) return { intl: true, where: m[1], year: 1 };
  const y = ['Freshman', 'Sophomore', 'Junior', 'Senior'].findIndex(w => (ped || '').includes(w));
  if (y >= 0) return { intl: false, year: y };
  return { intl: false, year: clamp((p.age || 19) - 18, 0, 3) };
}

// Recruit stars from the pedigree line ("Five-star recruit · Freshman"): 5, 4, 3 (3 without one).
export const recruitStars = (ped = '') => (/Five-star/i.test(ped) ? 5 : /Four-star/i.test(ped) ? 4 : /Three-star/i.test(ped) ? 3 : 3);
// The play-style label nudges the shot diet and the box score the way the scouting label reads.
function styleBends(style = '') {
  const s = style.toLowerCase(), has = w => s.includes(w);
  return {
    three: has('shoot') || has('shot-making') || has('3-and-d') || has('stretch') || has('sniper') ? 1.25 : has('interior') || has('post') || has('rim') ? 0.6 : 1,
    attack: has('slash') || has('athletic') || has('downhill') || has('finisher') || has('creator') || has('shot-creat') ? 1.2 : 1,
    pass: has('point') || has('playmak') || has('floor general') || has('connector') || has('glue') ? 1.2 : 1,
    def: has('two-way') || has('3-and-d') || has('defens') || has('stopper') || has('rim protect') ? 1.15 : 1,
    glass: has('rebound') || has('rugged') || has('rim') || has('interior') ? 1.12 : 1,
  };
}
// pct: where his skill total ranks in his class, 0 (last) to 1 (best). Returns the same shape as collegeLine, with
// li: null (no league in the save to rank him in), made: true, and gs (per-36 game score, for production grades).
// tier: his school ('power' a powerhouse, 'mid' a top mid-major, 'other'): at a powerhouse a star shares the ball with
// other pros (fewer shots, better looks); at a smaller school he carries it (more volume, harder shots).
// style: the class's play-style label. league: an overseas prospect's pro league (shown with his country).
export function makeLine(p, { yr, pct = 0.5, ped = '', salt = 0, tier = 'mid', style = '', league = '', rank = null, club = null } = {}) {
  const r = rng((salt ^ Math.imul((p.id || 0) + 101, 2654435761)) >>> 0);
  const g = () => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  const { intl, where, year } = schoolYear(p, ped);
  const big = (p.pos ?? 4) >= 6, guard = (p.pos ?? 4) <= 2, stars = recruitStars(ped), sb = styleBends(style);
  // Tendencies on the game's scale (about -5 to +5): how he likes to score and defend.
  const T = k => clamp(tend(p, k), -5, 5) / 5;
  const attackT = (T('dunk') + T('floater') + T('cross') + T('spin') + T('step')) / 5, postT = (T('post') + T('hook') + T('fades')) / 3;
  // Role: the best in the class start and carry the offense; a top recruit plays big minutes right away, upperclassmen
  // get the keys earlier than freshmen. A little luck either way (the right system, a crowded rotation).
  const luck = clamp(g() * 0.1, -0.2, 0.2);
  // The class's own projection: a top-five pick is the focal point wherever he plays.
  const rankUp = rank == null ? 0 : rank <= 5 ? 0.12 : rank <= 14 ? 0.06 : rank <= 30 ? 0.02 : 0;
  const role = clamp(0.55 + pct * 0.42 + year * 0.05 + (stars - 4) * 0.06 + rankUp + luck, 0.4, 1.15);
  // Usage by school: a powerhouse spreads the shots, a mid-major leans on him, a small school runs everything through him.
  // Overseas, the club decides: a EuroLeague team's deep roster keeps a teenager to spot minutes, a development club
  // (Mega, Ulm, Metropolitans 92) or an NBL Next Stars spot plays him, Overtime Elite runs everything through him.
  const lvl = club?.lvl || 'dev';
  const usage = intl ? { elite: 0.7, dev: 0.82, nbl: 0.8, ote: 1.05 }[lvl] : tier === 'power' ? 0.92 : tier === 'other' ? 1.16 : 1.06;
  const effAdj = intl ? { elite: -0.5, dev: -1.5, nbl: -1.5, ote: 0 }[lvl] : tier === 'power' ? 1.5 : tier === 'other' ? -2 : -0.5;
  const mpg = intl ? ({ elite: clamp(9 + role * 9 + g() * 2, 6, 24), dev: clamp(13 + role * 12 + g() * 2, 10, 30), nbl: clamp(12 + role * 12 + g() * 2, 9, 28), ote: clamp(18 + role * 12 + g() * 1.5, 16, 33) })[lvl] : clamp(14 + role * 18 + g() * 1.5, 12, 36);
  const gp = intl ? Math.round(clamp((lvl === 'elite' ? 30 : lvl === 'nbl' ? 26 : lvl === 'ote' ? 28 : 28) + r() * 8 - 4, 16, 40)) : Math.round(clamp(29 + r() * 7 - (r() < 0.12 ? 6 + r() * 8 : 0), 14, 37));
  const m = mpg / 32;
  const scoring = (cur(p, 'LAY') + cur(p, 'INS') + cur(p, 'MID') + cur(p, 'TPT') + cur(p, 'DRB') + cur(p, 'DNK') * 0.5) / 5.5;
  const pts = Math.max(0.5, mpg * (0.4 + 0.036 * (scoring - 8)) * (0.62 + role * 0.5) * usage * (1 + attackT * 0.05) * (1 + g() * 0.08));
  const tpa = Math.max(0, m * ((cur(p, 'TPT') - 6) * 0.42 + tend(p, 'threePoint') * 0.35) * (0.8 + role * 0.3) * usage * sb.three * (1 - Math.max(0, postT) * 0.4) + (sb.three > 1 ? m * 1.6 : 0) + g() * 0.3);
  const tp = clamp(25 + cur(p, 'TPT') * 1.0 + effAdj * 0.5 + g() * 3, 15, 47);
  const ft = clamp(51 + cur(p, 'FTS') * 1.9 + g() * 3, 40, 92);
  const inside = (cur(p, 'LAY') + cur(p, 'DNK') + cur(p, 'INS')) / 3;
  const fg = clamp(42.5 + (inside - 8) * 1.0 + (big ? 5 : guard ? -1.5 : 1) - Math.min(8, tpa * 0.9) + effAdj + Math.max(0, postT) * 1.5 + g() * 2.5, 33, 66);
  const reb = Math.max(0.5, m * (2.1 + (cur(p, 'ORE') + cur(p, 'DRE')) / 2 * 0.46 + ((p.ht || 78) - 78) * 0.22) * sb.glass * (1 + (T('offReb') + T('defReb')) * 0.04) * (intl ? 0.9 : 1) * (1 + g() * 0.08));
  const ast = Math.max(0.2, m * (0.5 + cur(p, 'PAS') * 0.27 + cur(p, 'DRB') * 0.06) * (0.75 + role * 0.35) * sb.pass * (1 + T('pass') * 0.08) * (intl ? 0.85 : 1) * (1 + g() * 0.08));
  const stl = Math.max(0.1, m * (0.25 + cur(p, 'STL') * 0.075) * sb.def * (1 + (T('stealOnBall') + T('stealOffBall')) * 0.05) * (1 + g() * 0.1));
  const blk = Math.max(0, m * (0.05 + cur(p, 'BLK') * 0.085 + (big ? 0.3 : 0)) * sb.def * (1 + T('block') * 0.08) * (1 + g() * 0.12));
  const tov = Math.max(0.3, 0.5 + ast * 0.3 + pts * 0.05 + g() * 0.2);
  const round1 = v => Math.round(v * 10) / 10;
  // Free throws: slashers and attackers get to the line more.
  const ftShare = clamp(0.2 * sb.attack * (1 + attackT * 0.25), 0.12, 0.34);
  const fta = ft > 0 ? pts * ftShare / (ft / 100) : 0, ftm = fta * ft / 100;
  const fgm = Math.max(0, (pts - ftm - tpa * tp / 100) / 2 + tpa * tp / 100), fga = fg > 0 ? fgm / (fg / 100) : 0;
  const gs = (pts + 0.7 * reb + 0.7 * ast + stl + 0.7 * blk - 0.7 * tov - 0.4 * (fga - fgm) - 0.4 * (fta - ftm)) / mpg * 36;
  return {
    yr, li: null, made: true, intl: !!intl, country: intl ? where : undefined, lg: intl ? (club?.lg || league || 'Professional league') : undefined,
    team: intl ? (club ? `${club.n} · ${club.ct}` : `${league || 'Professional league'} · ${where}`) : ['Freshman', 'Sophomore', 'Junior', 'Senior'][year] + ' season',
    gp, mpg: round1(mpg), pts: round1(pts), reb: round1(reb), ast: round1(ast), stl: round1(stl), blk: round1(blk), tov: round1(tov),
    fg: round1(fg), tp: tpa >= 0.3 ? round1(tp) : null, ft: round1(ft), tpa: round1(tpa), fta: round1(fta), gs: Math.round(gs * 100) / 100,
  };
}

// Lines for a whole class: each player's place in it, then his line.
export function makeLines(cls, { yr, pedOf = () => '', salt = 0, tierOf = () => 'mid', styleOf = () => '', leagueOf = () => '', rankOf = () => null, clubOf = () => null } = {}) {
  const sums = cls.map(skillSum).sort((a, b) => a - b), n = Math.max(1, cls.length - 1);
  const out = new Map();
  for (const p of cls) out.set(p.id, makeLine(p, { yr, pct: sums.indexOf(skillSum(p)) / n, ped: pedOf(p), salt, tier: tierOf(p), style: styleOf(p), league: leagueOf(p), rank: rankOf(p), club: clubOf(p) }));
  return out;
}

// Overseas clubs. lvl: elite (EuroLeague: deep rosters, spot minutes for a teenager), dev (clubs that play their
// prospects), nbl (NBL Next Stars), ote (Overtime Elite). n: club, lg: league, ct: the club's country.
const C = (n, lg, ct, lvl) => ({ n, lg, ct, lvl });
export const CLUBS = {
  euroElite: [C('Real Madrid', 'Liga ACB', 'Spain', 'elite'), C('FC Barcelona', 'Liga ACB', 'Spain', 'elite'), C('Baskonia', 'Liga ACB', 'Spain', 'elite'),
    C('Partizan', 'ABA League', 'Serbia', 'elite'), C('Crvena Zvezda', 'ABA League', 'Serbia', 'elite'), C('ASVEL', 'LNB Élite', 'France', 'elite'),
    C('AS Monaco', 'LNB Élite', 'France', 'elite'), C('Paris Basketball', 'LNB Élite', 'France', 'elite'), C('Bayern Munich', 'BBL', 'Germany', 'elite'),
    C('Žalgiris Kaunas', 'LKL', 'Lithuania', 'elite'), C('Anadolu Efes', 'BSL', 'Turkey', 'elite'), C('Fenerbahçe', 'BSL', 'Turkey', 'elite'),
    C('Olimpia Milano', 'Serie A', 'Italy', 'elite'), C('Virtus Bologna', 'Serie A', 'Italy', 'elite'), C('Panathinaikos', 'GBL', 'Greece', 'elite'),
    C('Olympiacos', 'GBL', 'Greece', 'elite'), C('Maccabi Tel Aviv', 'Israeli League', 'Israel', 'elite')],
  euroDev: [C('Mega Basketball', 'ABA League', 'Serbia', 'dev'), C('FMP', 'ABA League', 'Serbia', 'dev'), C('Cedevita Olimpija', 'ABA League', 'Slovenia', 'dev'),
    C('Joventut Badalona', 'Liga ACB', 'Spain', 'dev'), C('Unicaja', 'Liga ACB', 'Spain', 'dev'), C('Palencia', 'Primera FEB', 'Spain', 'dev'),
    C('Ratiopharm Ulm', 'BBL', 'Germany', 'dev'), C('Alba Berlin', 'BBL', 'Germany', 'dev'), C('Filathlitikos', 'GBL', 'Greece', 'dev'),
    C('Rytas Vilnius', 'LKL', 'Lithuania', 'dev'), C('Aquila Basket Trento', 'Serie A', 'Italy', 'dev'), C('OKK Beograd', 'ABA League', 'Serbia', 'dev')],
  france: [C('Metropolitans 92', 'LNB Élite', 'France', 'dev'), C('Cholet', 'LNB Élite', 'France', 'dev'), C('JL Bourg', 'LNB Élite', 'France', 'dev'),
    C('Le Mans', 'LNB Élite', 'France', 'dev'), C('Saint-Quentin', 'LNB Élite', 'France', 'dev'), C('Nanterre 92', 'LNB Élite', 'France', 'dev'),
    C('SIG Strasbourg', 'LNB Élite', 'France', 'dev')],
  nbl: [C('South East Melbourne Phoenix', 'NBL', 'Australia', 'nbl'), C('New Zealand Breakers', 'NBL', 'New Zealand', 'nbl'), C('Illawarra Hawks', 'NBL', 'Australia', 'nbl'), C('Adelaide 36ers', 'NBL', 'Australia', 'nbl'),
    C('Melbourne United', 'NBL', 'Australia', 'nbl'), C('Sydney Kings', 'NBL', 'Australia', 'nbl'), C('Perth Wildcats', 'NBL', 'Australia', 'nbl'),
    C('Cairns Taipans', 'NBL', 'Australia', 'nbl'), C('Brisbane Bullets', 'NBL', 'Australia', 'nbl')],
  ote: [C('Overtime Elite', 'OTE', 'USA', 'ote')],
};
// Where a prospect from each country plays: [pool, weight]. The best prospects lean to the clubs that play them.
const ROUTES = {
  France: [['france', 6], ['euroElite', 2], ['euroDev', 1]],
  Spain: [['euroElite', 3], ['euroDev', 2]],
  Serbia: [['euroDev', 3], ['euroElite', 2]],
  Canada: [['nbl', 3], ['ote', 2], ['euroDev', 2], ['france', 1]],
  Australia: [['nbl', 5], ['euroDev', 1]],
  'New Zealand': [['nbl', 5], ['euroDev', 1]],
  USA: [['ote', 3], ['nbl', 2], ['euroDev', 1]],
};
const ROUTE_ANY = [['euroDev', 4], ['euroElite', 2], ['france', 2], ['nbl', 1]];
export function clubFor(country, { seed = 0, rank = null } = {}) {
  const r = rng(seed >>> 0), routes = ROUTES[country] || ROUTE_ANY;
  // A top-ten prospect usually plays: development clubs, the NBL or Overtime Elite over a EuroLeague bench.
  const w = routes.map(([k, v]) => [k, rank != null && rank <= 10 && k === 'euroElite' ? v * 0.4 : v]);
  let x = r() * w.reduce((a, [, v]) => a + v, 0), pool = w[0][0];
  for (const [k, v] of w) { if ((x -= v) <= 0) { pool = k; break; } }
  const list = CLUBS[pool];
  // Home clubs first when the pool has one from his own country.
  const home = list.filter(c => c.ct === country), pick = home.length && r() < 0.6 ? home : list;
  return pick[Math.floor(r() * pick.length)];
}

// A club a class file names (from a big board): the club from the lists, or as given (a development club).
export function clubNamed(c) {
  const all = Object.values(CLUBS).flat(), hit = all.find(x => x.n === c.n);
  return hit || { n: c.n, lg: c.lg || 'Professional league', ct: c.ct || '', lvl: c.lvl || 'dev' };
}
