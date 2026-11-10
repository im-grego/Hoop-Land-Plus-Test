// The Olympics: every four summers (2028, 2032, ...), twelve national teams, three groups of four, then an
// eight-team knockout for gold, silver and bronze. Pure logic: the app hands in the league's players (with a level
// function) and gets back rosters, results, box scores, medals and the stories. Nothing here touches the save.
import { mulberry32 } from './progression.js';
import { nameFor } from './names.js';

export const isOlympicYear = yr => yr >= 2028 && yr % 4 === 0;
// The World Cup: the summer before each Olympics (2027, 2031, ...), sixteen teams, and where most Olympic spots are won.
export const isWorldCupYear = yr => yr >= 2027 && yr % 4 === 3;
export const eventOf = yr => (isOlympicYear(yr) ? 'olympics' : isWorldCupYear(yr) ? 'worldcup' : null);
export const EVENT_NAME = { olympics: 'Olympics', worldcup: 'World Cup' };
const WC_HOSTS = { 2027: ['PH', 'Manila'], 2031: ['FR', 'Paris'] };
const WC_ROTATION = [['AR', 'Buenos Aires'], ['JP', 'Tokyo'], ['DE', 'Berlin'], ['AU', 'Melbourne'], ['ES', 'Madrid'], ['PH', 'Manila']];
export const wcHostOf = yr => WC_HOSTS[yr] || WC_ROTATION[((yr - 2035) / 4) % WC_ROTATION.length | 0];

// Hosts: the real ones, then a rotation.
const HOSTS = { 2028: ['US', 'Los Angeles'], 2032: ['AU', 'Brisbane'] };
const ROTATION = [['ES', 'Madrid'], ['DE', 'Berlin'], ['JP', 'Osaka'], ['FR', 'Lyon'], ['IT', 'Milan'], ['CA', 'Toronto'], ['TR', 'Istanbul'], ['BR', 'Rio de Janeiro'], ['US', 'Chicago'], ['GR', 'Athens']];
// The state or region of each host city, for the header ("Los Angeles, California").
const HOST_REGION = { 'Los Angeles': 'California', Brisbane: 'Queensland', Madrid: 'Community of Madrid', Berlin: 'Berlin', Osaka: 'Osaka', Lyon: 'Auvergne-Rhône-Alpes',
  Milan: 'Lombardy', Toronto: 'Ontario', Istanbul: 'Istanbul', 'Rio de Janeiro': 'Rio de Janeiro', Chicago: 'Illinois', Athens: 'Attica', Manila: 'Metro Manila',
  Paris: 'Île-de-France', 'Buenos Aires': 'Buenos Aires', Tokyo: 'Tokyo', Melbourne: 'Victoria', Doha: 'Doha' };
export const regionName = city => HOST_REGION[city] || '';
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
  KR: ['KOR', 'South Korea', 66], EG: ['EGY', 'Egypt', 66],
  // Every other country with a flag in the game: anyone can field a team when the league gives them the players.
  AL: ['ALB', 'Albania', 62], AT: ['AUT', 'Austria', 65], BA: ['BIH', 'Bosnia and Herzegovina', 68], BB: ['BAR', 'Barbados', 58], BD: ['BAN', 'Bangladesh', 52],
  BG: ['BUL', 'Bulgaria', 65], BN: ['BRU', 'Brunei', 50], BY: ['BLR', 'Belarus', 61], CG: ['CGO', 'Congo', 60], CH: ['SUI', 'Switzerland', 63], CL: ['CHI', 'Chile', 60],
  CO: ['COL', 'Colombia', 60], CR: ['CRC', 'Costa Rica', 56], CU: ['CUB', 'Cuba', 62], CY: ['CYP', 'Cyprus', 58], DK: ['DEN', 'Denmark', 62], DZ: ['ALG', 'Algeria', 58],
  EC: ['ECU', 'Ecuador', 56], EE: ['EST', 'Estonia', 66], GH: ['GHA', 'Ghana', 60], GT: ['GUA', 'Guatemala', 54], HK: ['HKG', 'Hong Kong', 54], HN: ['HON', 'Honduras', 54],
  HT: ['HAI', 'Haiti', 56], HU: ['HUN', 'Hungary', 65], ID: ['INA', 'Indonesia', 58], IE: ['IRL', 'Ireland', 58], IN: ['IND', 'India', 56], IQ: ['IRQ', 'Iraq', 56],
  IR: ['IRI', 'Iran', 65], IS: ['ISL', 'Iceland', 63], KH: ['CAM', 'Cambodia', 50], KW: ['KUW', 'Kuwait', 52], KY: ['CAY', 'Cayman Islands', 50], KZ: ['KAZ', 'Kazakhstan', 60],
  LA: ['LAO', 'Laos', 48], LB: ['LBN', 'Lebanon', 67], LK: ['SRI', 'Sri Lanka', 48], LU: ['LUX', 'Luxembourg', 56], LY: ['LBA', 'Libya', 56], MA: ['MAR', 'Morocco', 58],
  MK: ['MKD', 'North Macedonia', 64], MT: ['MLT', 'Malta', 52], MY: ['MAS', 'Malaysia', 52], NI: ['NCA', 'Nicaragua', 52], NL: ['NED', 'Netherlands', 65], NO: ['NOR', 'Norway', 58],
  PA: ['PAN', 'Panama', 58], PE: ['PER', 'Peru', 54], PK: ['PAK', 'Pakistan', 50], PS: ['PLE', 'Palestine', 54], PT: ['POR', 'Portugal', 64], PY: ['PAR', 'Paraguay', 58],
  RO: ['ROU', 'Romania', 61], RU: ['RUS', 'Russia', 72], SA: ['KSA', 'Saudi Arabia', 56], SE: ['SWE', 'Sweden', 62], SG: ['SGP', 'Singapore', 50], SK: ['SVK', 'Slovakia', 61],
  SO: ['SOM', 'Somalia', 48], SV: ['ESA', 'El Salvador', 52], SY: ['SYR', 'Syria', 58], TH: ['THA', 'Thailand', 52], TN: ['TUN', 'Tunisia', 62], TT: ['TTO', 'Trinidad and Tobago', 54],
  TW: ['TPE', 'Chinese Taipei', 58], UG: ['UGA', 'Uganda', 58], UY: ['URU', 'Uruguay', 62], UZ: ['UZB', 'Uzbekistan', 52], VN: ['VIE', 'Vietnam', 50], WS: ['SAM', 'Samoa', 48],
  ZA: ['RSA', 'South Africa', 56],
};
// FIBA's regions, for the World Cup field and the Olympic spots it hands out.
const REGION = Object.fromEntries([
  ['AM', 'US CA AR BR PR DO MX BS VE JM CL CO CR CU EC GT HN HT NI PA PE PY SV TT UY BB KY'],
  ['OC', 'AU NZ WS'],
  ['AS', 'JP CN PH KR BD BN HK ID IN IQ IR KH KW KZ LA LB LK MY PK PS SA SG SY TH TW UZ VN'],
  ['AF', 'NG SN CM EG CG DZ GH LY MA SO TN UG ZA'],
].flatMap(([r, cs]) => cs.split(' ').map(c => [c, r]))); // everyone else: Europe
export const regionOf = c => REGION[c] || 'EU';
export const code = c => NATIONS[c]?.[0] || c;
// The game's own pixel flags (img/flags.png, 15x11 each, 12 to a row, in this order).
const FLAG_ORDER = 'AL AR AT AU BA BB BD BE BG BN BR BS BY CA CG CH CL CM CN CO CR CU CY CZ DE DK DO DZ EC EE EG ES FI FR GE GH GR GT HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JP KH KR KW KY KZ LA LB LK LT LU LV LY MA MK MT MX MY NG NI NL NO NZ PA PE PH PK PL PR PS PT PY RO RS RU SA SE SG SI SK SN SO SV SY TH TN TR TT TW UA UG UK US UY UZ VE VN WS ZA'.split(' ');
export const flagIdx = c => FLAG_ORDER.indexOf(c);
// Each country's two colors, read off its flag (for team-colored boxes): its main color, then white for a two-color
// flag (one color and white) or, with three or more, the next most used color that isn't white.
const FLAG_COLORS = {AL: ['AE001E', '000000'], AR: ['7EC8EB', 'F8EA41'], AT: ['AD001E', 'FFFFFF'], AU: ['1D2971', 'CA012B'], BA: ['2E4593', 'F4F60D'], BB: ['2E4593', 'EACC54'], BD: ['14583F', 'AE0C21'], BE: ['000000', 'F4F60D'], BG: ['218F36', 'AE001E'], BN: ['F4F60D', '010005'], BR: ['3B953E', 'EFDD3B'], BS: ['2E95E4', 'F4F60D'], BY: ['AE001E', '218F36'], CA: ['D52B1E', 'FFFFFF'], CG: ['1E9136', 'F4F60D'], CH: ['AE001E', 'FFFFFF'], CL: ['AE001E', '2C4595'], CM: ['F4F60D', '1E8F33'], CN: ['DE2910', 'FFDE00'], CO: ['F4F60D', '2C4693'], CR: ['2F4493', 'AE001E'], CU: ['2E4591', 'B10025'], CY: ['ECCE76', 'FFFFFF'], CZ: ['AE001E', '2E4593'], DE: ['DD0000', '000000'], DK: ['AE001E', 'FFFFFF'], DO: ['2F458E', 'AE001E'], DZ: ['1E9436', 'A7041F'], EC: ['F4F60D', 'B1001D'], EE: ['000000', '2E4593'], EG: ['AE001E', '000000'], ES: ['F4F60D', 'AE001C'], FI: ['2E4593', 'FFFFFF'], FR: ['002395', 'ED2939'], GE: ['AE001E', 'FFFFFF'], GH: ['F3F50D', 'AD001C'], GR: ['899FD0', 'FFFFFF'], GT: ['A6CCF1', '4B9B54'], HK: ['AE001E', 'FFFFFF'], HN: ['506292', 'FFFFFF'], HR: ['312855', 'D2001B'], HT: ['2E4593', '980A22'], HU: ['AE001E', '218F36'], ID: ['AE001E', 'FFFFFF'], IE: ['208D4C', 'EF8C26'], IL: ['899FD0', 'FFFFFF'], IN: ['EA7921', '1A6F3F'], IQ: ['BF0824', '000000'], IR: ['AE001E', '218F36'], IS: ['2E4593', 'B1001F'], IT: ['218F36', 'AE001E'], JM: ['000000', '2BA600'], JP: ['C70025', 'FFFFFF'], KH: ['2E4593', 'AE001E'], KR: ['000000', '0047A0'], KW: ['218F36', 'AE001E'], KY: ['1D2971', 'CA012B'], KZ: ['7DB6EB', 'E9C950'], LA: ['AE001E', '2E4593'], LB: ['AC001D', '208D35'], LK: ['F5F509', '6C001C'], LT: ['165A33', 'FAB00F'], LU: ['AB011E', '899FD0'], LV: ['6B001C', 'FFFFFF'], LY: ['000000', 'D71C25'], MA: ['AE001E', '288638'], MK: ['AE001E', 'F4F60D'], MT: ['E6001C', 'FFFFFF'], MX: ['006847', 'CE1126'], MY: ['AE001C', '2E4593'], NG: ['218F36', 'FFFFFF'], NI: ['506292', 'FDCF18'], NL: ['AE001E', '2E4593'], NO: ['AE001E', '304692'], NZ: ['1D2971', 'CA012B'], PA: ['AE001E', '2E4593'], PE: ['B71125', '4C673C'], PH: ['0038A8', 'CE1126'], PK: ['218F36', 'FFFFFF'], PL: ['AE001E', 'FFFFFF'], PR: ['AE001E', '2E4593'], PS: ['000000', '19682F'], PT: ['AE001E', '218F36'], PY: ['B1001D', '3A416B'], RO: ['2E4593', 'F4F60D'], RS: ['E6001C', '0C377B'], RU: ['0039A6', 'D52B1E'], SA: ['1E9038', 'FFFFFF'], SE: ['2D5392', 'E9C916'], SG: ['AE001E', 'FFFFFF'], SI: ['29438D', 'AE001E'], SK: ['B1001D', '2E4593'], SN: ['218F36', 'AE001E'], SO: ['A6CCF1', 'FFFFFF'], SV: ['506292', 'FFCC00'], SY: ['AD001E', '000000'], TH: ['AE0020', '2E4593'], TN: ['AE001E', 'FFFDFF'], TR: ['AE001E', 'FFFDFF'], TT: ['AE001E', '000000'], TW: ['AE001E', '2E4593'], UA: ['7DB6EB', 'F4F60D'], UG: ['F3F50B', '000002'], UK: ['CF142B', '00247D'], US: ['B22234', '3C3B6E'], UY: ['89A1CF', 'FFFFFF'], UZ: ['218E36', '889FCF'], VE: ['114593', 'F8EF0B'], VN: ['AE001E', 'F4F60D'], WS: ['AE001E', '2F4591'], ZA: ['228F36', 'AE001E']};
export const flagColors = c => FLAG_COLORS[c] || null;
// A flag (scaled up `s` times, pixel-sharp), or the three-letter code when the game has none for that country.
export function flagHtml(c, s = 2) {
  const i = flagIdx(c);
  if (i < 0) return '';
  return `<span class="flag" title="${nation(c)}" style="width:${15 * s}px;height:${11 * s}px;background-size:${180 * s}px ${110 * s}px;background-position:-${(i % 12) * 15 * s}px -${Math.floor(i / 12) * 11 * s}px"></span>`;
}
export const nation = c => NATIONS[c]?.[1] || c;
const SQUAD = 12;
const grp = pos => (pos <= 2 ? 'g' : pos >= 6 ? 'b' : 'w');   // guards, wings, bigs
// His passing and rebounding (out of 20), for the box score: a passing big racks up assists, a big guard rebounds.
const skillsOf = p => ({ pas: p.attributes?.PAS?.[0] ?? null, rb: Math.max(p.attributes?.DRE?.[0] ?? 0, p.attributes?.ORE?.[0] ?? 0) || null, st: p.attributes?.STL?.[0] ?? null, bk: p.attributes?.BLK?.[0] ?? null, pot: p.pot || 0 });

// A hometown in a US state ("Atlanta, GA") makes him American, whatever the country field says.
const US_STATES = new Set('AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' '));
const BY_NAME = () => (BY_NAME.m ||= Object.fromEntries(Object.entries(NATIONS).flatMap(([c, n]) => [[n[1].toLowerCase(), c], [n[0].toLowerCase(), c]])));
export const countryOf = p => {
  const m = /,\s*([A-Z]{2})\s*$/.exec(p.home || '');
  if (m && US_STATES.has(m[1])) return 'US';
  const c = String(p.ctry || '');
  if (c === 'GB') return 'UK';
  if (c.length > 2) return { 'united states': 'US', usa: 'US', england: 'UK', 'united kingdom': 'UK' }[c.toLowerCase()] || BY_NAME()[c.toLowerCase()] || c;   // some prospects carry the full name
  return c;
};
// The pool: the league's players by country (not retired, 39 or younger). `level(p)` is the app's shown level. Only
// countries the game has a flag for field a team.
function pools(players, level) {
  const by = {};
  for (const p of players) {
    const c = countryOf(p);
    if (flagIdx(c) < 0) continue;
    if (!NATIONS[c] || p.age > 39) continue;
    (by[c] ||= []).push({ p, lv: level(p) });
  }
  for (const c of Object.keys(by)) by[c].sort((a, b) => b.lv - a.lv);
  return by;
}

// Who says no: stars past 33 often rest, the injured can't go, and a few just want the summer off. `mine(p)`:
// your players (you can keep one home yourself; the app passes those in `home`).
// The chance starts from his age, then his personality and how long his season ran: a Finals run wears a player
// down, a competitor and a committed player want the gold, a lazy or injury-prone one stays home, a bag-chaser with
// an expiring deal protects his free agency. `poGp`: his playoff games last season.
function withdrawal(rng, p, lv, poGp = 0) {
  if ((p.season?.injury?.gamesOut || 0) > 0) return 'injured';
  const t = k => p.traits?.[k] || 10;
  let c = p.age >= 34 ? 0.3 : p.age >= 31 ? 0.15 : lv >= 95 ? 0.04 : 0.06;
  const why = [[p.age >= 34 ? 1.5 : p.age >= 31 ? 1.2 : 0.6, p.age >= 31 ? 'resting at his age' : 'taking the summer off']];
  const f = (m, w) => { c *= m; if (m > 1) why.push([m, w]); };
  if (poGp >= 19) f(2.2, 'worn down after the Finals run'); else if (poGp >= 13) f(1.6, 'resting after a deep playoff run'); else if (poGp >= 9) f(1.2, 'resting after a long season');
  if (t('winning') >= 16) f(0.5); else if (t('winning') <= 4) f(1.3, 'not interested this time');
  if (t('loyalty') >= 16) f(0.7); else if (t('loyalty') <= 4) f(1.3, 'not interested this time');
  if (t('motor') >= 16) f(0.7); else if (t('motor') <= 4) f(1.7, 'would rather have the summer off');
  if (t('durability') <= 4) f(1.6, 'his team wants him rested'); else if (t('durability') >= 16) f(0.8);
  if (t('playoffRiser') >= 16) f(0.8);   // an Alpha wants the stage
  if (t('money') >= 16 && p.status === 4) f(1.8, 'protecting his free agency');
  if (rng() >= Math.min(0.85, c)) return null;
  return why.sort((a, b) => b[0] - a[0])[0][1];
}

// A national team: the federation picks the best twelve it can, keeping a balance of guards, wings and bigs (never
// more than five of one kind), with a nod to players who were there last time. `edits`: { add: [pid], drop: [pid] }
// from you; `home`: pids you kept home.
function selectTeam(c, pool, rng, prev, edits = {}, home = new Set(), poGp = () => 0) {
  const withdrew = [], open = [];
  for (const x of pool) {
    const why = home.has(x.p.id) ? 'kept home by his team' : withdrawal(rng, x.p, x.lv, poGp(x.p));
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

// Build the field: rosters for every nation, then who's in. The World Cup: the host and the fifteen strongest, with at
// least three teams from the Americas, two from Africa, one from Asia and one from Oceania. The Olympics: the host,
// seven spots from last summer's World Cup (the two best from the Americas and from Europe, the best from Africa, Asia
// and Oceania), then four qualifying tournaments for the rest. `qual`: last summer's World Cup finish (codes, best
// first); `coaches`: { c: { name, cid } }.
export function buildField({ yr, players, level, prevIds = {}, edits = {}, home = [], seed, poGp, event = 'olympics', qual = null, coaches = {}, prospects = [] }) {
  const rng = mulberry32(seed ^ 0x0717c);
  const [host, city] = event === 'worldcup' ? wcHostOf(yr) : hostOf(yr), by = pools(players, level), homeSet = new Set(home);
  const used = new Set(players.map(p => `${p.fn} ${p.ln}`.toLowerCase()));
  const teams = Object.keys(NATIONS).filter(c => flagIdx(c) >= 0).map(c => {
    const sel = selectTeam(c, by[c] || [], rng, new Set(prevIds[c] || []), edits[c], homeSet, poGp);
    const roster = sel.picked.map(x => ({ pid: x.p.id, fn: x.p.fn, ln: x.p.ln, pos: x.p.pos, age: x.p.age, lv: x.lv, tid: x.p.tid, ...skillsOf(x.p) }));
    // The best of the country's own league are in the running too: a fringe league player doesn't beat a better pro
    // from home (unless you added him).
    const added = new Set(edits[c]?.add || []);
    const home = fillers(c, Math.max(SQUAD - roster.length, 6), rng, used, [1, 4, 7, 2, 5, 8]);
    const pool2 = [...roster, ...home].sort((a, b) => (added.has(b.pid) - added.has(a.pid)) || b.lv - a.lv);
    const cut = pool2.slice(SQUAD).filter(x => x.pid != null);
    roster.length = 0; roster.push(...pool2.slice(0, SQUAD).sort((a, b) => b.lv - a.lv));
    sel.snubs.unshift(...cut.slice(0, 2).map(x => ({ p: { id: x.pid }, lv: x.lv, why: 'beaten out by a pro from home' })));
    return { c, roster, withdrew: sel.withdrew.map(x => ({ pid: x.p.id, lv: x.lv, why: x.why })), snubs: sel.snubs.map(x => ({ pid: x.p.id, lv: x.lv, why: x.why })),
      eligible: sel.eligible.map(x => x.p.id), str: 0 };
  });
  naturalize(teams, by, rng);
  addProspects(teams, prospects, level, rng);
  // The national coach: the one the app hands in (a league coach), or the federation's own man.
  for (const t of teams) {
    t.str = +strength(t.roster, t.c, host).toFixed(1);
    const nm = coaches[t.c] ? null : nameFor(rng, t.c, used);
    t.coach = coaches[t.c] || (nm ? { name: `${nm.fn} ${nm.ln}` } : null);
  }
  teams.sort((a, b) => b.str - a.str);
  const T = Object.fromEntries(teams.map(t => [t.c, t]));
  let field, oqt = null;
  const via = {};
  if (event === 'worldcup') {
    // The host, then the strongest, keeping the regional minimums.
    const pick = [T[host]].filter(Boolean), rest = teams.filter(t => t.c !== host);
    for (const [rg, n] of [['AM', 3], ['AF', 2], ['AS', 1], ['OC', 1]]) {
      const need = Math.max(0, n - pick.filter(x => regionOf(x.c) === rg).length);
      pick.push(...rest.filter(t => regionOf(t.c) === rg && !pick.includes(t)).slice(0, need));
    }
    for (const t of rest) { if (pick.length >= 16) break; if (!pick.includes(t)) pick.push(t); }
    field = pick.sort((a, b) => b.str - a.str);
  } else {
    // Olympic spots from the World Cup finish (or, without one, from how the teams stack up today).
    const order = (qual?.length ? qual.filter(c => T[c]) : teams.map(t => t.c)).filter(c => c !== host);
    const quota = { AM: 2, EU: 2, AF: 1, AS: 1, OC: 1 }, got = {}, inn = [host];
    via[host] = 'host';
    for (const c of order) { const rg = regionOf(c); if ((got[rg] || 0) < quota[rg]) { got[rg] = (got[rg] || 0) + 1; inn.push(c); via[c] = 'World Cup'; } }
    // Four qualifying tournaments: the next sixteen, snake-seeded into four brackets of four; each winner goes.
    const next = [...order.filter(c => !inn.includes(c)), ...teams.map(t => t.c).filter(c => !inn.includes(c) && !order.includes(c))].slice(0, 16);
    const nextT = next.map(c => T[c]).sort((a, b) => b.str - a.str);
    const cities = ['Valencia', 'Piraeus', 'Riga', 'San Juan'];
    const w = G => (G.sa > G.sb ? G.a : G.b);
    oqt = [0, 1, 2, 3].map(i => {
      const g = [nextT[i], nextT[7 - i], nextT[8 + i], nextT[15 - i]].filter(Boolean);
      if (g.length < 2) return null;
      const s1 = playGame(rng, g[0], g[g.length - 1], 'Semifinal'), s2 = g.length >= 4 ? playGame(rng, g[1], g[2], 'Semifinal') : null;
      const fin = s2 ? playGame(rng, T[w(s1)], T[w(s2)], 'Final') : s1;
      const winner = w(fin);
      inn.push(winner); via[winner] = `qualifier in ${cities[i]}`;
      return { city: cities[i], teams: g.map(t => t.c), winner, final: { a: fin.a, b: fin.b, sa: fin.sa, sb: fin.sb } };
    }).filter(Boolean);
    field = inn.map(c => T[c]).filter(Boolean).sort((a, b) => b.str - a.str);
  }
  const groups = event === 'worldcup'
    ? [[0, 7, 8, 15], [1, 6, 9, 14], [2, 5, 10, 13], [3, 4, 11, 12]].map(ix => ix.map(i => field[i].c))
    // Groups by pots (snake): A gets 1, 6, 7, 12; B 2, 5, 8, 11; C 3, 4, 9, 10.
    : [[0, 5, 6, 11], [1, 4, 7, 10], [2, 3, 8, 9]].map(ix => ix.map(i => field[i].c));
  return { yr, event, host, city, field, groups, via, oqt, out: teams.filter(t => !field.includes(t)).slice(0, 4).map(t => t.c) };
}

// High-pedigree prospects (4 stars and up, not in the league yet) play for their country only when it's thin: three
// or fewer league players. Up to two a team, in place of the weakest home pros, if they're close to them.
function addProspects(teams, prospects, level, rng) {
  for (const t of teams) {
    const lg = t.roster.filter(x => x.pid != null && !x.pro).length;
    // His level as a pro: pre-draft ratings run high.
    const mine = prospects.filter(p => countryOf(p) === t.c && (p.pot || 0) >= 8).map(p => ({ p, raw: level(p), lv: level(p) - 6 })).sort((a, b) => b.lv - a.lv);
    const take = x => {
      const worst = t.roster.reduce((m, y, j) => (y.pid == null && (m < 0 || y.lv < t.roster[m].lv) ? j : m), -1);
      if (worst < 0) return false;
      t.roster[worst] = { pid: x.p.id, fn: x.p.fn, ln: x.p.ln, pos: x.p.pos, age: x.p.age, lv: x.lv, tid: null, pro: true, ...skillsOf(x.p) };
      return true;
    };
    let added = 0;
    for (const x of mine) {
      // A five-star prospect at 87 or better almost always goes, unless his country has more than five league players;
      // then he's mentioned as the one who missed out for lack of experience.
      const elite = (x.p.pot || 0) >= 10 && x.raw >= 87;
      if (elite) {
        if (lg <= 5 && rng() < 0.95 && take(x)) { added++; continue; }
        if (lg > 5) { t.snubs.push({ pid: x.p.id, lv: x.lv, why: 'lacking international experience', pro: true }); continue; }
      }
      // Other four-star-plus prospects: only on a thin team (three or fewer league players), up to two, if they're close
      // to the home pro they'd replace.
      if (added >= 2 || lg > 3) continue;
      const worst = t.roster.filter(y => y.pid == null).reduce((m, y) => Math.min(m, y.lv), 99);
      if (x.lv >= worst - 6 && take(x)) added++;
    }
    t.roster.sort((a, b) => b.lv - a.lv);
  }
}
// One naturalized player a team (FIBA's rule): a country with no more than three league players can bring in a
// league player who won't make his own country's team (usually an American a few levels short of Team USA). The
// thinnest teams ask first.
function naturalize(teams, by, rng) {
  const taken = new Set(teams.flatMap(t => t.roster.map(x => x.pid).filter(v => v != null)));
  const out = new Set(teams.flatMap(t => t.withdrew.map(w => w.pid)));
  const pool = Object.entries(by).filter(([, xs]) => xs.length > 14).flatMap(([c, xs]) => xs.map(x => ({ ...x, c })))
    // Rotation players, not stars (a Jordan Clarkson, an Anthony Randolph): nobody a contender would build around.
    .filter(x => !taken.has(x.p.id) && !out.has(x.p.id) && x.p.age <= 33 && x.lv >= 74 && x.lv <= 84 && !((x.p.season?.injury?.gamesOut || 0) > 0)).sort((a, b) => b.lv - a.lv);
  const lg = t => t.roster.filter(x => x.pid != null).length;
  const thin = teams.filter(t => lg(t) <= 3).sort((a, b) => lg(a) - lg(b));
  for (const t of thin) {
    if (rng() > 0.45 || !pool.length) continue;
    const x = pool.splice(Math.floor(rng() * Math.min(pool.length, 20)), 1)[0];
    const worst = t.roster.reduce((m, y, j) => (y.pid == null && (m < 0 || y.lv < t.roster[m].lv) ? j : m), -1);
    if (worst < 0 || x.lv <= t.roster[worst].lv) continue;
    t.roster[worst] = { pid: x.p.id, fn: x.p.fn, ln: x.p.ln, pos: x.p.pos, age: x.p.age, lv: x.lv, tid: x.p.tid, nat: x.c, ...skillsOf(x.p) };
    t.roster.sort((a, b) => b.lv - a.lv);
  }
}

// One game: a margin from the strength gap, FIBA scoring (40 minutes, about 85 a side), box scores for both teams.
function playGame(rng, A, B, stage) {
  const edge = ((A.str + (A.heat || 0)) - (B.str + (B.heat || 0))) * 0.65, margin = edge + (rng() + rng() + rng() + rng() - 2) * 12;
  const total = 166 + (rng() - 0.5) * 24;
  let sa = Math.round((total + margin) / 2), sb = Math.round((total - margin) / 2);
  // Ten-minute quarters, then five-minute overtimes until someone's ahead.
  const split = n => { const w = [0, 1, 2, 3].map(() => 0.8 + rng() * 0.4), sw = w.reduce((a, b) => a + b, 0), q = w.map(v => Math.floor(n * v / sw)); q[3] += n - q.reduce((a, b) => a + b, 0); return q; };
  const qa = split(sa), qb = split(sb);
  let ot = 0;
  while (sa === sb) { ot++; const oa = 6 + Math.floor(rng() * 7), ob = 6 + Math.floor(rng() * 7); qa.push(oa); qb.push(ob); sa += oa; sb += ob; }
  return { stage, a: A.c, b: B.c, sa, sb, ot, qa, qb, box: [box(rng, A, sa, ot), box(rng, B, sb, ot)] };
}
const MIN = [30, 28, 27, 25, 24, 21, 18, 15, 12, 10, 6, 4];
function box(rng, T, pts, ot = 0) {
  // How far each player stands above his own team (the 3rd to 8th men): a Giannis on a thin Greece is far above, a
  // Tatum on Team USA barely. The further above, the more he plays and the more of the offense runs through him.
  const lvs = T.roster.map(x => x.lv), mid = lvs.slice(2, 8).reduce((a, b) => a + b, 0) / Math.max(1, lvs.slice(2, 8).length);
  const dom = x => Math.max(0, (x.lv - mid) / 10);
  // A prospect plays a modest role, unless he's a great one (4.5 stars and up) on a thin team.
  const thin = T.roster.filter(x => x.pid != null && !x.pro).length <= 3;
  const modest = x => x.pro && !(thin && (x.pot || 0) >= 9);
  const rows = T.roster.map((x, i) => ({ x, d: modest(x) ? 0 : dom(x), min: Math.max(1, Math.round(MIN[i] + (i < 3 && !modest(x) ? Math.min(6, dom(x) * 3) : 0) - (modest(x) ? 5 : 0) + (rng() - 0.5) * 6)) }));
  // Five on the floor for 40 minutes (plus five an overtime): 200 minutes. The bench gives back what the stars take.
  const want = 200 + 25 * ot;
  for (let guard = 0, d = want - rows.reduce((a, r) => a + r.min, 0); d !== 0 && guard < 500; guard++) {
    const st = Math.sign(d), order = st < 0 ? [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4];
    const i = order[guard % order.length];
    if (rows[i] && rows[i].min + st >= 1 && rows[i].min + st <= 40) { rows[i].min += st; d -= st; }
  }
  // Scoring shares: minutes, level and how far above his team he is. Deep teams spread it (no one much past a
  // quarter); a lone star can take well over a third. A hero on a heater takes even more.
  const isHero = r => T.hero != null && (r.x.pid ?? `${r.x.fn} ${r.x.ln}`) === T.hero;
  const cap = r => (isHero(r) ? 0.42 : 0.2 + Math.min(0.15, r.d * 0.075));
  let w = rows.map(r => r.min * Math.pow(Math.max(40, r.x.lv) / 80, 4) * (1 + r.d * 0.6) * (0.75 + rng() * 0.5) * (isHero(r) ? 1.6 : 1) * (modest(r.x) ? 0.65 : 1));
  for (let k = 0; k < 4; k++) { const sw = w.reduce((a, b) => a + b, 0) || 1; w = w.map((v, i) => Math.min(v, sw * cap(rows[i]))); }
  const sw = w.reduce((a, b) => a + b, 0) || 1;
  const pts0 = w.map(v => Math.floor(pts * v / sw));
  let left = pts - pts0.reduce((a, b) => a + b, 0);
  for (let i = 0; left > 0; i = (i + 1) % rows.length) if (rows[i].min > 0) { pts0[i]++; left--; }
  return rows.map((r, i) => {
    const g = grp(r.x.pos), m = (r.min / 30) * (Math.max(40, r.x.lv) / 80) * (1 + r.d * 0.12);
    return { k: r.x.pid ?? `${r.x.fn} ${r.x.ln}`, min: r.min, pts: pts0[i],
      reb: Math.round(m * (r.x.rb != null ? 0.5 + r.x.rb * 0.42 : g === 'b' ? 7 : g === 'w' ? 4.5 : 3) * (0.6 + rng() * 0.8)),
      ast: Math.round(m * (r.x.pas != null ? Math.max(0.5, (r.x.pas - 4) * 0.36) : g === 'g' ? 5 : g === 'w' ? 2.5 : 1.5) * (0.6 + rng() * 0.8)),
      stl: Math.round(m * (r.x.st != null ? r.x.st * 0.08 : 0.9) * (0.4 + rng() * 1.2)), blk: Math.round(m * (r.x.bk != null ? r.x.bk * 0.08 : g === 'b' ? 1.1 : 0.4) * (0.4 + rng() * 1.2)) };
  });
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
      const G = playGame(rng, T[g[i]], T[g[j]], `Group ${'ABCD'[gi]}`);
      games.push(G);
      const [wa, wb] = G.sa > G.sb ? [table[G.a], table[G.b]] : [table[G.b], table[G.a]];
      wa.w++; wb.l++;
      table[G.a].pf += G.sa; table[G.a].pa += G.sb; table[G.b].pf += G.sb; table[G.b].pa += G.sa;
    }
  });
  const rank = a => a.sort((x, y) => y.w - x.w || (y.pf - y.pa) - (x.pf - x.pa));
  const standings = F.groups.map(g => rank(g.map(c => table[c])));
  // Quarterfinals, seeded 1 v 8, 2 v 7, 3 v 6, 4 v 5: three groups send their top two and the two best thirds; four
  // groups send their top two.
  const firsts = rank(standings.map(s => s[0])), seconds = rank(standings.map(s => s[1])), thirds = F.groups.length === 3 ? rank(standings.map(s => s[2])).slice(0, 2) : [];
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
    const L = lines.get(r.k) || lines.set(r.k, { k: r.k, c, gp: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, min: 0 }).get(r.k);
    if (r.min > 0) L.gp++;
    L.pts += r.pts; L.reb += r.reb; L.ast += r.ast; L.stl += r.stl || 0; L.blk += r.blk || 0; L.min += r.min;
  } });
  const val = L => (L.pts + L.reb * 0.8 + L.ast * 1.1) / Math.max(1, L.gp);
  const all = [...lines.values()].filter(L => L.gp >= 3);
  const weight = L => val(L) * (L.c === medals.gold ? 1.25 : L.c === medals.silver ? 1.1 : L.c === medals.bronze ? 1.05 : 0.9);
  const ranked = all.sort((a, b) => weight(b) - weight(a));
  const mvp = ranked.find(L => [medals.gold, medals.silver].includes(L.c)) || ranked[0];
  // Where everyone finished: the medals and fourth, the quarterfinal losers, then the rest by their group record.
  const qfOut = qf.map(lose).sort((a, b) => seeds.indexOf(a) - seeds.indexOf(b));
  const finish = [medals.gold, medals.silver, medals.bronze, medals.fourth, ...qfOut, ...standings.flat().map(x => x.c).filter(c => !seeds.slice(0, 8).includes(c))
    .sort((a, b) => table[b].w - table[a].w || (table[b].pf - table[b].pa) - (table[a].pf - table[a].pa))];
  // Injuries: a league player's chance grows with his minutes (about 3% for a full tournament, more if injury-prone).
  const injuries = [], prospectIds = new Set(F.field.flatMap(t => t.roster.filter(x => x.pro).map(x => x.pid)));
  for (const L of lines.values()) {
    if (typeof L.k !== 'number' || prospectIds.has(L.k)) continue;
    const c = Math.min(0.12, 0.03 * (L.min / 160) * (F.prone?.(L.k) || 1));
    if (rng() >= c) continue;
    const r = rng(), area = ['lowerBody', 'lowerBody', 'lowerBody', 'upperBody', 'core'][Math.floor(rng() * 5)];
    const part = area === 'lowerBody' ? [3, 3, 5, 6, 7, 10][Math.floor(rng() * 6)] : area === 'upperBody' ? 1 + Math.floor(rng() * 6) : [3, 4, 5][Math.floor(rng() * 3)];
    const major = r > 0.95;
    injuries.push({ k: L.k, c: L.c, area, part, minorSeverity: major ? 0 : [1, 3, 4, 5, 6, 7, 8, 9, 10][Math.floor(rng() * 9)], majorSeverity: major ? 1 + Math.floor(rng() * 4) : 0,
      gamesOut: major ? 25 + Math.floor(rng() * 35) : r > 0.75 ? 12 + Math.floor(rng() * 14) : 2 + Math.floor(rng() * 9) });
  }
  return { hero, finish, injuries, games, standings: standings.map(s => s.map(x => ({ ...x }))), seeds, medals, mvp: mvp?.k ?? null, allStar: ranked.slice(0, 5).map(L => L.k), lines: Object.fromEntries([...lines.values()].map(L => [L.k, L])) };
}

// ---- The logo: five pixel rings (blue, black, red over yellow, green), interlocked, on a white badge.
const RING = ['...####...', '.##....##.', '.#......#.', '#........#', '#........#', '#........#', '#........#', '.#......#.', '.##....##.', '...####...'];
const RINGS = [[0, 0, '#2f86e6'], [12, 0, '#111111'], [24, 0, '#e8202a'], [6, 5, '#f2c400'], [18, 5, '#0d9b3f']];
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
  return `<svg class="oly-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W0 + 4} ${H0 + 4}" width="${size}" height="${size * (H0 + 4) / (W0 + 4)}" shape-rendering="crispEdges" role="img" aria-label="Olympics">${rects}</svg>`;
}
// An original take in the same spirit: five pixel basketballs in the five colors, three over two, each with its
// seams (the middle lines and the two side curves).
const BALLS = [[0, 0, '#2f86e6'], [16, 0, '#1b1b1b'], [32, 0, '#e8202a'], [8, 8, '#f2c400'], [24, 8, '#0d9b3f']];
// A 15-pixel ball: the two middle lines, and two seams curving out like ( and ) that meet the vertical line at the
// top and bottom.
function ballPixels() {
  const c = 7, R = 7.4, seam = new Set();
  for (let i = 0; i <= 15; i++) { seam.add(`${c},${i}`); seam.add(`${i},${c}`); }
  for (let t = -1; t <= 1.0001; t += 0.02) {
    const y = Math.round(c + t * 6.6), off = 4.6 * (1 - t * t);
    seam.add(`${Math.round(c - off)},${y}`); seam.add(`${Math.round(c + off)},${y}`);
  }
  const out = [];
  for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) {
    const d = Math.hypot(x - c, y - c);
    if (d > R) continue;
    out.push([x, y, d <= R - 1 && seam.has(`${x},${y}`) ? 'seam' : 'fill']);
  }
  return out;
}
export function logo2Svg(size = 40) {
  const W0 = 47, H0 = 23, rects = [], px = ballPixels();
  for (const [ox, oy, col] of BALLS) for (const [x, y, kind] of px)
    rects.push(`<rect x="${ox + x}" y="${oy + y}" width="1" height="1" fill="${kind === 'seam' ? '#0a0a0a' : col}"${kind === 'seam' ? ' opacity="0.55"' : ''}/>`);
  return `<svg class="oly-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W0} ${H0}" width="${size}" height="${size * H0 / W0}" shape-rendering="crispEdges" role="img" aria-label="World Games">${rects.join('')}</svg>`;
}
