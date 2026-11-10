// The ? help: what the app adds that the game doesn't have (or barely uses). Keyed by screen title (the ? sits by
// the title) or by a section's heading (the ? sits on the section). A key matches a title or heading that starts
// with it. Only the app's own systems are explained here; ratings, potential and the rest of the game's own screens
// explain themselves.
const P = s => `<p class="small">${s}</p>`;

export const SCREEN_HELP = {
  'Draft Lottery': P('The lottery uses the format set in Settings (the NBA\'s, by default): the teams outside the playoffs, the worst records with the best odds. Until the balls are drawn, this year\'s lottery firsts can\'t be traded.'),
  'Mock Draft': P('Mock 1.0 comes out after the lottery from the scouting consensus. Mock 2.0 follows the combine: who rose, who fell and who dropped out of the first round. CPU teams draft close to the mocks, so they tell you who might be there at your pick.'),
  'Draft Room': P('Scouting: each team you run gets a few scouting trips. A scouted prospect\'s athletic ceilings come out early, his potential reads truer, and the scouts tell you how he\'ll measure, test and shoot at the combine.')
    + P('Grades, the big board and the projections are the league\'s read on the class, not the truth: workouts and the combine sharpen it.'),
  'Draft Combine': P('Measurements, athletic testing and shooting drills. Percentiles are against every prospect who has ever tested, not just this class, so a class\'s best usually land in the 80s and 90s and only a true outlier hits the 99th.')
    + P('Testing moves draft stock: a poor athletic test hurts more than a great one helps, and medical flags cost a little. Top prospects sometimes sit out, to protect their stock or save it for private workouts.'),
  'Private Workouts': P('Bring prospects in and ask three questions each. A workout reveals his true potential and the ceiling on every rating, and his answers show his personality. The number of slots per team is in Settings.'),
  'Prospect': P('<b>Ceilings</b> show as a range until you know them: wide at first, tighter after Mock 1.0, tighter again with a scouting trip and at the combine (the athletic ratings most), and exact after a private workout. The true ceiling can sit anywhere in the range.')
    + P('<b>Readiness</b> sets how much of the game\'s −4 draft drop (on every rating) a rookie wins back: <b>Ready now</b> −2, <b>1–2 years</b> −3, <b>Project</b> −4. It comes from his college production (60%) and his body (40%: frame and pedigree), each against his class at his position, plus maturity for older prospects.')
    + P('<b>Production</b> is his last college season against his class. When the save has no college stats for him, the app simulates a season from his ratings, his role in the class, his year in school and some luck, and marks it as simulated.'),
  'Draft Capital': P('Every pick you own and who owns yours. <b>Protections</b>: a protected pick (top 3, top 8 or lottery) that lands in its range stays with its original team. <b>Swaps</b>: the team with the right takes the better of the two picks. A ? beside a real-world pick names the trade it came from.')
    + P('A team values its own pick a little more (about 15%) when it\'s trying to trade for it back.'),
  'Options Deadline': P('Team and player options are decided here; a declined option sends the player to free agency. A <b>qualifying offer</b> makes your expiring young player a <b>restricted</b> free agent: you can match any offer he signs. Without one, he\'s unrestricted.'),
  'Extension Eligible': P('Players in the last year of their deal can be extended before free agency. What he asks comes from his value and his personality (money and loyalty). A no now isn\'t final: he can still re-sign in free agency.'),
  'Free Agency': P('Three weeks. <b>Week 1</b> is the main market. <b>Week 2</b> opens the mid-level exception for teams over the cap. <b>Week 3</b> is last call: asking prices drop, and anyone unsigned leaves his old team.')
    + P('Players weigh the money, winning, their role, loyalty to their old team and security, in amounts set by their personality. Pitch meetings can sway a close call. Your own free agents can be re-signed over the cap (Bird rights).'),
  'Rookie Numbers': P('Your rookies pick their jersey numbers.'),
  'Summer League': P('Rookies win back part of their draft drop by age (the youngest least), and the young cores play a short tournament in Las Vegas.'),
  'Team Meeting': P('Talk to players about their game. A talk changes his play-style tendencies (shoot more threes, attack the rim, move the ball and so on), not his ratings. Only players with something worth changing have a talk ready, and coachable players take it best.'),
  'Medical, Positions & Plans': P('<b>Surgery or rehab</b> for injured players: surgery clears what last season\'s injury would cost him (the potential risk, the lost work, the shorter career) but he starts the season on the injured list; rehab has him ready for opening night with the risk as it stands. <b>Positions</b>: move a player where his game fits; the app suggests moves. <b>Plans</b>: what each player works on before camp.'),
  'Progression Report': P('Offseason progression: young players earn rating points by age and minutes played, coachable players grow faster (stubborn ones slower), and nobody passes his potential\'s cap. Veterans past their peak start to decline, the injury-prone sooner.'),
  'Media Day': P('Jersey numbers, the season preview\'s top storylines and the press conference. What you say sets promises (minutes, a role, a contract) that players remember, and moves their mood.'),
  'GM Survey': P('Every GM in the league answers the preseason survey: title favorites, MVP, breakout players and more. The answers come from the rosters as they stand.'),
  'Preseason': P('Three exhibition games settle the camp battles. A starting battle is a bench player within reach of the starter at his own position; the winner starts. With no close battle, a <b>bench standout</b> plays himself into a bigger role and moves up to sixth man. The last roster spot is fought over too, and the loser is the cut. You can also stash a draft pick overseas or bring one home.'),
  'Camp Deals': P('Last call for one-year camp deals before final cuts. Players on them are cheap and easy to cut.'),
  'Final Cuts': P('Every team gets down to the roster limit before opening night. Cut players go to waivers; a multi-year deal you cut can be stretched to spread the dead money over more seasons.'),
  'Lineup & Minutes': P('Starters, the bench order and minutes for opening night. Minutes affect mood: players you promised minutes to at Media Day expect them, and stars and young players both want theirs.'),
  'Mentorship': P('Pair a veteran with a young player. The mentor passes on a skill, and over time a little of his character (work ethic, leadership).'),
  'Team Playbooks': P('Each team\'s offensive playbook. The app suggests the one that fits a roster best, and coaches have systems that fit some playbooks better than others.'),
  'Staff & Scheme': P('Your coach\'s system and how well the roster fits it. Pick the playbook that suits your players; a coach with a matching system gets more out of it.'),
  'Facilities': P('Spend coins on four facilities: <b>Medical</b> (injuries cost less), <b>Training</b> (faster progression), <b>Scouting</b> (truer reads and more workouts) and <b>Arena</b> (income, free agents and mood). Each tier lists exactly what it adds.'),
};

const TRAITS_HELP = P('Eight personality traits on a 1–20 scale. Only the ends (4 or lower, 16 or higher) earn a named tag, and those are the ones that really change how he acts.')
  + P('<b>Durability</b> (Injury-prone ↔ Ironman): how much lasting damage injuries do and how early he declines. <b>Winning</b> (Stat-Padder ↔ Competitor): wants a contender, takes less to win, frustrated in a rebuild. <b>Money</b> (Team-friendly ↔ Bag-Chaser): what he asks for and whether he holds out.')
  + P('<b>Loyalty</b> (Mercenary ↔ Committed): re-signing, trade requests, wanting a no-trade clause. <b>Motor</b> (Lazy ↔ Relentless): practice, camp, passing on work ethic. <b>Locker Room</b> (Cancer ↔ Leader): team chemistry, captains, calming big egos.')
  + P('<b>Ego</b> (Humble ↔ Alpha): wants the ball and a starring role, clashes with another Alpha. <b>Coachability</b> (Stubborn ↔ Coachable): grows ×0.8 to ×1.25 as fast. Traits can drift a point at a time with age, events and mentors.');

export const SECTION_HELP = {
  'Traits': TRAITS_HELP,
  'Personality': TRAITS_HELP,
  'Camp Battle': P('Two players at the same position for one starting spot. Camp and the preseason decide it; the winner starts on opening night.'),
  'Qualifying Offers': P('A qualifying offer makes an expiring young player a restricted free agent: you can match any offer he signs elsewhere. Without one he\'s unrestricted.'),
  'Protections': P('A protected pick that lands in its protected range (top 3, top 8 or the lottery) stays with its original team instead.'),
  'Swap': P('The team with the swap right takes the better of the two picks; the other team gets the worse one.'),
  'Trade Requests': P('Unhappy players can ask out: low mood, a losing team for a Competitor, or a rival signing. Loyal players rarely ask. A request stays until he\'s moved or his mood recovers.'),
  'Mentorship': SCREEN_HELP['Mentorship'],
  'Play Style': P('His play-style tendencies: how often he shoots threes, attacks the rim, posts up, passes and so on. The game plays them as set; the app changes them through Team Meeting talks, and re-rolls a realistic draft class\'s a little for each save.'),
  'Trainer': P('Injury history and health: every major injury he\'s had, how many games it cost, and his risk of it coming back. Injury-prone players carry more risk.'),
};
