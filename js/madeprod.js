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

// pct: where his skill total ranks in his class, 0 (last) to 1 (best). Returns the same shape as collegeLine, with
// li: null (no league in the save to rank him in), made: true, and gs (per-36 game score, for production grades).
export function makeLine(p, { yr, pct = 0.5, ped = '', salt = 0 } = {}) {
  const r = rng((salt ^ Math.imul((p.id || 0) + 101, 2654435761)) >>> 0);
  const g = () => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  const { intl, where, year } = schoolYear(p, ped);
  const big = (p.pos ?? 4) >= 6, guard = (p.pos ?? 4) <= 2;
  // Role: the best in the class start and carry the offense; upperclassmen get the keys earlier than freshmen. A
  // little luck either way (the right system, a crowded rotation) is what makes production worth reading.
  const luck = clamp(g() * 0.12, -0.25, 0.25);
  const role = clamp(0.55 + pct * 0.45 + year * 0.05 + luck, 0.4, 1.15);
  const mpg = clamp(14 + role * 18 + g() * 1.5, 12, 36);
  const gp = intl ? Math.round(clamp(24 + r() * 8, 20, 34)) : Math.round(clamp(29 + r() * 7 - (r() < 0.12 ? 6 + r() * 8 : 0), 14, 37));
  const m = mpg / 32;
  const scoring = (cur(p, 'LAY') + cur(p, 'INS') + cur(p, 'MID') + cur(p, 'TPT') + cur(p, 'DRB') + cur(p, 'DNK') * 0.5) / 5.5;
  const pts = Math.max(0.5, mpg * (0.4 + 0.036 * (scoring - 8)) * (0.62 + role * 0.5) * (1 + g() * 0.08));
  const tpa = Math.max(0, m * ((cur(p, 'TPT') - 6) * 0.42 + tend(p, 'threePoint') * 0.35) * (0.8 + role * 0.3) + g() * 0.3);
  const tp = clamp(25 + cur(p, 'TPT') * 1.0 + g() * 3, 15, 47);
  const ft = clamp(51 + cur(p, 'FTS') * 1.9 + g() * 3, 40, 92);
  const inside = (cur(p, 'LAY') + cur(p, 'DNK') + cur(p, 'INS')) / 3;
  const fg = clamp(42.5 + (inside - 8) * 1.0 + (big ? 5 : guard ? -1.5 : 1) - Math.min(8, tpa * 0.9) + g() * 2.5, 33, 66);
  const reb = Math.max(0.5, m * (2.1 + (cur(p, 'ORE') + cur(p, 'DRE')) / 2 * 0.46 + ((p.ht || 78) - 78) * 0.22) * (1 + g() * 0.08));
  const ast = Math.max(0.2, m * (0.5 + cur(p, 'PAS') * 0.27 + cur(p, 'DRB') * 0.06) * (0.75 + role * 0.35) * (1 + g() * 0.08));
  const stl = Math.max(0.1, m * (0.25 + cur(p, 'STL') * 0.075) * (1 + g() * 0.1));
  const blk = Math.max(0, m * (0.05 + cur(p, 'BLK') * 0.085 + (big ? 0.3 : 0)) * (1 + g() * 0.12));
  const tov = Math.max(0.3, 0.5 + ast * 0.3 + pts * 0.05 + g() * 0.2);
  const round1 = v => Math.round(v * 10) / 10;
  // Game score per 36 from the per-game line (field goal attempts from points and percentages).
  const fta = ft > 0 ? pts * 0.22 / (ft / 100) : 0, ftm = fta * ft / 100;
  const fgm = Math.max(0, (pts - ftm - tpa * tp / 100) / 2 + tpa * tp / 100), fga = fg > 0 ? fgm / (fg / 100) : 0;
  const gs = (pts + 0.7 * reb + 0.7 * ast + stl + 0.7 * blk - 0.7 * tov - 0.4 * (fga - fgm) - 0.4 * (fta - ftm)) / mpg * 36;
  return {
    yr, li: null, made: true, team: intl ? `Pro club · ${where}` : ['Freshman', 'Sophomore', 'Junior', 'Senior'][year] + ' season',
    gp, mpg: round1(mpg), pts: round1(pts), reb: round1(reb), ast: round1(ast), stl: round1(stl), blk: round1(blk), tov: round1(tov),
    fg: round1(fg), tp: tpa >= 0.3 ? round1(tp) : null, ft: round1(ft), tpa: round1(tpa), gs: Math.round(gs * 100) / 100,
  };
}

// Lines for a whole class: each player's place in it, then his line.
export function makeLines(cls, { yr, pedOf = () => '', salt = 0 } = {}) {
  const sums = cls.map(skillSum).sort((a, b) => a - b), n = Math.max(1, cls.length - 1);
  const out = new Map();
  for (const p of cls) out.set(p.id, makeLine(p, { yr, pct: sums.indexOf(skillSum(p)) / n, ped: pedOf(p), salt }));
  return out;
}
