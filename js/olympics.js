// The Olympics: every four summers (2028, 2032, ...), twelve national teams, three groups of four, then an
// eight-team knockout for gold, silver and bronze. Pure logic: the app hands in the league's players (with a level
// function) and gets back rosters, results, box scores, medals and the stories. Nothing here touches the save.
import { mulberry32 } from './progression.js';
import { nameFor } from './names.js';

export const isOlympicYear = yr => yr >= 2028 && yr % 4 === 0;

// Hosts: the real ones, then a rotation.
const HOSTS = { 2028: ['US', 'Los Angeles'], 2032: ['AU', 'Brisbane'] };
const ROTATION = [['ES', 'Madrid'], ['DE', 'Berlin'], ['JP', 'Osaka'], ['FR', 'Lyon'], ['IT', 'Milan'], ['CA', 'Toronto'], ['TR', 'Istanbul'], ['BR', 'Rio de Janeiro'], ['US', 'Chicago'], ['GR', 'Athens']];
export const hostOf = yr => HOSTS[yr] || ROTATION[((yr - 2036) / 4) % ROTATION.length | 0];

// Who can field a team, their three-letter code, and how good their best player outside the league is (on the
// app's level scale, where the league's 100th best player is about an 82).
export const NATIONS = {
  US: ['USA', 'United States', 76], CA: ['CAN', 'Canada', 74], FR: ['FRA', 'France', 80], RS: ['SRB', 'Serbia', 82], ES: ['ESP', 'Spain', 82],
  DE: ['GER', 'Germany', 79], GR: ['GRE', 'Greece', 80], AU: ['AUS', 'Australia', 77], LT: ['LTU', 'Lithuania', 79], SI: ['SLO', 'Slovenia', 76],
  TR: ['TUR', 'Turkey', 79], IT: ['ITA', 'Italy', 78], AR: ['ARG', 'Argentina', 76], BR: ['BRA', 'Brazil', 75], PR: ['PUR', 'Puerto Rico', 72],
  NG: ['NGR', 'Nigeria', 72], SS: ['SSD', 'South Sudan', 71], JP: ['JPN', 'Japan', 71], LV: ['LAT', 'Latvia', 75], HR: ['CRO', 'Croatia', 75],
  ME: ['MNE', 'Montenegro', 75], DO: ['DOM', 'Dominican Republic', 72], NZ: ['NZL', 'New Zealand', 72], SN: ['SEN', 'Senegal', 71],
  CN: ['CHN', 'China', 71], PL: ['POL', 'Poland', 73], FI: ['FIN', 'Finland', 73], GE: ['GEO', 'Georgia', 73], CZ: ['CZE', 'Czechia', 73],
  MX: ['MEX', 'Mexico', 70], PH: ['PHI', 'Philippines', 70], BS: ['BAH', 'Bahamas', 66], CM: ['CMR', 'Cameroon', 69], IL: ['ISR', 'Israel', 73],
  BE: ['BEL', 'Belgium', 72], UK: ['GBR', 'Great Britain', 71], VE: ['VEN', 'Venezuela', 70], JM: ['JAM', 'Jamaica', 64], UA: ['UKR', 'Ukraine', 72],
};
export const code = c => NATIONS[c]?.[0] || c;
export const nation = c => NATIONS[c]?.[1] || c;
const SQUAD = 12;
const grp = pos => (pos <= 2 ? 'g' : pos >= 6 ? 'b' : 'w');   // guards, wings, bigs

// The pool: the league's players by country (not retired, 39 or younger). `level(p)` is the app's shown level.
function pools(players, level) {
  const by = {};
  for (const p of players) {
    const c = p.ctry === 'GB' ? 'UK' : p.ctry;
    if (!NATIONS[c] || p.age > 39) continue;
    (by[c] ||= []).push({ p, lv: level(p) });
  }
  for (const c of Object.keys(by)) by[c].sort((a, b) => b.lv - a.lv);
  return by;
}

// Who says no: stars past 33 often rest, the injured can't go, and a few just want the summer off. `mine(p)`:
// your players (you can keep one home yourself; the app passes those in `home`).
function withdrawal(rng, p, lv) {
  if ((p.season?.injury?.gamesOut || 0) > 0) return 'injured';
  const r = rng();
  if (p.age >= 34) return r < 0.45 ? 'resting at his age' : null;
  if (p.age >= 31) return r < 0.22 ? 'resting after a long season' : null;
  return r < (lv >= 95 ? 0.05 : 0.07) ? 'taking the summer off' : null;   // stars rarely pass on it
}

// A national team: the federation picks the best twelve it can, keeping a balance of guards, wings and bigs (never
// more than five of one kind), with a nod to players who were there last time. `edits`: { add: [pid], drop: [pid] }
// from you; `home`: pids you kept home.
function selectTeam(c, pool, rng, prev, edits = {}, home = new Set()) {
  const withdrew = [], open = [];
  for (const x of pool) {
    const why = home.has(x.p.id) ? 'kept home by his team' : withdrawal(rng, x.p, x.lv);
    if (why && !(edits.add || []).includes(x.p.id)) withdrew.push({ ...x, why }); else open.push(x);
  }
  const drop = new Set(edits.drop || []), forced = (edits.add || []).map(id => open.find(x => x.p.id === id)).filter(Boolean);
  const loyal = x => (prev?.has(x.p.id) ? 1.5 : 0);
  const cands = open.filter(x => !drop.has(x.p.id)).map(x => ({ ...x, v: x.lv + loyal(x) + (rng() - 0.5) * 1.5 })).sort((a, b) => b.v - a.v);
  const picked = [...forced], count = k => picked.filter(x => grp(x.p.pos) === k).length;
  for (const x of cands) {
    if (picked.length >= SQUAD) break;
    if (picked.includes(x) || picked.some(y => y.p.id === x.p.id)) continue;
    if (count(grp(x.p.pos)) >= 5) continue;
    // Keep room for at least three guards and three bigs.
    const left = SQUAD - picked.length, need = ['g', 'b'].reduce((a, k) => a + Math.max(0, 3 - count(k)), 0);
    if (left <= need && !['g', 'b'].some(k => grp(x.p.pos) === k && count(k) < 3)) continue;
    picked.push(x);
  }
  // Snubs: the best players left off who were good enough to argue about (within a few levels of the last one in).
  const last = Math.min(...picked.map(x => x.lv));
  const snubs = cands.filter(x => !picked.some(y => y.p.id === x.p.id) && !drop.has(x.p.id) && x.lv >= last - 3).slice(0, 4)
    .map(x => ({ ...x, why: count(grp(x.p.pos)) >= 5 ? `too many ${({ g: 'guards', w: 'wings', b: 'bigs' })[grp(x.p.pos)]} ahead of him` : prev?.size && picked.some(y => prev.has(y.p.id) && y.lv < x.lv) ? 'the federation went with experience' : 'just missed the cut' }));
  const dropped = open.filter(x => drop.has(x.p.id));
  // Only the withdrawals people would notice: anyone who'd have been in the conversation for a spot.
  const notable = withdrew.filter(x => pool.length <= SQUAD || x.lv >= last - 4);
  return { picked, withdrew: notable, snubs: [...dropped.map(x => ({ ...x, why: 'left off by you' })), ...snubs], eligible: open };
}

// Fill a roster to twelve with players from that country's own league (named, no save record).
function fillers(c, n, rng, used, posNeed) {
  const base = NATIONS[c][2], out = [];
  for (let i = 0; i < n; i++) {
    const nm = nameFor(rng, c, used) || { fn: 'Overseas', ln: `Pro ${i + 1}` };
    used.add(`${nm.fn} ${nm.ln}`.toLowerCase());
    const pos = posNeed[i % posNeed.length];
    out.push({ ext: true, fn: nm.fn, ln: nm.ln, pos, age: 22 + Math.floor(rng() * 12), lv: Math.round(base - i * 1.4 + (rng() - 0.5) * 4) });
  }
  return out;
}

// Team strength: the top nine, weighted toward the stars, plus continuity for teams that play together every summer
// (everyone but the US) and the home crowd.
const W = [1, 0.95, 0.9, 0.8, 0.7, 0.55, 0.45, 0.35, 0.25];
export function strength(roster, c, host) {
  const lv = roster.map(x => x.lv).sort((a, b) => b - a);
  const s = W.reduce((a, w, i) => a + w * (lv[i] ?? 60), 0) / W.reduce((a, w) => a + w, 0);
  return s + (c === 'US' ? 0 : 2) + (c === host ? 1.5 : 0);
}

// Build the field: rosters for every nation, then the host plus the eleven strongest.
export function buildField({ yr, players, level, prevIds = {}, edits = {}, home = [], seed }) {
  const rng = mulberry32(seed ^ 0x0717c);
  const [host, city] = hostOf(yr), by = pools(players, level), homeSet = new Set(home);
  const used = new Set(players.map(p => `${p.fn} ${p.ln}`.toLowerCase()));
  const teams = Object.keys(NATIONS).map(c => {
    const sel = selectTeam(c, by[c] || [], rng, new Set(prevIds[c] || []), edits[c], homeSet);
    const roster = sel.picked.map(x => ({ pid: x.p.id, fn: x.p.fn, ln: x.p.ln, pos: x.p.pos, age: x.p.age, lv: x.lv, tid: x.p.tid }));
    // The best of the country's own league are in the running too: a fringe league player doesn't beat a better pro
    // from home (unless you added him).
    const added = new Set(edits[c]?.add || []);
    const home = fillers(c, Math.max(SQUAD - roster.length, 6), rng, used, [1, 4, 7, 2, 5, 8]);
    const pool2 = [...roster, ...home].sort((a, b) => (added.has(b.pid) - added.has(a.pid)) || b.lv - a.lv);
    const cut = pool2.slice(SQUAD).filter(x => x.pid != null);
    roster.length = 0; roster.push(...pool2.slice(0, SQUAD).sort((a, b) => b.lv - a.lv));
    sel.snubs.unshift(...cut.slice(0, 2).map(x => ({ p: { id: x.pid }, lv: x.lv, why: 'beaten out by a pro from home' })));
    return { c, roster, withdrew: sel.withdrew.map(x => ({ pid: x.p.id, lv: x.lv, why: x.why })), snubs: sel.snubs.map(x => ({ pid: x.p.id, lv: x.lv, why: x.why })),
      eligible: sel.eligible.map(x => x.p.id), str: +strength(roster, c, host).toFixed(1) };
  }).sort((a, b) => b.str - a.str);
  const field = [teams.find(t => t.c === host), ...teams.filter(t => t.c !== host).slice(0, 11)].filter(Boolean).sort((a, b) => b.str - a.str);
  // Groups by pots (snake): A gets 1, 6, 7, 12; B 2, 5, 8, 11; C 3, 4, 9, 10.
  const order = [[0, 5, 6, 11], [1, 4, 7, 10], [2, 3, 8, 9]];
  const groups = order.map(ix => ix.map(i => field[i].c));
  return { yr, host, city, field, groups, out: teams.filter(t => !field.includes(t)).slice(0, 4).map(t => t.c) };
}

// One game: a margin from the strength gap, FIBA scoring (40 minutes, about 85 a side), box scores for both teams.
function playGame(rng, A, B, stage) {
  const edge = ((A.str + (A.heat || 0)) - (B.str + (B.heat || 0))) * 0.65, margin = edge + (rng() + rng() + rng() + rng() - 2) * 12;
  const total = 166 + (rng() - 0.5) * 24;
  let sa = Math.round((total + margin) / 2), sb = Math.round((total - margin) / 2);
  let ot = 0;
  while (sa === sb) { ot++; sa += 6 + Math.floor(rng() * 7); sb += 6 + Math.floor(rng() * 7); }
  return { stage, a: A.c, b: B.c, sa, sb, ot, box: [box(rng, A, sa), box(rng, B, sb)] };
}
const MIN = [30, 28, 27, 25, 24, 21, 18, 15, 12, 10, 6, 4];
function box(rng, T, pts) {
  const rows = T.roster.map((x, i) => ({ x, min: Math.max(0, Math.round(MIN[i] + (rng() - 0.5) * 6)) }));
  // Shares of the scoring by minutes and level, no one over about 30% (FIBA games spread it around).
  // A hero on a heater takes a much bigger share (up to about 40%).
  const isHero = r => T.hero != null && (r.x.pid ?? `${r.x.fn} ${r.x.ln}`) === T.hero;
  let w = rows.map(r => r.min * Math.pow(Math.max(40, r.x.lv) / 80, 3) * (0.6 + rng() * 0.8) * (isHero(r) ? 1.8 : 1));
  for (let k = 0; k < 3; k++) { const sw = w.reduce((a, b) => a + b, 0) || 1; w = w.map((v, i) => Math.min(v, sw * (isHero(rows[i]) ? 0.42 : 0.3))); }
  const sw = w.reduce((a, b) => a + b, 0) || 1;
  const pts0 = w.map(v => Math.floor(pts * v / sw));
  let left = pts - pts0.reduce((a, b) => a + b, 0);
  for (let i = 0; left > 0; i = (i + 1) % rows.length) if (rows[i].min > 0) { pts0[i]++; left--; }
  const out = rows.map((r, i) => {
    const p = pts0[i];
    const g = grp(r.x.pos), m = r.min / 30;
    return { k: r.x.pid ?? `${r.x.fn} ${r.x.ln}`, min: r.min, pts: p,
      reb: Math.round(m * (g === 'b' ? 7 : g === 'w' ? 4.5 : 3) * (0.5 + rng())), ast: Math.round(m * (g === 'g' ? 5 : g === 'w' ? 2.5 : 1.5) * (0.5 + rng())) };
  });
  return out;
}

// The whole tournament.
export function runGames(F, seed) {
  const rng = mulberry32(seed ^ 0x601d), games = [];
  const T = Object.fromEntries(F.field.map(t => [t.c, { ...t, heat: 0, hero: null }]));
  // Usually the most talented team wins. Now and then (about one Games in six) a team outside the top three rides
  // its captain on a heater: he's worth a few extra points a night and takes over the scoring.
  const ranked0 = [...F.field].sort((a, b) => b.str - a.str);
  let hero = null;
  if (rng() < 0.17) {
    const can = ranked0.slice(3).filter(t => t.roster[0] && t.roster[0].lv >= 86);
    const t = can[Math.floor(rng() * can.length)];
    if (t) { const x = t.roster[0]; hero = { c: t.c, k: x.pid ?? `${x.fn} ${x.ln}` }; T[t.c].hero = hero.k; T[t.c].heat = 3.5 + rng() * 2.5; }
  }
  const table = {};
  F.groups.forEach((g, gi) => {
    for (const c of g) table[c] = { c, g: gi, w: 0, l: 0, pf: 0, pa: 0 };
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      const G = playGame(rng, T[g[i]], T[g[j]], `Group ${'ABC'[gi]}`);
      games.push(G);
      const [wa, wb] = G.sa > G.sb ? [table[G.a], table[G.b]] : [table[G.b], table[G.a]];
      wa.w++; wb.l++;
      table[G.a].pf += G.sa; table[G.a].pa += G.sb; table[G.b].pf += G.sb; table[G.b].pa += G.sa;
    }
  });
  const rank = a => a.sort((x, y) => y.w - x.w || (y.pf - y.pa) - (x.pf - x.pa));
  const standings = F.groups.map(g => rank(g.map(c => table[c])));
  // Quarterfinals: the top two of each group and the two best thirds, seeded 1 v 8, 2 v 7, 3 v 6, 4 v 5.
  const firsts = rank(standings.map(s => s[0])), seconds = rank(standings.map(s => s[1])), thirds = rank(standings.map(s => s[2])).slice(0, 2);
  const seeds = [...firsts, ...seconds, ...thirds].map(x => x.c);
  const win = G => (G.sa > G.sb ? G.a : G.b), lose = G => (G.sa > G.sb ? G.b : G.a);
  const qf = [[0, 7], [3, 4], [1, 6], [2, 5]].map(([i, j]) => playGame(rng, T[seeds[i]], T[seeds[j]], 'Quarterfinal'));
  const sf = [playGame(rng, T[win(qf[0])], T[win(qf[1])], 'Semifinal'), playGame(rng, T[win(qf[2])], T[win(qf[3])], 'Semifinal')];
  const bronze = playGame(rng, T[lose(sf[0])], T[lose(sf[1])], 'Bronze Medal Game');
  const gold = playGame(rng, T[win(sf[0])], T[win(sf[1])], 'Gold Medal Game');
  games.push(...qf, ...sf, bronze, gold);
  const medals = { gold: win(gold), silver: lose(gold), bronze: win(bronze), fourth: lose(bronze) };
  // Tournament lines, the MVP (from the medal teams, best line) and the All-Star Five.
  const lines = new Map();
  for (const G of games) G.box.forEach((b, side) => { const c = side ? G.b : G.a; for (const r of b) {
    const L = lines.get(r.k) || lines.set(r.k, { k: r.k, c, gp: 0, pts: 0, reb: 0, ast: 0, min: 0 }).get(r.k);
    if (r.min > 0) L.gp++;
    L.pts += r.pts; L.reb += r.reb; L.ast += r.ast; L.min += r.min;
  } });
  const val = L => (L.pts + L.reb * 0.8 + L.ast * 1.1) / Math.max(1, L.gp);
  const all = [...lines.values()].filter(L => L.gp >= 3);
  const weight = L => val(L) * (L.c === medals.gold ? 1.25 : L.c === medals.silver ? 1.1 : L.c === medals.bronze ? 1.05 : 0.9);
  const ranked = all.sort((a, b) => weight(b) - weight(a));
  const mvp = ranked.find(L => [medals.gold, medals.silver].includes(L.c)) || ranked[0];
  return { hero, games, standings: standings.map(s => s.map(x => ({ ...x }))), seeds, medals, mvp: mvp?.k ?? null, allStar: ranked.slice(0, 5).map(L => L.k), lines: Object.fromEntries([...lines.values()].map(L => [L.k, L])) };
}

// ---- The logo: five pixel rings (blue, black, red over yellow, green), interlocked, on a white badge.
const RING = ['...####...', '.##....##.', '.#......#.', '#........#', '#........#', '#........#', '#........#', '.#......#.', '.##....##.', '...####...'];
const RINGS = [[0, 0, '#0b5fb4'], [12, 0, '#111111'], [24, 0, '#e8202a'], [6, 5, '#f2c400'], [18, 5, '#0d9b3f']];
export function logoSvg(size = 40) {
  const W0 = 34, H0 = 15, px = {};
  RINGS.forEach(([ox, oy, col], ri) => RING.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '#') return;
    const k = `${ox + x},${oy + y}`, prev = px[k];
    // Where a top ring and a bottom ring cross: the top ring is in front at the upper crossing, behind at the lower.
    if (prev != null && ri >= 3) { const top = oy + y < 7; if (top) return; }
    px[k] = col;
  })));
  const rects = Object.entries(px).map(([k, col]) => { const [x, y] = k.split(','); return `<rect x="${+x + 2}" y="${+y + 2}" width="1" height="1" fill="${col}"/>`; }).join('');
  return `<svg class="oly-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W0 + 4} ${H0 + 4}" width="${size}" height="${size * (H0 + 4) / (W0 + 4)}" shape-rendering="crispEdges" role="img" aria-label="Olympics"><rect x="0" y="0" width="${W0 + 4}" height="${H0 + 4}" rx="2" fill="#fff"/>${rects}</svg>`;
}
