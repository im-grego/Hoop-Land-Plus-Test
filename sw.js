// Offline support: cache-first for the app shell, stale-while-revalidate for
// fonts. Team and league logos live in their own cache that survives updates:
// fetched once, then always served from the phone.
const LOGOS = 'hlc-logos';
// The logos bundled with the app (img/logos).
const LOGO_FILES = ["img/logos/ATL.png", "img/logos/BOS.png", "img/logos/Bulls.png", "img/logos/Cavs.png", "img/logos/Heat.png", "img/logos/Knicks.png", "img/logos/Lakers.png", "img/logos/MIN.png", "img/logos/NOP.png", "img/logos/Nets-1.png", "img/logos/Nuggets.png", "img/logos/Pacers.png", "img/logos/Photo-Jun-29-2025-10-47-21-AM.png", "img/logos/Photo-Jun-29-2025-10-49-49-AM.png", "img/logos/Photo-Jun-30-2025-10-11-45-AM.png", "img/logos/Photo-Jun-30-2025-10-12-46-AM.png", "img/logos/Photo-Jun-30-2025-10-30-21-AM.png", "img/logos/Photo-Jun-30-2025-10-35-00-AM.png", "img/logos/Photo-Jun-30-2025-10-35-37-AM.png", "img/logos/Photo-Jun-30-2025-11-08-52-AM.png", "img/logos/Photo-Jun-30-2025-9-59-16-AM.png", "img/logos/Photo-Oct-07-2025-4-02-19-PM.png", "img/logos/Photo-Oct-12-2025-7-52-04-PM-1.png", "img/logos/Photo-Oct-12-2025-8-04-07-PM-1.png", "img/logos/Pistons.png", "img/logos/Portland.png", "img/logos/Rockets.png", "img/logos/Sacramento-Kings-logo11.png", "img/logos/Spurs.png", "img/logos/Thunder.png", "img/logos/Vegaslogo-1.png", "img/logos/hmmmmmm.png"];
const VERSION = 'hlc-v0.365.15';
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
