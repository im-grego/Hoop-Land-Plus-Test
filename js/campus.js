// Campus mode (a college franchise save with its NBA league): since the game's 2027 update, the first save you can make
// after the championships already has the whole NBA offseason done (lottery, draft, free agency) along with the college
// one. With the save from just before that advance (both leagues at the end of their playoffs) as a reference, the NBA
// league of the advanced save goes back to where a normal pre-lottery save starts, so the app can run that offseason:
//
//   kept from the advance   the new season the game built (schedule, season rows, everyone a year older, stats rows),
//                           and what the game decides as it enters the offseason, the same as in any pre-lottery save:
//                           retirements, options, re-signings, releases, trades
//   undone                  the lottery, the draft, rookie and free-agent signings and the extensions signed in free
//                           agency: everyone else is back where he finished the season, a year off his contract
//   the draft class         the college players who declared (drafted or not), as prospects again
//
// In campus mode the game drafts with the coming year's picks (the "2028 draft" in the 2028 offseason).

import { CAMPUS_LEAGUES } from './savefile.js';

const P2_KEEP = new Set(['0:16', '2:18', '2:20', '2:21', '2:19', '2:26', '2:27', '0:17', '0:25', '3:11']);   // decided entering the offseason
const UNDO = new Set(['0:1', '0:2', '2:3', '2:5', '2:30']);   // lottery, draft picks, rookie signings, free agency, extensions
const key = n => `${n.category}:${n.type}`;
const clone = v => JSON.parse(JSON.stringify(v));

// Which league is which in a campus save.
export function campusLeagues(data) {
  const ci = data.seasonLeagues.findIndex(L => L.leagueType === 1);
  const pi = data.seasonLeagues.findIndex(L => L.leagueType !== 1);
  return { ci, pi };
}
// A campus save the game just advanced past the championships (NBA in its new regular season at day 0, college in its
// offseason), and the save from before that advance (both at the end of their playoffs, the year before).
export const isAdvanced = data => { const { ci, pi } = campusLeagues(data); const P = data.seasonLeagues[pi], C = data.seasonLeagues[ci]; return ci >= 0 && pi >= 0 && P.season.phase === 9 && (P.season.currentDay || 0) === 0 && [8, 15].includes(C.season.phase); };
export const isPreAdvance = (data, after) => { const { pi } = campusLeagues(data); const P = data.seasonLeagues[pi]; return pi >= 0 && P.season.phase === 11 && (!after || P.season.currentYear === after.seasonLeagues[campusLeagues(after).pi].season.currentYear - 1); };

// The draft-year rule for a campus NBA league (the coming year's picks), kept off the league object itself.
export const markCampus = L => CAMPUS_LEAGUES.add(L);
export const isCampusPro = L => CAMPUS_LEAGUES.has(L);

function statsRowTid(p, yr, tid, sal) {
  for (const s of p.stats || []) if (s.league === 0 && s.yr === yr) { if (sal != null) s.sal = sal; for (const r of s.season || []) r.tid = tid; }
}

// The NBA league of `post` back to its pre-lottery state, from `pre`. Changes `post` in place; returns a report.
export function rebuildProOffseason(post, pre) {
  const { pi, ci } = campusLeagues(post);
  const L = post.seasonLeagues[pi], L0 = pre.seasonLeagues[campusLeagues(pre).pi];
  const yr = L.season.currentYear;
  const T = new Map(L.teams.map(t => [t.id, t]));
  const report = { draftClass: 0, back: 0, freed: 0, kept: 0, removedNews: 0 };
  // Where everyone is now.
  const where = new Map();
  for (const t of L.teams) for (const p of t.roster) where.set(p.id, { p, t });
  for (const p of L.freeAgents) where.set(p.id, { p, t: null });
  const pull = id => { const w = where.get(id); if (!w) return null; if (w.t) w.t.roster.splice(w.t.roster.indexOf(w.p), 1); else L.freeAgents.splice(L.freeAgents.indexOf(w.p), 1); where.delete(id); return w.p; };
  // Moves decided entering the offseason stay; the draft and free agency go.
  const kept = new Set(L.season.news.filter(n => P2_KEEP.has(key(n))).map(n => n.pid));
  // 1) The declared college players (drafted or not) go back to being prospects.
  const prospects = [];
  for (const [id, w] of [...where]) {
    const h = w.p.history || {};
    if (h.coll !== ci || h.yearDeclared !== yr) continue;
    const p = pull(id);
    Object.assign(p, { tid: 0, status: 1, linePos: -1, yrs: h.yrs ?? p.yrs });
    if (h.draft) Object.assign(h.draft, { pk: 0, rd: 0, tid: 0, otid: 0, yr: 0 });
    p.stats = (p.stats || []).filter(s => s.league === ci);
    if (p.contract) Object.assign(p.contract, { tid: 0, sal: 0, yrs: 0, opt: 0, canExt: false, ext: { yrs: 0, sal: 0, opt: 0, noTrd: 0 } });
    prospects.push(p);
  }
  L.draftClass = [...(L.draftClass || []), ...prospects];
  report.draftClass = prospects.length;
  // 2) Everyone the game signed or moved in free agency goes back to where he finished, a year off his contract.
  const before = new Map();
  for (const t of L0.teams) for (const p of t.roster) before.set(p.id, { p, tid: t.id });
  for (const p of L0.freeAgents) before.set(p.id, { p, tid: 0 });
  for (const [id, b] of before) {
    const w = where.get(id);
    if (!w) continue;                     // retired (or gone for good): the game's call stands
    if (kept.has(id)) { report.kept++; continue; }   // an offseason move the game made before the lottery
    const p = w.p;
    const c0 = b.p.contract;
    const onTeam = b.tid && T.has(b.tid);
    const contract = { ...clone(c0), tid: onTeam ? b.tid : 0, pid: p.id, yrs: onTeam ? Math.max(0, (c0.yrs || 0) - 1) : 0 };
    if (!onTeam) Object.assign(contract, { sal: 0, opt: 0, ext: { yrs: 0, sal: 0, opt: 0, noTrd: 0 } });
    const sameSpot = (w.t?.id || 0) === (onTeam ? b.tid : 0) && JSON.stringify(p.contract) === JSON.stringify(contract);
    if (sameSpot) continue;
    pull(id);
    p.contract = contract;
    if (onTeam) { const t = T.get(b.tid); p.tid = t.id; p.status = 3; p.linePos = t.roster.length; t.roster.push(p); where.set(id, { p, t }); report.back++; }
    else { p.tid = 0; p.status = 5; p.linePos = -1; L.freeAgents.push(p); where.set(id, { p, t: null }); report.freed++; }
    statsRowTid(p, yr, p.tid, contract.sal);
  }
  // 3) The draft and free-agency news go (the picks, signings and the lottery winner are written again by the app).
  const n0 = L.season.news.length;
  L.season.news = L.season.news.filter(n => !UNDO.has(key(n)));
  report.removedNews = n0 - L.season.news.length;
  if (Array.isArray(L.season.posts)) { const gone = new Set(prospects.map(p => p.id)); L.season.posts = L.season.posts.filter(x => !gone.has(x.pid)); }
  // 4) This year's picks back (the coming year's, in campus mode), with no slots yet; last year's stale ones stay gone.
  for (const t0 of L0.teams) {
    const t = T.get(t0.id); if (!t) continue;
    const have = new Set(t.draftPicks.map(k => `${k.yr}:${k.rd}:${k.otid}`));
    for (const k of t0.draftPicks) if (k.yr === yr && !have.has(`${k.yr}:${k.rd}:${k.otid}`)) t.draftPicks.push({ ...clone(k), pk: 0 });
    for (const k of t.draftPicks) if (k.yr === yr) k.pk = 0;
    // The lottery slots the game wrote on the new-season row go: the app's lottery sets them.
    const row = (t.season || []).find(s => s.yr === yr);
    if (row) { if ('pick' in row) row.pick = 0; if ('poll' in row) row.poll = 0; }
  }
  // 5) Depth charts and lineups: the order each team had, then whoever came back. A deal with no years left is an
  //    expiring one (status 4), the way a pre-lottery save lists it, so free agency puts him on the market.
  for (const t of L.teams) {
    for (const p of t.roster) if ((p.contract?.yrs || 0) === 0 && p.status === 3) { p.status = 4; report.expiring = (report.expiring || 0) + 1; }
    t.roster.forEach((p, i) => { p.linePos = i; });
    if (Array.isArray(t.startingLineup)) t.startingLineup = t.roster.map((p, i) => ({ ...(t.startingLineup.find(e => e.pid === p.id) || { minutes: [0, 0, 0, 0, 0, 0] }), linePos: i, pid: p.id }));
  }
  L.season.phase = 2;
  L.season.currentDay = 0;
  markCampus(L);
  return report;
}

// Depth charts after the app's offseason: every player once, in roster order (linePos 0..n-1), keeping the minutes the
// game gave anyone who stayed; newcomers start at none. The game sets the rotation.
// Every NBA lineup goes on preset 0 for now (where a league starts); which number is Optimized is still to be confirmed
// in the game.
export const PRESET_OPTIMIZED = 0;
export function settleLineups(L) {
  for (const t of L.teams) {
    t.lineupPreset = PRESET_OPTIMIZED;
    const old = new Map((t.startingLineup || []).map(e => [e.pid, e]));
    t.roster.sort((a, b) => (a.linePos < 0 ? 1e3 : a.linePos) - (b.linePos < 0 ? 1e3 : b.linePos));
    t.roster.forEach((p, i) => { p.linePos = i; });
    t.startingLineup = t.roster.map((p, i) => ({ linePos: i, pid: p.id, minutes: old.get(p.id)?.minutes ? [...old.get(p.id).minutes] : [0, 0, 0, 0, 0, 0] }));
  }
}

// After the app's NBA offseason: the league goes back to the new season's opening day, the way the game left it.
export function finishProOffseason(data) {
  const { pi } = campusLeagues(data);
  const L = data.seasonLeagues[pi];
  L.season.phase = 9;
  L.season.currentDay = 0;
  return L;
}
