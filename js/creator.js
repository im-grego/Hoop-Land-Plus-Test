// Create Your Player: the app's deeper version of the game's creator, for a career save at its start (the high school
// showcase, before the college offers). The archetypes come from the real NBA file (data/creator/archetypes.json): for
// each one and each position, how the players who play that way spread their ratings, their habits, and who they are
// ("shades of"). The build is a primary and a secondary archetype (60/40), add-ons that trade points rather than add
// them, a primary and a secondary position, a body, a potential (4, 4.5 or 5 stars: the ceilings' total) and a
// pedigree (how highly recruited he is: where his ratings start).
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

export const ADDONS = {
  twoway: { name: '2-Way', note: 'Defense versatility: points move into steals, blocks and defensive boards', w: { STL: 1.45, BLK: 1.35, DRE: 1.3 } },
  crafty: { name: 'Crafty', note: 'Touch: layups, the mid-range and free throws', w: { LAY: 1.2, MID: 1.2, FTS: 1.15 } },
  athletic: { name: 'Athletic', note: 'Above the rim: dunks, and a step quicker', w: { DNK: 1.35 }, phys: { SPD: 1.5 } },
  glass: { name: 'Glass-Cleaning', note: 'Crashes both boards', w: { ORE: 1.45, DRE: 1.35 } },
  range: { name: 'Deep Range', note: 'Three-point range on top of his game', w: { TPT: 1.35 } },
  handles: { name: 'Tight Handles', note: 'Dribbling and passing', w: { DRB: 1.3, PAS: 1.15 } },
};
// Potential: the ceilings' total (the app's cap: 168 at 5 stars, 14 fewer each half star down).
export const TIERS = { 8: { stars: '4', cap: 140 }, 9: { stars: '4.5', cap: 154 }, 10: { stars: '5', cap: 168 } };
// Pedigree: how highly he was recruited sets where his ratings start (the game's own 5-star showcase kids run 58-70).
export const PEDIGREE = { 3: { name: 'Three-star recruit', lv: 52 }, 4: { name: 'Four-star recruit', lv: 57 }, 5: { name: 'Five-star recruit', lv: 62 }, 6: { name: 'Top-10 recruit in the country', lv: 66 } };
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

export const archById = (data, id) => data.archetypes.find(a => a.id === id);
// Archetypes that fit a position (bigs' styles at PF and C, and so on).
export const archsFor = (data, slot) => data.archetypes.filter(a => a.slots[slot]);
const slotData = (a, slot) => a.slots[slot] || a.slots[Object.keys(a.slots).map(Number).sort((x, y) => Math.abs(x - slot) - Math.abs(y - slot))[0]];

// The whole build. o: { slot, slot2, ht, wt, arch, arch2, addons: [], pot (8|9|10), pedigree (3..6) }.
export function build(data, o) {
  const slot = o.slot, slot2 = o.slot2 && o.slot2 !== o.slot ? o.slot2 : null;
  const B = data.base[slot], B2 = slot2 ? data.base[slot2] : null;
  // His position's shape, a quarter of the way toward the second position's.
  const shape = Object.fromEntries(RATINGS.map(k => [k, B2 ? B.shape[k] * 0.75 + B2.shape[k] * 0.25 : B.shape[k]]));
  const a1 = archById(data, o.arch), a2 = o.arch2 && o.arch2 !== o.arch ? archById(data, o.arch2) : null;
  const e1 = slotData(a1, slot), e2 = a2 ? slotData(a2, slot) : null;
  const w = {};
  for (const k of RATINGS) {
    let e = e2 ? (e1.emph[k] ** 0.6) * (e2.emph[k] ** 0.4) : e1.emph[k];
    if (a1.sig.includes(k)) e *= 1.25;
    if (a2?.sig.includes(k)) e *= 1.12;
    for (const id of o.addons || []) e *= ADDONS[id]?.w?.[k] || 1;
    w[k] = shape[k] * e ** 1.6;
  }
  const cap = Object.fromEntries(RATINGS.map(k => [k, sizeCap(k, o.ht)]));
  // Floors for what his position needs at any archetype: a guard handles it, a big blocks and rebounds.
  const NEED = { 1: { DRB: 12, PAS: 9 }, 2: { DRB: 10 }, 3: {}, 4: { BLK: 8, DRE: 11, ORE: 7, INS: 9 }, 5: { BLK: 9, DRE: 12, ORE: 8, INS: 10, DNK: 9 } }[slot];
  // Ceiling: his ceiling level (the potential's by default; you can set it anywhere, up to every rating at 20).
  const ceilLv = o.ceilLv ?? lvOf(TIERS[o.pot].cap);
  let ceilT = clamp(totalFor(ceilLv), 24, 240);
  const roomAll = RATINGS.reduce((s, k) => s + cap[k], 0);
  const cap2 = ceilT > roomAll ? Object.fromEntries(RATINGS.map(k => [k, 20])) : cap;   // past what his size allows: the size caps lift
  const ceil = spread(w, ceilT, cap2, Object.fromEntries(RATINGS.map(k => [k, Math.min(cap2[k], NEED[k] ?? 3)])));
  // Floor: where he starts (his pedigree's level by default; you can set it), never above a ceiling.
  const floorLv = o.floorLv ?? Math.min(PEDIGREE[o.pedigree].lv + (o.pot - 9), lvOf(TIERS[o.pot].cap) - 10);
  const now = spread(w, Math.min(clamp(totalFor(floorLv), 12, 240), RATINGS.reduce((s, k) => s + ceil[k], 0)), ceil);
  // Body: strength from his weight against his position, speed the other way; stamina high (he's 17).
  const ph = B.phys, wtD = (o.wt - B.wt);
  const athletic = (o.addons || []).includes('athletic') ? 1.5 : 0;
  const STR = clamp(Math.round(ph.STR - 2 + wtD / 10), 3, 20), SPD = clamp(Math.round(ph.SPD - 0.5 - wtD / 14 + athletic), 3, 20), STM = clamp(Math.round(ph.STM), 10, 20);
  const attributes = Object.fromEntries(RATINGS.map(k => [k, [now[k], ceil[k]]]));
  Object.assign(attributes, { STR: [STR, STR], SPD: [SPD, SPD], STM: [STM, STM] });
  // Your own edits on top, rating by rating (now, ceiling): anything from 1 to 20, a ceiling never under now.
  for (const [k, [n, c]] of Object.entries(o.edits || {})) if (attributes[k]) { const nn = clamp(n, 1, 20); attributes[k] = [nn, clamp(Math.max(c, nn), 1, 20)]; }
  // Habits: his position's, bent by what his archetypes do more (or less) than the position does.
  const tend = {};
  for (const k of data.tendKeys) {
    const v = (B.tend[k] ?? 0) + (e1.tend[k] ?? 0) * 0.7 + (e2 ? (e2.tend[k] ?? 0) * 0.4 : 0) + ((o.addons || []).includes('twoway') && /steal|block|takeCharge/.test(k) ? 1 : 0)
      + ((o.addons || []).includes('range') && k === 'threePoint' ? 1 : 0) + ((o.addons || []).includes('athletic') && /dunk|lob/.test(k) ? 1 : 0) + ((o.addons || []).includes('glass') && /Reb/.test(k) ? 1 : 0);
    tend[k] = clamp(Math.round(v), -5, 5);
  }
  const nowT = RATINGS.reduce((s, k) => s + attributes[k][0], 0), ceilSum = RATINGS.reduce((s, k) => s + attributes[k][1], 0), potCap = TIERS[o.pot].cap;
  return {
    attributes, tendencies: tend, pos: gamePos(slot, slot2), lvNow: lvOf(nowT), lvCeil: lvOf(ceilSum), lvPot: lvOf(potCap),
    pastPot: ceilSum > potCap,             // his ceilings run past what his potential allows
    noRoom: nowT >= ceilSum,               // he starts at his ceiling: nothing left to grow into
    room: ceilSum - nowT, name: archName(data, o), shades: shadesFor(data, o),
  };
}
// The archetype's name: "2-Way 3-Level Scorer", "Crafty Playmaking Big" (2-Way always leads).
export function archName(data, o) {
  const a1 = archById(data, o.arch), a2 = o.arch2 && o.arch2 !== o.arch ? archById(data, o.arch2) : null;
  const ad = o.addons || [];
  const lead = [ad.includes('twoway') && '2-Way', ad.includes('crafty') && 'Crafty', ad.includes('athletic') && 'Athletic'].filter(Boolean);
  const mid = a2 ? ({ sharp: 'Sharpshooting', spot: 'Floor-Spacing', slasher: 'Slashing', flyer: 'High-Flying', general: 'Playmaking', playscorer: 'Playmaking', pointfwd: 'Playmaking', playbig: 'Playmaking', glass: 'Rebounding', anchor: 'Rim-Protecting', lockdown: 'Lockdown', creator: 'Shot-Creating', midrange: 'Mid-Range', post: 'Post', '3lvl': '3-Level', insideout: 'Inside-Out', stretch: 'Stretch', runner: 'Rim-Running', switch: 'Switchable', unicorn: 'Unicorn' }[a2.id] || '') : '';
  return [...lead, mid, a1.name].filter(Boolean).join(' ');
}
// Shades of: the real players who play his primary style at his position (and his secondary's, if there's room).
export function shadesFor(data, o) {
  const a1 = archById(data, o.arch), a2 = o.arch2 && o.arch2 !== o.arch ? archById(data, o.arch2) : null;
  const s1 = slotData(a1, o.slot).shades || [], s2 = a2 ? (slotData(a2, o.slot).shades || []) : [];
  const both = s1.filter(n => s2.includes(n));
  return [...new Set([...both, ...s1, ...s2])].slice(0, 3);
}
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
