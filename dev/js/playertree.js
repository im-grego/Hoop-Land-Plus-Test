// The Player Tree: five branches of five tiers, unlocked with franchise tokens his career earns. Only things the app
// can really make happen are in it, and each node says which kind it is:
//   save    written into the save once, when you unlock it (ratings, ceilings, skills, tendencies, regression age);
//   season  written into the save once each season (upgrade points, a physical);
//   load    settled each time the save comes through the app: the app reads what happened in the game since the last
//           export and heals, boosts or tops it up (injuries, relationships, morale, conditioning);
//   app     the app's own systems (the Training Center).
import { ATTR_MAX, CATEGORIES } from './savefile.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const R12 = ['LAY', 'DNK', 'INS', 'MID', 'TPT', 'FTS', 'DRB', 'PAS', 'ORE', 'DRE', 'STL', 'BLK'];
const ceilUp = (p, keys) => { const out = []; for (const k of keys) if (p.attributes[k][1] < ATTR_MAX) { p.attributes[k][1] += 1; out.push(k); } return out.length ? `${out.join(' and ')} ceiling +1` : 'Ceilings already 20'; };
const tend = (p, d) => { for (const [k, v] of Object.entries(d)) if (k in p.tendencies) p.tendencies[k] = clamp(p.tendencies[k] + v, -5, 5); };
const giveSkill = (p, id, level) => {
  const s = p.skills.find(x => x.id === id);
  if (s) { s.level = Math.max(s.level || 0, level); s.equipped = true; }
  else p.skills.push({ id, xp: 0, level, equipped: true });
};
const best = (p, keys) => [...keys].sort((a, b) => p.attributes[b][0] - p.attributes[a][0])[0];
const apPlus = (p, cat) => { if (p.season?.ap) p.season.ap[CATEGORIES.findIndex(c => c.key === cat)] += 1; };

export const BRANCHES = [
  { id: 'scorer', icon: '🎯', name: 'Scorer' },
  { id: 'playmaker', icon: '🧠', name: 'Playmaker' },
  { id: 'defender', icon: '🛡️', name: 'Defender' },
  { id: 'athlete', icon: '💪', name: 'Durability' },
  { id: 'leader', icon: '👑', name: 'Leader' },
];
// rank: the legacy rank a tier needs (0 Rookie, 1 Bench Warmer, 2 Role Player, 3 Star Player, 4 All Star).
const RANK = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
export const NODES = [
  { branch: 'scorer', tier: 1, id: 'sc1', kind: 'app', name: 'Range Finder', says: 'The Shooting Lab costs half' },
  { branch: 'scorer', tier: 2, id: 'sc2', kind: 'season', name: 'Bucket Getter', says: '+1 shooting upgrade point every season', season: p => (apPlus(p, 'SHO'), '+1 shooting point') },
  { branch: 'scorer', tier: 3, id: 'sc3', kind: 'save', name: 'Green Light', says: 'Three-point and two-point shot tendencies +2: he hunts his shot', unlock: p => (tend(p, { threePoint: 2, twoPoint: 2 }), 'Shot tendencies +2') },
  { branch: 'scorer', tier: 4, id: 'sc4', kind: 'save', name: 'Shooter\'s Touch', says: '+1 ceiling on mid-range and three', unlock: p => ceilUp(p, ['MID', 'TPT']) },
  { branch: 'scorer', tier: 5, id: 'sc5', kind: 'save', name: 'Signature Scorer', says: 'Limitless or Unfazed (whichever fits his game) at level 2', unlock: p => { const id = p.attributes.TPT[0] >= p.attributes.MID[0] ? 'LIM' : 'UNF'; giveSkill(p, id, 2); return `${id === 'LIM' ? 'Limitless' : 'Unfazed'} level 2`; } },

  { branch: 'playmaker', tier: 1, id: 'pm1', kind: 'app', name: 'Court Vision', says: 'The Handle & Vision Camp costs half' },
  { branch: 'playmaker', tier: 2, id: 'pm2', kind: 'season', name: 'Table Setter', says: '+1 creating upgrade point every season', season: p => (apPlus(p, 'CRE'), '+1 creating point') },
  { branch: 'playmaker', tier: 3, id: 'pm3', kind: 'save', name: 'Floor General', says: 'Pass tendency +2 and Dimer', unlock: p => (tend(p, { pass: 2 }), giveSkill(p, 'DIM', 1), 'Pass tendency +2, Dimer') },
  { branch: 'playmaker', tier: 4, id: 'pm4', kind: 'save', name: 'Handles & Vision', says: '+1 ceiling on dribbling and passing', unlock: p => ceilUp(p, ['DRB', 'PAS']) },
  { branch: 'playmaker', tier: 5, id: 'pm5', kind: 'save', name: 'Maestro', says: 'Hot Potato and Chef at level 2', unlock: p => (giveSkill(p, 'HOT', 2), giveSkill(p, 'CHE', 2), 'Hot Potato and Chef level 2') },

  { branch: 'defender', tier: 1, id: 'df1', kind: 'app', name: 'Hustle', says: 'The Defensive Clinic costs half' },
  { branch: 'defender', tier: 2, id: 'df2', kind: 'season', name: 'Stopper', says: '+1 defense upgrade point every season', season: p => (apPlus(p, 'DEF'), '+1 defense point') },
  { branch: 'defender', tier: 3, id: 'df3', kind: 'save', name: 'Clamps Up', says: 'Clamps and Locked In, steal and block tendencies +1', unlock: p => (giveSkill(p, 'CLA', 1), giveSkill(p, 'LOC', 1), tend(p, { stealOnBall: 1, block: 1 }), 'Clamps, Locked In') },
  { branch: 'defender', tier: 4, id: 'df4', kind: 'save', name: 'Long Arms', says: '+1 ceiling on steals and blocks', unlock: p => ceilUp(p, ['STL', 'BLK']) },
  { branch: 'defender', tier: 5, id: 'df5', kind: 'save', name: 'Anchor', says: 'Ball Hawk or Snatcher (whichever fits his game) at level 2', unlock: p => { const id = p.attributes.STL[0] >= p.attributes.BLK[0] ? 'BAL' : 'SNA'; giveSkill(p, id, 2); return `${id === 'BAL' ? 'Ball Hawk' : 'Snatcher'} level 2`; } },

  { branch: 'athlete', tier: 1, id: 'at1', kind: 'load', name: 'Quick Recovery', says: 'Full conditioning every time the save comes through the app' },
  { branch: 'athlete', tier: 2, id: 'at2', kind: 'load', name: 'Durable', says: 'Minor injuries heal twice as fast: the games out are halved' },
  { branch: 'athlete', tier: 3, id: 'at3', kind: 'load', name: 'Iron Body', says: 'Major injuries heal twice as fast too' },
  { branch: 'athlete', tier: 4, id: 'at4', kind: 'save', name: 'Built to Last', says: 'He starts declining a year later', unlock: p => { p.regressionAge = Math.min(40, (p.regressionAge || 30) + 1); return `Regression age ${p.regressionAge}`; } },
  { branch: 'athlete', tier: 5, id: 'at5', kind: 'season', name: 'Ageless Athlete', says: 'Once he\'s aging, his stored speed and strength go up a point each season to offset the decline (up to 20)', season: (p, x) => {
    if (!(x.declining > 0)) return null;
    const out = []; for (const k of ['SPD', 'STR']) { const a = p.attributes[k]; if (a[0] < ATTR_MAX) { a[0] += 1; a[1] = Math.max(a[1], a[0]); out.push(k); } }
    return out.length ? `${out.join(' and ')} +1 against age` : null; } },

  { branch: 'leader', tier: 1, id: 'ld1', kind: 'load', name: 'Good Teammate', says: 'What he gains with teammates in the game counts half again' },
  { branch: 'leader', tier: 2, id: 'ld2', kind: 'load', name: 'Coach\'s Guy', says: 'What he gains with the coach counts half again; what he loses, half' },
  { branch: 'leader', tier: 3, id: 'ld3', kind: 'load', name: 'Steady', says: 'His morale never sits below 60' },
  { branch: 'leader', tier: 4, id: 'ld4', kind: 'load', name: 'Captain', says: 'What teammates lose with him in the game counts half, and nobody stays below -10' },
  { branch: 'leader', tier: 5, id: 'ld5', kind: 'load', name: 'Franchise Cornerstone', says: 'Teammates\' morale never below 50; the coach\'s relationship never below 25' },
];
for (const n of NODES) { n.cost = n.tier; n.rank = RANK[n.tier]; }
export const KIND_LABEL = { save: 'Written into the save', season: 'Every season', load: 'Each time the save comes through the app', app: 'In the app' };

// Franchise tokens: the app's own, earned with achievements read off the save (his career highs, his seasons, his
// totals, his awards). One token to start; each achievement once.
const sum = (rows, k) => rows.reduce((n, r) => n + (r[k] || 0), 0);
// His seasons: each year's totals over every team he played for that year.
function seasonsOf(p) {
  const out = [];
  for (const r of p.stats || []) { const rows = r.season || []; if (!rows.length) continue;
    const t = Object.fromEntries(['GP', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TPM', 'TPA', 'FGM', 'FGA', 'FTM', 'FTA', 'DD', 'TD'].map(k => [k, sum(rows, k)]));
    out.push({ yr: r.yr, league: r.league ?? 0, ...t }); }
  return out;
}
const pg = (s, k) => (s.GP ? s[k] / s.GP : 0);
const pct = (m, a) => (a ? m / a : 0);
export const ACHIEVEMENTS = [
  // Big games (his career single-game highs)
  { id: 'g40', group: 'Big Games', icon: '🔥', name: '40-Point Game', tokens: 1, test: x => x.hi.PTS >= 40 },
  { id: 'g50', group: 'Big Games', icon: '🔥', name: '50-Point Game', tokens: 2, test: x => x.hi.PTS >= 50 },
  { id: 'g60', group: 'Big Games', icon: '🌋', name: '60-Point Game', tokens: 3, test: x => x.hi.PTS >= 60 },
  { id: 'g70', group: 'Big Games', icon: '👑', name: '70-Point Game', tokens: 5, test: x => x.hi.PTS >= 70 },
  { id: 'r20', group: 'Big Games', icon: '🧲', name: '20-Rebound Game', tokens: 1, test: x => x.hi.REB >= 20 },
  { id: 'r25', group: 'Big Games', icon: '🧲', name: '25-Rebound Game', tokens: 2, test: x => x.hi.REB >= 25 },
  { id: 'a15', group: 'Big Games', icon: '🎯', name: '15-Assist Game', tokens: 1, test: x => x.hi.AST >= 15 },
  { id: 'a20', group: 'Big Games', icon: '🎯', name: '20-Assist Game', tokens: 2, test: x => x.hi.AST >= 20 },
  { id: 'b10', group: 'Big Games', icon: '🚫', name: '10-Block Game', tokens: 2, test: x => x.hi.BLK >= 10 },
  { id: 's8', group: 'Big Games', icon: '🖐️', name: '8-Steal Game', tokens: 2, test: x => x.hi.STL >= 8 },
  { id: 't10', group: 'Big Games', icon: '🎯', name: '10 Threes in a Game', tokens: 2, test: x => x.hi.TPM >= 10 },
  // Doubles
  { id: 'td1', group: 'Triple-Doubles', icon: '3️⃣', name: 'First Triple-Double', tokens: 1, test: x => x.tot.TD >= 1 },
  { id: 'td10', group: 'Triple-Doubles', icon: '3️⃣', name: '10 Triple-Doubles', tokens: 2, test: x => x.tot.TD >= 10 },
  { id: 'td50', group: 'Triple-Doubles', icon: '3️⃣', name: '50 Triple-Doubles', tokens: 3, test: x => x.tot.TD >= 50 },
  { id: 'td100', group: 'Triple-Doubles', icon: '🐐', name: '100 Triple-Doubles', tokens: 5, test: x => x.tot.TD >= 100 },
  { id: 'dd100', group: 'Triple-Doubles', icon: '2️⃣', name: '100 Double-Doubles', tokens: 2, test: x => x.tot.DD + x.tot.TD >= 100 },
  { id: 'tdavg', group: 'Triple-Doubles', icon: '🏅', name: 'Average a Triple-Double (a season, 40+ games)', tokens: 5, test: x => x.seasons.some(s => s.GP >= 40 && pg(s, 'PTS') >= 10 && pg(s, 'REB') >= 10 && pg(s, 'AST') >= 10) },
  // Seasons
  { id: 'p25', group: 'Seasons', icon: '📈', name: '25 Points a Game (a season, 40+ games)', tokens: 1, test: x => x.seasons.some(s => s.GP >= 40 && pg(s, 'PTS') >= 25) },
  { id: 'p30', group: 'Seasons', icon: '📈', name: '30 Points a Game (a season)', tokens: 2, test: x => x.seasons.some(s => s.GP >= 40 && pg(s, 'PTS') >= 30) },
  { id: 'p35', group: 'Seasons', icon: '🚀', name: '35 Points a Game (a season)', tokens: 4, test: x => x.seasons.some(s => s.GP >= 40 && pg(s, 'PTS') >= 35) },
  { id: 'c504090', group: 'Seasons', icon: '🎯', name: '50-40-90 Season', tokens: 4, test: x => x.seasons.some(s => s.GP >= 40 && s.FGA >= 300 && s.TPA >= 100 && s.FTA >= 100 && pct(s.FGM, s.FGA) >= 0.5 && pct(s.TPM, s.TPA) >= 0.4 && pct(s.FTM, s.FTA) >= 0.9) },
  { id: 'iron', group: 'Seasons', icon: '🦾', name: 'Iron Man: every game of a season', tokens: 1, test: x => x.seasons.some(s => s.league === 0 && s.GP >= 82) },
  { id: 'th300', group: 'Seasons', icon: '🎯', name: '300 Threes in a Season', tokens: 3, test: x => x.seasons.some(s => s.TPM >= 300) },
  // Career totals
  ...[[5000, 1], [10000, 2], [20000, 3], [30000, 4], [40000, 5]].map(([n, t]) => ({ id: `pts${n}`, group: 'Career', icon: '🏀', name: `${n.toLocaleString()} Career Points`, tokens: t, test: x => x.tot.PTS >= n })),
  ...[[5000, 2], [10000, 3]].map(([n, t]) => ({ id: `ast${n}`, group: 'Career', icon: '🤝', name: `${n.toLocaleString()} Career Assists`, tokens: t, test: x => x.tot.AST >= n })),
  ...[[5000, 2], [10000, 3]].map(([n, t]) => ({ id: `reb${n}`, group: 'Career', icon: '🧲', name: `${n.toLocaleString()} Career Rebounds`, tokens: t, test: x => x.tot.REB >= n })),
  { id: 'th2000', group: 'Career', icon: '🎯', name: '2,000 Career Threes', tokens: 3, test: x => x.tot.TPM >= 2000 },
  { id: 'blk1000', group: 'Career', icon: '🚫', name: '1,000 Career Blocks', tokens: 2, test: x => x.tot.BLK >= 1000 },
  { id: 'stl1000', group: 'Career', icon: '🖐️', name: '1,000 Career Steals', tokens: 2, test: x => x.tot.STL >= 1000 },
  // Honors
  ...[1, 5, 10].map((n, i) => ({ id: `as${n}`, group: 'Honors', icon: '⭐', name: n === 1 ? 'All-Star' : `${n}× All-Star`, tokens: [1, 2, 3][i], test: x => x.tro.allStar >= n })),
  ...[1, 3].map((n, i) => ({ id: `nba${n}`, group: 'Honors', icon: '📜', name: n === 1 ? 'All-League Team' : `${n}× All-League`, tokens: [1, 2][i], test: x => x.tro.allNba >= n })),
  ...[1, 3].map((n, i) => ({ id: `mvp${n}`, group: 'Honors', icon: '🏅', name: n === 1 ? 'MVP' : `${n}× MVP`, tokens: [3, 5][i], test: x => x.tro.mvp >= n })),
  { id: 'dpoy', group: 'Honors', icon: '🛡️', name: 'Defensive Player of the Year', tokens: 2, test: x => x.tro.dpoy >= 1 },
  { id: 'fmvp', group: 'Honors', icon: '🥇', name: 'Finals MVP', tokens: 3, test: x => x.tro.fmvp >= 1 },
  ...[1, 3, 6].map((n, i) => ({ id: `ring${n}`, group: 'Honors', icon: '🏆', name: n === 1 ? 'Champion' : `${n}× Champion`, tokens: [3, 4, 5][i], test: x => x.tro.rings >= n })),
  // Legacy
  ...[1, 2, 3, 4, 5, 6, 7, 8].map(r => ({ id: `rank${r}`, group: 'Legacy', icon: '🪜', name: `Reach ${['', 'Bench Warmer', 'Role Player', 'Star Player', 'All Star', 'Superstar', 'Hall of Famer', 'Legend', 'Greatest of All Time'][r]}`, tokens: r >= 6 ? 3 : 1, test: x => x.rank >= r })),
];
export const ACH_GROUPS = ['Big Games', 'Triple-Doubles', 'Seasons', 'Career', 'Honors', 'Legacy'];
// Everything his save shows he's done: { earned (tokens), done: [achievement] }. trophies: from career.js.
export function achievementsOf(p, rankIdx, trophies) {
  const cs = p.careerStats || {}, H = cs.seasonHighs || {}, PH = cs.playoffHighs || {}, FH = cs.finalsHighs || {};
  const hi = Object.fromEntries(['PTS', 'REB', 'AST', 'STL', 'BLK', 'TPM'].map(k => [k, Math.max(H[k] || 0, PH[k] || 0, FH[k] || 0)]));
  const seasons = seasonsOf(p);
  const tot = Object.fromEntries(['PTS', 'REB', 'AST', 'STL', 'BLK', 'TPM', 'DD', 'TD'].map(k => [k, Math.max(cs.season?.[k] || 0, seasons.reduce((n, s) => n + (s[k] || 0), 0))]));
  const x = { hi, tot, seasons, tro: trophies, rank: rankIdx };
  const done = ACHIEVEMENTS.filter(a => { try { return a.test(x); } catch { return false; } });
  return { earned: 1 + done.reduce((n, a) => n + a.tokens, 0), done };
}
export const owned = (st, id) => (st.tree?.nodes || []).includes(id);
export const spent = st => (st.tree?.nodes || []).reduce((n, id) => n + (NODES.find(x => x.id === id)?.cost || 0), 0);
// Can he unlock it? { ok, why }
export function canUnlock(n, st, rankIdx, left, rankNames) {
  if (owned(st, n.id)) return { ok: false, why: 'Unlocked' };
  if (n.tier > 1 && !owned(st, NODES.find(x => x.branch === n.branch && x.tier === n.tier - 1).id)) return { ok: false, why: `Needs tier ${n.tier - 1}` };
  if (rankIdx < n.rank) return { ok: false, why: `${rankNames[n.rank]} rank` };
  if (left < n.cost) return { ok: false, why: `${n.cost - left} more token${n.cost - left === 1 ? '' : 's'}` };
  return { ok: true };
}
// The Training Center's price with the tree (half price for the branch's tier-1 program).
const HALF = { shoot: 'sc1', handle: 'pm1', defense: 'df1' };
export const trainPrice = (prog, st) => (HALF[prog.id] && owned(st, HALF[prog.id]) ? Math.round(prog.cost / 2) : prog.cost);

// Settled when the save comes through the app. x: { team, coach, mates, snap (what the app exported last time), handled
// (injuries already halved) }. Returns what it did, one line each.
export function settleLoad(p, st, x) {
  const has = id => owned(st, id), out = [];
  if (!p.season) return out;
  if (has('at1') && (p.season.condition ?? 100) < 100) { p.season.condition = 100; out.push('Conditioning back to 100%'); }
  // Injuries: each one halved once (the minor ones with Durable, the major ones with Iron Body).
  const j = p.season.injury;
  if (j && j.gamesOut > 0 && (has('at2') || has('at3'))) {
    const key = ['core', 'upperBody', 'lowerBody', 'minorSeverity', 'majorSeverity', 'yr'].map(k => j[k] || 0).join('.');
    const major = (j.majorSeverity || 0) > 0;
    if (!x.handled.includes(key) && (major ? has('at3') : has('at2'))) {
      const before = j.gamesOut; j.gamesOut = Math.max(1, Math.ceil(before / 2));
      x.handled.push(key);
      if (j.gamesOut < before) out.push(`${major ? 'Major' : 'Minor'} injury: ${before} games out → ${j.gamesOut}`);
    }
  }
  // Relationships: the change since the last export, counted again by half (gains) or given back by half (losses).
  if (x.snap) {
    let up = 0, held = 0;
    for (const m of x.mates) {
      const was = x.snap.rel?.[m.id]; if (was == null || !m.season) continue;
      const d = (m.season.relationship || 0) - was;
      if (d > 0 && has('ld1')) { const add = Math.round(d / 2); if (add) { m.season.relationship = clamp(m.season.relationship + add, -100, 100); up += add; } }
      if (d < 0 && has('ld4')) { const back = Math.round(-d / 2); if (back) { m.season.relationship = clamp(m.season.relationship + back, -100, 100); held += back; } }
    }
    if (up) out.push(`Teammates +${up} on top of what he earned in the game`);
    if (held) out.push(`${held} of what teammates soured on him given back`);
    if (x.coach && x.snap.coach?.id === x.coach.id && has('ld2')) {
      const d = (x.coach.rp || 0) - (x.snap.coach.rp || 0), adj = d > 0 ? Math.round(d / 2) : d < 0 ? Math.round(-d / 2) : 0;
      if (adj) { x.coach.rp = clamp((x.coach.rp || 0) + adj, -50, 50); out.push(`Coach relationship ${adj > 0 ? '+' : ''}${adj} (${d > 0 ? 'gains count more' : 'half of the drop back'})`); }
    }
  }
  if (has('ld4')) { let n = 0; for (const m of x.mates) if (m.season && (m.season.relationship || 0) < -10) { m.season.relationship = -10; n++; } if (n) out.push(`${n} teammate${n === 1 ? '' : 's'} pulled back up to -10`); }
  if (has('ld3') && (p.season.morale ?? 100) < 60) { p.season.morale = 60; out.push('Morale back up to 60'); }
  if (has('ld5')) {
    let n = 0; for (const m of x.mates) if (m.season && (m.season.morale ?? 100) < 50) { m.season.morale = 50; n++; }
    if (n) out.push(`${n} teammate${n === 1 ? "'s" : "s'"} morale up to 50`);
    if (x.coach && (x.coach.rp || 0) < 25) { x.coach.rp = 25; out.push('Coach relationship up to 25'); }
  }
  return out;
}
// What the app remembers at export, to read the game's changes against next time.
export const snapshot = (p, x) => ({ rel: Object.fromEntries(x.mates.filter(m => m.season).map(m => [m.id, m.season.relationship || 0])), coach: x.coach ? { id: x.coach.id, rp: x.coach.rp || 0 } : null });
