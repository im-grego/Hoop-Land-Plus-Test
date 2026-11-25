// The Training Center: what a career player can buy with his Career Tokens that the game's Practice Facility doesn't
// sell (the game has conditioning, recovery, respecs and the custom archetype). Career Tokens are the app's own currency,
// earned by achievements (js/achievements.js) and kept in the app like Franchise Tokens; prices run 2 to 50 tokens.
// Each program writes straight into the save: ratings [now, ceiling], upgrade points (season.ap, one a
// category), physicals, regression age, potential, conditioning, morale, the coach's and teammates' bonds, fans.
import { CATEGORIES, ATTR_MAX } from './savefile.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const room = (p, k) => Math.min(ATTR_MAX, p.attributes[k][1]) - p.attributes[k][0];
// The rating in a group with the most room to grow (ties: the higher one).
const roomiest = (p, keys) => keys.filter(k => p.attributes?.[k] && room(p, k) > 0).sort((a, b) => room(p, b) - room(p, a) || p.attributes[b][0] - p.attributes[a][0])[0] || null;
const bump = (p, k, n = 1) => { const a = p.attributes[k]; a[0] = clamp(a[0] + n, 1, Math.min(ATTR_MAX, a[1])); };
const physUp = (p, k) => { const a = p.attributes[k]; if (!a || a[0] >= ATTR_MAX) return false; a[0] += 1; a[1] = Math.max(a[1], a[0]); return true; };
const drill = (keys, label) => ({
  can: p => !!roomiest(p, keys) || `No room left to grow in ${label}`,
  run: p => { const k = roomiest(p, keys); bump(p, k); return `+1 ${k}`; },
});

// The catalog. per: times a season (default 1); life: times a career; rank: the legacy rank it needs (0 Rookie ... 4 All
// Star); can(p, ctx): true or the reason it can't; run(p, ctx): does it and says what changed.
export const PROGRAMS = [
  { group: 'Drills', id: 'shoot', icon: '🎯', name: 'Shooting Lab', cost: 5, per: 2, says: '+1 to the shooting rating with the most room (mid-range, three or free throw)', ...drill(['MID', 'TPT', 'FTS'], 'shooting') },
  { group: 'Drills', id: 'finish', icon: '🏀', name: 'Finishing School', cost: 5, per: 2, says: '+1 to the finishing rating with the most room (layup, dunk or inside)', ...drill(['LAY', 'DNK', 'INS'], 'finishing') },
  { group: 'Drills', id: 'handle', icon: '🧤', name: 'Handle & Vision Camp', cost: 5, per: 2, says: '+1 to dribbling or passing, whichever has more room', ...drill(['DRB', 'PAS'], 'dribbling and passing') },
  { group: 'Drills', id: 'defense', icon: '🛡️', name: 'Defensive Clinic', cost: 5, per: 2, says: '+1 to the defensive rating with the most room (rebounding, steals or blocks)', ...drill(['DRE', 'STL', 'BLK'], 'defense') },
  { group: 'Drills', id: 'glass', icon: '🧲', name: 'Rebounding Camp', cost: 4, per: 2, says: '+1 to offensive or defensive rebounding', ...drill(['ORE', 'DRE'], 'rebounding') },
  { group: 'Drills', id: 'trainer', icon: '🧑‍🏫', name: 'Private Skills Trainer', cost: 13, says: '+2 upgrade points in the category with the most room to spend them',
    can: p => !!p.season?.ap || 'No upgrade points in this save',
    run: p => { const c = CATEGORIES.slice(0, 4).map((c, i) => ({ c, i, r: c.attrs.reduce((n, k) => n + room(p, k), 0) })).sort((a, b) => b.r - a.r)[0]; p.season.ap[c.i] += 2; return `+2 ${c.c.name} upgrade points`; } },
  { group: 'Drills', id: 'signature', icon: '✍️', name: 'Signature Move Coach', cost: 17, says: '+1 ceiling on his best rating: a move nobody can take away',
    can: p => ['LAY', 'DNK', 'INS', 'MID', 'TPT', 'FTS', 'DRB', 'PAS', 'ORE', 'DRE', 'STL', 'BLK'].some(k => p.attributes[k][1] < ATTR_MAX) || 'Every ceiling is already 20',
    run: p => { const k = ['LAY', 'DNK', 'INS', 'MID', 'TPT', 'FTS', 'DRB', 'PAS', 'ORE', 'DRE', 'STL', 'BLK'].filter(x => p.attributes[x][1] < ATTR_MAX).sort((a, b) => p.attributes[b][0] - p.attributes[a][0])[0]; p.attributes[k][1] += 1; return `${k} ceiling +1`; } },

  { group: 'Body', id: 'speed', icon: '⚡', name: 'Speed & Agility Program', cost: 10, says: '+1 speed', can: p => p.attributes.SPD[0] < ATTR_MAX || 'Speed is maxed', run: p => (physUp(p, 'SPD'), '+1 speed') },
  { group: 'Body', id: 'weights', icon: '🏋️', name: 'Weight Room Block', cost: 10, says: '+1 strength', can: p => p.attributes.STR[0] < ATTR_MAX || 'Strength is maxed', run: p => (physUp(p, 'STR'), '+1 strength') },
  { group: 'Body', id: 'altitude', icon: '⛰️', name: 'Altitude Endurance Camp', cost: 8, says: '+1 stamina', can: p => p.attributes.STM[0] < ATTR_MAX || 'Stamina is maxed', run: p => (physUp(p, 'STM'), '+1 stamina') },
  { group: 'Body', id: 'longevity', icon: '🧬', name: 'Longevity Program', cost: 27, life: 3, says: 'Diet, sleep, a body coach: he starts declining a year later',
    can: p => (p.regressionAge || 0) < 40 || 'He already ages as slowly as anyone can', run: p => { p.regressionAge = (p.regressionAge || 30) + 1; return `Regression age ${p.regressionAge}`; } },

  { group: 'Recovery', id: 'reset', icon: '🧊', name: 'Sports Science Reset', cost: 2, per: 5, says: 'Full conditioning and a little morale', can: () => true,
    run: p => { p.season.condition = 100; p.season.morale = clamp((p.season.morale ?? 80) + 5, 0, 100); return 'Conditioning 100%'; } },
  { group: 'Recovery', id: 'hyperbaric', icon: '🫧', name: 'Hyperbaric Chamber', cost: 5, per: 3, says: 'Two games off an injury', can: p => (p.season?.injury?.gamesOut || 0) > 0 || 'He isn\'t hurt',
    run: p => { const j = p.season.injury; j.gamesOut = Math.max(0, j.gamesOut - 2); return j.gamesOut ? `${j.gamesOut} games left out` : 'Back to full health'; } },

  { group: 'Mind', id: 'film', icon: '🎞️', name: 'Film Room with the Coach', cost: 3, per: 2, says: 'Coach relationship +4', can: (p, x) => !!x.coach || 'No coach',
    run: (p, x) => { x.coach.rp = clamp((x.coach.rp || 0) + 4, -50, 50); return `Coach relationship ${x.coach.rp}`; } },
  { group: 'Mind', id: 'psych', icon: '🧠', name: 'Sports Psychologist', cost: 4, per: 2, says: 'Morale +15', can: () => true,
    run: p => { p.season.morale = clamp((p.season.morale ?? 80) + 15, 0, 100); return `Morale ${p.season.morale}`; } },
  { group: 'Mind', id: 'retreat', icon: '🏕️', name: 'Team Leadership Retreat', cost: 8, says: 'Every teammate likes him a little more (+3)', can: (p, x) => (x.mates || []).length > 0 || 'No teammates',
    run: (p, x) => { for (const m of x.mates) if (m.season) m.season.relationship = clamp((m.season.relationship || 0) + 3, -100, 100); return `${x.mates.length} teammates +3`; } },

  { group: 'Brand', id: 'social', icon: '📱', name: 'Social Media Team', cost: 5, says: 'Fans +5%', can: (p, x) => !!x.career || 'No career in this save',
    run: (p, x) => { x.career.fans = Math.round((x.career.fans || 0) * 1.05 + 5); return `${x.career.fans.toLocaleString()} fans`; } },
  { group: 'Brand', id: 'camp', icon: '⛹️', name: 'Youth Basketball Camp', cost: 7, says: 'Fans +3% and morale +5: the kids love him', can: (p, x) => !!x.career || 'No career in this save',
    run: (p, x) => { x.career.fans = Math.round((x.career.fans || 0) * 1.03 + 3); p.season.morale = clamp((p.season.morale ?? 80) + 5, 0, 100); return `${x.career.fans.toLocaleString()} fans`; } },

  { group: 'Elite', id: 'elite', icon: '🌟', name: 'Elite Development Program', cost: 50, life: 1, rank: 3, says: 'Half a star more potential: +7 ceiling points where he has the most to give',
    can: p => (p.pot || 0) < 10 || 'He\'s already at 5-star potential',
    run: p => { p.pot = Math.min(10, (p.pot || 0) + 1); for (let i = 0; i < 7; i++) { const k = ['LAY', 'DNK', 'INS', 'MID', 'TPT', 'FTS', 'DRB', 'PAS', 'ORE', 'DRE', 'STL', 'BLK'].filter(x => p.attributes[x][1] < ATTR_MAX).sort((a, b) => p.attributes[b][1] - p.attributes[a][1])[0]; if (k) p.attributes[k][1] += 1; } return `Potential ${p.pot / 2}★`; } },
];
export const GROUPS = ['Drills', 'Body', 'Recovery', 'Mind', 'Brand', 'Elite'];
// Can he buy it now? { ok, why } — tokens (x.tokens), rank, the season's and the career's limits, then the program's own test.
export function check(prog, p, x, used) {
  if ((x.tokens || 0) < prog.cost) return { ok: false, why: `${prog.cost - (x.tokens || 0)} more Career Token${prog.cost - (x.tokens || 0) === 1 ? '' : 's'}` };
  if (prog.rank != null && x.rank < prog.rank) return { ok: false, why: `${x.rankName} rank required` };
  if ((used.season[prog.id] || 0) >= (prog.per || 1)) return { ok: false, why: 'Done for this season' };
  if (prog.life && (used.life[prog.id] || 0) >= prog.life) return { ok: false, why: prog.life === 1 ? 'Once a career' : `${prog.life} times a career` };
  const c = prog.can(p, x);
  return c === true ? { ok: true } : { ok: false, why: c };
}
