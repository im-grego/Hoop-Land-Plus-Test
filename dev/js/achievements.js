// Career achievements: the marks a career player hits that pay Career Tokens. The tokens live only in the app (like
// Franchise Tokens): earned here, spent in the Training Center, never written to the save.
// Three kinds:
//   badges: one-time unlocks (a 50-point game, a quadruple-double, 10,000 career points). Each pays once.
//   season marks: every season it happens (All-Star, MVP, a 25 ppg season). Each season pays again.
//   counts: every triple-double and every game-winner pays a token.
// What the save holds: career single-game highs (careerStats.seasonHighs), career totals (careerStats.season), the last
// game's box (gameStats), the season rows (stats) and the awards. Combined lines the game doesn't keep (a
// quadruple-double, a 5x5) are caught from the last game's box and the app's game log, so they're seen once they happen.
// Kept free of the app so Franchise mode can get its own list later on the same shape.

const AW = { champ: 0, fmvp: 1, mvp: 2, dpoy: 3, roy: 4, allLeague: 13, allStar: 101 };

// A single game: tens in four of points, rebounds, assists, steals, blocks; fives in all five.
export const isQuad = r => [r.PTS, r.REB, r.AST, r.STL, r.BLK].filter(v => (v || 0) >= 10).length >= 4;
export const isFive = r => [r.PTS, r.REB, r.AST, r.STL, r.BLK].every(v => (v || 0) >= 5);

const hi = (k, n) => x => (x.hi[k] || 0) >= n;
const tot = (k, n) => x => (x.tot[k] || 0) >= n;
const anySeason = f => x => x.seasons.some(f);
const won = (id, n = 1) => x => (x.awards[id]?.length || 0) >= n;
const pct = (m, a) => (a ? m / a : 0);

// group, id, icon, name, says, tok, test(ctx)
export const BADGES = [
  { group: 'Big Nights', id: 'pts30', icon: '🔥', name: '30-Piece', says: 'Score 30 in a game', tok: 2, test: hi('PTS', 30) },
  { group: 'Big Nights', id: 'pts40', icon: '🔥', name: '40 Burger', says: 'Score 40 in a game', tok: 4, test: hi('PTS', 40) },
  { group: 'Big Nights', id: 'pts50', icon: '💥', name: 'Half a Hundred', says: 'Score 50 in a game', tok: 8, test: hi('PTS', 50) },
  { group: 'Big Nights', id: 'pts60', icon: '☄️', name: 'Sixty', says: 'Score 60 in a game', tok: 15, test: hi('PTS', 60) },
  { group: 'Big Nights', id: 'pts70', icon: '🌋', name: 'Seventy', says: 'Score 70 in a game', tok: 25, test: hi('PTS', 70) },
  { group: 'Big Nights', id: 'tpm8', icon: '🎯', name: 'Splash Night', says: 'Make 8 threes in a game', tok: 3, test: hi('TPM', 8) },
  { group: 'Big Nights', id: 'tpm12', icon: '🎯', name: 'Can\'t Miss', says: 'Make 12 threes in a game', tok: 10, test: hi('TPM', 12) },
  { group: 'Big Nights', id: 'reb20', icon: '🧲', name: 'Glass Eater', says: 'Grab 20 rebounds in a game', tok: 4, test: hi('REB', 20) },
  { group: 'Big Nights', id: 'reb25', icon: '🧲', name: 'Every Board', says: 'Grab 25 rebounds in a game', tok: 8, test: hi('REB', 25) },
  { group: 'Big Nights', id: 'ast15', icon: '🪄', name: 'Dime Dropper', says: 'Hand out 15 assists in a game', tok: 4, test: hi('AST', 15) },
  { group: 'Big Nights', id: 'ast20', icon: '🪄', name: 'Point God', says: 'Hand out 20 assists in a game', tok: 8, test: hi('AST', 20) },
  { group: 'Big Nights', id: 'blk5', icon: '✋', name: 'Not in My House', says: 'Block 5 shots in a game', tok: 3, test: hi('BLK', 5) },
  { group: 'Big Nights', id: 'blk10', icon: '✋', name: 'Swat Team', says: 'Block 10 shots in a game', tok: 10, test: hi('BLK', 10) },
  { group: 'Big Nights', id: 'stl5', icon: '🫳', name: 'Pickpocket', says: 'Get 5 steals in a game', tok: 3, test: hi('STL', 5) },
  { group: 'Big Nights', id: 'stl8', icon: '🫳', name: 'Highway Robbery', says: 'Get 8 steals in a game', tok: 8, test: hi('STL', 8) },
  { group: 'Big Nights', id: 'dd', icon: '✌️', name: 'Double-Double', says: 'Your first double-double', tok: 1, test: tot('DD', 1) },
  { group: 'Big Nights', id: 'td', icon: '🔺', name: 'Triple-Double', says: 'Your first triple-double', tok: 3, test: tot('TD', 1) },
  { group: 'Big Nights', id: 'qd', icon: '💎', name: 'Quadruple-Double', says: 'Tens in four of points, rebounds, assists, steals and blocks', tok: 20, test: x => !!x.flags.qd },
  { group: 'Big Nights', id: 'five', icon: '🖐️', name: 'Five by Five', says: 'Five or more points, rebounds, assists, steals and blocks in one game', tok: 10, test: x => !!x.flags.five },
  { group: 'Big Nights', id: 'gw', icon: '⏱️', name: 'Ice in His Veins', says: 'Your first game-winner', tok: 3, test: tot('GW', 1) },

  { group: 'Seasons', id: 'ppg20', icon: '📈', name: '20 a Night', says: 'Average 20 points over a season', tok: 5, test: anySeason(s => s.ppg >= 20) },
  { group: 'Seasons', id: 'ppg25', icon: '📈', name: '25 a Night', says: 'Average 25 points over a season', tok: 8, test: anySeason(s => s.ppg >= 25) },
  { group: 'Seasons', id: 'ppg30', icon: '📈', name: '30 a Night', says: 'Average 30 points over a season', tok: 12, test: anySeason(s => s.ppg >= 30) },
  { group: 'Seasons', id: 'rpg12', icon: '🧲', name: 'Rebounding Machine', says: 'Average 12 rebounds over a season', tok: 6, test: anySeason(s => s.rpg >= 12) },
  { group: 'Seasons', id: 'apg10', icon: '🪄', name: 'Floor General', says: 'Average 10 assists over a season', tok: 6, test: anySeason(s => s.apg >= 10) },
  { group: 'Seasons', id: 'tdavg', icon: '🔺', name: 'Triple-Double Season', says: 'Average a triple-double over a season', tok: 20, test: anySeason(s => s.ppg >= 10 && s.rpg >= 10 && s.apg >= 10) },
  { group: 'Seasons', id: 'club', icon: '🎯', name: '50-40-90', says: '50% from the field, 40% from three, 90% at the line over a season (enough shots of each)', tok: 12,
    test: anySeason(s => s.fga >= 300 && s.tpa >= 82 && s.fta >= 125 && s.fg >= 0.5 && s.tp >= 0.4 && s.ft >= 0.9) },
  { group: 'Seasons', id: 'roy', icon: '🐣', name: 'Rookie of the Year', says: 'Win Rookie of the Year', tok: 5, test: won(AW.roy) },
  { group: 'Seasons', id: 'allstar', icon: '🌟', name: 'All-Star', says: 'Make your first All-Star team', tok: 5, test: won(AW.allStar) },
  { group: 'Seasons', id: 'allleague', icon: '📜', name: 'All-League', says: 'Make your first All-League team', tok: 8, test: won(AW.allLeague) },
  { group: 'Seasons', id: 'dpoy', icon: '🛡️', name: 'Lockdown', says: 'Win Defensive Player of the Year', tok: 10, test: won(AW.dpoy) },
  { group: 'Seasons', id: 'mvp', icon: '🏅', name: 'Most Valuable', says: 'Win MVP', tok: 15, test: won(AW.mvp) },
  { group: 'Seasons', id: 'champ', icon: '🏆', name: 'Champion', says: 'Win a title', tok: 10, test: won(AW.champ) },
  { group: 'Seasons', id: 'fmvp', icon: '🥇', name: 'Finals MVP', says: 'Win Finals MVP', tok: 15, test: won(AW.fmvp) },

  { group: 'Career', id: 'c1k', icon: '🏀', name: '1,000 Points', says: '1,000 career points', tok: 2, test: tot('PTS', 1000) },
  { group: 'Career', id: 'c5k', icon: '🏀', name: '5,000 Points', says: '5,000 career points', tok: 5, test: tot('PTS', 5000) },
  { group: 'Career', id: 'c10k', icon: '🏀', name: '10,000 Points', says: '10,000 career points', tok: 10, test: tot('PTS', 10000) },
  { group: 'Career', id: 'c20k', icon: '🏀', name: '20,000 Points', says: '20,000 career points', tok: 20, test: tot('PTS', 20000) },
  { group: 'Career', id: 'c30k', icon: '👑', name: '30,000 Points', says: '30,000 career points', tok: 30, test: tot('PTS', 30000) },
  { group: 'Career', id: 'creb', icon: '🧲', name: '5,000 Rebounds', says: '5,000 career rebounds', tok: 8, test: tot('REB', 5000) },
  { group: 'Career', id: 'cast', icon: '🪄', name: '5,000 Assists', says: '5,000 career assists', tok: 8, test: tot('AST', 5000) },
  { group: 'Career', id: 'cstl', icon: '🫳', name: '1,000 Steals', says: '1,000 career steals', tok: 8, test: tot('STL', 1000) },
  { group: 'Career', id: 'cblk', icon: '✋', name: '1,000 Blocks', says: '1,000 career blocks', tok: 8, test: tot('BLK', 1000) },
  { group: 'Career', id: 'ctpm', icon: '🎯', name: '1,000 Threes', says: '1,000 career threes', tok: 8, test: tot('TPM', 1000) },
  { group: 'Career', id: 'ctd10', icon: '🔺', name: 'Triple-Double Machine', says: '10 career triple-doubles', tok: 5, test: tot('TD', 10) },
  { group: 'Career', id: 'ctd50', icon: '🔺', name: 'Triple-Double King', says: '50 career triple-doubles', tok: 15, test: tot('TD', 50) },
  { group: 'Career', id: 'gp500', icon: '🗓️', name: 'Iron Man', says: '500 games played', tok: 5, test: tot('GP', 500) },
  { group: 'Career', id: 'gp1000', icon: '🗓️', name: 'Thousand Games', says: '1,000 games played', tok: 12, test: tot('GP', 1000) },
  { group: 'Career', id: 'yrs10', icon: '🎖️', name: 'Decade', says: 'Play 10 seasons', tok: 8, test: x => x.seasons.length >= 10 },
  { group: 'Career', id: 'yrs15', icon: '🎖️', name: 'Ageless', says: 'Play 15 seasons', tok: 15, test: x => x.seasons.length >= 15 },
  { group: 'Career', id: 'loyal', icon: '🤝', name: 'Franchise Player', says: '10 seasons with one team', tok: 10, test: x => x.mostWithOne >= 10 },
  { group: 'Career', id: 'rings3', icon: '🏆', name: 'Three-Peat Material', says: 'Win 3 titles', tok: 15, test: won(AW.champ, 3) },
  { group: 'Career', id: 'mvp3', icon: '🏅', name: 'Three-Time MVP', says: 'Win MVP 3 times', tok: 25, test: won(AW.mvp, 3) },
];
export const GROUPS = ['Big Nights', 'Seasons', 'Career'];

// Every season it happens: key per season, so it pays once that season.
export const MARKS = [
  { id: 'allStar', icon: '🌟', name: 'All-Star selection', tok: 3, award: AW.allStar },
  { id: 'allLeague', icon: '📜', name: 'All-League team', tok: 5, award: AW.allLeague },
  { id: 'dpoy', icon: '🛡️', name: 'Defensive Player of the Year', tok: 6, award: AW.dpoy },
  { id: 'mvp', icon: '🏅', name: 'MVP', tok: 10, award: AW.mvp },
  { id: 'champ', icon: '🏆', name: 'Title', tok: 8, award: AW.champ },
  { id: 'fmvp', icon: '🥇', name: 'Finals MVP', tok: 8, award: AW.fmvp },
  { id: 'ppg25', icon: '📈', name: '25 ppg season', tok: 3, season: s => s.ppg >= 25 },
];
// Every one of these pays a token.
export const COUNTS = [
  { id: 'TD', icon: '🔺', name: 'Triple-double', tok: 1 },
  { id: 'GW', icon: '⏱️', name: 'Game-winner', tok: 1 },
];

// Season lines from the save's stats rows: [{ yr, gp, ppg, rpg, apg, fg, tp, ft, fga, tpa, fta, tids }].
export function seasonLines(p, leagueIdx, done) {
  const out = [];
  for (const s of p.stats || []) {
    if (s.league !== leagueIdx || !done(s.yr)) continue;
    const rows = (s.season || []).filter(r => r.GP > 0);
    if (!rows.length) continue;
    const t = k => rows.reduce((a, r) => a + (r[k] || 0), 0), gp = t('GP');
    out.push({ yr: s.yr, gp, ppg: t('PTS') / gp, rpg: t('REB') / gp, apg: t('AST') / gp, fg: pct(t('FGM'), t('FGA')), tp: pct(t('TPM'), t('TPA')), ft: pct(t('FTM'), t('FTA')),
      fga: t('FGA'), tpa: t('TPA'), fta: t('FTA'), tids: rows.map(r => r.tid) });
  }
  return out.sort((a, b) => a.yr - b.yr);
}
// The most seasons he's spent with one team.
function mostWithOne(seasons) { const n = {}; for (const s of seasons) for (const t of new Set(s.tids)) n[t] = (n[t] || 0) + 1; return Math.max(0, ...Object.values(n)); }

// ctx for the tests. flags: combined lines seen in single games ({ qd: yr, five: yr }).
export function context(p, leagueIdx, done, flags = {}) {
  const seasons = seasonLines(p, leagueIdx, done), awards = {};
  for (const a of p.awards || []) if ((a.league ?? 0) === leagueIdx) (awards[a.id] ||= []).push(...(a.yearsWon || []));
  return { hi: p.careerStats?.seasonHighs || {}, tot: p.careerStats?.season || {}, seasons, awards, flags, mostWithOne: mostWithOne(seasons) };
}

// What's newly earned against what's on the books (book: { badges: {id: {yr, tok}}, marks: {key: tok}, counts: {id: n} }).
// Returns [{ kind, key, icon, name, tok }] and writes them into the book.
export function settle(book, x, yr) {
  const got = [];
  book.badges ||= {}; book.marks ||= {}; book.counts ||= {};
  for (const b of BADGES) if (!book.badges[b.id] && b.test(x)) { book.badges[b.id] = { yr, tok: b.tok }; got.push({ kind: 'badge', key: b.id, icon: b.icon, name: b.name, tok: b.tok }); }
  for (const m of MARKS) {
    const yrs = m.award != null ? (x.awards[m.award] || []) : x.seasons.filter(m.season).map(s => s.yr);
    for (const y of new Set(yrs)) { const k = `${m.id}:${y}`; if (book.marks[k] == null) { book.marks[k] = m.tok; got.push({ kind: 'mark', key: k, icon: m.icon, name: `${m.name} (${y})`, tok: m.tok }); } }
  }
  for (const c of COUNTS) {
    const n = x.tot[c.id] || 0, had = book.counts[c.id] || 0;
    if (n > had) { book.counts[c.id] = n; got.push({ kind: 'count', key: c.id, icon: c.icon, name: n - had > 1 ? `${n - had} ${c.name.toLowerCase()}s` : c.name, tok: (n - had) * c.tok }); }
  }
  return got;
}
export const earned = book => Object.values(book.badges || {}).reduce((a, b) => a + b.tok, 0) + Object.values(book.marks || {}).reduce((a, n) => a + n, 0)
  + COUNTS.reduce((a, c) => a + (book.counts?.[c.id] || 0) * c.tok, 0);
