// Realistic draft classes: hand-built classes for given draft years (data/classes/<year>.json), installed in place of
// the game's own class when that draft comes around. Each time one goes in it's varied a little, so no two saves get
// exactly the same players:
// - ratings move by a point here and there (now and ceiling), never past 20 or under 1, now never above the ceiling;
// - play-style tendencies are re-rolled around the file's values (-2 to +2 each), personality traits a point or two;
// - a few players' potential moves up or down one (a 10 can become a 9, a 9 a 10), always in pairs, so the class keeps
//   exactly as many players at every potential: 3 five-star and 4 four-and-a-half-star stays 3 and 4.
// The class files are the Draft Class Lab's own format (Export Class), or any JSON holding a list of prospects.

import { tameRatings } from './classtools.js';

export const REAL_CLASS_YEARS = [2027, 2028, 2029];
export const classUrl = yr => `data/classes/${yr}.json`;

const clone = o => JSON.parse(JSON.stringify(o));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// The prospects in a class file: the Lab's pack ({ kind: 'hlc-class', prospects }) or a list of players anywhere in it.
export function prospectsIn(json) {
  if (json?.kind === 'hlc-class' && Array.isArray(json.prospects)) return { pack: json };
  const isPlayer = o => o && typeof o === 'object' && typeof o.fn === 'string' && o.attributes && typeof o.pot === 'number';
  let list = null;
  const walk = o => {
    if (list || !o || typeof o !== 'object') return;
    if (Array.isArray(o) && o.length && o.every(isPlayer)) { list = o; return; }
    for (const v of Object.values(o)) walk(v);
  };
  walk(json);
  return list ? { pack: { kind: 'hlc-class', v: 1, prospects: list, meta: {} } } : null;
}

// Potential swaps: about one player in eight, in pairs from neighboring levels (a 10 and a 9 trade places), so the
// count at every level is unchanged. A player who moves up gains a little ceiling; one who moves down loses a little.
// Production tilts it, the way it does for pros: a standout college producer is likelier to be the one moving up, a
// poor one the one moving down (zOf: his college production against his class, or null).
function swapPotentials(cls, rng, zOf = () => null) {
  const pairs = Math.max(1, Math.round(cls.length / 16));
  const moved = new Set();
  for (let k = 0; k < pairs * 4 && moved.size < pairs * 2; k++) {
    const a = cls[Math.floor(rng() * cls.length)];
    if (moved.has(a.id)) continue;
    const za = zOf(a) ?? 0;
    const dir = rng() < Math.max(0.15, Math.min(0.85, 0.5 + 0.2 * za)) ? 1 : -1;
    const b = cls.filter(p => !moved.has(p.id) && p !== a && p.pot === a.pot + dir);
    if (!b.length) continue;
    // The partner goes the other way: when a moves up, the weakest producer at the level above is likeliest to drop.
    const w = b.map(p => Math.max(0.2, 1 + dir * -(zOf(p) ?? 0) * 0.6)), tot = w.reduce((x, y) => x + y, 0);
    let r = rng() * tot, j = 0;
    for (; j < b.length - 1; j++) { r -= w[j]; if (r <= 0) break; }
    const c = b[j];
    [a.pot, c.pot] = [c.pot, a.pot];
    nudgeCeilings(a, a.pot - c.pot, rng);
    nudgeCeilings(c, c.pot - a.pot, rng);
    moved.add(a.id); moved.add(c.id);
  }
  return moved;
}
function nudgeCeilings(p, dir, rng) {
  const keys = Object.keys(p.attributes || {}).filter(k => Array.isArray(p.attributes[k]));
  for (let i = 0; i < 3 && keys.length; i++) {
    const a = p.attributes[keys[Math.floor(rng() * keys.length)]];
    a[1] = clamp(a[1] + dir * (1 + Math.floor(rng() * 2)), a[0], 20);
  }
}

// A tendency's shuffle: -2 (10%), -1 (20%), 0 (40%), +1 (20%), +2 (10%).
const tendRoll = rng => { const r = rng(); return r < 0.1 ? -2 : r < 0.3 ? -1 : r < 0.7 ? 0 : r < 0.9 ? 1 : 2; };
// One varied copy of a class. rng: a seeded random (same seed, same class).
export function varyClass(prospects, rng, zOf = () => null) {
  const cls = clone(prospects);
  const step = (p = 0.35) => (rng() < p ? (rng() < 0.5 ? -1 : 1) : 0);
  for (const p of cls) {
    for (const a of Object.values(p.attributes || {})) {
      if (!Array.isArray(a)) continue;
      a[1] = clamp(a[1] + step(0.2), 1, 20);
      a[0] = clamp(a[0] + step(0.3), 1, a[1]);
    }
    // Play style: every tendency re-rolled around the class file's own value, -2 to +2 (no change likeliest), so each
    // save's class plays a little differently while the file stays as written.
    for (const k of Object.keys(p.tendencies || {})) if (typeof p.tendencies[k] === 'number') p.tendencies[k] = clamp(p.tendencies[k] + tendRoll(rng), -5, 5);
    for (const k of Object.keys(p.traits || {})) if (typeof p.traits[k] === 'number' && p.traits[k] > 0) p.traits[k] = clamp(p.traits[k] + step(0.4) * (rng() < 0.3 ? 2 : 1), 1, 20);
  }
  swapPotentials(cls, rng, zOf);   // copies keep their ids, so zOf reads them like the originals
  for (const p of cls) fitPotential(p);
  tameRatings(cls, rng);   // a nudge can't make a 17 common or an 18 more than rare
  return cls;
}

// The potential's cap on the 12 skill ratings (168 for a 5-star, 14 less per half star): over it, the highest
// ratings come down a point at a time, ceiling and current alike, so nobody is better than his potential allows.
const SKILLS = ['LAY', 'DNK', 'INS', 'MID', 'TPT', 'FTS', 'DRB', 'PAS', 'ORE', 'DRE', 'STL', 'BLK'];
export const capFor = pot => 168 - 14 * (10 - pot);
export function fitPotential(p) {
  if (!p.attributes || !SKILLS.every(k => Array.isArray(p.attributes[k]))) return;
  const cap = capFor(p.pot);
  for (const i of [1, 0]) {
    let over = SKILLS.reduce((a, k) => a + p.attributes[k][i], 0) - cap;
    while (over > 0) {
      const keys = [...SKILLS].sort((a, b) => p.attributes[b][i] - p.attributes[a][i]).filter(k => p.attributes[k][i] > 1);
      if (!keys.length) break;
      for (const k of keys) { if (over <= 0) break; p.attributes[k][i]--; over--; }
    }
  }
  for (const k of SKILLS) p.attributes[k][0] = Math.min(p.attributes[k][0], p.attributes[k][1]);
}

// How many at each potential: the check that a varied class kept the shape of the original.
export const potCounts = cls => cls.reduce((m, p) => { m[p.pot] = (m[p.pot] || 0) + 1; return m; }, {});
