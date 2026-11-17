// Real NBA rivalries to start a save with (2026-27 rosters): each team's top three, the three most recent events behind
// each, newest first. The app's own rivalries (playoff series, big trades) build on top of these from there.
// [rival, [[year, what happened], ...]]
export const REAL_RIVALS = {
  ATL: [['WAS', [[2026, 'Trae Young was traded to Washington']]], ['NYK', [[2021, 'Trae and the Hawks took the Knicks out in the first round']]], ['BOS', [[2023, 'Boston beat Atlanta in the first round']]]],
  BOS: [['PHI', [[2026, 'Jaylen Brown left for Philadelphia: Tatum and Brown on opposite sides'], [2023, 'Boston won the East semifinals in seven']]], ['NYK', [[2025, 'New York knocked Boston out in the East semifinals']]], ['MIA', [[2024, 'Boston beat Miami in the first round'], [2023, 'Miami won the East finals in seven'], [2022, 'Boston won the East finals in seven']]]],
  BKN: [['NYK', [[2026, 'The crosstown rivalry']]], ['MIN', [[2026, 'Julius Randle came over from Minnesota']]], ['BOS', [[2022, 'Boston swept Brooklyn in the first round']]]],
  CHA: [['MIN', [[2026, 'LaMelo Ball was traded to Minnesota']]], ['ORL', [[2026, 'Southeast Division rivals']]], ['MIA', [[2026, 'Southeast Division rivals']]]],
  CHI: [['MIL', [[2022, 'Milwaukee beat Chicago in the first round']]], ['SAC', [[2025, 'Zach LaVine was traded to Sacramento']]], ['DET', [[2026, 'Central Division rivals']]]],
  CLE: [['IND', [[2025, 'Indiana knocked Cleveland out in the East semifinals']]], ['BOS', [[2024, 'Boston beat Cleveland in the East semifinals']]], ['ORL', [[2024, 'Cleveland won their first-round series in seven']]]],
  DAL: [['LAL', [[2025, 'Luka Dončić was traded to the Lakers']]], ['BOS', [[2024, 'Boston beat Dallas in the Finals']]], ['MIN', [[2024, 'Dallas beat Minnesota in the West finals']]]],
  DEN: [['OKC', [[2025, 'Oklahoma City won the West semifinals in seven']]], ['MIN', [[2024, 'Minnesota came back to win the West semifinals in seven']]], ['LAL', [[2024, 'Denver beat the Lakers in the first round'], [2023, 'Denver swept the Lakers in the West finals']]]],
  DET: [['NYK', [[2025, 'New York beat Detroit in the first round']]], ['CLE', [[2026, 'Central Division rivals']]], ['IND', [[2026, 'Central Division rivals']]]],
  GSW: [['HOU', [[2025, 'Golden State won their first-round series in seven']]], ['MIN', [[2025, 'Minnesota beat Golden State in the West semifinals']]], ['MIA', [[2025, 'Jimmy Butler came over from Miami']]]],
  HOU: [['GSW', [[2025, 'Golden State won their first-round series in seven']]], ['PHX', [[2025, 'Kevin Durant came over from Phoenix']]], ['DAL', [[2026, 'The Texas rivalry']]]],
  IND: [['NYK', [[2025, 'Indiana beat New York in the East finals'], [2024, 'Indiana won the East semifinals in seven']]], ['OKC', [[2025, 'Oklahoma City won the Finals in seven']]], ['MIL', [[2025, 'Myles Turner left for Milwaukee'], [2025, 'Indiana beat Milwaukee in the first round'], [2024, 'Indiana beat Milwaukee in the first round']]]],
  LAC: [['DEN', [[2025, 'Denver won their first-round series in seven']]], ['DAL', [[2024, 'Dallas beat the Clippers in the first round']]], ['LAL', [[2026, 'The hallway rivalry']]]],
  LAL: [['DAL', [[2025, 'Luka Dončić came over from Dallas']]], ['DEN', [[2024, 'Denver beat the Lakers in the first round'], [2023, 'Denver swept the Lakers in the West finals']]], ['MIN', [[2025, 'Minnesota beat the Lakers in the first round']]]],
  MEM: [['OKC', [[2025, 'Oklahoma City swept Memphis in the first round']]], ['POR', [[2026, 'Ja Morant was traded to Portland']]], ['UTA', [[2026, 'Jaren Jackson Jr. was traded to Utah']]]],
  MIA: [['BOS', [[2024, 'Boston beat Miami in the first round'], [2023, 'Miami won the East finals in seven'], [2022, 'Boston won the East finals in seven']]], ['NYK', [[2023, 'Miami beat New York in the East semifinals']]], ['GSW', [[2025, 'Jimmy Butler was traded to Golden State']]]],
  MIL: [['IND', [[2025, 'Myles Turner came over from Indiana'], [2025, 'Indiana beat Milwaukee in the first round'], [2024, 'Indiana beat Milwaukee in the first round']]], ['BOS', [[2022, 'Boston won the East semifinals in seven']]], ['POR', [[2025, 'Damian Lillard went back to Portland']]]],
  MIN: [['DEN', [[2024, 'Minnesota came back to win the West semifinals in seven']]], ['OKC', [[2025, 'Oklahoma City beat Minnesota in the West finals']]], ['DAL', [[2024, 'Dallas beat Minnesota in the West finals']]]],
  NOP: [['OKC', [[2024, 'Oklahoma City swept New Orleans in the first round']]], ['PHX', [[2022, 'Phoenix beat New Orleans in the first round']]], ['MEM', [[2026, 'Southwest Division rivals']]]],
  NYK: [['IND', [[2025, 'Indiana beat New York in the East finals'], [2024, 'Indiana won the East semifinals in seven']]], ['BOS', [[2025, 'New York knocked Boston out in the East semifinals']]], ['BKN', [[2026, 'The crosstown rivalry']]]],
  OKC: [['DEN', [[2025, 'Oklahoma City won the West semifinals in seven']]], ['IND', [[2025, 'Oklahoma City won the Finals in seven']]], ['MIN', [[2025, 'Oklahoma City beat Minnesota in the West finals']]]],
  ORL: [['CLE', [[2024, 'Cleveland won their first-round series in seven']]], ['BOS', [[2025, 'Boston beat Orlando in the first round']]], ['MEM', [[2025, 'Desmond Bane came over from Memphis']]]],
  PHI: [['BOS', [[2026, 'Jaylen Brown came over from Boston'], [2023, 'Boston won the East semifinals in seven']]], ['NYK', [[2024, 'New York beat Philadelphia in the first round']]], ['MIA', [[2022, 'Miami beat Philadelphia in the East semifinals']]]],
  PHX: [['DAL', [[2022, 'Dallas won the West semifinals in seven']]], ['DEN', [[2023, 'Denver beat Phoenix in the West semifinals']]], ['HOU', [[2025, 'Kevin Durant was traded to Houston']]]],
  POR: [['MEM', [[2026, 'Ja Morant came over from Memphis']]], ['MIL', [[2025, 'Damian Lillard came home from Milwaukee']]], ['UTA', [[2026, 'Northwest Division rivals']]]],
  SAC: [['GSW', [[2023, 'Golden State won their first-round series in seven']]], ['SAS', [[2025, "De'Aaron Fox was traded to San Antonio"]]], ['CHI', [[2025, 'Zach LaVine came over from Chicago']]]],
  SAS: [['SAC', [[2025, "De'Aaron Fox came over from Sacramento"]]], ['HOU', [[2026, 'The Texas rivalry']]], ['DAL', [[2026, 'The Texas rivalry']]]],
  TOR: [['PHI', [[2022, 'Philadelphia beat Toronto in the first round']]], ['NYK', [[2024, 'OG Anunoby went to New York']]], ['BOS', [[2026, 'Atlantic Division rivals']]]],
  UTA: [['MEM', [[2026, 'Jaren Jackson Jr. came over from Memphis']]], ['MIN', [[2022, 'Rudy Gobert went to Minnesota']]], ['DAL', [[2022, 'Dallas beat Utah in the first round']]]],
  WAS: [['ATL', [[2026, 'Trae Young came over from Atlanta']]], ['DAL', [[2026, 'Anthony Davis came over from Dallas']]], ['PHX', [[2023, 'Bradley Beal was traded to Phoenix']]]],
};
// The All-Star Game host by season (the season's year: 2027 is 2026-27).
export const REAL_ASG_HOSTS = { 2027: 'PHX', 2028: 'MIA' };
