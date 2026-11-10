// Draft class shaping, for the Draft Class Lab and the realistic classes alike.
//
// Rarity. On the game's 20-point scale (half a point on its 10-point display), a prospect's ratings:
// - 17 (8.5/10) is rare: about 1.5% of a class's skill ratings;
// - 18-19 (9-9.5) is extremely rare: three in a class at most, a 19 only for a 5-star's best rating;
// - 20 (10/10) never happens in a class.
// Points taken off a rating go to the same player's next-best ratings (never past 16), so his level stays put.
//
// Physicals. Strength, speed and stamina are dealt out the way the pro league has them (its own share at every value,
// from the save's NBA rosters; 18-20 as common as it is there), keeping each player's order in the class (the
// strongest stays the strongest): strength leans on his weight, speed away from his height, stamina toward guards.
// Without a league to read, a built-in scale close to the NBA's.

export const SKILL_KEYS = ['LAY', 'DNK', 'INS', 'MID', 'TPT', 'FTS', 'DRB', 'PAS', 'ORE', 'DRE', 'STL', 'BLK'];

// Share of a class at each value (they don't need to add to 100: they're weights).
export const PHYS_DIST = {   // the NBA's own shape (a 450-player league), for when there's none to read
  STR: { 8: 73, 9: 67, 10: 77, 11: 63, 12: 47, 13: 36, 14: 16, 15: 31, 16: 12, 17: 15, 18: 9, 19: 4 },
  SPD: { 8: 21, 9: 15, 10: 24, 11: 39, 12: 37, 13: 73, 14: 62, 15: 68, 16: 49, 17: 28, 18: 16, 19: 14, 20: 4 },
  STM: { 11: 1, 12: 1, 13: 8, 14: 44, 15: 74, 16: 92, 17: 90, 18: 44, 19: 46, 20: 50 },
};

const quantileValue = (dist, q) => {
  const vals = Object.keys(dist).map(Number).sort((a, b) => a - b), tot = vals.reduce((a, v) => a + dist[v], 0);
  let acc = 0;
  for (const v of vals) { acc += dist[v] / tot; if (q < acc) return v; }
  return vals[vals.length - 1];
};

// The pro league's share at every value of each physical rating (ref: its players), or null if too few.
export function physDistOf(ref) {
  const ps = (ref || []).filter(p => p.attributes?.STR && p.attributes?.SPD && p.attributes?.STM);
  if (ps.length < 100) return null;
  const out = {};
  for (const k of ['STR', 'SPD', 'STM']) { const h = {}; for (const p of ps) { const v = p.attributes[k][0]; h[v] = (h[v] || 0) + 1; } out[k] = h; }
  return out;
}
export const PROSPECT_SHIFT = { STR: -2, SPD: -0.5, STM: 1 };
export function balancePhysicals(cls, rng = Math.random, ref = null) {
  const dist = physDistOf(ref) || PHYS_DIST;
  const score = {
    STR: p => p.attributes.STR[0] + ((p.wt || 210) - 215) / 12 + rng() * 1.5,
    SPD: p => p.attributes.SPD[0] - ((p.ht || 78) - 78) * 0.25 + rng() * 1.5,
    STM: p => p.attributes.STM[0] / 4 + (p.pos <= 2 ? 1.2 : p.pos <= 5 ? 0.6 : 0) + rng() * 2.5,
  };
  for (const k of ['STR', 'SPD', 'STM']) {
    const ps = cls.filter(p => Array.isArray(p.attributes?.[k]));
    const order = ps.map(p => ({ p, s: score[k](p) })).sort((a, b) => a.s - b.s);
    order.forEach(({ p }, i) => {
      // His place in the class, give or take a little (so no two classes come out the same).
      const q = Math.max(0, Math.min(0.999, (i + 0.5 + (rng() - 0.5) * 2) / order.length));
      // Then where a prospect sits against the pros: young legs (stamina a point up), about pro speed (half a point
      // down: the drills and coaching still to come), and well short of pro strength (two points down: the biggest
      // gap between a college body and an NBA one).
      const shift = PROSPECT_SHIFT[k], half = shift % 1 ? (rng() < 0.5 ? Math.floor(shift) : Math.ceil(shift)) : shift;
      const v = Math.max(5, Math.min(20, quantileValue(dist[k], q) + half));
      p.attributes[k] = [v, v];   // the game never develops a physical: no ceiling above the rating
    });
  }
}

// The skill ratings' rarity across a class. Works on ceilings; a current rating that sat at its ceiling moves with it.
export function tameRatings(cls, rng = Math.random, { top = 3, share17 = 0.016 } = {}) {
  const at = (p, k) => p.attributes[k][1];
  const moved = new Map();   // player -> { key: delta }
  const shift = (p, k, d) => { const m = moved.get(p) || moved.set(p, {}).get(p); m[k] = (m[k] || 0) + d; p.attributes[k][1] += d; };
  for (const p of cls) for (const k of SKILL_KEYS) if (at(p, k) >= 20) shift(p, k, 19 - at(p, k));
  // 18-19: the few best, by rating and then potential.
  const high = cls.flatMap(p => SKILL_KEYS.filter(k => at(p, k) >= 18).map(k => ({ p, k }))).sort((a, b) => at(b.p, b.k) - at(a.p, a.k) || b.p.pot - a.p.pot || rng() - 0.5);
  high.forEach(({ p, k }, i) => {
    if (i >= top) shift(p, k, 17 - at(p, k));
    else if (at(p, k) === 19 && !(i === 0 && p.pot >= 10)) shift(p, k, -1);
  });
  // 17: about 1.5% of the class's ratings, the higher potentials first.
  const allow = Math.max(4, Math.round(cls.length * SKILL_KEYS.length * share17));
  const s17 = cls.flatMap(p => SKILL_KEYS.filter(k => at(p, k) === 17).map(k => ({ p, k }))).sort((a, b) => b.p.pot - a.p.pot || rng() - 0.5);
  s17.slice(allow).forEach(({ p, k }) => shift(p, k, -1));
  // The points go back into his next-best ratings (up to 16), so his level holds.
  for (const [p, m] of moved) {
    let back = -Object.values(m).reduce((a, d) => a + d, 0);
    const keys = SKILL_KEYS.filter(k => !(k in m)).sort((a, b) => at(p, b) - at(p, a));
    for (let pass = 0; back > 0 && pass < 4; pass++) for (const k of keys) { if (back <= 0) break; if (at(p, k) < 16) { shift(p, k, 1); back--; } }
  }
  // Current ratings: one that sat at its ceiling moves with it; none ends above its ceiling.
  for (const [p, m] of moved) for (const [k, d] of Object.entries(m)) {
    const a = p.attributes[k], was1 = a[1] - d;
    a[0] = a[0] === was1 ? a[1] : Math.min(a[0], a[1]);
  }
  for (const p of cls) for (const k of SKILL_KEYS) p.attributes[k][0] = Math.max(1, Math.min(p.attributes[k][0], p.attributes[k][1]));
  return moved.size;
}

// How a class's skill ratings spread at the top (for checks and reports).
export function rarityCount(cls) {
  const c = { 17: 0, 18: 0, 19: 0, 20: 0 };
  for (const p of cls) for (const k of SKILL_KEYS) { const v = p.attributes[k][1]; if (v >= 17) c[Math.min(20, v)]++; }
  return c;
}
