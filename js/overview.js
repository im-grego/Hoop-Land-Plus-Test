// Offseason Overview: where a team stands, its books, its real roster needs
// (depth, upside, age and play style), its draft position; plus the league
// rumor mill and play-style reads from the save's tendencies.

import { playerName, draftYear } from './savefile.js';
import { shownLevel as levelOf } from './regression.js';
import { teamRecord, teamStatus, lotterySetup, lotteryOdds, seedOrder, standings } from './draft.js';
import { seasonLine } from './storylines.js';
import { tr, traitsSet } from './traits.js';
import * as FA from './freeagency.js';

const GROUPS = { guards: 'Guards', wings: 'Wings', bigs: 'Bigs' };
export const groupOf = p => (p.pos <= 2 ? 'guards' : p.pos <= 5 ? 'wings' : 'bigs');
const lastYr = L => Math.max(...L.teams.map(t => teamRecord(t).yr || 0));

// ---------------------------------------------------------------------------
// Tendencies (-5..5 in the save): what a player looks to do on the floor.
// Each style reads one or more sliders; a player shows the styles he leans
// into hardest. `neg` styles are things he won't do.
export const TEND_LABELS = {
  dunk: 'Dunk', floater: 'Floater', hook: 'Hook', post: 'Post-up', twoPoint: 'Midrange', threePoint: 'Three',
  pumpFake: 'Pump fake', fades: 'Fadeaway', pass: 'Pass', lob: 'Lob', cross: 'Crossover', spin: 'Spin',
  step: 'Step-back', offReb: 'Off. glass', runPlay: 'Run plays', defReb: 'Def. glass', takeCharge: 'Take charges',
  stealOnBall: 'On-ball steals', stealOffBall: 'Passing lanes', block: 'Block shots',
};
export const TEND_GROUPS = [
  ['Scoring & Shooting', ['dunk', 'floater', 'hook', 'post', 'twoPoint', 'threePoint', 'pumpFake', 'fades']],
  ['Creating & IQ', ['cross', 'spin', 'step', 'pass', 'lob', 'runPlay']],
  ['Effort & Defense', ['offReb', 'defReb', 'takeCharge', 'stealOnBall', 'stealOffBall', 'block']],
];
const STYLES = [
  { k: 'shooter', label: 'Floor spacer', icon: '🎯', f: t => t.threePoint, min: 3, text: 'lives beyond the arc' },
  { k: 'rim', label: 'Rim attacker', icon: '💥', f: t => (t.dunk * 2 + t.floater) / 3, min: 2.5, text: 'attacks the rim' },
  { k: 'mid', label: 'Midrange scorer', icon: '🔥', f: t => (t.twoPoint * 2 + t.fades) / 3, min: 2.5, text: 'pulls up from the midrange' },
  { k: 'post', label: 'Post scorer', icon: '🧱', f: t => (t.post * 2 + t.hook) / 3, min: 2.5, text: 'wants it on the block' },
  { k: 'creator', label: 'Shot creator', icon: '🪄', f: t => (t.step + t.cross + t.spin + t.fades) / 4, min: 2.5, text: 'creates his own shot off the dribble' },
  { k: 'playmaker', label: 'Playmaker', icon: '📋', f: t => (t.pass * 2 + t.runPlay) / 3, min: 2.5, text: 'looks to set teammates up' },
  { k: 'lob', label: 'Lob threat', icon: '🛫', f: t => (t.dunk + t.runPlay) / 2, min: 2.5, text: 'catches lobs' },
  { k: 'setter', label: 'Table setter', icon: '🍽️', f: t => t.lob, min: 1, fixed: true, ok: (p, t) => (p.attributes?.PAS?.[0] || 0) >= 13 && t.pass >= 0, text: 'throws lobs' },   // passing 6.5+ as the game shows it, a passing tendency of 0+, lobs of 1+
  { k: 'three', label: '3-Level scorer', icon: '📊', f: t => Math.min((t.dunk * 2 + t.floater) / 3, (t.twoPoint * 2 + t.fades) / 3, t.threePoint), min: 0.5, fixed: true, text: 'scores at all three levels' },
  { k: 'glass', label: 'Glass cleaner', icon: '🧹', f: t => (t.offReb + t.defReb) / 2, min: 3, text: 'crashes the boards' },
  { k: 'protector', label: 'Rim protector', icon: '🛡️', f: t => t.block, min: 3, text: 'goes for blocks' },
  { k: 'pest', label: 'Ball hawk', icon: '🦅', f: t => (t.stealOnBall + t.stealOffBall) / 2, min: 2.5, text: 'jumps passing lanes' },
  { k: 'charge', label: 'High effort', icon: '💪', f: t => t.takeCharge, min: 3, text: 'stands his ground for charges' },
];
const WONT = [
  { k: 'threePoint', max: -4, text: "won't shoot threes" },
  { k: 'pass', max: -4, text: "doesn't make the extra pass" },
  { k: 'dunk', max: -4, text: "doesn't play above the rim" },
  { k: 'defReb', max: -4, text: "doesn't rebound" },
];
// Pros and prospects lean differently (prospect sliders run higher), so a
// style counts when a player is in the top ~20% of his own pool (pros or
// the draft class) and clearly positive. setStyleRefs() reads the league.
let REFS = null;
export function setStyleRefs(L) {
  const cut = ps => Object.fromEntries(STYLES.map(st => {
    const v = ps.filter(p => p.tendencies).map(p => st.f(p.tendencies)).sort((a, b) => b - a);
    return [st.k, Math.max(1, v[Math.floor(v.length * 0.2)] ?? st.min)];
  }));
  const pros = L.teams.flatMap(t => t.roster).filter(p => p.attributes);
  const tools = Object.fromEntries(['TPT', 'MID', 'LAY', 'DNK', 'INS', 'DRB', 'PAS'].map(k => {
    const v = pros.map(p => p.attributes[k]?.[0] || 0), mean = v.reduce((x, y) => x + y, 0) / (v.length || 1);
    return [k, { mean, sd: Math.sqrt(v.reduce((x, y) => x + (y - mean) ** 2, 0) / (v.length || 1)) || 3 }];
  }));
  REFS = { pro: cut(L.teams.flatMap(t => t.roster)), draft: cut(L.draftClass || []), tools };
}
const refFor = p => (REFS ? (p.status === 1 ? REFS.draft : REFS.pro) : null);
// What reads as his game first: how he scores, then how he makes plays, then the glass and defense, and taking charges
// only ever last (an effort note, never the headline).
const STYLE_TIER = { shooter: 0, rim: 0, mid: 0, post: 0, creator: 0, three: 0, playmaker: 1, setter: 1, lob: 1, protector: 2, glass: 2, pest: 2, charge: 3 };
// A player's styles, most apparent first: [{ k, label, icon, text, v }]. The `n` he leans into hardest are kept, then
// ordered by what stands out in his game (scoring, playmaking, defense and the glass, effort), strongest first within each.
export function playStyles(p, n = 3) {
  const t = p.tendencies;
  if (!t) return [];
  const ref = refFor(p);
  const margin = s => s.v - s.cut;
  return STYLES.map(s => ({ ...s, text: s.k === 'charge' && (p.id || 0) % 2 ? 'puts his body on the line' : s.text, v: s.f(t), cut: s.fixed ? s.min : ref ? ref[s.k] : s.min }))
    .filter(s => s.v >= s.cut && (!s.ok || s.ok(p, t)))
    .sort((a, b) => margin(b) - margin(a)).slice(0, n)
    .sort((a, b) => STYLE_TIER[a.k] - STYLE_TIER[b.k] || margin(b) - margin(a));
}
// Bad habits: he leans into something (a tendency of +2 or more) his rating can't back up (under 10 of 20).
function badHabits(p) {
  const t = p.tendencies, r = k => +p.attributes?.[k]?.[0] || 0, out = [];
  if (!t) return out;
  const deep = t.threePoint >= 2 && r('TPT') < 10, mid = (t.twoPoint + t.fades) / 2 >= 2 && r('MID') < 10;
  if (deep && mid) out.push('has bad shot selection');
  else if (deep) out.push('forces shots from deep');
  else if (mid) out.push('settles for bad midrange shots');
  if ((t.cross + t.spin + t.step) / 3 >= 2 && r('DRB') < 10) out.push('dribbles the air out of the ball');
  // Goes inside a lot without the touch to finish there (a strong dunker never reads as hesitant).
  if (r('DNK') < 12 && ((t.dunk >= 2 && r('DNK') < 10) || (t.floater >= 2 && r('LAY') < 10) || ((t.post + t.hook) / 2 >= 2 && r('INS') < 10))) out.push('is hesitant under the basket');
  if (t.block >= 2 && r('BLK') < 10) out.push('bites on pump fakes');
  if ((t.stealOnBall + t.stealOffBall) / 2 >= 2 && r('STL') < 10) out.push((p.id || 0) % 2 ? 'gambles in the passing lanes' : 'gets called for reaching in');
  return out;
}
export const wontDo = p => (p.tendencies ? [...badHabits(p), ...WONT.filter(w => p.tendencies[w.k] <= w.max).map(w => w.text)] : []);
// A plain sentence for a report: no tags, just what he does.
export function styleSentence(p) {
  const t = p.tendencies;
  if (!t) return '';
  const does = playStyles(p, 3).map(x => x.text);
  const wont = wontDo(p).slice(0, 2);
  const list = a => (a.length < 3 ? a.join(' and ') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
  if (!does.length && !wont.length) return 'He has no strong lean in his game.';
  return [does.length ? `He ${list(does)}.` : '', wont.length ? `He ${list(wont)}.` : ''].filter(Boolean).join(' ');
}
// His game in two or three connected sentences, for a report: what he does on offense, then on defense or the glass
// (one compound sentence); then his skills (`skills`: the skill phrases he has earned, "has limitless range"), with
// what he won't do set against them by "but". No list runs past two items, so no "and ... and ... and".
const DEFENSE = new Set(['protector', 'pest', 'charge']), BOARDS = new Set(['glass']);
const pair = a => (a.length > 1 ? `${a[0]} and ${a[1]}` : a[0] || '');
// Every item: "a, b and c".
const list = a => (a.length > 2 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : pair(a));
// His best offensive rating as a phrase, for a player with no style that stands out on offense: what he'd be known for.
const TOOL = { TPT: 'can stretch the floor', MID: 'can hit the midrange shot', LAY: 'finishes around the basket', DNK: 'can throw it down', INS: 'scores inside', DRB: 'handles the ball well', PAS: 'moves the ball well' };
// Each rating against the league (how far above its average), so a big's ordinary three-point rating doesn't outrank the
// inside game he's known for; a tool his won't-do list contradicts (threes, dunks, passing) is skipped.
const CONTRA = { TPT: 'threePoint', DNK: 'dunk', PAS: 'pass' };
const bestTool = p => {
  const a = p.attributes || {}, t = p.tendencies || {}, m = REFS?.tools || {};
  const score = k => ((a[k]?.[0] || 0) - (m[k]?.mean ?? 10)) / (m[k]?.sd || 3);
  const k = Object.keys(TOOL).filter(x => a[x] && !(CONTRA[x] && (t[CONTRA[x]] ?? 0) <= -4)).sort((x, y) => score(y) - score(x))[0];
  return k ? TOOL[k] : '';
};
export function playRead(p, skills = []) {
  if (!p.tendencies) return '';
  const st = playStyles(p, 3);
  const off = st.filter(x => !DEFENSE.has(x.k) && !BOARDS.has(x.k)).slice(0, 2).map(x => x.text);
  // Nothing stands out on offense: his best offensive rating leads, so the glass, defense or an effort note never opens.
  if (!off.length && bestTool(p)) off.push(bestTool(p));
  const def = st.filter(x => DEFENSE.has(x.k) || BOARDS.has(x.k)).slice(0, 2);
  const defT = def.map(x => x.text);
  const wont = wontDo(p).slice(0, 3), sk = skills.filter(Boolean).slice(0, 4);   // his best four skills
  const out = [];
  let first = '';
  if (off.length && def.length) first = `He ${pair(off)}, and ${def.some(x => DEFENSE.has(x.k)) ? 'on defense he' : 'he'} ${pair(defT)}`;
  else if (off.length || def.length) first = `He ${pair(off.length ? off : defT)}`;
  else if (!sk.length) first = 'He has no strong lean in his game';
  const short = !(off.length && def.length);   // one clause so far: room for a "but"
  if (first && wont.length && !sk.length && short) { out.push(`${first}. However, he ${list(wont)}.`); return out.join(' '); }
  if (first) out.push(`${first}.`);
  if (sk.length && wont.length) out.push(`He ${list(sk)}. However, he ${list(wont)}.`);
  else if (sk.length) out.push(first ? `On top of that, he ${list(sk)}.` : `He ${list(sk)}.`);
  else if (wont.length) out.push(`However, he ${list(wont)}.`);
  return out.join(' ');
}

// One line for a scouting report: "Floor spacer: lives beyond the arc; won't post up."
export function styleLine(p) {
  const s = playStyles(p, 2), w = wontDo(p);
  if (!s.length && !w.length) return 'Balanced: no strong lean in his game.';
  const lead = s.length ? `${s.map(x => x.label).join(' · ')}: ${s.map(x => x.text).join(', ')}` : 'No real specialty';
  return `${lead}${w.length ? `; ${w.slice(0, 2).join(', ')}` : ''}.`;
}

// ---------------------------------------------------------------------------
// Where the team stands.
export function teamStanding(L, team) {
  const r = teamRecord(team);
  const rows = (team.season || []).filter(s => s.seasonStats?.GP > 0).slice(-3);
  const row = (team.season || []).find(s => s.yr === r.yr);
  const round = row?.round || 0, sw = row?.seriesWins || 0;
  const champ = round === 4 && sw === 4;
  const finish = champ ? '🏆 Won the title' : round === 4 ? 'Lost in the Finals' : round === 3 ? 'Lost in the conference finals'
    : round === 2 ? 'Lost in the second round' : round === 1 ? 'Lost in the first round' : 'Missed the playoffs';
  const trend = rows.map(s => ({ yr: s.yr, W: s.seasonStats.W, L: s.seasonStats.L, pct: s.seasonStats.W / Math.max(1, s.seasonStats.W + s.seasonStats.L) }));
  const status = teamStatus(L, team);
  return { ...r, status, tier: teamTier(L, team, status, r.pct, round), finish, champ, round, trend };
}

// Tiers, best to worst: Favorites, Contending, Competing, Developing, Selling,
// Rebuilding. The middle splits by age: a young core on the way up is
// Developing; an aging core that's slipping is Selling. A rebuilding team
// shopping its veterans is Selling too.
export const TIER_NAMES = { favorites: 'Favorites', contending: 'Contending', competing: 'Competing', developing: 'Developing', selling: 'Selling', rebuilding: 'Rebuilding' };
const W9 = [1, 0.95, 0.9, 0.8, 0.7, 0.55, 0.45, 0.35, 0.25];
const projOf = t => [...t.roster].map(p => levelOf(p) * (p.status === 4 ? 0.9 : 1)).sort((a, b) => b - a).slice(0, 9).reduce((a, v, i) => a + v * W9[i], 0);
// A rebuilding team with an 86+ veteran in the rumor mill (shopped on the block, or the kind contenders call about) is
// selling him off, the way a Competing team at the top of the league reads as a contender.
const shopping = (L, team) => team.roster.some(p => p.status !== 4 && !FA.isLifer(L, p, team) && p.age >= 28 && levelOf(p) >= 86 && (p.season?.onTradeBlock === 1 || p.age >= (p.regressionAge || 32) - 4));
function teamTier(L, team, status, pct, round) {
  const mine = projOf(team);
  const rank = 1 + L.teams.filter(t => t !== team && projOf(t) > mine).length;
  // The game now tags every team (0 Rebuilding, 1 Developing, 2 Competing,
  // 3 Contending). When it has, its tag leads; the app keeps two more steps:
  // Favorites above Contending, and Selling for an aging team in the middle.
  if (L.teams.some(t => (t.status || 0) > 0)) {
    const tag = team.status || 0;
    const age = [...team.roster].filter(p => p.status !== 4).sort((a, b) => levelOf(b) - levelOf(a)).slice(0, 5).reduce((a, p, _, l) => a + p.age / l.length, 0);
    if (tag >= 3) return rank <= 3 && (pct >= 0.6 || round >= 3) ? 'favorites' : 'contending';
    if (tag === 2) return age >= 29 && pct < 0.55 ? 'selling' : 'competing';
    if (tag === 1) return age >= 29 ? 'selling' : 'developing';
    return shopping(L, team) ? 'selling' : 'rebuilding';
  }
  if (rank <= 3 && (pct >= 0.6 || round >= 3)) return 'favorites';
  if (status === 'contending') return 'contending';
  if (status === 'rebuilding') return shopping(L, team) ? 'selling' : 'rebuilding';
  const top5 = [...team.roster].filter(p => p.status !== 4).sort((a, b) => levelOf(b) - levelOf(a)).slice(0, 5);
  const age = top5.reduce((a, p) => a + p.age, 0) / (top5.length || 1);
  return age >= 28 ? 'selling' : 'developing';
}

// ---------------------------------------------------------------------------
// The books: expiring deals, options due, extension candidates, restricted
// free agents, committed money and projected space. `level`/`worth` come
// from the app (regression-aware level, fair salary).
export function teamBooks(L, team, { level = levelOf, worth, qoEligible }) {
  const roster = team.roster;
  const expiring = roster.filter(p => p.status === 4 && !((p.contract?.ext?.yrs || 0) > 0)).map(p => ({ p, level: level(p), worth: worth(p), rfa: qoEligible(L, p) }))
    .sort((a, b) => b.level - a.level);
  const options = roster.filter(p => p.contract && (p.contract.yrs || 0) <= 1 && (p.contract.opt === 1 || p.contract.opt === 2) && p.status !== 4)
    .map(p => ({ p, kind: p.contract.opt === 1 ? 'team' : 'player', sal: p.contract.sal, worth: worth(p), level: level(p) })).sort((a, b) => b.level - a.level);
  const ext = roster.filter(p => p.status === 3 && (p.contract?.yrs || 0) === 1 && !(p.contract?.ext?.yrs > 0) && p.contract.canExt !== false && !options.some(o => o.p === p))
    .map(p => ({ p, level: level(p), sal: p.contract.sal, worth: worth(p) })).sort((a, b) => b.level - a.level);
  const committed = roster.filter(p => p.status === 3 && (p.contract?.yrs || 0) >= 1).reduce((a, p) => a + (p.contract.sal || 0), 0);
  const cap = FA.capLines(L).cap;
  return { expiring, options, ext, committed, cap, space: cap - committed };
}

// ---------------------------------------------------------------------------
// Roster needs: depth, starter quality, upside and age by position group,
// plus play-style holes. Looks at next season's roster (players under
// contract; options assumed picked up). Severity 1–3.
export function leagueCuts(L, level) {
  const lv = L.teams.flatMap(t => t.roster.filter(p => p.status !== 4).map(level)).sort((a, b) => b - a);
  const n = L.teams.length;
  // A starter is a 3.5-star player: level 79 or better.
  return { starter: 79, rotation: lv[n * 8 - 1] ?? 70 };
}
export function rosterNeeds(L, team, { level = levelOf, li = 0 } = {}) {
  const cuts = leagueCuts(L, level);
  const keep = team.roster.filter(p => p.status !== 4);
  const out = [];
  for (const g of Object.keys(GROUPS)) {
    const ps = keep.filter(p => groupOf(p) === g).sort((a, b) => level(b) - level(a));
    const rot = ps.filter(p => level(p) >= cuts.rotation);
    const best = ps[0];
    const young = ps.filter(p => p.age <= 24 && (p.pot || 0) >= 7);
    const old = rot.filter(p => p.age >= (p.regressionAge || 32) - 1);
    const name = GROUPS[g];
    const want = g === 'wings' ? 3 : 2;
    if (rot.length < want) out.push({ group: g, kind: 'Depth', sev: rot.length === 0 ? 3 : want - rot.length >= 2 ? 3 : 2,
      text: rot.length ? `Only ${rot.length} rotation-quality ${name.toLowerCase().slice(0, rot.length === 1 ? -1 : undefined)} signed for next season` : `No rotation-quality ${name.toLowerCase()} signed for next season` });
    if (!best || level(best) < cuts.starter) out.push({ group: g, kind: 'Starter', sev: !best || level(best) < cuts.rotation ? 3 : 2,
      text: best ? `No starting-caliber ${name.toLowerCase().slice(0, -1)}: ${playerName(best)} (Lv ${level(best)}) is your best` : `No ${name.toLowerCase()} on the roster` });
    if (!young.length) out.push({ group: g, kind: 'Upside', sev: 1, text: `No ${name.toLowerCase().slice(0, -1)} 24 or younger with Starter-level or better potential` });
    if (old.length && old.length >= Math.max(1, rot.length - 1)) out.push({ group: g, kind: 'Age', sev: old.length >= 2 ? 2 : 1,
      text: `${old.map(p => `${playerName(p)} (${p.age})`).join(', ')} ${old.length > 1 ? 'are' : 'is'} at the end of ${old.length > 1 ? 'their primes' : 'his prime'}` });
  }
  // Play style: what the likely rotation does (top 9 by level).
  const rot9 = [...keep].sort((a, b) => level(b) - level(a)).slice(0, 9);
  const has = k => rot9.filter(p => playStyles(p, 4).some(s => s.k === k));
  const style = (k, need, text, sev = 2) => { const n = has(k).length; if (n < need) out.push({ group: 'style', kind: 'Style', sev: n === 0 ? sev : 1, style: k, text }); };
  style('shooter', 2, has('shooter').length ? `Only ${playerName(has('shooter')[0])} spaces the floor` : 'Nobody in the rotation spaces the floor');
  style('rim', 1, 'Nobody attacks the rim', 2);
  style('playmaker', 1, 'No playmaker: nobody looks to set teammates up', 2);
  style('protector', 1, 'No rim protector', 2);
  style('glass', 1, 'Nobody crashes the boards', 1);
  return out.sort((a, b) => b.sev - a.sev);
}

// Team identity: the rotation's average lean on each slider.
export function teamIdentity(team, level = levelOf) {
  const rot = [...team.roster].filter(p => p.status !== 4 && p.tendencies).sort((a, b) => level(b) - level(a)).slice(0, 9);
  if (!rot.length) return [];
  return STYLES.map(s => ({ ...s, n: rot.filter(p => playStyles(p, 4).some(x => x.k === s.k)).length }))
    .sort((a, b) => b.n - a.n);
}

// ---------------------------------------------------------------------------
// Draft position before the lottery: each of the team's picks this year
// with its slot (or lottery odds).
export function draftPosition(L, team, format = 'auto') {
  const yr = L.season.currentYear;
  const setup = lotterySetup(L, format);
  const order = seedOrder(L).map(r => r.team);
  const odds = setup.lotteryTeams.length ? lotteryOdds(L, format, setup.draws, 4000, 7) : [];
  const r2 = standings(L).map(r => r.team);
  const n = L.teams.length;
  return team.draftPicks.filter(pk => pk.yr === draftYear(L)).sort((a, b) => a.rd - b.rd).map(pk => {
    const orig = L.teams.find(t => t.id === pk.otid) || team;
    if (pk.rd === 1) {
      const seed = order.indexOf(orig);
      const o = odds.find(x => x.team === orig);
      if (o) {
        const likely = o.pct.indexOf(Math.max(...o.pct)) + 1;
        const exp = o.pct.reduce((a, v, i) => a + v * (i + 1), 0) / 100;
        return { rd: 1, orig, seed: seed + 1, lottery: true, p1: o.pct[0], top4: o.pct.slice(0, 4).reduce((a, b) => a + b, 0), likely, exp, worst: o.pct.reduce((m, v, i) => (v > 0.05 ? i + 1 : m), likely) };
      }
      return { rd: 1, orig, seed: seed + 1, slot: seed + 1, lottery: false };
    }
    return { rd: 2, orig, slot: n + r2.indexOf(orig) + 1, lottery: false };
  });
}

// ---------------------------------------------------------------------------
// Rumor mill. Every team's direction, plus stars who might want out and
// veterans a rebuilding team might move. Stars on bad teams aren't unhappy
// by default: big minutes keep morale up; it's losing year after year,
// no co-star and a low mood that build the heat.
export function rumorMill(L, { level = levelOf, li = 0, skip = () => false } = {}) {
  const yr = lastYr(L);
  const out = [];
  for (const team of L.teams) {
    if (skip(team)) continue;
    const st = teamStanding(L, team);
    // A franchise lifer finishing his career at home isn't rumored anywhere.
    const roster = [...team.roster].filter(p => p.status !== 4 && !FA.isLifer(L, p, team)).sort((a, b) => level(b) - level(a));
    const star = roster[0], second = roster[1];
    if (!star) continue;
    const prime = star.age >= 24 && star.age < (star.regressionAge || 32);
    // Losing seasons in a row, from the team's whole history.
    const hist = (team.season || []).filter(s => s.yr <= yr && s.seasonStats?.GP > 0).sort((a, b) => b.yr - a.yr);
    let losing = 0;
    for (const s of hist) { if ((s.seasonStats.W || 0) >= (s.seasonStats.L || 0)) break; losing++; }
    const l = seasonLine(star, li, yr);
    const mpg = l?.mpg ?? 0;
    const morale = star.season?.morale ?? 70;
    // Disgruntled star.
    if (level(star) >= 80 && prime) {
      let heat = 0;
      const why = [];
      if (losing >= 2) { heat += 2; why.push(`${losing} losing seasons in a row`); } else if (losing === 1) { heat += 1; why.push('a losing season'); }
      if (st.round >= 1 && st.round <= 1 && !st.champ && st.status !== 'rebuilding' && st.trend.length >= 2 && st.trend.every(s => s.pct >= 0.5)) { heat += 1; why.push('another early playoff exit'); }
      if (!second || level(second) < level(star) - 8) { heat += 1.5; why.push('no co-star'); }
      if (st.tier === 'rebuilding' || st.tier === 'selling') { heat += 1; why.push('a team heading into a rebuild'); }
      if (morale < 40) { heat += 2; why.push('an unhappy star'); } else if (morale < 60) { heat += 1; why.push('his mood slipping'); }
      if (traitsSet(star)) {
        if (losing && tr(star, 'winning') >= 15) { heat += 1; why.push('wants to win now'); }
        if (tr(star, 'loyalty') >= 16) { heat -= 1.5; }
        if (tr(star, 'lockerRoom') <= 6) { heat += 1; why.push('a difficult locker room presence'); }
      }
      if (mpg >= 33) heat -= 1;      // the minutes keep him happy enough
      if (morale >= 85) heat -= 1;
      if (heat >= 3) out.push({ kind: 'star', p: star, team, heat: Math.min(3, Math.floor(heat / 1.5)), why, level: level(star), mpg, morale });
    }
    // The money: a team near the top of what its owner will spend has to shed a contract. How high that is depends on
    // where the team stands: a rebuilding or selling team shouldn't be anywhere near the tax, a team in the middle
    // near the top of the 1st apron, and a contender (whose owner pays to keep a winner together, up to the 2nd apron)
    // only near the 2nd apron. A 90+ player is the one they build around, never the one they sell (he only turns up
    // as a disgruntled star): the biggest contract after him is the one that could move.
    if (FA.capSystemOn()) {
      const C = FA.capLines(L), pay = FA.teamCommitted(team), near = 5;
      const tier = st.tier, contender = tier === 'favorites' || tier === 'contending', seller = tier === 'rebuilding' || tier === 'selling';
      const line = contender ? C.apron2 : seller ? C.tax : C.apron1;
      if (pay >= line - near) {
        const m = (v, s, at) => (v > 0 ? `$${v}M ${s}` : `right at ${at}`);
        const where = pay >= C.apron2 ? m(pay - C.apron2, 'over the 2nd apron', 'the 2nd apron') : pay >= C.apron2 - near ? m(C.apron2 - pay, 'from the 2nd apron', 'the 2nd apron')
          : pay >= C.apron1 ? m(pay - C.apron1, 'into the 1st apron', 'the 1st apron') : pay >= C.tax ? m(pay - C.tax, 'over the tax', 'the tax') : m(C.tax - pay, 'from the tax', 'the tax');
        const bill = pay > C.tax ? FA.taxBill(L, team) : 0;
        const why = [where, ...(bill ? [`a $${bill}M tax bill`] : []), ...(seller ? [`a ${tier} team`] : [])];
        // The one they build around: a good player (80+) under 33 who hasn't reached his decline age, the highest potential
        // first; on a tie a player 27 or younger, then the better one (Maxey over Brown and Edgecombe, Amen over Durant).
        // Two tied that way (same potential, both 27 or younger or both older) are a duo they build around together.
        const cands = roster.filter(p => level(p) >= 80 && p.age <= 32 && p.age < (p.regressionAge || 31))
          .sort((a, b) => (b.pot || 0) - (a.pot || 0) || (b.age <= 27) - (a.age <= 27) || level(b) - level(a));
        const core = cands[0] || null, duo = cands[1] && cands[1].pot === core.pot && (cands[1].age <= 27) === (core.age <= 27) ? cands[1] : null;
        const keep = core ? [core, ...(duo ? [duo] : [])] : null;
        // The one shopped: a real contract (15M+), never a young cornerstone.
        const big = [...roster].filter(p => !keep?.includes(p) && level(p) >= 74 && level(p) < 90 && (p.contract?.sal || 0) >= 15 && !(p.age <= 24 && (p.pot || 0) >= 9)).sort((a, b) => (b.contract?.sal || 0) - (a.contract?.sal || 0))[0];
        if (big) out.push({ kind: 'blowup', p: big, team, heat: seller || pay >= C.apron2 ? 2 : 1, why, level: level(big), morale: big.season?.morale ?? 70, bill, keep, seller });
      }
    }
    // Same duo, same result: two of its best three (84+, within 8 levels of each other) have gone out in the playoffs together three years running
    // without a title. Before their value slips, the team would move one to build around the other (the higher
    // potential, then the younger, is the one it keeps).
    {
      const top = roster.slice(0, 3).filter(p => level(p) >= 82);
      const runs = (team.season || []).filter(s => (s.round || 0) > 0 && (s.yr < L.season.currentYear || L.season.phase > 9)).sort((x, y) => y.yr - x.yr);
      const together = (p, yr) => (p.stats || []).some(x => x.league === li && x.yr === yr && (x.playoffs || []).some(r => r.tid === team.id));
      const streak = (a, b) => {
        let n = 0;
        for (const s of runs) {
          if (s.yr !== runs[0].yr - n) break;
          const champ = (s.round === 4 && s.seriesWins === 4) || team.championships?.yearsWon?.includes(s.yr);
          if (champ || !together(a, s.yr) || !together(b, s.yr)) break;
          n++;
        }
        return n;
      };
      const pairs = top.flatMap((a, i) => top.slice(i + 1).map(b => [a, b])).filter(([a, b]) => Math.min(level(a), level(b)) >= 84 && Math.abs(level(a) - level(b)) <= 8);   // a real duo, not a star and his sidekick
      const hit = runs[0] && runs[0].yr >= L.season.currentYear - 1 && pairs.map(([a, b]) => ({ a, b, n: streak(a, b) })).find(x => x.n >= 3);
      if (hit) {
        const [keep, move] = [hit.a, hit.b].sort((x, y) => (y.pot || 0) - (x.pot || 0) || x.age - y.age || level(y) - level(x));
        out.push({ kind: 'split', p: move, team, heat: 2, why: [], level: level(move), morale: move.season?.morale ?? 70, keep: [keep], pair: [hit.a, hit.b], years: hit.n });
      }
    }
    // Sell high: a team that isn't contending, a good player (78-89) a year or two from the age his game starts to
    // slip. His value won't be higher than it is now (more so when he's playing better than last season).
    if (st.tier !== 'favorites' && st.tier !== 'contending') {
      const sh = roster.filter(p => level(p) >= 78 && level(p) < 90 && !out.some(x => x.p === p) && p.age >= (p.regressionAge || 31) - 2 && p.age <= (p.regressionAge || 31))
        .sort((a, b) => level(b) - level(a))[0];
      if (sh) {
        const now = seasonLine(sh, li, L.season.currentYear), before = seasonLine(sh, li, L.season.currentYear - 1);
        const hot = now && before && now.gp >= 8 && now.ppg >= before.ppg + 2;
        out.push({ kind: 'sellhigh', p: sh, team, heat: hot ? 2 : 1, why: hot ? [`${now.ppg.toFixed(1)} a night, up from ${before.ppg.toFixed(1)}`] : [], level: level(sh), morale: sh.season?.morale ?? 70, hot });
      }
    }
    // Veterans a rebuilding (or sliding) team might move.
    if (st.status === 'rebuilding') {
      for (const p of roster.slice(0, 6)) {
        if (p === star && out.some(x => x.p === p)) continue;
        if (level(p) >= 79 && p.age >= (p.regressionAge || 32) - 4) out.push({ kind: 'vet', p, team, heat: level(p) >= 82 ? 2 : 1, why: [`${p.age} years old on a ${st.tier} team`], level: level(p), morale: p.season?.morale ?? 70 });
      }
      // Veterans it's shopping (the contracts it took on included) are on the market too.
      // Only names that would make headlines.
      for (const p of roster) if (p.season?.onTradeBlock === 1 && p.age >= 28 && level(p) >= 75 && (p.pot || 0) >= 8 && !out.some(x => x.p === p)) out.push({ kind: 'block', p, team, heat: 1, why: [], level: level(p), morale: p.season?.morale ?? 70 });
    }
  }
  // One rumor per team: its hottest.
  const seen = new Set();
  return out.sort((a, b) => b.heat - a.heat || b.level - a.level).filter(r => !seen.has(r.team) && seen.add(r.team));
}
export const statusOfAll = L => L.teams.map(t => ({ team: t, ...teamStanding(L, t) }));
