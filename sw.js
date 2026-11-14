// Offline support: cache-first for the app shell, stale-while-revalidate for
// fonts. Team and league logos live in their own cache that survives updates:
// fetched once, then always served from the phone.
const LOGOS = 'hlc-logos';
// The logos bundled with the app (img/logos).
const LOGO_FILES = ["img/logos/ATL.png", "img/logos/BOS.png", "img/logos/Bulls.png", "img/logos/Cavs.png", "img/logos/Heat.png", "img/logos/Knicks.png", "img/logos/Lakers.png", "img/logos/MIN.png", "img/logos/NOP.png", "img/logos/Nets-1.png", "img/logos/Nuggets.png", "img/logos/Pacers.png", "img/logos/Photo-Jun-29-2025-10-47-21-AM.png", "img/logos/Photo-Jun-29-2025-10-49-49-AM.png", "img/logos/Photo-Jun-30-2025-10-11-45-AM.png", "img/logos/Photo-Jun-30-2025-10-12-46-AM.png", "img/logos/Photo-Jun-30-2025-10-30-21-AM.png", "img/logos/Photo-Jun-30-2025-10-35-00-AM.png", "img/logos/Photo-Jun-30-2025-10-35-37-AM.png", "img/logos/Photo-Jun-30-2025-11-08-52-AM.png", "img/logos/Photo-Jun-30-2025-9-59-16-AM.png", "img/logos/Photo-Oct-07-2025-4-02-19-PM.png", "img/logos/Photo-Oct-12-2025-7-52-04-PM-1.png", "img/logos/Photo-Oct-12-2025-8-04-07-PM-1.png", "img/logos/Pistons.png", "img/logos/Portland.png", "img/logos/Rockets.png", "img/logos/Sacramento-Kings-logo11.png", "img/logos/Spurs.png", "img/logos/Thunder.png", "img/logos/Vegaslogo-1.png", "img/logos/hmmmmmm.png", "img/logos/college/akron.png", "img/logos/college/alabama.png", "img/logos/college/arizona-state.png", "img/logos/college/arizona.png", "img/logos/college/arkansas.png", "img/logos/college/auburn.png", "img/logos/college/baylor.png", "img/logos/college/belmont.png", "img/logos/college/boise-state.png", "img/logos/college/boston-college.png", "img/logos/college/byu.png", "img/logos/college/california.png", "img/logos/college/charleston.png", "img/logos/college/cincinnati.png", "img/logos/college/clemson.png", "img/logos/college/colorado-state.png", "img/logos/college/colorado.png", "img/logos/college/creighton.png", "img/logos/college/dayton.png", "img/logos/college/depaul.png", "img/logos/college/duke.png", "img/logos/college/eastern-michigan.png", "img/logos/college/florida-state.png", "img/logos/college/florida.png", "img/logos/college/furman.png", "img/logos/college/georgetown.png", "img/logos/college/georgia-tech.png", "img/logos/college/georgia.png", "img/logos/college/gonzaga.png", "img/logos/college/hofstra.png", "img/logos/college/houston.png", "img/logos/college/illinois.png", "img/logos/college/indiana.png", "img/logos/college/iowa-state.png", "img/logos/college/iowa.png", "img/logos/college/kansas-state.png", "img/logos/college/kansas.png", "img/logos/college/kentucky.png", "img/logos/college/liberty.png", "img/logos/college/louisville.png", "img/logos/college/loyola-maryland.png", "img/logos/college/lsu.png", "img/logos/college/marquette.png", "img/logos/college/maryland.png", "img/logos/college/memphis.png", "img/logos/college/miami.png", "img/logos/college/michigan-state.png", "img/logos/college/michigan.png", "img/logos/college/milwaukee.png", "img/logos/college/minnesota.png", "img/logos/college/mississippi-state.png", "img/logos/college/missouri-state.png", "img/logos/college/missouri.png", "img/logos/college/murray-state.png", "img/logos/college/nc-state.png", "img/logos/college/nebraska.png", "img/logos/college/nevada.png", "img/logos/college/north-carolina.png", "img/logos/college/northwestern.png", "img/logos/college/notre-dame.png", "img/logos/college/ohio-state.png", "img/logos/college/ohio.png", "img/logos/college/oklahoma-state.png", "img/logos/college/oklahoma.png", "img/logos/college/oregon.png", "img/logos/college/penn-state.png", "img/logos/college/pepperdine.png", "img/logos/college/pittsburgh.png", "img/logos/college/providence.png", "img/logos/college/purdue.png", "img/logos/college/rutgers.png", "img/logos/college/saint-joseph-s.png", "img/logos/college/san-diego-state.png", "img/logos/college/san-francisco.png", "img/logos/college/santa-clara.png", "img/logos/college/seton-hall.png", "img/logos/college/smu.png", "img/logos/college/south-carolina.png", "img/logos/college/south-florida.png", "img/logos/college/st-john-s.png", "img/logos/college/stanford.png", "img/logos/college/syracuse.png", "img/logos/college/tcu.png", "img/logos/college/tennessee.png", "img/logos/college/texas-a-m.png", "img/logos/college/texas-tech.png", "img/logos/college/texas.png", "img/logos/college/toledo.png", "img/logos/college/tulane.png", "img/logos/college/uc-santa-barbara.png", "img/logos/college/ucf.png", "img/logos/college/ucla.png", "img/logos/college/uconn.png", "img/logos/college/usc.png", "img/logos/college/ut-arlington.png", "img/logos/college/utah-state.png", "img/logos/college/utah.png", "img/logos/college/valparaiso.png", "img/logos/college/vanderbilt.png", "img/logos/college/vcu.png", "img/logos/college/villanova.png", "img/logos/college/virginia-tech.png", "img/logos/college/virginia.png", "img/logos/college/wake-forest.png", "img/logos/college/washington-state.png", "img/logos/college/washington.png", "img/logos/college/weber-state.png", "img/logos/college/west-virginia.png", "img/logos/college/western-kentucky.png", "img/logos/college/wichita-state.png", "img/logos/college/wisconsin.png", "img/logos/college/wyoming.png", "img/logos/college/xavier.png", "img/logos/college/yale.png"];
const VERSION = 'hlc-v0.365.69';
const SHELL = [
  './',
  'index.html',
  'css/app.css',
  'js/app.js',
  'js/savefile.js',
  'js/progression.js',
  'js/draft.js',
  'js/mentorship.js',
  'js/storylines.js',
  'js/dropbox.js',
  'js/livedraft.js',
  'js/trades.js',
  'js/traderules.js', 'js/regression.js', 'js/skillinfo.js', 'js/autoplay.js', 'js/leagueexport.js', 'js/settle.js', 'js/leaguepack.js', 'js/leaguetemplate.js', 'js/plays.js', 'js/coachprofile.js', 'js/coachmarket.js', 'js/schemeevo.js', 'js/names.js', 'js/classgen.js', 'js/ego.js', 'js/career.js', 'js/careerlife.js', 'js/talks.js', 'js/careerlife2.js', 'js/lineups.js', 'js/pixelicons.js', 'js/faceimport.js', 'js/expansion.js', 'js/realclasses.js', 'js/classtools.js', 'js/teampresets.js', 'js/fantasy.js', 'js/careerlife3.js', 'js/playoffs.js', 'js/careerlife4.js', 'js/gameclock.js', 'js/gear.js', 'js/scoring.js',
  'js/realpicks.js', 'js/influence.js',
  'js/facilities.js',
  'js/predraft.js', 'js/jerseys.js',
  'js/presser.js',
  'js/survey.js',
  'js/freeagency.js',
  'js/destination.js',
  'js/phases.js',
  'js/summer.js',
  'js/olympics.js',
  'js/cup.js',
  'js/overview.js',
  'js/traits.js',
  'js/college.js',
  'js/coaching.js',
  'js/recruits.js',
  'js/recruiting.js',
  'js/collegeplus.js',
  'js/campus.js', 'js/madeprod.js', 'js/helptext.js', 'js/schedule.js',
  'js/appearance-pool.js',
  'manifest.webmanifest',
  'js/logomap.js',
  ...LOGO_FILES,
  'icons/icon.svg',
  'img/flags.png',
  'img/worldcup.png',
  'img/mood/0.png', 'img/mood/1.png', 'img/mood/2.png', 'img/mood/3.png', 'img/mood/4.png',
  'icons/hoopland-logo.png',
  'icons/nba.png',
  'icons/pro-logo.png',
  'icons/nba-px.png',
  'icons/coin.png',
  'img/awards/3pt.png', 'img/awards/6moy.png', 'img/awards/alldef.png', 'img/awards/allnba.png', 'img/awards/allrook.png', 'img/awards/allstar.png', 'img/awards/asmvp.png', 'img/awards/astlead.png', 'img/awards/blklead.png', 'img/awards/champ.png', 'img/awards/clutch.png', 'img/awards/coty.png', 'img/awards/dpoy.png', 'img/awards/fmvp.png', 'img/awards/mip.png', 'img/awards/mvp.png', 'img/awards/ptslead.png', 'img/awards/roty.png', 'img/awards/stllead.png', 'img/awards/trblead.png',
  'icons/credit.png',
  'icons/banner.jpg',
  'icons/league-ball.png',
  'icons/bg-tile.jpg',
  'icons/hero-camp.jpg',
  'icons/hero-mentor.jpg',
  'icons/hero-media.jpg',
  'icons/alert.png',
  'icons/hero-fa.jpg',
  'icons/app-180.png',
  'icons/app-192.png',
  'icons/app-512.png',
  ...Array.from({ length: 102 }, (_, i) => `img/plays/${i}.png`),
];

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache, so an update never
  // stores a stale copy of a file next to new ones.
  // Each file is cached on its own: one missing file must never block an
  // update (addAll fails the whole install if any request fails).
  e.waitUntil(caches.open(VERSION)
    .then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== LOGOS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('goatcounter.com')) return;   // the usage counter: straight to the network, never cached
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
    return;
  }
  // Logos (Dropbox and any other image host): cache-first in the logo cache, kept across app updates.
  if (req.destination === 'image' || /dropbox(usercontent)?\.com$/.test(url.hostname) || /\.(png|jpe?g|gif|webp|svg)$/i.test(url.pathname)) {
    e.respondWith(caches.open(LOGOS).then(async cache => {
      const hit = await cache.match(req, { ignoreVary: true });
      if (hit) return hit;
      try { const res = await fetch(req); if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; } catch { return Response.error(); }
    }));
    return;
  }
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const hit = await cache.match(req);
      const net = fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
