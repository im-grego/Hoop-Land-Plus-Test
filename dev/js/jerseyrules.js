// Retired numbers a player may still wear. Family: the number is retired for his father (or another relative with his
// last name), the way Tim Hardaway Jr. wears his dad's #10 in Miami.
const base = s => String(s || '').toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\.?$/, '').replace(/[^a-z]/g, '');
export function familyNumber(league, team, p, num) {
  const r = (team.retiredNumbers || []).find(x => x.num === num);
  if (!r || r.pid == null) return false;
  const people = [...(league.retirees || []), ...(league.hallOfFame || []), ...league.teams.flatMap(t => t.roster), ...(league.freeAgents || [])];
  const legend = people.find(x => x.id === r.pid);
  return !!legend && legend !== p && base(legend.ln) === base(p.ln);
}
// A number the whole league retired (Bill Russell's #6): a player who wore it in an earlier season keeps it, wherever
// he plays now (DeAndre Jordan's #6).
export function leagueWideNumber(league, team, p, num) {
  if (!league.teams.every(t => (t.retiredNumbers || []).some(r => r.num === num))) return false;
  const yr = league.season.currentYear;
  return (p.stats || []).some(s => s.league === 0 && s.yr < yr && (s.season || []).some(r => r.num === num && r.GP > 0));
}
