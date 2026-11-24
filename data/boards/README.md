# Draft boards

One file per draft year (`2027.json`, ...). Campus saves use it at the draft: a college player's pro potential, after the
class-year, size and athleticism cuts (`js/draft.js` proPotential), is capped at his tier here. Anyone not listed caps at
3 stars. A year without a file uses the cuts alone.

`prospects` is in board order: `{ rank, name, pot }`, with `pot` in half stars (10 = 5 stars). Names are matched loosely
(case, accents, Jr./II/III and punctuation don't matter).
