// Real-world future draft picks (2027-2033) as of November 2026, boiled down to the simple facts: this team's pick belongs
// to that team now. A pick that goes to one of several teams by where it lands ("most favorable of") goes where the
// standings point today; deferrals are left out.
// Anything conditional (swaps, "more favorable of", "if not already settled", rollovers) is left to the app's own system.
// Matching is by team name, so it works on any file. A pick is only moved when it still sits where it should
// (with its original team); a pick found anywhere else was traded in the game and stays put, unprotected.

export const TEAMS = {
  ATL: ['Atlanta Hawks', 'Hawks'], BOS: ['Boston Celtics', 'Celtics'], BRK: ['Brooklyn Nets', 'Nets'], CHA: ['Charlotte Hornets', 'Hornets'],
  CHI: ['Chicago Bulls', 'Bulls'], CLE: ['Cleveland Cavaliers', 'Cavaliers'], DAL: ['Dallas Mavericks', 'Mavericks'], DEN: ['Denver Nuggets', 'Nuggets'],
  DET: ['Detroit Pistons', 'Pistons'], GOS: ['Golden State Warriors', 'Warriors'], HOU: ['Houston Rockets', 'Rockets'], IND: ['Indiana Pacers', 'Pacers'],
  LAC: ['Los Angeles Clippers', 'Clippers'], LAL: ['Los Angeles Lakers', 'Lakers'], MEM: ['Memphis Grizzlies', 'Grizzlies'], MIA: ['Miami Heat', 'Heat'],
  MIL: ['Milwaukee Bucks', 'Bucks'], MIN: ['Minnesota Timberwolves', 'Timberwolves'], NOP: ['New Orleans Pelicans', 'Pelicans'], NYK: ['New York Knicks', 'Knicks'],
  OKC: ['Oklahoma City Thunder', 'Thunder'], ORL: ['Orlando Magic', 'Magic'], PHL: ['Philadelphia 76ers', '76ers'], PHX: ['Phoenix Suns', 'Suns'],
  POR: ['Portland Trail Blazers', 'Trail Blazers'], SAC: ['Sacramento Kings', 'Kings'], SAN: ['San Antonio Spurs', 'Spurs'], TOR: ['Toronto Raptors', 'Raptors'],
  UTH: ['Utah Jazz', 'Jazz'], WAS: ['Washington Wizards', 'Wizards'],
};
const SHORT = { BRK: 'BKN', CHA: 'CHO', GOS: 'GSW', PHL: 'PHI', SAN: 'SAS', UTH: 'UTA' };   // the codes a file's own abbreviations use
const ALT = { 'philadelphia sixers': 'PHL', 'portland blazers': 'POR' };

// "year round FROM>TO [top N]": FROM's pick now belongs to TO; a top-N protection sends it back if it lands in the top N.
// Protections are the closest of top 3, top 8 and lottery (tL).
const DATA = `
2027 1 ATL>SAN, NYK>BRK, DAL>CHA t3, MIA>CHA tL, LAL>MEM t3, PHX>HOU, PHL>BRK t8, MIL>NOP, NOP>ATL t3, UTH>MEM, CLE>PHX, MIN>UTH, DEN>OKC t3, SAN>OKC tL
2028 1 ORL>POR, LAC>PHL
2029 1 NYK>BRK, LAL>DAL, IND>LAC, MIL>POR, BOS>POR, POR>WAS, CLE>PHX, MIN>UTH, DAL>HOU, PHX>BRK, DEN>OKC t3
2030 1 ORL>MEM, GOS>DAL tL
2031 1 CLE>DEN, MIA>MIL, PHX>MEM, NYK>BRK, MIN>SAC, LAL>UTH, TOR>LAC
2032 1 DEN>BRK
2033 1 PHX>CHA, MIA>MIL, LAL>UTH, TOR>LAC
2027 2 MIN>POR, DAL>WAS, DEN>UTH, CHA>SAC, MIA>PHL, NOP>CHA, ORL>UTH, IND>NOP, PHX>LAC, BRK>DET, MIL>DET, UTH>IND, CHI>OKC, LAC>UTH, WAS>NYK, CLE>CHI, GOS>WAS, OKC>NYK, BOS>PHX, LAL>BRK, POR>HOU, MEM>HOU, HOU>MIA
2028 2 POR>WAS, MIL>PHL, CLE>UTH, BOS>NYK, LAC>CHA, MEM>BRK, ATL>BRK, MIA>DET, UTH>OKC, SAC>POR, NYK>DET, LAL>ORL, ORL>CHA, DAL>LAC, DEN>WAS, PHX>IND, IND>NYK, NOP>SAN, DET>PHL, OKC>PHL, MIN>SAN, GOS>PHL, WAS>LAL
2029 2 POR>MEM, MIL>DET, CLE>ATL, BOS>OKC, LAC>SAN, MEM>BRK, ATL>OKC, MIA>OKC, SAC>HOU, NYK>DET, LAL>WAS, DAL>BRK, DEN>CHA, NOP>SAN, HOU>DAL, PHX>CHA, GOS>BRK, WAS>IND
2030 2 PHL>NYK, POR>WAS, MIL>ORL, CLE>SAN, BOS>BRK, LAC>UTH, MEM>MIN, MIA>OKC, CHA>BOS, SAC>SAN, NYK>ATL, LAL>BRK, DAL>BRK, DEN>OKC, TOR>LAC, HOU>OKC, PHX>WAS, MIN>DET, WAS>PHL
2031 2 MIL>CHA, CLE>BOS, ATL>OKC, CHA>CHI, SAC>SAN, NYK>CHI, LAL>BRK, DAL>DET, DEN>CHA, TOR>NOP, HOU>BOS, PHX>CHA, WAS>LAL
2032 2 ATL>OKC, LAL>ATL, DAL>NYK, DEN>BRK, MIA>BRK, TOR>BRK, MIL>CHA, WAS>LAL, SAC>DEN, CLE>UTH, UTH>WAS, HOU>PHX, GOS>MEM
2033 2 MIA>MIL, SAC>ATL, TOR>LAC, PHX>NYK
`;
// Two-team swaps: the first team gets the better of the two picks, the second the worse. (Multi-team and conditional ones are left out.)
export const SWAPS = [
  { yr: 2027, rd: 1, best: 'HOU', worst: 'BRK' }, { yr: 2027, rd: 1, best: 'OKC', worst: 'LAC' },
  { yr: 2028, rd: 1, best: 'POR', worst: 'MIL' }, { yr: 2028, rd: 1, best: 'UTH', worst: 'CLE' }, { yr: 2028, rd: 1, best: 'SAN', worst: 'BOS' },
  { yr: 2028, rd: 1, best: 'BRK', worst: 'NYK' }, { yr: 2028, rd: 1, best: 'OKC', worst: 'DAL' }, { yr: 2028, rd: 1, best: 'WAS', worst: 'PHX' },
  { yr: 2029, rd: 1, best: 'PHL', worst: 'LAC' }, { yr: 2029, rd: 1, best: 'MEM', worst: 'ORL' },
  { yr: 2030, rd: 1, best: 'POR', worst: 'MIL' }, { yr: 2030, rd: 1, best: 'UTH', worst: 'LAL' }, { yr: 2030, rd: 1, best: 'SAN', worst: 'DAL' },
  { yr: 2030, rd: 1, best: 'WAS', worst: 'PHX' }, { yr: 2030, rd: 2, best: 'ORL', worst: 'NOP' },
  { yr: 2031, rd: 1, best: 'SAN', worst: 'SAC' }, { yr: 2031, rd: 2, best: 'ORL', worst: 'NOP' },
  { yr: 2032, rd: 2, best: 'PHL', worst: 'MEM' },
];
// Dead cap that is really on a team's books: Damian Lillard, waived and stretched by Milwaukee (about $21.3M a
// year after the set-off from his Portland deal, rounded down to $21M), five seasons: 2025-26 through 2029-30.
// Bradley Beal, bought out and stretched by Phoenix: $22M a season, 2025-26 through 2029-30 (this season and three
// more). `yr` is the first season's ending year.
export const REAL_DEAD = [
  { team: 'MIL', name: 'Damian Lillard', sal: 21, yr: 2026, yrs: 5, tag: 'real:lillard' },
  { team: 'PHX', name: 'Bradley Beal', sal: 22, yr: 2026, yrs: 5, tag: 'real:beal' },
];
// Forfeited first-rounders (the Clippers' scandal penalty): these picks don't exist, so they're taken out.
// IND's 2029 first was owed to LAC and goes with it.
export const FORFEITED = [{ yr: 2029, rd: 1, team: 'IND' }, { yr: 2030, rd: 1, team: 'LAC' }, { yr: 2031, rd: 1, team: 'LAC' }, { yr: 2032, rd: 1, team: 'LAC' }, { yr: 2033, rd: 1, team: 'LAC' }];
export const REAL_PICKS = DATA.trim().split('\n').flatMap(line => {
  const [yr, rd, ...rest] = line.trim().split(' ');
  return rest.join(' ').split(',').map(s => s.trim()).filter(Boolean).map(s => {
    const [mv, t] = s.split(' ');
    const [from, to] = mv.split('>');
    return { yr: +yr, rd: +rd, from, to, top: t ? (t.slice(1) === 'L' ? 99 : +t.slice(1)) : 0 };
  });
});

// The list as an earlier version had it. A pick it placed that the list above now puts elsewhere (or leaves home) was the
// app's doing, not a trade made in the game, so applying the real picks again moves it to where it belongs.
const PREV_DATA = `
2027 1 ATL>SAN, NYK>BRK, DAL>CHA, MIA>CHA, LAL>MEM, PHX>HOU
2028 1 ORL>POR
2029 1 NYK>BRK, LAL>DAL, IND>LAC
2030 1 ORL>MEM, GOS>MEM
2031 1 PHL>BOS, CLE>DEN, MIA>MIL, PHX>MEM, NYK>BRK, MIN>SAC, LAL>UTH, TOR>LAC
2032 1 DEN>BRK
2033 1 MIN>CHA, PHX>CHA, MIA>MIL, LAL>UTH, TOR>LAC
2027 2 CHI>OKC, CLE>CHI, MEM>CHA, WAS>NYK, DEN>UTH, LAC>UTH, UTH>IND, MIN>POR
2028 2 ATL>BRK, MEM>BRK, HOU>CHA, ORL>CHA, DAL>LAC, MIN>DEN, NOP>SAN, CLE>UTH, UTH>OKC, NYK>DET, SAC>POR
2029 2 CLE>ATL, BOS>OKC, DAL>BRK, GOS>BRK, MEM>BRK, HOU>MEM, LAL>MEM, POR>MEM, LAC>SAN, NOP>SAN, PHX>NYK, SAC>NYK
2030 2 ATL>OKC, NYK>ATL, BOS>BRK, DAL>BRK, LAL>BRK, CLE>SAN, MIL>ORL, MIN>OKC, SAC>SAN, PHL>NYK, TOR>LAC
2031 2 DAL>DET, DET>OKC, LAL>BRK, WAS>LAL, MIL>CHA, PHX>CHA, DEN>CHI, NYK>CHI, SAC>DEN, TOR>NOP
2032 2 ATL>OKC, LAL>OKC, DAL>NYK, DEN>BRK, MIA>BRK, TOR>BRK, MIL>CHA, MIN>CHA, WAS>LAL, SAC>DEN, CLE>UTH
2033 2 SAC>ATL, DAL>WAS, WAS>MEM, OKC>MEM, HOU>CHA, MIN>CHA, MIA>MIL, PHX>NYK, TOR>LAC
`;
// Swaps an earlier version had that aren't real: dropped from a save's swap ledger when the real picks are applied again.
export const PREV_SWAPS_GONE = [{ yr: 2028, rd: 1, best: 'CHA', worst: 'MIN' }, { yr: 2030, rd: 2, best: 'CHI', worst: 'IND' }];
const parse = text => text.trim().split('\n').flatMap(line => {
  const [yr, rd, ...rest] = line.trim().split(' ');
  return rest.join(' ').split(',').map(x => x.trim()).filter(Boolean).map(x => { const [from, to] = x.split(' ')[0].split('>'); return { yr: +yr, rd: +rd, from, to }; });
});
const PREV_PICKS = parse(PREV_DATA);

// The real trade behind each pick above and each swap (keyed "year round FROM>TO", a swap by the team that gives up the
// better pick > the team that holds the right): shown on Draft Capital.
const NOTES = {
  '2027 1 ATL>SAN': "The Dejounte Murray–Danilo Gallinari trade (June 2022)",
  '2027 1 NYK>BRK': "The Mikal Bridges–Bojan Bogdanovic trade (July 2024)",
  '2027 1 DAL>CHA': "The P.J. Washington–Grant Williams trade (Feb 2024)",
  '2027 1 MIA>CHA': "The Terry Rozier–Kyle Lowry trade (Jan 2024)",
  '2027 1 LAL>MEM': "The Jaren Jackson Jr.–Walter Clayton Jr. trade (Feb 2026)",
  '2027 1 PHX>HOU': "A pick deal with the Nets (June 2024)",
  '2027 1 PHL>BRK': "The James Harden–Ben Simmons trade (Feb 2022)",
  '2027 1 MIL>NOP': "The Jrue Holiday–Eric Bledsoe trade (Nov 2020)",
  '2027 1 NOP>ATL': "The Dejounte Murray–Larry Nance Jr. trade (July 2024)",
  '2027 1 UTH>MEM': "The Jaren Jackson Jr.–Walter Clayton Jr. trade (Feb 2026)",
  '2027 1 CLE>PHX': "A pick deal with the Jazz (Jan 2025)",
  '2027 1 MIN>UTH': "The Rudy Gobert–Malik Beasley trade (July 2022)",
  '2027 1 DEN>OKC': "The Peyton Watson–JaMychal Green trade (June 2022)",
  '2027 1 SAN>OKC': "The Nique Clifford draft-rights deal (June 2025)",
  '2028 1 ORL>POR': "The Cedric Coward–Yang Hansen draft-rights deal (June 2025)",
  '2028 1 LAC>PHL': "The James Harden–Robert Covington trade (Nov 2023)",
  '2029 1 NYK>BRK': "The Mikal Bridges–Bojan Bogdanovic trade (July 2024)",
  '2029 1 LAL>DAL': "The Luka Doncic–Anthony Davis trade (Feb 2025)",
  '2029 1 IND>LAC': "The Ivica Zubac–Bennedict Mathurin trade (Feb 2026)",
  '2029 1 MIL>POR': "The Damian Lillard–Jrue Holiday trade (Sept 2023)",
  '2029 1 BOS>POR': "The Jrue Holiday–Robert Williams III trade (Oct 2023)",
  '2029 1 POR>WAS': "The Deni Avdija–Malcolm Brogdon trade (July 2024)",
  '2029 1 CLE>PHX': "The Grayson Allen–Miles Bridges trade (July 2026)",
  '2029 1 MIN>UTH': "The Donovan Mitchell–Lauri Markkanen trade (Sept 2022)",
  '2029 1 DAL>HOU': "A pick deal with the Nets (June 2024)",
  '2029 1 PHX>BRK': "The Kevin Durant–Mikal Bridges trade (Feb 2023)",
  '2029 1 DEN>OKC': "The Hunter Tyson draft-rights deal (June 2023)",
  '2030 1 ORL>MEM': "The Desmond Bane–Cole Anthony trade (June 2025)",
  '2030 1 GOS>DAL': "The Anthony Davis–Khris Middleton trade (Feb 2026)",
  '2031 1 CLE>DEN': "The Peyton Watson–Julian Reese trade (Aug 2026)",
  '2031 1 MIA>MIL': "The Giannis Antetokounmpo–Tyler Herro trade (July 2026)",
  '2031 1 PHX>MEM': "The Jaren Jackson Jr.–Walter Clayton Jr. trade (Feb 2026)",
  '2031 1 NYK>BRK': "The Mikal Bridges–Bojan Bogdanovic trade (July 2024)",
  '2031 1 MIN>SAC': "The De'Aaron Fox–Zach LaVine trade (Feb 2025)",
  '2031 1 LAL>UTH': "The Walker Kessler trade (July 2026)",
  '2031 1 TOR>LAC': "The Kawhi Leonard–Brandon Ingram trade (Sept 2026)",
  '2032 1 DEN>BRK': "The Cameron Johnson–Michael Porter Jr. trade (July 2025)",
  '2033 1 PHX>CHA': "The Miles Bridges–Grayson Allen trade (July 2026)",
  '2033 1 MIA>MIL': "The Giannis Antetokounmpo–Tyler Herro trade (July 2026)",
  '2033 1 LAL>UTH': "The Walker Kessler trade (July 2026)",
  '2033 1 TOR>LAC': "The Kawhi Leonard–Brandon Ingram trade (Sept 2026)",
  '2027 2 MIN>POR': "The Tyler Kolek–Dani Diez draft-rights deal (June 2024)",
  '2027 2 DAL>WAS': "The Monte Morris trade (July 2023)",
  '2027 2 DEN>UTH': "The John Tonje–Chris Boucher trade (Feb 2026)",
  '2027 2 CHA>SAC': "The De'Aaron Fox–Zach LaVine trade (Feb 2025)",
  '2027 2 MIA>PHL': "The Jared McCain trade (Feb 2026)",
  '2027 2 NOP>CHA': "The Jalen McDaniels–Sviatoslav Mykhailiuk trade (Feb 2023)",
  '2027 2 ORL>UTH': "The R.J. Luis–Georges Niang trade (Aug 2025)",
  '2027 2 IND>NOP': "The Jose Alvarado–Dalen Terry trade (Feb 2026)",
  '2027 2 PHX>LAC': "The Johni Broome trade (July 2026)",
  '2027 2 BRK>DET': "The Jahlil Okafor–DeAndre Jordan trade (Sept 2021)",
  '2027 2 MIL>DET': "The K.J. Martin trade (Feb 2025)",
  '2027 2 UTH>IND': "The Caris LeVert–Ricky Rubio trade (Feb 2022)",
  '2027 2 CHI>OKC': "The Luguentz Dort trade (July 2026)",
  '2027 2 LAC>UTH': "The John Collins–Kevin Love trade (July 2025)",
  '2027 2 WAS>NYK': "The Ousmane Dieng draft-rights deal (June 2022)",
  '2027 2 CLE>CHI': "The Ayo Dosunmu–Rob Dillingham trade (Feb 2026)",
  '2027 2 GOS>WAS': "The Chris Paul–Patrick Baldwin Jr. trade (July 2023)",
  '2027 2 OKC>NYK': "The Dillon Jones draft-rights deal (July 2024)",
  '2027 2 BOS>PHX': "The Grayson Allen–Miles Bridges trade (July 2026)",
  '2027 2 LAL>BRK': "The Dorian Finney-Smith–D'Angelo Russell trade (Dec 2024)",
  '2027 2 POR>HOU': "The Jaden Springer trade (Feb 2025)",
  '2027 2 MEM>HOU': "The Patty Mills–Dillon Brooks trade (July 2023)",
  '2027 2 HOU>MIA': "The Max Strus trade (July 2023)",
  '2028 2 POR>WAS': "The Deni Avdija–Malcolm Brogdon trade (July 2024)",
  '2028 2 MIL>PHL': "The Jared McCain trade (Feb 2026)",
  '2028 2 CLE>UTH': "The Jock Landale–Lonzo Ball trade (Feb 2026)",
  '2028 2 BOS>NYK': "The Oso Ighodaro–Kevin McCullar Jr. draft-rights deal (June 2024)",
  '2028 2 LAC>CHA': "The Mason Plumlee–Reggie Jackson trade (Feb 2023)",
  '2028 2 MEM>BRK': "The Royce O'Neale–Keita Bates-Diop trade (Feb 2024)",
  '2028 2 ATL>BRK': "The De'Anthony Melton trade (Dec 2024)",
  '2028 2 MIA>DET': "The Quentin Grimes–Tim Hardaway Jr. trade (July 2024)",
  '2028 2 UTH>OKC': "The Derrick Favors trade (July 2021)",
  '2028 2 SAC>POR': "The Cedric Coward–Yang Hansen draft-rights deal (June 2025)",
  '2028 2 NYK>DET': "The Alec Burks–Evan Fournier trade (Feb 2024)",
  '2028 2 LAL>ORL': "A pick deal with the Lakers (June 2022)",
  '2028 2 ORL>CHA': "The Tyus Jones trade (Feb 2026)",
  '2028 2 DAL>LAC': "The Ivica Zubac–Bennedict Mathurin trade (Feb 2026)",
  '2028 2 DEN>WAS': "The Jonas Valanciunas–Sidy Cissoko trade (Feb 2025)",
  '2028 2 PHX>IND': "The Bilal Coulibaly–Jarace Walker draft-rights deal (June 2023)",
  '2028 2 IND>NYK': "The Obi Toppin trade (July 2023)",
  '2028 2 NOP>SAN': "The Josh Richardson–Devonte' Graham trade (Feb 2023)",
  '2028 2 DET>PHL': "The Danuel House Jr. trade (Feb 2024)",
  '2028 2 OKC>PHL': "The Jared McCain trade (Feb 2026)",
  '2028 2 MIN>SAN': "The Leonard Miller draft-rights deal (June 2023)",
  '2028 2 GOS>PHL': "The Reggie Jackson–Jared Butler trade (Feb 2025)",
  '2028 2 WAS>LAL': "The Kentavious Caldwell-Pope–Russell Westbrook trade (Aug 2021)",
  '2029 2 POR>MEM': "The Jay Huff trade (July 2025)",
  '2029 2 MIL>DET': "The Joe Harris trade (July 2023)",
  '2029 2 CLE>ATL': "The De'Andre Hunter–Caris LeVert trade (Feb 2025)",
  '2029 2 BOS>OKC': "The Mike Muscala–Justin Jackson trade (Feb 2023)",
  '2029 2 LAC>SAN': "The Doug McDermott–Marcus Morris trade (Feb 2024)",
  '2029 2 MEM>BRK': "The Royce O'Neale–Keita Bates-Diop trade (Feb 2024)",
  '2029 2 ATL>OKC': "The Vit Krejci–Maurice \"Moe\" Harkless trade (Sept 2022)",
  '2029 2 MIA>OKC': "The Victor Oladipo trade (July 2023)",
  '2029 2 SAC>HOU': "The Cam Whitmore–Mojave King trade (July 2025)",
  '2029 2 NYK>DET': "The Alec Burks–Evan Fournier trade (Feb 2024)",
  '2029 2 LAL>WAS': "The Rui Hachimura–Kendrick Nunn trade (Jan 2023)",
  '2029 2 DAL>BRK': "The Kyrie Irving–Spencer Dinwiddie trade (Feb 2023)",
  '2029 2 DEN>CHA': "The Josh Green trade (July 2024)",
  '2029 2 NOP>SAN': "The Josh Richardson–Devonte' Graham trade (Feb 2023)",
  '2029 2 HOU>DAL': "The Anthony Davis–Khris Middleton trade (Feb 2026)",
  '2029 2 PHX>CHA': "A pick deal with the Thunder (Feb 2025)",
  '2029 2 GOS>BRK': "The De'Anthony Melton trade (Dec 2024)",
  '2029 2 WAS>IND': "The Bilal Coulibaly–Jarace Walker draft-rights deal (June 2023)",
  '2030 2 PHL>NYK': "The Cameron Carr–Tyler Nickel draft-rights deal (June 2026)",
  '2030 2 POR>WAS': "The Deni Avdija–Malcolm Brogdon trade (July 2024)",
  '2030 2 MIL>ORL': "The Andre Jackson Jr. draft-rights deal (June 2023)",
  '2030 2 CLE>SAN': "The Cedi Osman trade (July 2023)",
  '2030 2 BOS>BRK': "The Adou Thiero draft-rights deal (July 2025)",
  '2030 2 LAC>UTH': "The Drew Eubanks–P.J. Tucker trade (Feb 2025)",
  '2030 2 MEM>MIN': "The Wendell Moore Jr. trade (July 2024)",
  '2030 2 MIA>OKC': "The Victor Oladipo trade (July 2023)",
  '2030 2 CHA>BOS': "The Xavier Tillman trade (Feb 2026)",
  '2030 2 SAC>SAN': "The Kam Jones draft-rights deal (July 2025)",
  '2030 2 NYK>ATL': "The Vit Krejci–Duop Reath trade (Feb 2026)",
  '2030 2 LAL>BRK': "The Dorian Finney-Smith–D'Angelo Russell trade (Dec 2024)",
  '2030 2 DAL>BRK': "The Mamadi Diakite–Ziaire Williams trade (July 2024)",
  '2030 2 DEN>OKC': "A pick deal with the Hornets (Feb 2025)",
  '2030 2 TOR>LAC': "The Kawhi Leonard–Brandon Ingram trade (Sept 2026)",
  '2030 2 HOU>OKC': "The Patty Mills trade (July 2023)",
  '2030 2 PHX>WAS': "The Bradley Beal–Chris Paul trade (June 2023)",
  '2030 2 MIN>DET': "The Monte Morris–Troy Brown Jr. trade (Feb 2024)",
  '2030 2 WAS>PHL': "The Reggie Jackson–Jared Butler trade (Feb 2025)",
  '2031 2 MIL>CHA': "The Vasilije Micic–Pat Connaughton trade (July 2025)",
  '2031 2 CLE>BOS': "The Kristaps Porzingis–Georges Niang trade (July 2025)",
  '2031 2 ATL>OKC': "The Luguentz Dort trade (July 2026)",
  '2031 2 CHA>CHI': "The Coby White–Collin Sexton trade (Feb 2026)",
  '2031 2 SAC>SAN': "The Jalen McDaniels trade (Oct 2024)",
  '2031 2 NYK>CHI': "The Coby White–Collin Sexton trade (Feb 2026)",
  '2031 2 LAL>BRK': "The Dorian Finney-Smith–D'Angelo Russell trade (Dec 2024)",
  '2031 2 DAL>DET': "The K.J. Martin trade (Feb 2025)",
  '2031 2 DEN>CHA': "The Nick Richards–Josh Okogie trade (Jan 2025)",
  '2031 2 TOR>NOP': "The Brandon Ingram–Bruce Brown trade (Feb 2025)",
  '2031 2 HOU>BOS': "The Jaden Springer trade (Feb 2025)",
  '2031 2 PHX>CHA': "The Nick Richards–Josh Okogie trade (Jan 2025)",
  '2031 2 WAS>LAL': "The DeAndre Ayton–Jaden Hardy trade (July 2026)",
  '2032 2 ATL>OKC': "The Luguentz Dort trade (July 2026)",
  '2032 2 LAL>ATL': "The Luke Kennard–Gabe Vincent trade (Feb 2026)",
  '2032 2 DAL>NYK': "The Cameron Carr–Tyler Nickel draft-rights deal (June 2026)",
  '2032 2 DEN>BRK': "The Hunter Tyson trade (Feb 2026)",
  '2032 2 MIA>BRK': "The Haywood Highsmith trade (Aug 2025)",
  '2032 2 TOR>BRK': "The Vanja Marinkovic–Ochai Agbaji trade (Feb 2026)",
  '2032 2 MIL>CHA': "The Vasilije Micic–Pat Connaughton trade (July 2025)",
  '2032 2 WAS>LAL': "The DeAndre Ayton–Jaden Hardy trade (July 2026)",
  '2032 2 SAC>DEN': "The Peyton Watson–Julian Reese trade (Aug 2026)",
  '2032 2 CLE>UTH': "The Jock Landale–Lonzo Ball trade (Feb 2026)",
  '2032 2 UTH>WAS': "The Walter Clayton Jr.–Will Riley draft-rights deal (June 2025)",
  '2032 2 HOU>PHX': "The Kevin Durant–Jalen Green trade (July 2025)",
  '2032 2 GOS>MEM': "The Will Richard–Jahmai Mashack draft-rights deal (July 2025)",
  '2033 2 MIA>MIL': "The Giannis Antetokounmpo–Tyler Herro trade (July 2026)",
  '2033 2 SAC>ATL': "The Alpha Kaba–Devin Carter trade (June 2026)",
  '2033 2 TOR>LAC': "The Kawhi Leonard–Brandon Ingram trade (Sept 2026)",
  '2033 2 PHX>NYK': "The Cameron Carr–Tyler Nickel draft-rights deal (June 2026)",
  '2027 1 BRK>HOU': "The James Harden–Victor Oladipo trade (Jan 2021)",
  '2027 1 LAC>OKC': "A pick deal (Nov 2023)",
  '2028 1 MIL>POR': "The Damian Lillard–Jrue Holiday trade (Sept 2023)",
  '2028 1 CLE>UTH': "The Donovan Mitchell–Lauri Markkanen trade (Sept 2022)",
  '2028 1 BOS>SAN': "The Derrick White–Josh Richardson trade (Feb 2022)",
  '2028 1 NYK>BRK': "The Mikal Bridges–Bojan Bogdanovic trade (July 2024)",
  '2028 1 DAL>OKC': "A pick deal with the Mavericks (Feb 2024)",
  '2028 1 PHX>WAS': "The Bradley Beal–Chris Paul trade (June 2023)",
  '2029 1 LAC>PHL': "The James Harden–Robert Covington trade (Nov 2023)",
  '2029 1 ORL>MEM': "The Desmond Bane–Cole Anthony trade (June 2025)",
  '2030 1 MIL>POR': "The Damian Lillard–Jrue Holiday trade (Sept 2023)",
  '2030 1 LAL>UTH': "The Walker Kessler trade (July 2026)",
  '2030 1 DAL>SAN': "The Reggie Bullock trade (July 2023)",
  '2030 1 PHX>WAS': "The Bradley Beal–Chris Paul trade (June 2023)",
  '2030 2 NOP>ORL': "The Antonio Reeves trade (June 2024)",
  '2031 1 SAC>SAN': "The RaiQuan Gray–Harrison Barnes trade (July 2024)",
  '2031 2 NOP>ORL': "The Antonio Reeves trade (June 2024)",
  '2032 2 MEM>PHL': "The Eric Gordon–Justinian Jessup trade (Feb 2026)",
};

// The real trade a pick came in (the code for a team, then the note), or '' when this pick isn't one of the real ones
// where it sits now (a pick traded in the game).
export function codeOf(L, team) { return Object.keys(TEAMS).find(c => teamFor(L, c) === team) || null; }
export function tradeNote(L, yr, rd, fromTeam, toTeam) {
  const a = fromTeam && codeOf(L, fromTeam), b = toTeam && codeOf(L, toTeam);
  return (a && b && NOTES[`${yr} ${rd} ${a}>${b}`]) || '';
}

// The team in a file that a code stands for, matched by name (city + nickname), then nickname, then abbreviation.
export function teamFor(L, code) {
  const [full, nick] = TEAMS[code];
  const norm = s => String(s || '').trim().toLowerCase();
  const name = t => norm(`${t.city || ''} ${t.name || ''}`);
  return L.teams.find(t => name(t) === norm(full))
    || L.teams.find(t => norm(t.name) === norm(nick) || ALT[name(t)] === code)
    || L.teams.find(t => t.shortName === (SHORT[code] || code)) || null;
}

// Put every team's own picks in the file for these years (a league file lists only some of them).
export function fillDefaultPicks(L, years, rounds = [1, 2]) {
  const have = new Set(L.teams.flatMap(t => (t.draftPicks || []).map(p => `${p.yr}:${p.rd}:${p.otid}`)));
  let made = 0;
  for (const t of L.teams) {
    t.draftPicks ||= [];
    for (const yr of years) for (const rd of rounds) {
      if (have.has(`${yr}:${rd}:${t.id}`)) continue;
      t.draftPicks.push({ pk: 0, rd, tid: t.id, otid: t.id, yr });
      made++;
    }
  }
  return made;
}

// Apply the real assignments to a file's picks. Returns { moved, kept, voided, protections: [{ otid, yr, top, from }], missing }.
// `force` is for a clean file: nothing in it was traded in a game, so every pick goes where the real deal says, wherever it sits.
export function applyRealPicks(L, { years = null, force = false } = {}) {
  const out = { moved: 0, kept: 0, missing: 0, voided: 0, corrected: 0, protections: [], swaps: [] };
  const holderOf = (otid, yr, rd) => {
    for (const t of L.teams) { const pk = (t.draftPicks || []).find(p => p.otid === otid && p.yr === yr && p.rd === rd); if (pk) return { t, pk }; }
    return null;
  };
  // A pick an earlier version of the list placed, where the list now says otherwise: back to its own team first (the
  // loop below then sends it where it belongs now).
  for (const r of PREV_PICKS) {
    if (years && !years.includes(r.yr)) continue;
    const now = REAL_PICKS.find(x => x.yr === r.yr && x.rd === r.rd && x.from === r.from);
    if (now && now.to === r.to) continue;
    const X = teamFor(L, r.from), P = teamFor(L, r.to), at = X && P && holderOf(X.id, r.yr, r.rd);
    if (!at || at.t !== P) continue;
    at.t.draftPicks.splice(at.t.draftPicks.indexOf(at.pk), 1);
    at.pk.tid = X.id;
    X.draftPicks.push(at.pk);
    out.corrected++;
  }
  for (const r of REAL_PICKS) {
    if (years && !years.includes(r.yr)) continue;
    const X = teamFor(L, r.from), Z = teamFor(L, r.to);
    if (!X || !Z) { out.missing++; continue; }
    const at = holderOf(X.id, r.yr, r.rd);
    if (!at) { out.missing++; continue; }
    if ((at.t === X || force) && at.t !== Z) {
      at.t.draftPicks.splice(at.t.draftPicks.indexOf(at.pk), 1);
      at.pk.tid = Z.id;
      Z.draftPicks.push(at.pk);
      out.moved++;
    } else if (at.t !== Z) { out.kept++; continue; }          // traded in the game: honored as it stands, unprotected
    if (r.top && r.rd === 1) out.protections.push({ otid: X.id, yr: r.yr, top: r.top, from: X.id });
  }
  // A swap needs both picks with their original teams (or a clean file), each pick in only one swap.
  for (const w of SWAPS) {
    if (years && !years.includes(w.yr)) continue;
    const X = teamFor(L, w.best), Y = teamFor(L, w.worst);
    const hx = X && holderOf(X.id, w.yr, w.rd), hy = Y && holderOf(Y.id, w.yr, w.rd);
    if (!hx || !hy) { out.missing++; continue; }
    if (!force && (hx.t !== X || hy.t !== Y)) { out.kept++; continue; }
    out.swaps.push({ yr: w.yr, rd: w.rd, a: hx.t.id, b: hy.t.id, x: X.id, y: Y.id, mode: 'best' });
  }
  for (const f of FORFEITED) {
    if (years && !years.includes(f.yr)) continue;
    const X = teamFor(L, f.team);
    const at = X && holderOf(X.id, f.yr, f.rd);
    // Still with its team, or with the team the real deal sent it to (IND's 2029 first, owed to the Clippers): void it.
    const owedTo = REAL_PICKS.filter(r => r.from === f.team && r.yr === f.yr && r.rd === f.rd).map(r => teamFor(L, r.to));
    if (at && (at.t === X || owedTo.includes(at.t) || force)) { at.t.draftPicks.splice(at.t.draftPicks.indexOf(at.pk), 1); out.voided++; }
  }
  return out;
}
