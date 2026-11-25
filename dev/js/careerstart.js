// Start a Career from the app: a college save at the start of a season (phase 9, no games yet) becomes a Career save
// the way the game writes one once a recruit commits (checked against a real one, build 1.12.1):
//   both leagues: season.mode 2; the college league: season.teamId = his school, season.playerId = him; the pro
//   league: teamId 0, playerId 0; no team flagged isPlayer; the career block (coins, fans, fame, games) starts at 0.
//   him: on the school's roster, yrs 0 (a freshman), contract all zeros with canExt true, a stats row for this season
//   (sal 0), and a "commits" news item (type 14). meta.uPID covers his id.
// The steps in between are the app's: Create Your Player (js/creator.js) on a blank recruit, then his offers.

const RATINGS = ['LAY', 'DNK', 'INS', 'MID', 'TPT', 'FTS', 'DRB', 'PAS', 'ORE', 'DRE', 'STL', 'BLK'];
export const levelOf = p => 100 - Math.floor((168 - RATINGS.reduce((a, k) => a + (p.attributes?.[k]?.[0] || 0), 0)) / 2);
export const ROSTER_MAX = 15;
const clone = x => JSON.parse(JSON.stringify(x));
// Every number in a stat line back to 0 (minute arrays too).
const zero = o => { const z = clone(o); for (const k of Object.keys(z)) { if (typeof z[k] === 'number') z[k] = 0; else if (Array.isArray(z[k]) && z[k].every(v => typeof v === 'number')) z[k] = z[k].map(() => 0); else if (z[k] && typeof z[k] === 'object') z[k] = zero(z[k]); } return z; };
const gamesPlayed = L => L.teams.some(t => t.roster.some(p => (p.stats || []).some(s => s.yr === L.season.currentYear && (s.season || []).some(r => r.GP > 0))));

// The college league of a save, or why it can't start a career.
export function checkBase(save) {
  const leagues = save?.seasonLeagues || [];
  const li = leagues.findIndex(L => L.leagueType === 1);
  if (li < 0) return { ok: false, why: 'This save has no college league. Use a college (Campus) save.' };
  const L = leagues[li];
  if (leagues.some(x => x.season?.mode === 2 && x.season.playerId > 0)) return { ok: false, why: 'This save already has a career player.' };
  if (L.season.phase !== 9) return { ok: false, why: 'Use a save from the start of a college season (the new season, before the first game).' };
  if (gamesPlayed(L)) return { ok: false, why: 'Games have been played this season. Use a save from before the first game.' };
  return { ok: true, li, L };
}

// A blank recruit: a freshman from the league as the template (his body, look and gear), wiped of everything that
// was his. Create Your Player then gives him a name, ratings, potential, position and skills.
export function blankRecruit(save, li) {
  const L = save.seasonLeagues[li];
  const all = L.teams.flatMap(t => t.roster);
  const minYrs = Math.min(...all.map(p => p.yrs ?? 9));
  const fr = all.filter(p => (p.yrs ?? 9) === minYrs).sort((a, b) => a.age - b.age || a.id - b.id);
  const tpl = fr[Math.floor(fr.length / 2)] || all[0];
  const p = clone(tpl);
  const maxId = Math.max(L.meta?.uPID || 0, ...all.map(x => x.id), ...(L.freeAgents || []).map(x => x.id));
  Object.assign(p, { id: maxId + 1, tid: 0, fn: 'New', ln: 'Recruit', tag: '', arc: '', yrs: 0, status: 0, records: 0, awards: [], skills: [], stats: [], rating: 0, usage: 0, linePos: 0, teamPos: p.pos, posRnk: 0 });
  p.contract = { tid: 0, pid: 0, type: 0, yrs: 0, sal: 0, nil: 0, opt: 0, noTrd: 0, canExt: true, ext: { yrs: 0, sal: 0, opt: 0, noTrd: 0 } };
  p.gameStats = zero(p.gameStats); p.gameStats.num = -1;
  if (p.careerStats) p.careerStats = zero(p.careerStats);
  if (p.history) { const h = p.history; h.coll = 0; h.yrs = 0; h.id = 0; h.tid = 0; h.injuries = []; h.fantasyDrafts = []; h.expansionDrafts = []; h.draft = zero(h.draft); if (h.collegeStats) h.collegeStats = zero(h.collegeStats); for (const k of ['yearDeclared', 'yearRetired', 'yearInducted', 'causeOfDeath']) h[k] = 0; }
  if (p.season) {
    const s = p.season;
    Object.assign(s, { xp: s.xp?.map(() => 0) || [0, 0, 0, 0, 0], ap: s.ap?.map(() => 0) || [0, 0, 0, 0, 0], condition: 100, morale: 100, restDay: false, onTradeBlock: 0, regimen: 0, focus: 0, watch: false, scout: false, progress: 0, protect: false, retiring: false, gpa: 0, relationship: 0, legacyPoints: 0, following: false, legacy: 0 });
    if (s.injury) s.injury = zero(s.injury);
    if (s.gameHistory) s.gameHistory = zero(s.gameHistory);
  }
  if (p.gameStatus) Object.assign(p.gameStatus, { stamina: 0, gradePoints: 0, streak: 0, xpEarned: 0, onBench: false, injured: false, isPlayer: false });
  if (p.careerGoals) p.careerGoals = zero(p.careerGoals);
  return p;
}

// Small seeded random, so the same recruit sees the same offers.
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = s => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);
const group = pos => (pos <= 2 ? 0 : pos <= 5 ? 1 : 2);   // guards, wings, bigs
export const GROUP_NAMES = ['guards', 'wings', 'bigs'];
// How many offers a recruit draws, and which slice of the prestige ladder (0 the top) they come from.
const PULL = { 3: { n: 5, from: 0.35, to: 1 }, 4: { n: 6, from: 0.15, to: 0.8 }, 5: { n: 7, from: 0, to: 0.6 }, 6: { n: 8, from: 0, to: 0.4 } };

// His offers: [{ t, prestigeRank, strengthRank, role, ahead, minutes, conf, homeRank }], best programs first.
export function offers(save, li, p, pedigree = 4) {
  const L = save.seasonLeagues[li], teams = L.teams.filter(t => t.roster.length < ROSTER_MAX);
  const top8 = t => { const l = t.roster.map(levelOf).sort((a, b) => b - a).slice(0, 8); return l.reduce((a, b) => a + b, 0) / Math.max(1, l.length); };
  const byPrestige = [...L.teams].sort((a, b) => (b.prestigePoints || 0) - (a.prestigePoints || 0) || top8(b) - top8(a));
  const byStrength = [...L.teams].sort((a, b) => top8(b) - top8(a));
  const pr = new Map(byPrestige.map((t, i) => [t.id, i + 1])), sr = new Map(byStrength.map((t, i) => [t.id, i + 1]));
  const pull = PULL[pedigree] || PULL[4], N = L.teams.length;
  const lo = Math.floor(pull.from * N), hi = Math.max(lo + pull.n, Math.ceil(pull.to * N));
  const lv = levelOf(p), g = group(p.pos);
  const need = t => { const at = t.roster.filter(x => group(x.pos) === g); return at.filter(x => levelOf(x) >= lv).length; };   // players at his spot as good or better
  const pool = teams.filter(t => { const r = pr.get(t.id); return r > lo && r <= hi; });
  const rand = rng(hash(`${p.fn} ${p.ln} ${p.id}`));
  // Programs short at his spot are keener; a little luck on top.
  const picked = pool.map(t => ({ t, w: rand() + 0.35 / (1 + need(t)) })).sort((a, b) => b.w - a.w).slice(0, pull.n).map(x => x.t);
  const dist = t => (p.loc && t.location ? Math.hypot((p.loc.x || 0) - (t.location.x || 0), (p.loc.y || 0) - (t.location.y || 0)) : null);
  const near = [...L.teams].map(t => ({ t, d: dist(t) })).filter(x => x.d != null).sort((a, b) => a.d - b.d);
  const homeRank = new Map(near.map((x, i) => [x.t.id, i + 1]));
  return picked.map(t => {
    const ahead = need(t), at = t.roster.filter(x => group(x.pos) === g).sort((a, b) => levelOf(b) - levelOf(a));
    // Starters by group: 2 guards, 2 wings, 1 big is the usual floor; behind them, the rotation.
    const starts = [2, 2, 1][g];
    const role = ahead < starts ? 'Starter' : ahead < starts + 2 ? 'Rotation' : 'Bench to start';
    const minutes = role === 'Starter' ? '28-32' : role === 'Rotation' ? '14-20' : '0-10';
    const div = L.divisions?.[t.division];
    return { t, prestigeRank: pr.get(t.id), strengthRank: sr.get(t.id), role, minutes, ahead, best: at[0] || null, conf: div?.name || div?.shortName || '', homeRank: homeRank.get(t.id) ?? null, of: N };
  }).sort((a, b) => a.prestigeRank - b.prestigeRank);
}

// He commits: onto the roster, and the save becomes a Career save.
export function commit(save, li, p, teamId, wantNum) {
  const L = save.seasonLeagues[li], t = L.teams.find(x => x.id === teamId), yr = L.season.currentYear;
  const taken = new Set(t.roster.map(x => x.num));
  let num = wantNum != null && wantNum !== '' && !taken.has(+wantNum) ? +wantNum : p.num;
  if (taken.has(num)) num = [...Array(100).keys()].find(n => !taken.has(n)) ?? 0;
  p.num = num; p.tid = t.id; p.league = li; p.yrs = 0;
  // His season row, shaped like a teammate's, all zeros.
  const mate = t.roster.find(x => (x.stats || []).some(s => s.yr === yr));
  const row = mate ? zero(mate.stats.find(s => s.yr === yr).season[0]) : { GP: 0, MIN: [0, 0, 0, 0, 0, 0] };
  p.stats = [{ league: li, yr, sal: 0, season: [{ ...row, tid: t.id, num }], playoffs: [], finals: [] }];
  t.roster.push(p);
  save.seasonLeagues.forEach((X, i) => {
    X.season.mode = 2;
    X.season.teamId = i === li ? t.id : 0;
    X.season.playerId = i === li ? p.id : 0;
    for (const tt of X.teams) tt.isPlayer = false;
    if (X.career) Object.assign(X.career, { gamesPlayed: 0, gamesSimulated: 0, coins: 0, fans: 0, fame: 0, inbox: [] });
  });
  L.meta.uPID = Math.max(L.meta.uPID || 0, p.id);
  (L.season.news ||= []).push({ league: li, rating: 100, date: L.season.currentDay || 1, phase: 14, category: 0, type: 14, tid: t.id, pid: p.id, gid: 0,
    data: { contract: clone(p.contract), draftPick: { pk: 0, rd: 0, tid: 0, otid: 0, yr: 0 }, injury: { yr: 0, core: 0, upperBody: 0, lowerBody: 0, minorSeverity: 0, majorSeverity: 0, gamesOut: 0, ageRegression: 0, age: 0 },
      awardId: 0, awardTeam: 0, trade: { teams: [], tradeGap: -1.0, status: 0 }, retiredNumber: { num: 0, pid: 0, yr: 0 }, facility: { type: 0, tier: 0, upgrade: 0, condition: 5 }, focus: 0, regimen: 0 }, read: false });
  return t;
}
