// Archetype names that carry a position word use the word for the player's own position:
// PG Point · G Combo · SG Guard · GF Wing · SF Wing · F Forward · PF Four · FC Big · C Big.
// "Point Forward" also fits GF, SF, F and PF, so it stays on them.
// Names without a position word are left alone. Used by class prep, the Draft Class Lab and the realistic classes.
export const ARC_POS_WORD = ['Point', 'Combo', 'Guard', 'Wing', 'Wing', 'Forward', 'Four', 'Big', 'Big'];
const WORDS = 'Point[- ]Forward|Combo[- ]Guard|Point[- ]Guard|Shooting[- ]Guard|Small[- ]Forward|Power[- ]Forward|Point|Combo|Guard|Wing|Swingman|Forward|Four|Big|Center|Five';
// A position word stands on its own: not part of a hyphenated word like "Point-of-Attack" or "Point-Fading".
const POSW = new RegExp(`(^|[^-\\w])(${WORDS})(?![-\\w])`, 'i');
const POSW_ALL = new RegExp(`(^|[^-\\w])(${WORDS})(?![-\\w])`, 'gi');
const ADJ = {
  'Shot-Maker': 'Shotmaking', Shotmaker: 'Shotmaking', Scorer: 'Scoring', Playmaker: 'Playmaking', Shooter: 'Shooting', Slasher: 'Slashing',
  Finisher: 'Finishing', Defender: 'Defensive', Rebounder: 'Rebounding', 'Shot-Creator': 'Creating', Creator: 'Creating', 'Post-Scorer': 'Post-Scoring', Stopper: 'Lockdown',
};

export function fixArcPos(arc, pos) {
  if (!arc || !POSW.test(arc)) return arc;
  const w = ARC_POS_WORD[pos] ?? ARC_POS_WORD[Math.max(0, Math.min(8, +pos || 0))];
  const pf = arc.match(/(^|[^-\w])(Point[- ]Forward)(?![-\w])/i);
  if (pf && pos >= 3 && pos <= 6) {                               // point forward fits GF-PF: keep it, drop other position words
    let out = arc.replace(POSW_ALL, (m, pre, word) => `${pre}${/^Point[- ]Forward$/i.test(word) ? '\u0000' : ''}`);
    out = out.replace('\u0000', pf[2]).replace(/\u0000/g, '');
    return out.replace(/\s{2,}/g, ' ').trim();
  }
  if (/^\s*Point[- ]Forward\s*$/i.test(arc)) return pos === 0 ? w : `Playmaking ${w}`;
  let out = arc.replace(POSW, (_, pre) => `${pre}\u0000`);
  out = out.replace(POSW_ALL, (_, pre) => pre);                 // a second position word goes
  out = out.replace('\u0000', w).replace(/\s{2,}/g, ' ').trim();
  if (/^playmaking point$/i.test(out)) out = 'Point';
  // Keep adjective + noun: "Combo Shot-Maker" on a SG reads "Shotmaking Guard", not "Guard Shot-Maker".
  const m = out.match(new RegExp(`^${w} (\\S+)$`));
  if (m && out !== arc && ADJ[m[1]]) out = `${ADJ[m[1]]} ${w}`;
  return out;
}
