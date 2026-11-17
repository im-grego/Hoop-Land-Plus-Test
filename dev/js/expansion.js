// Expansion: new teams written into the save, protected lists and the expansion draft, by the NBA's rules.
// - Each existing team protects up to 8 players: players under contract (options included) and restricted free
//   agents. A pending unrestricted free agent can't be protected. Each team must leave at least one player exposed who
//   can't become an unrestricted free agent.
// - Draft order alternates (not a snake). A team loses one player at most: once one of its players is taken, the rest
//   of its list is off the board. An expansion team takes 14 to 29 players.
// - A restricted free agent who's taken becomes unrestricted (his old team can't re-sign him); the expansion team holds
//   his rights. A team over the cap that loses a player under contract gets a traded player exception for his salary.
// - After the draft an expansion team's cap is two-thirds of the league's in year 1 and 80% in year 2 (the floor is
//   90% of that), and a player it took and waives before its first season comes off its cap (he still counts toward
//   the floor).

export const EXP_MIN = 14, EXP_MAX = 29, PROTECT_MAX = 8;
export const CAP_SCALE = [2 / 3, 0.8];

import { TEAM_PRESETS } from './teampresets.js';
import { draftYear } from './savefile.js';

// The expansion teams to start from: the preset team files (every field can be changed, or replaced from a team
// file). A spec keeps only its preset's key; the file itself is read again when the team is made.
export const presetTeam = key => TEAM_PRESETS.find(p => p.key === key);
export const presetSpec = p => ({ ...teamFromFile(p.team), fromFile: false, preset: p.key, label: p.city, division: p.team.division, location: { ...p.team.location }, ...(p.heritage ? { heritage: p.heritage } : {}) });
// PRESETS: at the end of the file (it needs the helpers below).

// With both new teams in the West, one Western team moves East so the conferences stay even (16 and 16).
// With both new teams in the West, one Western team has to move East (the user picks which). When it's New Orleans or
// Memphis, joining the Southeast, Washington can move to the Atlantic (or the Southeast stays at six).
export const REALIGN = [
  { key: 'MIN', label: 'Minnesota to the Central', abbr: 'MIN', division: 1 },
  { key: 'NOP', label: 'New Orleans to the Southeast', abbr: 'NOP', division: 2, was: true },
  { key: 'MEM', label: 'Memphis to the Southeast', abbr: 'MEM', division: 2, was: true },
];
export const realignMoves = (r, wasToAtlantic = false) => (r?.abbr ? [{ abbr: r.abbr, division: r.division }, ...(r.was && wasToAtlantic ? [{ abbr: 'WAS', division: 0 }] : [])] : []);

// A full realignment by geography (6 divisions, 3 a conference): the eastern half of the league (by longitude) is the
// East. In each conference the southern third is the Southeast / Southwest, and the rest splits east-west: Atlantic
// and Central, Northwest and Pacific. Teams in the same city stay together. Works for any number of teams (a
// Vancouver or a Mexico City lands where the map puts it). Returns Map(team id -> division).
export function geoRealign(teams) {
  const lat = t => (t.location?.x ?? 0) / 100, lon = t => (t.location?.y ?? 0) / 100;
  const same = (a, b) => a && b && lat(a) === lat(b) && lon(a) === lon(b);
  // A cut at i that doesn't part two teams from the same city (moves back first, then forward).
  const cut = (xs, i) => { let j = i; while (j > 1 && same(xs[j - 1], xs[j])) j--; if (j > 1) return j; j = i; while (j < xs.length - 1 && same(xs[j - 1], xs[j])) j++; return j; };
  const byLon = [...teams].sort((a, b) => lon(b) - lon(a));
  const h = cut(byLon, Math.ceil(teams.length / 2));
  const out = new Map();
  const conf = (xs, south, east, west) => {
    const bySouth = [...xs].sort((a, b) => lat(a) - lat(b)), k = cut(bySouth, Math.round(xs.length / 3));
    bySouth.slice(0, k).forEach(t => out.set(t.id, south));
    const rest = bySouth.slice(k).sort((a, b) => lon(b) - lon(a)), m = cut(rest, Math.ceil(rest.length / 2));
    rest.forEach((t, i) => out.set(t.id, i < m ? east : west));
  };
  conf(byLon.slice(0, h), 2, 0, 1);
  conf(byLon.slice(h), 5, 3, 4);
  return out;
}

const clone = o => JSON.parse(JSON.stringify(o));
// Every number in a structure to 0 (arrays of numbers keep their length; L10-style streak lists empty out).
const zeroed = o => {
  if (Array.isArray(o)) return o.map(zeroed);
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, k === 'L10' ? [] : zeroed(v)]));
  return typeof o === 'number' ? 0 : typeof o === 'boolean' ? false : o;
};
const hex = s => String(s || '').replace('#', '').toUpperCase().slice(0, 6);

// The next team id: after every team and the All-Star teams (starTeams), so a 30-team league with its All-Star teams
// on 32 and 33 adds 34, then 35.
export function nextTeamId(league, taken = []) {
  return Math.max(0, ...league.teams.map(t => t.id), ...(league.starTeams || []).map(t => t.id), ...taken) + 1;
}

// Numbers retired across the league (on at least half the teams: Bill Russell's 6), for a new team to honor too.
export function leagueWideRetired(league) {
  const n = new Map();
  for (const t of league.teams) for (const r of t.retiredNumbers || []) { const k = `${r.num}:${r.pid}`; n.set(k, { r, c: (n.get(k)?.c || 0) + 1 }); }
  return [...n.values()].filter(x => x.c >= league.teams.length / 2).map(x => ({ ...x.r }));
}
// Numerical order, 00 first, then 0 up to 99.
const numKey = n => (String(n) === '00' || Number(n) === 100 ? -1 : Number(n));   // the game stores 00 as 100
const byNumber = list => list.sort((a, b) => numKey(a.num) - numKey(b.num));

// A returning franchise takes its history back from the team that moved away (Seattle from Oklahoma City): the seasons
// up to the move (team rows, the franchise totals for those years, the titles), every player's and coach's stat lines
// with the old team in those years, and the retired numbers (but the ones kept by the team that moved, and the ones
// retired league-wide, which both teams keep). h: { from: [abbr or name...], through: last season before the move,
// keep: [last names whose numbers stay] }.
export function takeHeritage(league, team, h) {
  const src = league.teams.find(t => t !== team && (h.from || []).some(k => t.shortName === k || t.name === k));
  if (!src) return null;
  const through = h.through, old = src.id, out = { from: src, seasons: 0, lines: 0, numbers: 0, titles: 0 };
  // Team seasons and the franchise totals for them.
  const rows = (src.season || []).filter(r => r.yr <= through);
  if (!rows.length) return null;
  src.season = src.season.filter(r => r.yr > through);
  for (const r of rows) for (const k of ['seasonStats', 'playoffStats', 'finalsStats']) if (r[k] && r[k].tid === old) r[k].tid = team.id;
  team.season = [...rows, ...(team.season || [])].sort((a, b) => a.yr - b.yr);
  out.seasons = rows.length;
  const move = (hk, rk) => {
    const A = src.history?.[hk], B = team.history?.[hk];
    if (!A || !B) return;
    for (const [k, v] of Object.entries(A)) {
      if (k === 'tid' || k === 'L10' || k === 'STRK') continue;
      if (typeof v === 'number') { const s = rows.reduce((a, r) => a + (r[rk]?.[k] || 0), 0); A[k] = v - s; B[k] = (B[k] || 0) + s; }
      else if (Array.isArray(v)) v.forEach((x, i) => { if (typeof x !== 'number') return; const s = rows.reduce((a, r) => a + (r[rk]?.[k]?.[i] || 0), 0); v[i] = x - s; (B[k] ||= v.map(() => 0))[i] = (B[k][i] || 0) + s; });
    }
  };
  move('season', 'seasonStats'); move('playoffs', 'playoffStats'); move('finals', 'finalsStats');
  // Titles.
  const won = (src.championships?.yearsWon || []).filter(y => y <= through);
  if (won.length) {
    src.championships.yearsWon = src.championships.yearsWon.filter(y => y > through);
    team.championships = { ...(team.championships || {}), yearsWon: [...won, ...(team.championships?.yearsWon || [])].sort((a, b) => a - b) };
    out.titles = won.length;
  }
  // Stat lines: players (rosters, free agents, prospects, retirees, Hall of Fame) and coaches (pool and staff).
  const people = [...league.teams.flatMap(t => [...(t.roster || []), ...(t.frontOffice?.staff || [])]), ...(league.freeAgents || []), ...(league.retirees || []), ...(league.hallOfFame || []), ...(league.draftClass || []), ...(league.coaches || [])];
  const fix = s => { if (s && s.tid === old) { s.tid = team.id; out.lines++; } };
  for (const p of people) for (const r of [...(p.stats || []), ...(p.career?.teamHistory || [])]) {
    if (!(r.yr <= through)) continue;
    for (const k of ['season', 'playoffs', 'finals']) { const v = r[k]; if (Array.isArray(v)) v.forEach(fix); else fix(v); }
  }
  // Draft records: a player Seattle drafted shows Seattle, not the team that moved.
  for (const p of people) { const d = p.history?.draft; if (d && d.yr <= through) { if (d.tid === old) d.tid = team.id; if (d.otid === old) d.otid = team.id; } }
  // Retired numbers: league-wide ones stay on both; the kept ones stay home; the rest come back.
  const wide = new Set(leagueWideRetired(league).map(r => `${r.num}:${r.pid}`));
  const nameOf = pid => people.find(p => p.id === pid)?.ln || '';
  const keep = new Set((h.keep || []).map(s => s.toLowerCase()));
  const back = (src.retiredNumbers || []).filter(r => !wide.has(`${r.num}:${r.pid}`) && !keep.has(nameOf(r.pid).toLowerCase()));
  src.retiredNumbers = (src.retiredNumbers || []).filter(r => !back.includes(r));
  const have = new Set((team.retiredNumbers || []).map(r => `${r.num}:${r.pid}`));
  // Numbers the returning team retires itself (h.retire: [{ fn, ln, num }]), for players in the league file.
  const own = (h.retire || []).map(x => ({ x, p: people.find(p => p.fn === x.fn && p.ln === x.ln) })).filter(o => o.p && !have.has(`${o.x.num}:${o.p.id}`))
    .map(o => ({ num: o.x.num, pid: o.p.id, yr: league.season?.currentYear || through }));
  team.retiredNumbers = byNumber([...(team.retiredNumbers || []), ...back.filter(r => !have.has(`${r.num}:${r.pid}`)), ...own]);
  out.numbers = back.length + own.length;
  return out;
}

// A new person id: one above every player, prospect, retiree, coach and staff member in the league and the game's
// counter; the counter (meta.uPID) is moved up to it.
export function nextPersonId(league) {
  const all = [...league.teams.flatMap(t => [...(t.roster || []), ...(t.frontOffice?.staff || [])]), ...(league.freeAgents || []), ...(league.retirees || []), ...(league.hallOfFame || []), ...(league.draftClass || []), ...(league.coaches || [])];
  const id = Math.max(league.meta?.uPID || 0, ...all.map(p => p.id || 0)) + 1;
  if (league.meta) league.meta.uPID = id;
  return id;
}

// A vacant staff chair in the game's own format.
export function emptyStaff(tid, template) {
  const s = zeroed(clone(template));
  return Object.assign(s, { tid, fn: '', ln: '', tag: '', home: '', ctry: '', appearance: Object.fromEntries(Object.keys(template.appearance || {}).map(k => [k, k === 'unibrow' ? false : ''])), suits: [], awards: [], history: { league: 0, id: 0 }, career: zeroed(clone(template.career || {})) });
}

// Uniforms in the team's colors: home (white), away (primary), alternate (secondary), statement (primary/secondary).
function uniformsFor(colors) {
  const [p, s, t] = colors.map(hex);
  return [
    { jersey: 'FFFFFF', jerseyStripe: 'DBE0E7', jerseyCollar: s, jerseyNumber: p, shorts: 'FFFFFF', shortsStripe: s },
    { jersey: p, jerseyStripe: s, jerseyCollar: s, jerseyNumber: t, shorts: p, shortsStripe: s },
    { jersey: s, jerseyStripe: p, jerseyCollar: 'PRI', jerseyNumber: 'PRI', shorts: s, shortsStripe: p },
    { jersey: p, jerseyStripe: 'SEC', jerseyCollar: 'SEC', jerseyNumber: 'SEC', shorts: p, shortsStripe: 'TER' },
  ];
}
function courtFor(template, colors) {
  const [p, s] = colors.map(hex);
  const c = clone(template || {});
  Object.assign(c, { innerFT: '', innerFTC: p, outerKey: '', outerKeyC: p, innerKey: '', innerKeyC: p, outerBorder: s, innerBorder: s, outerFloor: p, sideline1C: s, sideline2C: p, baseline1C: 'FFFFFF', baseline2C: 'FFFFFF', hoopBase: 'PRI', overlayURL: '', logoSize: 0 });
  return c;
}

// The look of a team from a Hoop Land team file (or any JSON holding a team): the first object with a city, a name
// and team colors. Only the look comes over: names, arena, logo, colors, uniforms, court, location.
export function teamFromFile(json) {
  let found = null;
  const walk = o => {
    if (found || !o || typeof o !== 'object') return;
    if (!Array.isArray(o) && typeof o.city === 'string' && typeof o.name === 'string' && Array.isArray(o.teamColors)) { found = o; return; }
    for (const v of Object.values(o)) walk(v);
  };
  walk(json);
  if (!found) return null;
  const f = found;
  return {
    city: f.city, name: f.name, abbr: f.shortName || f.name.slice(0, 3).toUpperCase(), arena: f.arenaName || '', colors: f.teamColors.slice(0, 3).map(hex),
    logoURL: f.logoURL || '', logoSize: f.logoSize, tag: f.tag, location: f.location, uniforms: f.uniforms, court: f.court, fromFile: true,
  };
}

// A new team in the save, built on an existing team's structure with everything team-specific reset.
// spec: { city, name, abbr, arena, colors, division, location, logoURL?, uniforms?, court?, tag? }
export function makeTeam(league, spec, template, id) {
  const yr = league.season.currentYear;
  const t = clone({ ...template, roster: [] });
  const colors = (spec.colors || ['333333', 'AAAAAA', 'FFFFFF']).map(hex);
  Object.assign(t, {
    id, isPlayer: false, city: spec.city, name: spec.name, shortName: spec.abbr, arenaName: spec.arena || `${spec.city} Arena`,
    logoURL: spec.logoURL || '', logoSize: spec.logoSize || template.logoSize || 256, tag: spec.tag || `${spec.city}${spec.name}`.toLowerCase().replace(/[^a-z]/g, ''),
    location: spec.location || template.location, division: spec.division ?? template.division, inbox: [], teamColors: colors,
    uniforms: spec.uniforms ? clone(spec.uniforms) : uniformsFor(colors), court: spec.court ? clone(spec.court) : courtFor(template.court, colors),
    roster: [], startingLineup: [], currentLineup: 0, retiredNumbers: byNumber(leagueWideRetired(league)), headToHeads: [], scoringOptions: [], coinFlip: 0,
    prestigePoints: 0, rnk: 0, following: false,
    championships: { id: 0, team: 0, league: 0, yearsWon: [], position: 0 },
    history: zeroed(clone(template.history || {})), campusGoals: zeroed(clone(template.campusGoals || {})),
  });
  if (t.campusGoals?.legacy) t.campusGoals.legacy.generatedTier = -1;
  // This season's row only: no past seasons.
  const row = zeroed(clone((template.season || []).find(r => r.yr === yr) || (template.season || []).slice(-1)[0] || { yr }));
  row.yr = yr;
  for (const k of ['seasonStats', 'playoffStats', 'finalsStats']) if (row[k]) row[k].tid = id;
  t.season = [row];
  // Front office: the facilities at their base, a smaller fan base, the staff chairs empty (the app hires a coach).
  const fo = t.frontOffice || {};
  // A preset team brings its own assistants, announcers and arena ads (the head coach's chair stays open).
  const pre = spec.preset && presetTeam(spec.preset)?.team.frontOffice;
  const theirs = pos => pre && pos !== 1 && (pre.staff || []).find(s => s.pos === pos);
  t.frontOffice = { ...fo, coins: fo.coins ?? 250, condition: 100, morale: 70, fans: pre?.fans > 0 ? pre.fans : 40,   // a preset's own fan base (Seattle 90, Las Vegas 60)
    facilities: (fo.facilities || []).map(f => ({ ...f, tier: 1, upgrade: 0, condition: 5 })),
    // Each preset assistant gets a person id of his own, above every id in the league (staff ids can run past the
    // game's counter, meta.uPID), and the counter moves up with it.
    staff: (fo.staff || []).map((s, i) => { const a = theirs(i + 1); if (a) return { ...clone(a), tid: id, id: nextPersonId(league) }; const e = emptyStaff(id, s); e.pos = 0; e.id = 0; return e; }) };
  if (pre) {
    if ((pre.announcers || []).length) t.frontOffice.announcers = pre.announcers.map(a => ({ ...clone(a), tid: id, id: 0 }));
    if (pre.adsURL) Object.assign(t.frontOffice, { adsURL: pre.adsURL, adSize: pre.adSize ?? 0 });
  }
  // Its own picks, every future year the league has picks for (both rounds); this summer's draft (draftYear: in a pro
  // save the offseason already carries next season's year) is placed in the draft order at the expansion draft.
  const dy = draftYear(league);
  const years = [...new Set(league.teams.flatMap(x => x.draftPicks || []).map(p => p.yr))].filter(y => y > dy).sort();
  t.draftPicks = years.flatMap(y => [1, 2].map(rd => ({ pk: 0, rd, tid: id, otid: id, yr: y })));
  return t;
}

// Where a player stands for the draft: 'contract' (signed past this season, an option, or an extension), 'rfa'
// (restricted free agent), 'ufa' (a pending unrestricted free agent: can't be protected) or null (not eligible: a
// player just drafted, a two-way, nobody).
export function eligibility(p, { isRestricted, STATUS_SIGNED, STATUS_EXPIRING }) {
  if (p.status === STATUS_SIGNED && (p.contract?.yrs || 0) >= 1 && (p.contract?.sal || 0) > 0) return 'contract';
  if (p.status === STATUS_EXPIRING) {
    if ((p.contract?.ext?.yrs || 0) > 0) return 'contract';
    return isRestricted(p) ? 'rfa' : 'ufa';
  }
  return null;
}
export const protectable = kind => kind === 'contract' || kind === 'rfa';

// Does a list follow the rules? Returns null or the problem.
export function listProblem(roster, ids, kindOf) {
  const set = new Set(ids);
  if (set.size > PROTECT_MAX) return `Protect ${PROTECT_MAX} at most (${set.size} picked).`;
  for (const p of roster) if (set.has(p.id) && !protectable(kindOf(p))) return `${p.fn} ${p.ln} is a pending unrestricted free agent: he can't be protected.`;
  const contracted = roster.filter(p => kindOf(p) === 'contract');
  if (contracted.length && contracted.every(p => set.has(p.id))) return 'Leave at least one player under contract unprotected.';
  return null;
}

// A CPU team's list: its most valuable protectable players, up to 8, skipping anyone not worth keeping (an overpaid
// deal it would be glad to lose), and always leaving one contracted player exposed.
export function cpuList(roster, kindOf, value, keepAt = 12) {
  const ranked = roster.filter(p => protectable(kindOf(p))).map(p => ({ p, v: value(p) })).sort((a, b) => b.v - a.v);
  let list = ranked.filter(x => x.v >= keepAt).slice(0, PROTECT_MAX).map(x => x.p.id);
  const contracted = roster.filter(p => kindOf(p) === 'contract');
  if (contracted.length && contracted.every(p => list.includes(p.id))) {
    const drop = ranked.filter(x => kindOf(x.p) === 'contract' && list.includes(x.p.id)).pop();
    list = list.filter(id => id !== drop.p.id);
  }
  return list;
}

// The alternating order, from the team holding the first pick.
export const turnOf = (n, first, second) => (n % 2 === 0 ? first : second);

// How an expansion team values a player in the pool: value for the future (young, upside, a fair deal) over
// value now, and less for one it would only hold the rights to (a pending free agent can walk).
export function expansionValue(p, kind, value) {
  let v = value(p);
  if (p.age <= 25) v *= 1.15;
  if (p.age >= 31) v *= 0.8;
  if (kind === 'ufa') v *= 0.65;   // his Bird rights: the one team that can re-sign him over its small first-year cap
  if (kind === 'rfa') v *= 0.9;
  return v;
}

// A CPU expansion team's choice: the best value on the board, with a lean toward positions it still needs; it keeps
// picking to 14, then only while there's real value (and stops at 16, leaving room to fill in free agency).
// room: what's left under its (expansion) cap for contracts; a deal that doesn't fit is passed over, and one that eats
// most of what's left counts for less. Rights-only picks (pending free agents) stop at three.
export function cpuPick(pool, have, kindOf, value, groupOf, room = Infinity) {
  if (have.length >= EXP_MAX) return null;
  const need = g => Math.max(0, 5 - have.filter(p => groupOf(p) === g).length);
  const rights = have.filter(p => kindOf(p) === 'ufa').length;
  const sal = p => (kindOf(p) === 'contract' ? p.contract?.sal || 0 : 0);
  // Keep about $4.5M a spot for the players still needed to reach 14.
  const reserve = Math.max(0, EXP_MIN - have.length - 1) * 4.5;
  const fits = x => sal(x.p) <= room - reserve && (kindOf(x.p) !== 'ufa' || rights < 3);
  const scored = pool.filter(fits).map(x => ({ ...x, s: expansionValue(x.p, kindOf(x.p), value) * (1 + 0.04 * need(groupOf(x.p))) * (sal(x.p) > room * 0.4 ? 0.7 : 1) })).sort((a, b) => b.s - a.s);
  // Short of 14 with nothing that fits: the cheapest deal on the board.
  const best = scored[0] || (have.length < EXP_MIN ? pool.filter(x => kindOf(x.p) !== 'ufa' || rights < 3).sort((a, b) => sal(a.p) - sal(b.p) || value(b.p) - value(a.p))[0] : null);
  if (!best) return null;
  if (!scored[0]) return best;
  if (have.length >= EXP_MIN && (have.length >= 16 || best.s < 18)) return null;
  return best;
}

// This year's picks with the expansion teams placed at their slots (1-based overall within round 1; in round 2 they
// pick first): every later pick moves down. pk is 0-based within each round, as the game numbers them.
export function placeDraftSlots(league, yr, entries) {
  // entries: [{ team, slot1 }]. Before the lottery has numbered the picks there's no order to slot into: the picks are
  // added unnumbered (returns false).
  const set = league.teams.some(t => (t.draftPicks || []).some(p => p.yr === yr && p.rd === 1 && p.pk > 0));
  if (!set) { for (const e of entries) for (const rd of [1, 2]) e.team.draftPicks.push({ pk: 0, rd, tid: e.team.id, otid: e.team.id, yr }); return false; }
  for (const rd of [1, 2]) {
    const order = league.teams.flatMap(t => (t.draftPicks || []).filter(p => p.yr === yr && p.rd === rd)).sort((a, b) => a.pk - b.pk);
    const adds = entries.map((e, i) => ({ at: rd === 1 ? e.slot1 - 1 : i, pick: { pk: 0, rd, tid: e.team.id, otid: e.team.id, yr }, team: e.team })).sort((a, b) => a.at - b.at);
    for (const a of adds) { order.splice(Math.min(a.at, order.length), 0, a.pick); a.team.draftPicks.push(a.pick); }
    order.forEach((p, i) => { p.pk = i; });
  }
  return true;
}

export const PRESETS = TEAM_PRESETS.map(p => presetSpec(p));
