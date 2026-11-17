// Fantasy draft: every team starts from nothing and drafts its roster from the whole league (every rostered player
// and the free agents), snake order, 12 rounds, before a season starts. Contracts stay as they are.
//
// How the CPU drafts:
// - The first twelve picks take the best player on the board: the top of a fantasy draft is chalk (young 5-star
//   ceilings and the league's best players, by value).
// - From there to the end of the first round, a team chooses among the few players very close to the top of its board
//   (within 5% of the best), so the end of the first moves around a little, within reason.
// - Rounds 2 to 5: value, youth and talent first, with what the roster still needs starting to count.
// - Rounds 6 to 12: team needs count more (guards, wings and bigs to fill out a rotation), still on value.
// - Every team drafts to win this season: value is mostly what a player gives now (level and production), with youth
//   and upside still counting for some.
// - Positions: from round 2, a team leans toward the group it's short in (guards, wings, bigs, about a third each as
//   the roster fills) and away from one it's already loaded with, more as the draft goes on. A clearly better player
//   still goes first: the lean is a nudge, not a rule.

export const ROUNDS = 12;
export const CHALK = 12;   // picks that always go best-available
// Kept for drafts already under way; every new draft is win-now.
export const STYLES = {
  win: { name: 'Win-Now', blurb: 'built to win this season', f: () => 1 },
  youth: { name: 'Win-Now', blurb: 'built to win this season', f: () => 1 },
  bal: { name: 'Win-Now', blurb: 'built to win this season', f: () => 1 },
};
// A 12-man roster: about four of each.
const TARGET = { guards: 4, wings: 4, bigs: 4 };

const shuffle = (a, rng) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// A new draft: a random order; every team drafts to win now.
export function newFantasy(teamIds, rng) {
  return { order: shuffle(teamIds, rng), styles: Object.fromEntries(teamIds.map(id => [id, 'win'])), picks: [] };
}

// Pick n (0-based overall) in a snake: round, pick in the round and the team on the clock.
export function slotOf(order, n) {
  const len = order.length, rd = Math.floor(n / len), i = n % len;
  return { rd: rd + 1, inRd: i + 1, tid: rd % 2 === 0 ? order[i] : order[len - 1 - i] };
}
export const totalPicks = order => order.length * ROUNDS;

// How a team scores a player at pick n: his value, then from round 2 the lean toward the position group it's short in.
// d: how far the group is under its share (a third of the roster after this pick); each player under is worth 8%
// (rounds 2-3), 12% (4-6), 16% after, the same off for each over, within 0.65 to 1.4. Five or more in a group: 0.6.
export function scoreFor(p, v, n, nTeams, have, style, groupOf) {
  const rd = Math.floor(n / nTeams) + 1;
  let s = v;
  if (rd >= 2) {
    const g = groupOf(p), got = have.filter(x => groupOf(x) === g).length;
    const d = (have.length + 1) / 3 - got, w = rd <= 3 ? 0.08 : rd <= 6 ? 0.12 : 0.16;
    s *= Math.max(0.65, Math.min(1.4, 1 + w * d));
    if (got >= (TARGET[g] ?? 4) + 1) s *= 0.6;
  }
  return s;
}

// The CPU's pick. pool: [{ p, v }] (v: the player's value); have: its players so far.
export function cpuChoose(pool, have, n, nTeams, style, groupOf, rng) {
  if (!pool.length) return null;
  const scored = pool.map(x => ({ ...x, s: scoreFor(x.p, x.v, n, nTeams, have, style, groupOf) })).sort((a, b) => b.s - a.s);
  if (n < CHALK) return [...pool].sort((a, b) => b.v - a.v)[0];
  const rd = Math.floor(n / nTeams) + 1;
  const within = rd === 1 ? 0.95 : 0.85, size = rd === 1 ? 2 : 5;
  const top = scored.filter(x => x.s >= scored[0].s * within).slice(0, size);
  // The closer to the top of its board, the likelier (score to the 4th power).
  const w = top.map(x => Math.pow(x.s, 4)), tot = w.reduce((a, b) => a + b, 0);
  let r = rng() * tot;
  for (let i = 0; i < top.length; i++) { r -= w[i]; if (r <= 0) return top[i]; }
  return top[0];
}
