// Hoop Gram followers, like Instagram's: a count for every team and player, worked out from what makes people follow
// (the market's fans, winning, titles, stars, awards, a career player's own fans), with a little per-account wobble so
// no two read alike. Kept free of the app: the profile page (app.js) shows them and logs how they move.

const jitter = id => 0.9 + (((Math.imul((id | 0) + 1, 2654435761) >>> 0) % 1000) / 1000) * 0.2;   // 0.9 to 1.1, fixed per id
const won = (p, id, li = 0) => (p.awards || []).filter(a => a.id === id && (a.league ?? 0) === li).reduce((n, a) => n + (a.yearsWon || []).length, 0);

// A team: { college, yr, levels: [its players' levels], li }.
export function teamFollowers(t, { college = false, yr, levels = [] } = {}) {
  const rec = (t.season || []).find(x => x.yr === yr)?.seasonStats || {};
  const gp = (rec.W || 0) + (rec.L || 0), pct = gp ? rec.W / gp : 0.5;
  const titles = (t.championships?.yearsWon || []).length, fans = t.frontOffice?.fans ?? 50;
  const top = [...levels].sort((a, b) => b - a).slice(0, 3);
  let n;
  if (college) {
    n = (15000 + (t.prestigePoints || 0) * 4000) * (0.7 + 0.6 * pct) * (1 + 0.1 * Math.min(titles, 10)) + top.reduce((a, l) => a + Math.max(0, l - 70) ** 2 * 800, 0);
  } else {
    n = (1200000 + fans * 60000) * (0.7 + 0.6 * pct) * (1 + 0.08 * Math.min(titles, 10)) + top.reduce((a, l) => a + Math.max(0, l - 75) ** 2 * 15000, 0);
  }
  return Math.round(n * jitter(t.id));
}

// A player: { level, college, career: the save's career block when he's the career player, li }.
export function playerFollowers(p, { level = 60, college = false, career = null, li = 0 } = {}) {
  let n = 5000 * 1.17 ** (level - 60);
  n += won(p, 101, li) * 400000 + won(p, 13, li) * 300000 + won(p, 2, li) * 3000000 + won(p, 0, li) * 800000 + won(p, 1, li) * 1500000 + won(p, 4, li) * 300000;
  if (college) n *= 0.15;
  n *= jitter(p.id);
  if (career) n += (career.fans || 0) + (career.fame || 0) * 25000;
  return Math.round(n);
}
export const following = id => 60 + ((id | 0) * 37) % 140;

// 1,234 · 12.3K · 1.2M, like the app shows them.
export function fmt(n) {
  const a = Math.abs(n), s = n < 0 ? '−' : '';
  if (a >= 1e6) return `${s}${(a / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (a >= 1e4) return `${s}${(a / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, '')}K`;
  return `${s}${Math.round(a).toLocaleString()}`;
}

// The log of daily counts ({ day: n }): today's goes in, and how much it's moved over the last week of entries.
export function track(log, day, n) {
  log[day] = n;
  const days = Object.keys(log).map(Number).sort((a, b) => a - b);
  for (const d of days.slice(0, Math.max(0, days.length - 60))) delete log[d];
  const kept = Object.keys(log).map(Number).sort((a, b) => a - b), i = kept.indexOf(day);
  const back = kept[Math.max(0, i - 7)];
  return back === day ? 0 : n - log[back];
}
