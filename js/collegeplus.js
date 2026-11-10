// College offseason, part two: the decisions around the game's own steps.
//
//   Testing the waters   underclassmen with draft buzz declare; one meeting to bring each back
//   NIL budget           a collective's money split across the roster; underpaid players are portal risks
//   Retention meetings   players thinking about the portal say why; a promise is judged next spring
//   Camps & AAU          scouting days at summer events: meet recruits, uncover hidden gems
//   Walk-ons             13 scholarships; preferred walk-ons fill the last spots; a walk-on can earn a scholarship
//   Redshirts            sit a player for a year (medical after a long injury); he keeps the year of eligibility
//   Coaching carousel    assistants hired away after good years; job offers for you after big ones
//   Schedule             the non-conference slate: buy games, an early-season tournament, ranked road games
//   Madness & tour       a hype night for recruiting and a summer trip abroad for extra practice
//   Media day            preseason conference predictions and the All-Conference team
//   Program legacy       banners, retired jerseys and a legacy score that recruits notice
//
// Everything is plain functions on the college league (C), a level function and a trait function (1-20), so the app
// can show it and the tests can run it. What changes the save is kept as a decision in the program store and put back
// into a freshly loaded save by applyProgram (the offseason spans several of the game's saves).

import { rngOf, GROUP, miles } from './recruiting.js';
import { generateRecruit, signToSchool } from './recruits.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = v => Math.round(v * 10) / 10;
const half = v => Math.round(v * 2) / 2;
const rowOf = (t, yr) => (t.season || []).find(s => s.yr === yr);
const stat = (t, yr) => rowOf(t, yr)?.seasonStats || {};
// A hash of a few numbers, for decisions that must come out the same on every load.
export const seedOf = (...xs) => xs.reduce((a, x) => (Math.imul(a ^ (x | 0), 0x9e3779b1) + 0x7f4a7c15) >>> 0, 0x2545f491);

// The last season played (a fresh campus-mode save has none yet: the year before this one).
export function lastSeasonYr(C) {
  const yrs = C.teams.flatMap(t => (t.season || []).filter(s => (s.seasonStats?.GP || 0) > 0).map(s => s.yr));
  return yrs.length ? Math.max(...yrs) : C.season.currentYear - 1;
}

// The program store, kept per save by the app. Years are the season the decision belongs to.
export const emptyProgram = () => ({
  v: 1,
  waters: {},      // yr -> { pid: { proj, pitch, back: bool } }, plus cpu: [pids] that left
  nil: {},         // yr -> { pid: amount }
  retention: {},   // yr -> { pid: { reasons, promise, stay: bool } }
  promises: [],    // { pid, yr, kind, base, judged: null | 'kept' | 'broken' }
  camps: {},       // yr -> [camp keys]
  walkons: {},     // pid -> { yr, seed, id, scholarship: bool }
  walkonOffer: {}, // yr -> seed
  redshirt: {},    // yr -> { pid: 'red' | 'medical' }
  redApplied: {},  // pid -> yr the year was given back
  staff: {},       // yr -> { slot: { fn, ln, age, from } }
  left: {},        // yr -> [{ slot, fn, ln, to }]
  job: {},         // yr -> { from, to } (a job you took)
  schedule: {},    // yr -> { buy, mte, road, neutral }
  madness: {},     // yr -> true
  tour: {},        // yr -> destination key
  tourGain: {},    // yr -> [{ pid, k, to }]
  retired: [],     // { tid, num, pid, name, yr }
});

// ---------------------------------------------------------------------------
// Draft projection (for testing the waters): every college player ranked by what a pro team sees (current level,
// ceiling and youth). The top 30 project to the first round, 31-60 the second.
export function draftBoard(C, level) {
  const all = C.teams.flatMap(t => t.roster.map(p => ({ p, t })));
  const value = p => level(p) + (p.pot || 5) * 3.2 + Math.max(0, 22 - (p.age || 20)) * 1.2;
  const list = all.map(x => ({ ...x, v: value(x.p) })).sort((a, b) => b.v - a.v);
  list.forEach((x, i) => { x.rank = i + 1; x.label = projLabel(i + 1); });
  return { list, byId: new Map(list.map(x => [x.p.id, x])) };
}
export const projLabel = rank => (rank <= 5 ? 'Top-5 pick' : rank <= 14 ? 'Lottery pick' : rank <= 30 ? 'First round' : rank <= 45 ? 'Early second round' : rank <= 60 ? 'Late second round' : 'Undrafted');

// Combine feedback: what the scouts tell him (from his body and ratings).
export function combineFeedback(p, rank) {
  const A = k => p.attributes?.[k]?.[0] || 10;
  const good = [], work = [];
  if (A('SPD') >= 15) good.push('elite burst'); else if (A('SPD') <= 10) work.push('lateral quickness');
  if (A('STR') >= 15) good.push('a pro body'); else if (A('STR') <= 9) work.push('add strength');
  if (A('TPT') >= 15) good.push('NBA range'); else if (A('TPT') <= 9 && GROUP(p) !== 'Bigs') work.push('the jump shot');
  if (A('DRB') >= 15) good.push('handle'); if (A('DRE') >= 15 || A('BLK') >= 15) good.push('defensive tools');
  if (A('PAS') <= 8 && GROUP(p) === 'Guards') work.push('decision-making');
  const verdict = rank <= 14 ? 'Teams in the lottery are calling.' : rank <= 30 ? 'A first-round promise is possible, not certain.'
    : rank <= 60 ? 'Most teams see a second-rounder: no guaranteed money.' : 'Teams told him to come back: he would likely go undrafted.';
  return { good, work, verdict };
}

// Underclassmen with draft buzz on your roster (seniors are gone anyway).
export function watersCandidates(C, team, level, board = draftBoard(C, level)) {
  // Nobody tests the waters before a season has been played (a fresh campus-mode save).
  if (!C.teams.some(t => (t.season || []).some(s => (s.seasonStats?.GP || 0) > 0))) return [];
  return team.roster.filter(p => (p.yrs ?? 0) <= 2).map(p => board.byId.get(p.id)).filter(x => x && x.rank <= 60)
    .map(x => ({ ...x, fb: combineFeedback(x.p, x.rank) })).sort((a, b) => a.rank - b.rank);
}

export const WATER_PITCHES = [
  { k: 'develop', label: 'Come back and develop', says: 'One more year and you go higher.' },
  { k: 'role', label: 'The team is yours', says: 'You\'ll be the focal point next year.' },
  { k: 'nil', label: 'NIL raise', says: 'The collective will make it worth your while.' },
  { k: 'title', label: 'Chase a title', says: 'We have the pieces to win it all.' },
];
// How likely he comes back after your pitch. Projection first (a lottery pick almost always goes), then the pitch
// against what he cares about.
export function returnOdds(x, pitch, trait, ctx = {}) {
  const base = x.rank <= 5 ? 0.04 : x.rank <= 14 ? 0.12 : x.rank <= 30 ? 0.3 : x.rank <= 45 ? 0.55 : 0.72;
  const t = k => trait(x.p, k) || 10;
  const fit = {
    develop: (t('roadWarrior') + t('motor')) / 40 + ((x.p.yrs ?? 0) === 0 ? 0.15 : 0),
    role: (t('playoffRiser') + t('motor')) / 40,
    nil: t('money') / 20 + (ctx.nilRoom || 0) / 10,
    title: t('winning') / 20 + (ctx.strong ? 0.2 : -0.1),
  }[pitch] ?? 0.4;
  const loyal = (t('loyalty') - 10) / 60;
  return clamp(base + (fit - 0.5) * 0.35 + loyal, 0.02, 0.95);
}
// Decide each meeting (seeded, so a reload gives the same answer).
export function decideWaters(C, x, pitch, trait, ctx = {}) {
  const odds = returnOdds(x, pitch, trait, ctx);
  const r = rngOf(seedOf(C.season.currentYear, x.p.id, WATER_PITCHES.findIndex(w => w.k === pitch)))();
  return { odds, back: r < odds };
}
// CPU schools' underclassmen in the first round stay in the draft (most of them).
// ---------------------------------------------------------------------------
// Since its 2027 update the game runs the end of the season before you can save: early entrants declare (news type 15)
// and are drafted into the pro league, and players enter the transfer portal (type 34, tid = the school he left). For
// your school, the app's meetings decide instead: these are the ones it can bring back.
export function gameDepartures(data, li, team) {
  const C = data.seasonLeagues[li], yr = C.season.currentYear;
  const onCollege = new Set(C.teams.flatMap(t => t.roster.map(p => p.id)));
  const declared = [];
  data.seasonLeagues.forEach((L, pi) => {
    if (pi === li) return;
    const add = (p, t) => { const h = p.history || {}; if (h.coll === li && h.tid === team.id && h.yearDeclared === yr && !onCollege.has(h.id)) declared.push({ p, pi, t, hid: h.id, yrs: h.yrs ?? 0, pick: h.draft?.rd ? h.draft.pk : 0 }); };
    for (const t of L.teams) for (const p of t.roster) add(p, t);
    for (const p of L.freeAgents || []) add(p, null);
  });
  const left = new Set((C.season.news || []).filter(n => n.type === 34 && n.tid === team.id).map(n => n.pid));
  const portal = (C.freeAgents || []).filter(p => left.has(p.id));
  return { declared, portal };
}
// Underclassmen the game sent to the draft, as testing-the-waters candidates (their projection is where they went).
export function declaredCandidates(data, li, team) {
  return gameDepartures(data, li, team).declared.filter(x => x.yrs <= 2).map(x => {
    const rank = x.pick || 61;
    return { p: x.p, t: x.t, rank, label: x.pick ? `Drafted No. ${x.pick} by ${x.t?.shortName || '?'}` : 'Went undrafted', fb: combineFeedback(x.p, rank), declared: true, hid: x.hid };
  });
}
// A declared player back to school: a college player again (his college id, class, number and stats), gone from the pros.
export function restoreFromPro(data, li, team, pid) {
  const C = data.seasonLeagues[li];
  const x = gameDepartures(data, li, team).declared.find(d => d.hid === pid);
  if (!x || C.teams.some(t => t.roster.some(p => p.id === pid))) return null;
  const P = data.seasonLeagues[x.pi];
  // Out of the pro league: his roster spot, lineup slots and the news that names him.
  if (x.t) {
    x.t.roster.splice(x.t.roster.indexOf(x.p), 1);
    if (Array.isArray(x.t.startingLineup)) x.t.startingLineup = x.t.startingLineup.filter(e => e.pid !== x.p.id);
    if (Array.isArray(x.t.currentLineup)) x.t.currentLineup = x.t.currentLineup.filter(e => (e?.pid ?? e) !== x.p.id);
    x.t.roster.forEach((p, i) => { if (p.linePos >= 0) p.linePos = i; });
  } else P.freeAgents.splice(P.freeAgents.indexOf(x.p), 1);
  for (const k of ['news', 'posts']) if (Array.isArray(P.season[k])) P.season[k] = P.season[k].filter(n => n.pid !== x.p.id);
  const q = JSON.parse(JSON.stringify(x.p));
  // His college number (the pros gave him a new one): the last one his college stats show.
  const lastRow = (q.stats || []).filter(st => st.league === li).flatMap(st => st.season || []).filter(r => r.tid === team.id).pop();
  const num = lastRow?.num ?? q.num;
  q.id = pid; q.league = li; q.yrs = Math.min(4, x.yrs + 1);
  q.stats = (q.stats || []).filter(s => s.league === li);
  if (q.history?.collegeStats) q.careerStats = JSON.parse(JSON.stringify(q.history.collegeStats));
  Object.assign(q.history, { coll: 0, yrs: 0, id: 0, tid: team.id, yearDeclared: 0 });
  if (q.history.draft) Object.assign(q.history.draft, { pk: 0, rd: 0, tid: 0, otid: 0, yr: 0 });
  q.contract = { ...q.contract, opt: 0, canExt: false, ext: { yrs: 0, sal: 0, opt: 0, noTrd: 0 } };
  signToSchool(C, li, team, q, { sal: 1 });
  if (!team.roster.some(p => p !== q && p.num === num)) { q.num = num; for (const s of q.stats) for (const r of s.season || []) if (r.tid === team.id) r.num = num; }
  for (const k of ['news', 'posts']) if (Array.isArray(C.season[k])) C.season[k] = C.season[k].filter(n => !(n.pid === pid && n.type === 15));
  return q;
}
// A portal entrant talked into staying: back on the roster, his portal news item gone.
export function restoreFromPortal(C, li, team, pid) {
  const p = (C.freeAgents || []).find(x => x.id === pid);
  if (!p || C.teams.some(t => t.roster.some(x => x.id === pid))) return null;
  C.freeAgents.splice(C.freeAgents.indexOf(p), 1);
  const num = p.num;
  p.stats = (p.stats || []).filter(s => !(s.league === li && s.yr === C.season.currentYear));
  signToSchool(C, li, team, p, { sal: 1 });
  if (!team.roster.some(x => x !== p && x.num === num)) { p.num = num; for (const s of p.stats) for (const r of s.season || []) if (r.tid === team.id) r.num = num; }
  for (const k of ['news', 'posts']) if (Array.isArray(C.season[k])) C.season[k] = C.season[k].filter(n => !(n.pid === pid && n.type === 34));
  return p;
}

export function cpuWaters(C, userIds, level, board = draftBoard(C, level)) {
  const out = [];
  for (const x of board.list) {
    if (x.rank > 30 || userIds.has(x.t.id) || (x.p.yrs ?? 0) > 2) continue;
    const stay = x.rank <= 14 ? 0.92 : 0.6;
    if (rngOf(seedOf(C.season.currentYear, x.p.id, 77))() < stay) out.push(x.p.id);
  }
  return out;
}

// ---------------------------------------------------------------------------
// NIL. The collective's money grows with the program; each returning player asks by his standing on the roster.
export function nilBudget(team, legacy = 0) {
  return half(4 + ((team.prestigePoints || 0) / 139) * 14 + legacy * 0.6);
}
export function nilAsks(team, level, trait) {
  const ps = [...team.roster].sort((a, b) => level(b) - level(a));
  return ps.map((p, i) => {
    // The stars and the rotation ask; the end of the bench is just happy to be there.
    const top = i < 2 ? 1.6 : i < 5 ? 1 : i < 8 ? 0.5 : 0;
    const ask = top ? half(clamp(top * (0.7 + (trait(p, 'money') || 10) / 25) + ((p.pot || 5) - 5) * 0.1, 0.5, 4)) : 0;
    return { p, ask, slot: i + 1 };
  });
}
// How he feels about his NIL: underpaid stars are the portal's first targets.
export function nilMood(ask, paid, trait) {
  if (ask <= 0) return paid > 0 ? 'happy' : 'fine';
  const f = paid / ask;
  if (f >= 1) return 'happy';
  if (f >= 0.6) return 'fine';
  // Only a player who cares about money (or is paid next to nothing) is truly unhappy.
  return (trait('money') || 10) >= 13 || (f < 0.25 && ask >= 1) ? 'unhappy' : 'grumbling';
}

// ---------------------------------------------------------------------------
// Retention. Each returning player's reasons to leave, from last season and the year ahead.
export const RET_PROMISES = {
  start: { label: 'You\'ll start', kept: 'started like you promised', broke: 'never got the starting job you promised' },
  minutes: { label: 'More minutes', kept: 'got the minutes you promised', broke: 'never got the minutes you promised' },
  nil: { label: 'NIL bump (+$0.5M)', kept: 'got his NIL bump', broke: '' },
  honest: { label: 'Be honest with him', kept: '', broke: '' },
};
export function retentionRisks(C, team, level, trait, ctx = {}) {
  const yr = lastSeasonYr(C);
  // Players the game already put in the portal (ctx.portal) sit at their spot in the pecking order, and always have a reason.
  const gone = new Set((ctx.portal || []).map(p => p.id));
  const ps = [...team.roster, ...(ctx.portal || [])].filter(p => (p.yrs ?? 0) <= 3).sort((a, b) => level(b) - level(a));
  const st = stat(team, yr), gp = (st.W || 0) + (st.L || 0), wpct = gp ? (st.W || 0) / gp : 0.5;
  const out = [];
  ps.forEach((p, i) => {
    const line = ctx.line ? ctx.line(p) : null;
    const mpg = line?.mpg ?? 0;
    const reasons = [];
    // Playing time: a top-8 talent who played spot minutes.
    if (i < 8 && line && mpg < 18) reasons.push({ k: 'pt', text: `played ${r1(mpg)} minutes a night and thinks he's earned more` });
    if (i < 5 && line && (line.starts ?? 0) < (line.gp || 0) / 3) reasons.push({ k: 'role', text: 'wants to start' });
    const mood = ctx.nilMood ? ctx.nilMood(p) : 'fine';
    if (mood === 'unhappy') reasons.push({ k: 'nil', text: 'feels underpaid by the collective' });
    if (wpct < 0.45 && trait(p, 'winning') >= 13) reasons.push({ k: 'win', text: `is tired of losing (${st.W || 0}-${st.L || 0})` });
    if (i < 4 && mood !== 'happy' && (p.pot || 0) >= 7) reasons.push({ k: 'poach', text: 'is hearing from bigger schools' });
    if (ctx.broken?.has(p.id)) reasons.push({ k: 'trust', text: 'remembers the promise you broke' });
    if (gone.has(p.id) && !reasons.length) reasons.push({ k: 'fresh', text: 'wants a fresh start somewhere else' });
    if (!reasons.length) return;
    const loyal = trait(p, 'loyalty') || 10;
    const risk = clamp(0.04 + reasons.length * 0.11 + (10 - loyal) * 0.02 + (i < 3 ? 0.04 : 0), 0.03, 0.85);
    // One foot already out the door: harder to keep.
    out.push({ p, reasons, risk: gone.has(p.id) ? clamp(risk + 0.15, 0.2, 0.9) : risk, slot: i + 1, portal: gone.has(p.id) });
  });
  return out.sort((a, b) => b.risk - a.risk);
}
// What a promise does to his risk: it answers the reasons it covers. Honesty helps a loyal player only.
export function stayOdds(x, promise, trait) {
  const ks = new Set(x.reasons.map(r => r.k));
  const covers = { start: ['role', 'pt'], minutes: ['pt'], nil: ['nil', 'poach'], honest: [] }[promise] || [];
  const answered = covers.filter(k => ks.has(k)).length;
  let risk = x.risk - answered * 0.12;
  if (promise === 'honest') risk += (trait(x.p, 'loyalty') || 10) >= 13 ? -0.08 : 0.04;
  return clamp(1 - risk, 0.1, 0.97);
}
export function decideRetention(C, x, promise, trait) {
  const odds = stayOdds(x, promise, trait);
  return { odds, stay: rngOf(seedOf(C.season.currentYear, x.p.id, 3 + Object.keys(RET_PROMISES).indexOf(promise)))() < odds };
}
// A year later: was it kept? start = started half the games; minutes = 4 more a night than the year before.
export function judgePromise(pr, line) {
  if (!line || !line.gp) return null;
  if (pr.kind === 'start') return (line.starts || 0) >= line.gp / 2 ? 'kept' : 'broken';
  if (pr.kind === 'minutes') return (line.mpg || 0) >= (pr.base || 0) + 4 ? 'kept' : 'broken';
  return 'kept';
}

// ---------------------------------------------------------------------------
// Camps and the AAU circuit, before recruiting opens. Each event shows part of the class; attending one marks those
// recruits as scouted (their real ceiling shows) and they've met you (a little interest).
export const CAMP_DAYS = 6;
export const CAMPS = [
  { k: 'peach', label: 'Peach Jam', icon: '🍑', days: 3, says: 'The shoe-circuit finals: the top of the class, 4★ and 5★.', pick: x => x.stars >= 4 },
  { k: 'nbpa', label: 'Top 100 Camp', icon: '💯', days: 2, says: 'The top 100 of the class.', pick: x => x.rank <= 100 },
  { k: 'east', label: 'East Coast Showcase', icon: '🌊', days: 2, says: 'Everyone from the eastern time zone.', pick: x => (x.p.loc?.y ?? 0) > -8200 },
  { k: 'south', label: 'Southern Jamboree', icon: '🌴', days: 2, says: 'The South, Texas to the Carolinas.', pick: x => (x.p.loc?.x ?? 0) < 3700 },
  { k: 'midwest', label: 'Heartland Classic', icon: '🌽', days: 2, says: 'The Midwest and the Plains.', pick: x => (x.p.loc?.x ?? 0) >= 3700 && (x.p.loc?.y ?? 0) <= -8200 && (x.p.loc?.y ?? 0) > -10500 },
  { k: 'west', label: 'West Coast Live', icon: '🌅', days: 2, says: 'The Mountain and Pacific time zones.', pick: x => (x.p.loc?.y ?? 0) <= -10500 },
  { k: 'gems', label: 'Under the Radar', icon: '💎', days: 1, says: 'The 2★ and 3★ camp, where the sleepers are.', pick: x => x.stars <= 3 },
];
// A hidden gem: rated two stars below where his ceiling says he should be.
export const starsForPot = pot => (pot >= 9 ? 5 : pot >= 8 ? 4 : pot >= 6 ? 3 : 2);
export const isGem = x => !x.transfer && starsForPot(x.p.pot || 5) - x.stars >= 1 && (x.p.pot || 0) >= 7;
export function campReport(cls, keys) {
  const seen = new Map();
  for (const k of keys) { const c = CAMPS.find(x => x.k === k); if (!c) continue; for (const x of cls.hs.filter(c.pick)) seen.set(x.id, x); }
  const list = [...seen.values()];
  return { list, gems: list.filter(isGem), days: keys.reduce((a, k) => a + (CAMPS.find(c => c.k === k)?.days || 0), 0) };
}
export function attendCamps(M, cls, tid, keys) {
  const { list } = campReport(cls, keys);
  for (const x of list) {
    M.scouted[x.id] = 1;
    const o = (M.int[x.id] ||= {});
    o[tid] = r1((o[tid] || 0) + (isGem(x) ? 6 : 3));
  }
  M.camps = keys;
  return list.length;
}

// ---------------------------------------------------------------------------
// Walk-ons. The game's roster holds 15; scholarships are 13, so walk-ons fill the last two spots.
export const SCHOLARSHIPS = 13;
export function scholarshipCount(team, prog) {
  const walk = team.roster.filter(p => prog.walkons[p.id] && !prog.walkons[p.id].scholarship);
  return { total: team.roster.length, walkons: walk, scholarships: team.roster.length - walk.length };
}
// Three local walk-on candidates (seeded): low ceilings, good motors.
export function walkonCandidates(C, li, team, seed) {
  const template = C.teams.flatMap(t => t.roster).reduce((a, p) => (!a || p.id < a.id ? p : a), null);
  if (!template) return [];
  const out = [];
  for (let i = 0; i < 3; i++) {
    const r = rngOf(seedOf(seed, i));
    const { p } = generateRecruit(C, li, r, { stars: 2, pot: 4 + (r() < 0.3 ? 1 : 0), id: -1 - i, template });
    p.age = 18 + Math.floor(r() * 3); p.yrs = Math.floor(r() * 3);
    p.home = team.location?.city || p.home || '';
    p.loc = { x: (team.location?.x ?? p.loc.x) + Math.round((r() - 0.5) * 120), y: (team.location?.y ?? p.loc.y) + Math.round((r() - 0.5) * 120) };
    out.push({ p, seed: seedOf(seed, i), i });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Redshirts and eligibility. A redshirt year doesn't count: if he played 4 games or fewer, he gets the year back.
// A medical redshirt needs an injury that cost him most of the season.
export const MAX_REDSHIRTS = 3;
export function eligibility(team, prog) {
  return team.roster.map(p => {
    const used = !!prog.redApplied[p.id];
    const out = p.season?.injury?.gamesOut || 0;
    return { p, left: Math.max(1, 4 - (p.yrs ?? 0)), used, out, medical: out >= 15, canRed: !used && (p.yrs ?? 0) <= 3 };
  });
}
// The year back, once the season he sat is over (his class went up by one in the meantime).
export function redshirtsDue(prog, yrNow) {
  const due = [];
  for (const [yr, picks] of Object.entries(prog.redshirt)) {
    if (+yr >= yrNow) continue;
    for (const [pid, kind] of Object.entries(picks)) if (!prog.redApplied[pid]) due.push({ pid: +pid, yr: +yr, kind });
  }
  return due;
}

// ---------------------------------------------------------------------------
// Coaching carousel. After a good season other schools come for your assistants; a big season brings offers for you.
export function seasonScore(C, team, yr) {
  const s = stat(team, yr), gp = (s.W || 0) + (s.L || 0);
  const round = rowOf(team, yr)?.round || 0;
  return { wpct: gp ? (s.W || 0) / gp : 0, round, W: s.W || 0, L: s.L || 0 };
}
export function assistantsLeaving(C, team, yr) {
  const sc = seasonScore(C, team, yr);
  const heat = clamp((sc.wpct - 0.55) * 1.6 + sc.round * 0.08, 0, 0.75);
  const others = C.teams.filter(t => t !== team);
  return (team.frontOffice?.staff || []).slice(1, 4).map((s, i) => ({ s, slot: i + 1 })).filter(({ s, slot }) => s?.fn && rngOf(seedOf(yr, team.id, slot, 41))() < heat * (s.pot >= 7 ? 1.2 : 0.8))
    .map(x => ({ ...x, to: others[Math.floor(rngOf(seedOf(yr, team.id, x.slot, 43))() * others.length)] }));
}
// Candidates to replace an assistant (seeded names from the league's own name pool).
export function assistantCandidates(C, yr, slot, n = 3) {
  const people = [...C.teams.flatMap(t => t.roster), ...(C.retirees || [])];
  const r = rngOf(seedOf(yr, slot, 59));
  const pick = () => people[Math.floor(r() * people.length)] || { fn: 'Coach', ln: 'Smith' };
  const ROLES = ['Recruiter', 'Player development', 'Defensive coordinator', 'Offensive coordinator'];
  return Array.from({ length: n }, (_, i) => ({ fn: pick().fn, ln: pick().ln, age: 30 + Math.floor(r() * 25), role: ROLES[Math.floor(r() * ROLES.length)], i }));
}
// Job offers: schools with more prestige than yours, if your season was big enough.
export function jobOffers(C, team, yr) {
  const sc = seasonScore(C, team, yr);
  const hot = sc.round >= 3 || sc.wpct >= 0.78;
  if (!hot) return [];
  const mine = team.prestigePoints || 0;
  const r = rngOf(seedOf(yr, team.id, 97));
  return C.teams.filter(t => t !== team && (t.prestigePoints || 0) > mine + 8).filter(t => {
    const s = seasonScore(C, t, yr);
    return s.wpct < 0.5 || r() < 0.08;   // schools that just had a bad year are looking
  }).sort((a, b) => (b.prestigePoints || 0) - (a.prestigePoints || 0)).slice(0, 2);
}

// ---------------------------------------------------------------------------
// Non-conference schedule. Choices trade wins for a tournament case; each pays off somewhere the app tracks.
export const SCHEDULE = {
  buy: { label: 'Buy games', max: 6, says: 'Home games against small schools: easy wins, money for the collective (+$0.25M each), nothing for the résumé.' },
  mte: { label: 'Early-season tournament', max: 1, options: ['None', 'Maui Invitational', 'Battle 4 Atlantis', 'Players Era', 'Empire Classic'], says: 'Three games in a week on national TV: recruits watch.' },
  road: { label: 'Road games at ranked teams', max: 3, says: 'Tough losses are likely; a win is a résumé builder.' },
  neutral: { label: 'Neutral-site showcases', max: 2, says: 'A big game in an NBA arena near a recruiting hotbed.' },
};
export function scheduleEffect(s = {}) {
  const buy = s.buy || 0, road = s.road || 0, neutral = s.neutral || 0, mte = s.mte ? 1 : 0;
  return {
    nil: buy * 0.25,
    sos: clamp(50 + road * 10 + neutral * 6 + mte * 8 - buy * 5, 0, 100),
    exposure: mte * 4 + neutral * 3 + road * 1,   // recruiting interest next cycle
    wins: r1(buy * 0.95 + road * 0.35 + neutral * 0.55 + mte * 1.8),
    games: buy + road + neutral + mte * 3,
  };
}

// ---------------------------------------------------------------------------
// Midnight Madness and the summer tour.
export const TOURS = {
  none: { label: 'Stay home', practices: 0, cost: 0, says: '' },
  canada: { label: 'Canada', practices: 6, cost: 0.25, says: 'A short trip: 6 extra practices, two games.' },
  italy: { label: 'Italy', practices: 10, cost: 0.5, says: '10 extra practices, three games against pro teams.' },
  australia: { label: 'Australia', practices: 10, cost: 0.75, says: '10 extra practices, a long trip that bonds a young team.' },
};
// The tour's extra practices: a small bump for the young players (ratings toward the ceiling).
export function tourGains(team, key, seed) {
  const T = TOURS[key];
  if (!T || !T.practices) return [];
  const r = rngOf(seed);
  const SK = ['LAY', 'DNK', 'INS', 'MID', 'TPT', 'FTS', 'DRB', 'PAS', 'ORE', 'DRE', 'STL', 'BLK'];
  const out = [];
  for (const p of team.roster) {
    if ((p.yrs ?? 0) > 1) continue;
    const room = SK.filter(k => p.attributes?.[k] && p.attributes[k][0] < p.attributes[k][1]);
    const n = Math.min(room.length, T.practices >= 10 ? 2 : 1);
    const ks = [];
    for (let i = 0; i < n; i++) { const k = room.splice(Math.floor(r() * room.length), 1)[0]; ks.push(k); }
    if (ks.length) out.push({ pid: p.id, ks });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Media day: the conference's predicted order (roster strength and last season) and the All-Conference team.
const W9 = [1, 0.95, 0.9, 0.8, 0.7, 0.55, 0.45, 0.35, 0.25];
export function mediaDay(C, team, level, line = () => null) {
  const conf = C.divisions?.length ? team.division : null;
  const yr = lastSeasonYr(C);
  const strength = t => [...t.roster].map(level).sort((a, b) => b - a).slice(0, 9).reduce((a, v, i) => a + v * W9[i], 0);
  const teams = C.teams.filter(t => conf == null || t.division === conf).map(t => {
    const s = stat(t, yr), gp = (s.W || 0) + (s.L || 0);
    return { t, s: strength(t) + (gp ? (s.W / gp - 0.5) * 30 : 0) };
  }).sort((a, b) => b.s - a.s);
  teams.forEach((x, i) => { x.place = i + 1; });
  const players = teams.flatMap(x => x.t.roster.map(p => ({ p, t: x.t, l: line(p) })))
    .map(x => ({ ...x, v: level(x.p) + (x.l ? x.l.ppg * 0.5 + x.l.rpg * 0.25 + x.l.apg * 0.35 : 0) })).sort((a, b) => b.v - a.v);
  const first = players.slice(0, 5), second = players.slice(5, 10);
  const poy = players[0] || null;
  const fresh = players.filter(x => (x.p.yrs ?? 0) === 0)[0] || null;
  return { conf: conf == null ? 'League' : C.divisions[conf] || 'Conference', teams, mine: teams.find(x => x.t === team), first, second, poy, fresh };
}

// ---------------------------------------------------------------------------
// Program legacy, from the school's own history in the save: titles, Final Fours, tournament trips, retired jerseys.
// The legacy score (0-10) helps recruiting (interest from your calls and visits) and the NIL collective.
export function legacyOf(C, team, prog = emptyProgram()) {
  const rows = (team.season || []).filter(s => (s.seasonStats?.GP || 0) > 0);
  const banners = [];
  const champYrs = new Set(team.championships?.yearsWon || []);
  for (const s of rows) {
    const rounds = 6, rd = s.round || 0;
    if (champYrs.has(s.yr)) banners.push({ yr: s.yr, kind: 'title', label: 'National Champions' });
    else if (rd >= rounds - 1) banners.push({ yr: s.yr, kind: 'ff', label: 'Final Four' });
    else if (rd >= rounds - 3) banners.push({ yr: s.yr, kind: 'e8', label: rd >= rounds - 2 ? 'Elite Eight' : 'Sweet 16' });
    else if (rd >= 1) banners.push({ yr: s.yr, kind: 'tourney', label: 'NCAA Tournament' });
  }
  for (const y of champYrs) if (!banners.some(b => b.yr === y)) banners.push({ yr: y, kind: 'title', label: 'National Champions' });
  banners.sort((a, b) => b.yr - a.yr);
  const pts = banners.reduce((a, b) => a + ({ title: 3, ff: 1.5, e8: 0.8, tourney: 0.3 }[b.kind] || 0), 0)
    + (team.retiredNumbers || []).length * 0.4 + (team.prestigePoints || 0) / 30;
  const score = clamp(Math.round(pts * 10) / 10, 0, 10);
  return { banners, score, tier: score >= 8 ? 'Blue Blood' : score >= 5 ? 'Power Program' : score >= 2.5 ? 'Rising' : 'Building',
    culture: 1 + score * 0.015, retired: team.retiredNumbers || [] };
}
// Program greats who could have a jersey retired: former players of the school with awards or records, gone now.
export function retireCandidates(data, li, team) {
  const C = data.seasonLeagues[li];
  const out = [];
  const seen = new Set((team.retiredNumbers || []).map(r => r.num));
  const consider = (p, where) => {
    const h = p.history || {};
    const fromHere = where === 'college' ? (p.stats || []).some(s => s.league === li && (s.season || []).some(r => r.tid === team.id && r.GP > 0)) : h.coll === li && h.tid === team.id;
    if (!fromHere) return;
    const aw = (p.awards || []).filter(a => a.league === li).reduce((a, x) => a + (x.yearsWon?.length || 0), 0);
    const pro = where === 'pro';
    if (!aw && !pro && !(p.records > 0)) return;
    const num = p.num ?? 0;
    if (seen.has(num)) return;
    out.push({ p, num, aw, pro, score: aw * 2 + (pro ? 2 : 0) + (p.records || 0) });
  };
  for (const p of C.retirees || []) consider(p, 'college');
  data.seasonLeagues.forEach((L, i) => { if (i === li) return; for (const t of L.teams) for (const p of t.roster) consider(p, 'pro'); });
  return out.sort((a, b) => b.score - a.score).slice(0, 8);
}

const rt0 = (prog, yr) => prog.retention?.[yr];

// ---------------------------------------------------------------------------
// Putting the decisions back into a freshly loaded save (safe to run again). Returns what changed.
export function applyProgram(data, li, prog, { userId, yr, proIdx = -1 } = {}) {
  const C = data.seasonLeagues[li];
  const T = new Map(C.teams.map(t => [t.id, t]));
  const changes = [];
  const where = new Map(C.teams.flatMap(t => t.roster.map(p => [p.id, t])));
  const touched = new Set();
  const take = pid => { const t = where.get(pid); if (!t) return null; const p = t.roster.find(x => x.id === pid); t.roster.splice(t.roster.indexOf(p), 1); where.delete(pid); touched.add(t); return { p, t }; };
  // Testing the waters: those who stayed in the draft leave the school (into the pro draft class when there is one).
  const w = prog.waters[yr];
  if (w) {
    const gone = [...Object.entries(w).filter(([k, v]) => k !== 'cpu' && v && v.back === false).map(([k]) => +k), ...(w.cpu || [])];
    for (const pid of gone) {
      const x = take(pid);
      if (!x) continue;
      changes.push(`${x.p.fn} ${x.p.ln} left ${x.t.shortName} for the draft`);
      const P = data.seasonLeagues[proIdx];
      if (P && Array.isArray(P.draftClass) && P.meta) {
        const q = JSON.parse(JSON.stringify(x.p));
        q.id = ++P.meta.uPID; q.tid = 0; q.league = 0; q.status = 0; q.yrs = 0;
        q.history = { ...(q.history || {}), coll: li, id: x.p.id, tid: x.t.id, yrs: x.p.yrs ?? 0, yearDeclared: C.season.currentYear };
        if (q.contract) Object.assign(q.contract, { tid: 0, pid: q.id, sal: 0, nil: 0, yrs: 0 });
        P.draftClass.push(q);
      }
    }
  }
  // Ones the game had sent away that your meetings brought back.
  const me0 = T.get(userId);
  if (me0 && w) for (const [pid, v] of Object.entries(w)) if (pid !== 'cpu' && v?.back && v.declared) { const q = restoreFromPro(data, li, me0, +pid); if (q) { where.set(q.id, me0); changes.push(`${q.fn} ${q.ln} withdrew from the draft`); } }
  if (me0 && rt0(prog, yr)) for (const [pid, v] of Object.entries(prog.retention[yr])) if (v.stay && v.portal) { const q = restoreFromPortal(C, li, me0, +pid); if (q) { where.set(q.id, me0); changes.push(`${q.fn} ${q.ln} left the portal`); } }
  // Retention: the ones who left go into the portal (the college free-agent pool) with the game's portal news item.
  const rt = prog.retention[yr];
  if (rt) for (const [pid, v] of Object.entries(rt)) {
    if (v.stay !== false || v.portal) continue;
    const x = take(+pid);
    if (!x) continue;
    x.p.tid = 0; x.p.linePos = -1;
    if (x.p.contract) Object.assign(x.p.contract, { tid: 0, sal: 0, nil: 0 });
    (C.freeAgents ||= []).push(x.p);
    const news = (C.season.news ||= []);
    if (!news.some(n => n.type === 34 && n.pid === x.p.id)) news.push({ ...(news.find(n => n.type === 34) || { category: 0, phase: C.season.phase, day: C.season.currentDay || 0 }), type: 34, pid: x.p.id, tid: x.t.id });
    changes.push(`${x.p.fn} ${x.p.ln} entered the portal`);
  }
  // Close the gaps in the depth chart of a team that lost someone (in the order it already had).
  for (const t of touched) [...t.roster].filter(p => p.linePos >= 0).sort((x, y) => x.linePos - y.linePos).forEach((p, i) => { p.linePos = i; });
  // NIL deals.
  const nil = prog.nil[yr];
  if (nil) for (const [pid, amt] of Object.entries(nil)) { const t = where.get(+pid); const p = t?.roster.find(x => x.id === +pid); if (p?.contract && p.contract.nil !== amt) { p.contract.nil = amt; changes.push(`${p.fn} ${p.ln}: NIL $${amt}M`); } }
  // Walk-ons: put back any that aren't on the roster.
  const me = T.get(userId);
  if (me) for (const [pid, wk] of Object.entries(prog.walkons)) {
    if (wk.yr !== yr || where.has(+pid) || me.roster.length >= 15) continue;
    const cand = walkonCandidates(C, li, me, wk.seed)[wk.i];
    if (!cand) continue;
    const id = +pid;
    // The id is his for good; a save where someone else already has it skips him (the app warns).
    if (C.teams.some(t => t.roster.some(p => p.id === id)) || (C.freeAgents || []).some(p => p.id === id) || (C.retirees || []).some(p => p.id === id)) continue;
    cand.p.id = id; cand.p.contract.pid = id;
    signToSchool(C, li, me, cand.p, { sal: 0 });
    C.meta.uPID = Math.max(C.meta.uPID || 0, id);
    where.set(id, me);
    changes.push(`${cand.p.fn} ${cand.p.ln} joined as a walk-on`);
  }
  // Redshirts: the year back for anyone who sat a whole season.
  // (Done by the app once per player; see redshirtsDue.)
  // Staff hires.
  const st = prog.staff[yr];
  if (st) for (const [slot, h] of Object.entries(st)) {
    const s = (T.get(h.tid) || me)?.frontOffice?.staff?.[+slot];
    if (s && (s.fn !== h.fn || s.ln !== h.ln)) { s.fn = h.fn; s.ln = h.ln; if (h.age) s.age = h.age; changes.push(`${h.fn} ${h.ln} hired`); }
  }
  // Retired jerseys.
  for (const r of prog.retired) {
    const t = T.get(r.tid);
    if (t && !(t.retiredNumbers ||= []).some(x => x.num === r.num)) { t.retiredNumbers.push({ num: r.num, pid: r.pid, yr: r.yr }); t.retiredNumbers.sort((a, b) => (a.num === 100 ? -1 : a.num) - (b.num === 100 ? -1 : b.num)); changes.push(`#${r.num === 100 ? '00' : r.num} retired`); }
  }
  // Tour practices.
  // Tour practices: each gain is stored as the rating he reached, so running this again changes nothing.
  for (const g of prog.tourGain?.[yr] || []) {
    const p = me?.roster.find(x => x.id === g.pid);
    const a = p?.attributes?.[g.k];
    if (a && a[0] < g.to && g.to <= a[1]) { a[0] = g.to; changes.push(`${p.fn} ${p.ln} ${g.k} ${g.to}`); }
  }
  return changes;
}

export { GROUP, miles };

// ---------------------------------------------------------------------------
// Graduates: every player who finishes his eligibility at your school, kept by the app for good (the game keeps only
// some of them). The game makes up a major on its departure screen without saving it, so the app picks one (the same
// one every time, by his id).
export const MAJORS = ['Communication', 'Business Administration', 'Sport Management', 'Kinesiology', 'Psychology', 'Sociology',
  'Criminal Justice', 'Marketing', 'Finance', 'Economics', 'Political Science', 'History', 'Journalism', 'Education',
  'Exercise Science', 'Information Technology', 'Computer Science', 'Mechanical Engineering', 'Biology', 'African American Studies',
  'Recreation Management', 'Health Sciences', 'Public Relations', 'Supply Chain Management', 'Social Work', 'Film Studies',
  'Nursing', 'Marine Biology', 'Mathematics', 'Biomedical Engineering', 'Zoology', 'Accounting', 'Architecture', 'Chemistry',
  'English', 'Philosophy', 'Graphic Design', 'Music', 'Agricultural Science', 'Environmental Science'];
const MAJOR_W = [9, 9, 8, 7, 6, 5, 5, 5, 3, 3, 3, 3, 3, 3, 4, 2, 2, 2, 3, 2, 2, 3, 3, 1, 2, 1, 3, 2, 2, 2, 2, 2, 1, 1, 2, 1, 1, 1, 1, 2];
export function degreeOf(pid, yrs) {
  const r = rngOf(seedOf(pid, 4242))();
  let x = r * MAJOR_W.reduce((a, v) => a + v, 0), i = 0;
  while (i < MAJORS.length - 1 && (x -= MAJOR_W[i]) > 0) i++;
  return MAJORS[i];   // the game's own words: "Graduated in Nursing"
}
// College career totals from his stat rows at one school (league li).
export function collegeCareer(p, li, tid) {
  const t = { GP: 0, GS: 0, MIN: 0, PTS: 0, REB: 0, AST: 0, STL: 0, BLK: 0, FGM: 0, FGA: 0, TPM: 0, TPA: 0, FTM: 0, FTA: 0 };
  const seasons = new Set();
  for (const s of p.stats || []) {
    if (s.league !== li) continue;
    for (const r of s.season || []) {
      if (tid != null && r.tid !== tid) continue;
      if ((r.GP || 0) > 0) seasons.add(s.yr);
      for (const k of Object.keys(t)) t[k] += k === 'MIN' ? (Array.isArray(r.MIN) ? r.MIN[0] : r.MIN || 0) / 60 : r[k] || 0;
    }
  }
  const pg = k => (t.GP ? Math.round((t[k] / t.GP) * 10) / 10 : 0);
  return { ...Object.fromEntries(Object.entries(t).map(([k, v]) => [k, Math.round(v)])), seasons: [...seasons].sort(), ppg: pg('PTS'), rpg: pg('REB'), apg: pg('AST'), spg: pg('STL'), bpg: pg('BLK'), mpg: pg('MIN'),
    fg: t.FGA ? Math.round((t.FGM / t.FGA) * 1000) / 10 : 0, tp: t.TPA ? Math.round((t.TPM / t.TPA) * 1000) / 10 : 0, ft: t.FTA ? Math.round((t.FTM / t.FTA) * 1000) / 10 : 0 };
}
// This offseason's graduates from your school: the college retirees whose eligibility ran out this year, and seniors
// who went to the pros (drafted or not). Returns records ready for the program store.
export function graduatesNow(data, li, team) {
  const C = data.seasonLeagues[li], yr = C.season.currentYear;
  const AW = C.awards || [];
  const rec = (p, outcome, extra = {}) => {
    const car = collegeCareer(p, li, team.id);
    if (!car.GP && !car.seasons.length) return null;
    const lastRow = (p.stats || []).filter(s => s.league === li).flatMap(s => s.season || []).filter(r => r.tid === team.id).pop();
    return {
      pid: extra.hid ?? p.id, fn: p.fn, ln: String(p.ln).replace(/^\*/, ''), num: lastRow?.num ?? p.num, pos: p.pos, ht: p.ht, home: p.home || '',
      tid: team.id, school: team.shortName, classOf: yr, yrs: extra.yrs ?? p.yrs, degree: degreeOf(extra.hid ?? p.id, extra.yrs ?? p.yrs), outcome,
      career: car, awards: (p.awards || []).filter(a => a.league === li).map(a => ({ name: AW[a.id]?.name || 'Award', yrs: a.yearsWon || [] })),
    };
  };
  const out = [];
  for (const p of C.retirees || []) {
    if ((p.history?.yearRetired || 0) !== yr) continue;
    if (!(p.stats || []).some(s => s.league === li && (s.season || []).some(r => r.tid === team.id && (r.GP || 0) > 0))) continue;
    const last = (p.stats || []).filter(s => s.league === li && (s.season || []).length).pop();
    if (last?.season[last.season.length - 1]?.tid !== team.id) continue;   // he finished somewhere else
    const r = rec(p, 'Graduated'); if (r) out.push(r);
  }
  for (const x of gameDepartures(data, li, team).declared) {
    if (x.yrs < 3) continue;   // underclassmen who left early aren't graduates
    const r = rec(x.p, x.pick ? `Drafted No. ${x.pick} (${x.t?.shortName || 'pro'})` : 'Went pro (undrafted)', { hid: x.hid, yrs: x.yrs + 1 });
    if (r) out.push(r);
  }
  return out.sort((a, b) => b.career.PTS - a.career.PTS);
}
