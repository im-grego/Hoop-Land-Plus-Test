// Create Your Player: the app's deeper version of the game's creator, for a career save at its start (the high school
// showcase, before the college offers). The archetypes come from the real NBA file (data/creator/archetypes.json): for
// each one and each position, how the players who play that way spread their ratings, their habits, and who they are
// ("shades of"). The build: a potential (4, 4.5 or 5 stars), a primary archetype that sets his ceilings to it, a
// secondary trait that bends those ceilings a little (High-Flying, 2-Way, Crafty...), then a pool of upgrade points
// you spend on any rating you like (the game splits its points by category; here it's one pool).
//
// What the game expects of a recruit, read off its own career saves: he sits on a showcase team (starTeams) at 17,
// ratings stored [now, ceiling], tendencies -5..5, no skills yet, arc empty until the game names him.

export const RATINGS = ['LAY', 'DNK', 'INS', 'MID', 'TPT', 'FTS', 'DRB', 'PAS', 'ORE', 'DRE', 'STL', 'BLK'];
export const SLOT_NAMES = { 1: 'Point Guard', 2: 'Shooting Guard', 3: 'Small Forward', 4: 'Power Forward', 5: 'Center' };
export const SLOT_SHORT = { 1: 'PG', 2: 'SG', 3: 'SF', 4: 'PF', 5: 'C' };
// The game's nine positions from a primary and a secondary slot (next to each other: the combo; otherwise the primary).
const GAME_POS = { 1: 0, 2: 2, 3: 4, 4: 6, 5: 8 };
const COMBO = { '1-2': 1, '2-3': 3, '3-4': 5, '4-5': 7 };
export function gamePos(slot, slot2) {
  if (slot2 && Math.abs(slot - slot2) === 1) return COMBO[`${Math.min(slot, slot2)}-${Math.max(slot, slot2)}`];
  return GAME_POS[slot];
}
// A name for the pair: "Point Forward" (SF + PG), "Point Center" (C + PG) and the like; a plain combo otherwise.
export function posLabel(slot, slot2) {
  if (!slot2 || slot2 === slot) return SLOT_NAMES[slot];
  if (slot2 === 1 && slot >= 3) return slot === 3 ? 'Point Forward' : slot === 4 ? 'Point Forward (PF)' : 'Point Center';
  const combo = { '1-2': 'Combo Guard', '2-3': 'Wing (SG/SF)', '3-4': 'Forward (SF/PF)', '4-5': 'Big (PF/C)' }[`${Math.min(slot, slot2)}-${Math.max(slot, slot2)}`];
  return combo || `${SLOT_SHORT[slot]} / ${SLOT_SHORT[slot2]}`;
}

// Secondary traits: what he adds on top of his primary style. Each one bends his ceilings toward it (points move, the
// total doesn't), and a couple add to his body.
export const SECONDARY = {
  flyer: { name: 'High-Flying', note: 'Super athletic: speed and dunking', w: { DNK: 1.45, LAY: 1.1 }, body: { SPD: 2 }, lead: 'High-Flying' },
  twoway: { name: '2-Way', note: 'Defense on top of his game: steals, blocks, defensive boards', w: { STL: 1.45, BLK: 1.35, DRE: 1.3 }, lead: '2-Way' },
  crafty: { name: 'Crafty', note: 'Touch around the basket: layups and inside scoring', w: { LAY: 1.35, INS: 1.35 }, lead: 'Crafty' },
  sniper: { name: 'Sharpshooting', note: 'Range: the three and the mid-range', w: { TPT: 1.45, MID: 1.15 }, lead: 'Sharpshooting' },
  handles: { name: 'Playmaking', note: 'Handle and vision: dribbling and passing', w: { DRB: 1.3, PAS: 1.35 }, lead: 'Playmaking' },
  glass: { name: 'Glass-Cleaning', note: 'Crashes both boards', w: { ORE: 1.5, DRE: 1.35 }, body: { STR: 1 }, lead: 'Rebounding' },
  power: { name: 'Bruiser', note: 'Strength and post scoring', w: { INS: 1.35, DNK: 1.15 }, body: { STR: 2 }, lead: 'Bruising' },
  lockdown: { name: 'Lockdown', note: 'A stopper on the ball: steals and quick feet', w: { STL: 1.6 }, body: { SPD: 1 }, lead: 'Lockdown' },
};
export const ADDONS = SECONDARY;   // the old name
// Upgrade points: his pedigree sets how many he gets to spend (on top of a base every recruit starts with). Sandbox: as
// many as it takes to max everything.
export const BASE_LV = 40;
// Potential: the ceilings' total (the app's cap: 168 at 5 stars, 14 fewer each half star down).
export const TIERS = { 8: { stars: '4', cap: 140 }, 9: { stars: '4.5', cap: 154 }, 10: { stars: '5', cap: 168 } };
// Pedigree: how highly he was recruited sets where his ratings start (the game's own 5-star showcase kids run 58-70).
export const PEDIGREE = { 3: { name: 'Three-star recruit', lv: 52 }, 4: { name: 'Four-star recruit', lv: 57 }, 5: { name: 'Five-star recruit', lv: 62 }, 6: { name: 'Top-10 recruit in the country', lv: 66 }, 9: { name: 'Sandbox', lv: 136 } };
export const POINTS = ped => 168 - 2 * (100 - PEDIGREE[ped].lv) - (168 - 2 * (100 - BASE_LV));
export const HIGH_SCHOOLS = [
  'Montverde Academy (FL)', 'IMG Academy (FL)', 'Oak Hill Academy (VA)', 'Sierra Canyon (CA)', 'La Lumiere School (IN)', 'Prolific Prep (CA)',
  'Link Academy (MO)', 'Brewster Academy (NH)', 'Columbus (Miami, FL)', 'Duncanville (TX)', 'Mater Dei (CA)', 'Long Island Lutheran (NY)',
  'Paul VI (VA)', 'AZ Compass Prep (AZ)', 'Wasatch Academy (UT)', 'Bishop Gorman (NV)', 'DeMatha Catholic (MD)', 'Archbishop Stepinac (NY)',
  'Findlay Prep (NV)', 'Oak Ridge (FL)', 'Overtime Elite (GA)', 'Hillcrest Prep (AZ)', 'Christ the King (NY)', 'Simeon (IL)', 'Whitney Young (IL)',
  'Your hometown high school',
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// How tall a rating can go at his height (the same rule the league files use): bigs can't dribble like guards, guards
// can't block like bigs; free throws top out at 15, as in the game's own files.
export function sizeCap(k, ht) {
  if (k === 'FTS') return 15;
  const f = { DNK: h => (h - 66) * 1.6, BLK: h => (h - 68) * 1.4, ORE: h => (h - 66) * 1.3, DRE: h => (h - 64) * 1.3, DRB: h => (96 - h) * 1.25 }[k];
  return f ? clamp(Math.round(f(ht)), 3, 20) : 20;
}
const lvOf = total => Math.floor(100 - (168 - total) / 2);
const totalFor = lv => 168 - 2 * (100 - lv);

// Ratings spread to an exact total, as close to the weights as the caps allow.
function spread(w, T, cap, floor = {}) {
  let lo = 0.01, hi = 500;
  const mk = m => Object.fromEntries(RATINGS.map(k => [k, clamp(Math.round(w[k] * m), floor[k] ?? 1, cap[k])]));
  for (let i = 0; i < 70; i++) { const mid = (lo + hi) / 2; const s = Object.values(mk(mid)).reduce((a, b) => a + b, 0); if (s < T) lo = mid; else hi = mid; }
  const r = mk(hi);
  let s = Object.values(r).reduce((a, b) => a + b, 0), guard = 400;
  while (s > T && guard--) { const k = RATINGS.filter(x => r[x] > (floor[x] ?? 1)).sort((a, b) => (r[b] - w[b] * hi) - (r[a] - w[a] * hi))[0]; if (!k) break; r[k]--; s--; }
  while (s < T && guard--) { const k = RATINGS.filter(x => r[x] < cap[x]).sort((a, b) => (r[a] - w[a] * hi) - (r[b] - w[b] * hi))[0]; if (!k) break; r[k]++; s++; }
  return r;
}

// One line on how each style plays.
export const ARCH_DESC = {
  '3lvl': 'Scores from all three levels: at the rim, the mid-range and three',
  creator: 'Makes his own shot off the dribble, late clock or not',
  midrange: 'Lives in the mid-range: pull-ups, fadeaways, the elbow',
  insideout: 'Bully-ball inside, the jumper outside: a matchup problem',
  slasher: 'Downhill: gets to the rim and finishes through contact',
  flyer: 'Above the rim: lobs, putbacks, transition dunks',
  sharp: 'A knockdown shooter off the catch and the move',
  spot: 'Spaces the floor and punishes help',
  general: 'Runs the offense: sets the table, controls tempo',
  playscorer: 'Scores and creates in the same possession',
  pointfwd: 'A forward who runs the offense',
  playbig: 'Offense runs through him at the elbow and the block',
  post: 'Back-to-the-basket scoring: hooks, drop steps, power',
  glass: 'Owns the boards on both ends',
  runner: 'Rolls hard, catches lobs, runs the floor',
  stretch: 'A big who spaces the floor',
  anchor: 'Protects the rim and anchors the defense',
  lockdown: 'Takes the other team\'s best perimeter scorer',
  switch: 'Guards one through five',
  unicorn: 'A big with a guard\'s skill set: shoots, handles, blocks',
};
// The game's skill rules in a career: stars (simple 1, regular 2, elite 3), their cost in skill points, 4 a category,
// and an elite skill needs 8 in its rating.
export const skillStars = id => (['HIG', 'SPA', 'DIM', 'CLA'].includes(id) ? 1 : ['BUL', 'DUN', 'LIM', 'UNF', 'FOO', 'HOT', 'BAL', 'SNA'].includes(id) ? 3 : 2);
export const CAREER_ELITE_MIN = 8;
export const PER_CATEGORY = 4;
export const archById = (data, id) => data.archetypes.find(a => a.id === id);
// Archetypes that fit a position (bigs' styles at PF and C, and so on).
export const archsFor = (data, slot) => data.archetypes.filter(a => a.slots[slot]);
const slotData = (a, slot) => a.slots[slot] || a.slots[Object.keys(a.slots).map(Number).sort((x, y) => Math.abs(x - slot) - Math.abs(y - slot))[0]];

// The whole build. o: { slot, slot2, ht, wt, arch, sec, pot (8|9|10), pedigree, spent: { rating: points } | null }.
// Ceilings: the primary archetype at his position, scaled to his potential, bent by the secondary trait. Ratings: a
// base in the same shape, then the points (spent: yours; null: spent for you along the build).
export function build(data, o) {
  const slot = o.slot, slot2 = o.slot2 && o.slot2 !== o.slot ? o.slot2 : null;
  const B = data.base[slot], B2 = slot2 ? data.base[slot2] : null;
  const shape = Object.fromEntries(RATINGS.map(k => [k, B2 ? B.shape[k] * 0.75 + B2.shape[k] * 0.25 : B.shape[k]]));
  const a1 = archById(data, o.arch), e1 = slotData(a1, slot), S = SECONDARY[o.sec] || null;
  const w = {};
  for (const k of RATINGS) {
    let e = e1.emph[k];
    if (a1.sig.includes(k)) e *= 1.25;
    if (S?.w?.[k]) e *= S.w[k];
    w[k] = shape[k] * e ** 1.6;
  }
  const cap = Object.fromEntries(RATINGS.map(k => [k, sizeCap(k, o.ht)]));
  const NEED = { 1: { DRB: 12, PAS: 9 }, 2: { DRB: 10 }, 3: {}, 4: { BLK: 8, DRE: 11, ORE: 7, INS: 9 }, 5: { BLK: 9, DRE: 12, ORE: 8, INS: 10, DNK: 9 } }[slot];
  const ceil = spread(w, TIERS[o.pot].cap, cap, Object.fromEntries(RATINGS.map(k => [k, Math.min(cap[k], NEED[k] ?? 3)])));
  // Body: strength from his weight against his position, speed the other way; stamina high (he's 17).
  const ph = B.phys, wtD = (o.wt - B.wt);
  const body = { STR: clamp(Math.round(ph.STR - 2 + wtD / 10 + (S?.body?.STR || 0)), 3, 20), SPD: clamp(Math.round(ph.SPD - 0.5 - wtD / 14 + (S?.body?.SPD || 0)), 3, 20), STM: clamp(Math.round(ph.STM), 10, 20) };
  // The base every recruit starts from, and the points on top.
  const base = spread(w, totalFor(BASE_LV), ceil);
  const ALL = [...RATINGS, 'SPD', 'STR', 'STM'];
  const pool = POINTS(o.pedigree);
  const spent = o.spent || autoSpend(w, base, ceil, pool);
  const used = ALL.reduce((n, k) => n + (spent[k] || 0), 0);
  const now = Object.fromEntries(RATINGS.map(k => [k, clamp(base[k] + (spent[k] || 0), 1, 20)]));
  const attributes = Object.fromEntries(RATINGS.map(k => [k, [now[k], Math.max(ceil[k], now[k])]]));
  for (const k of ['SPD', 'STR', 'STM']) { const v = clamp(body[k] + (spent[k] || 0), 1, 20); attributes[k] = [v, v]; }
  // Habits: his position's, bent by what his style does more (or less) than the position does.
  const tend = {};
  for (const k of data.tendKeys) {
    const v = (B.tend[k] ?? 0) + (e1.tend[k] ?? 0) * 0.8 + (o.sec === 'twoway' && /steal|block|takeCharge/.test(k) ? 1 : 0) + (o.sec === 'sniper' && k === 'threePoint' ? 2 : 0)
      + (o.sec === 'flyer' && /dunk|lob/.test(k) ? 2 : 0) + (o.sec === 'glass' && /Reb/.test(k) ? 2 : 0) + (o.sec === 'crafty' && /floater|twoPoint/.test(k) ? 1 : 0)
      + (o.sec === 'handles' && /pass|cross/.test(k) ? 1 : 0) + (o.sec === 'power' && /post|hook/.test(k) ? 2 : 0) + (o.sec === 'lockdown' && k === 'stealOnBall' ? 2 : 0);
    tend[k] = clamp(Math.round(v), -5, 5);
  }
  const nowT = RATINGS.reduce((n, k) => n + attributes[k][0], 0), ceilT = RATINGS.reduce((n, k) => n + ceil[k], 0), potCap = TIERS[o.pot].cap;
  return {
    attributes, base, ceil, body, spent, pool, used, left: pool - used, tendencies: tend, pos: gamePos(slot, slot2),
    lvNow: lvOf(nowT), lvCeil: lvOf(RATINGS.reduce((n, k) => n + attributes[k][1], 0)), lvPot: lvOf(potCap),
    pastPot: RATINGS.some(k => now[k] > ceil[k]),   // points past a ceiling: beyond what his potential lets him grow to
    noRoom: nowT >= ceilT,
    name: archName(data, o), shades: shadesFor(data, o),
  };
}
// Points spent for you: along the build's shape, up to each ceiling.
function autoSpend(w, base, ceil, pool) {
  const target = spread(w, Math.min(RATINGS.reduce((n, k) => n + base[k], 0) + pool, RATINGS.reduce((n, k) => n + ceil[k], 0)), ceil, base);
  return Object.fromEntries(RATINGS.map(k => [k, target[k] - base[k]]));
}
// The archetype's name: "2-Way 3-Level Scorer", "Crafty Playmaking Big" (2-Way always leads).
export function archName(data, o) {
  const a1 = archById(data, o.arch), S = SECONDARY[o.sec];
  return [S?.lead, a1.name].filter(Boolean).join(' ');
}
// Shades of: the all-time greats who played his primary style at his spot, and today's 4.5- and 5-star players who do
// (his secondary style's when they share names, then the rest).
export function shadesFor(data, o) {
  const a1 = archById(data, o.arch), d1 = slotData(a1, o.slot) || {}, d2 = {};
  const pick = (x, y, n) => { const both = (x || []).filter(v => (y || []).includes(v)); return [...new Set([...both, ...(x || []), ...(y || [])])].slice(0, n); };
  const legends = pick(d1.legends, d2.legends, 2);
  return { legends, today: pick(d1.shades, d2.shades, 4).filter(n => !legends.includes(n)).slice(0, 2) };
}
// "Shades of Kobe Bryant, Dwyane Wade · today: Devin Booker"
export const shadesLine = sh => [sh.legends.length ? sh.legends.join(', ') : '', sh.today.length ? `today: ${sh.today.join(', ')}` : ''].filter(Boolean).join(' · ');
// The game's career recruit in a save at the start of a career: on a showcase team, before the college offers.
export function careerRecruit(save) {
  for (let li = 0; li < (save?.seasonLeagues || []).length; li++) {
    const L = save.seasonLeagues[li], id = L.season?.playerId;
    if (L.season?.mode !== 2 || !id) continue;
    for (const t of L.starTeams || []) { const p = (t.roster || []).find(x => x.id === id); if (p) return { L, li, p, team: t, stage: 'showcase' }; }
    for (const t of L.teams || []) { const p = (t.roster || []).find(x => x.id === id); if (p && L.career?.gamesPlayed === 0 && (p.stats || []).every(s => !s.season?.[0]?.GP)) return { L, li, p, team: t, stage: 'committed' }; }
  }
  return null;
}
// Write the build onto the game's recruit. Identity and body from the form, ratings, potential, tendencies and the
// archetype from the build; everything the game set up for his career (ids, stats rows, season, appearance) stays.
export function applyBuild(p, o, b) {
  if (o.fn) p.fn = o.fn.trim();
  if (o.ln) p.ln = o.ln.trim();
  if (o.home != null) p.home = o.home.trim();
  if (o.num != null && o.num !== '') p.num = clamp(+o.num, 0, 99);
  Object.assign(p, { ht: o.ht, wt: o.wt, pos: b.pos, teamPos: b.pos, pot: o.pot, arc: b.name });
  for (const [k, v] of Object.entries(b.attributes)) p.attributes[k] = [...v];
  Object.assign(p.tendencies, b.tendencies);
  // Skills: the ones you picked, at their levels (the simple ones have none), all equipped.
  if (Array.isArray(o.skills)) p.skills = o.skills.map(x => ({ id: x.id, xp: 0, level: x.level ?? 1, equipped: true }));
  return p;
}
