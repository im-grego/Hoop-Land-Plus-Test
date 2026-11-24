// Sound effects: small retro blips made on the spot with Web Audio (no sound files), in the spirit of the game's menus.
// A tap, moving forward and back, switching a tab or setting, a pop-up, a notice, a success, a refusal, and a few
// bigger moments (the buzzer, the crowd, a swish). Volume and on/off come from the app's settings.
let ctx = null, master = null, noiseBuf = null;
let vol = 0.5, on = true;

export function setSound(enabled, volume) { on = !!enabled; if (volume != null) vol = Math.max(0, Math.min(1, volume)); if (master) master.gain.value = vol * 0.35; }
export const soundOn = () => on;

// Browsers start audio only after the person touches the page: the first tap wakes it.
function wake() {
  if (!on) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
    master = ctx.createGain(); master.gain.value = vol * 0.35; master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
export function unlock() { wake(); }

// One note: an oscillator through a quick envelope. f can glide to f2.
function tone({ f, f2 = null, t = 0, d = 0.06, type = 'square', g = 0.5, a = 0.004 }) {
  const c = wake(); if (!c) return;
  const s = c.currentTime + t + 0.005;
  const o = c.createOscillator(), e = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, s);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, s + d);
  e.gain.setValueAtTime(0.0001, s);
  e.gain.exponentialRampToValueAtTime(g, s + a);
  e.gain.exponentialRampToValueAtTime(0.0001, s + d);
  o.connect(e); e.connect(master);
  o.start(s); o.stop(s + d + 0.02);
}
// Filtered noise: the swish of a net, a crowd's murmur.
function noise({ t = 0, d = 0.25, from = 3000, to = 800, q = 1.2, g = 0.4, type = 'bandpass', a = 0.02 }) {
  const c = wake(); if (!c) return;
  if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const x = noiseBuf.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1; }
  const s = c.currentTime + t + 0.005;
  const n = c.createBufferSource(), fl = c.createBiquadFilter(), e = c.createGain();
  n.buffer = noiseBuf; n.loop = true;
  fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(from, s); fl.frequency.exponentialRampToValueAtTime(to, s + d);
  e.gain.setValueAtTime(0.0001, s); e.gain.exponentialRampToValueAtTime(g, s + a); e.gain.exponentialRampToValueAtTime(0.0001, s + d);
  n.connect(fl); fl.connect(e); e.connect(master);
  n.start(s); n.stop(s + d + 0.05);
}

// A low "ooo" voice for the boos: a buzzy note through a muffling filter, sliding down.
function lowVoice(f, f2, t, d) {
  const c = wake(); if (!c) return;
  const s = c.currentTime + t + 0.005;
  const o = c.createOscillator(), fl = c.createBiquadFilter(), e = c.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(f, s); o.frequency.exponentialRampToValueAtTime(f2, s + d);
  fl.type = 'lowpass'; fl.frequency.value = 520; fl.Q.value = 2;
  e.gain.setValueAtTime(0.0001, s); e.gain.exponentialRampToValueAtTime(0.09, s + 0.25); e.gain.exponentialRampToValueAtTime(0.0001, s + d);
  o.connect(fl); fl.connect(e); e.connect(master);
  o.start(s); o.stop(s + d + 0.05);
}

// The sounds, by name. Short and quiet: the app is tapped hundreds of times a session.
const SOUNDS = {
  tap:     () => tone({ f: 1250, d: 0.035, g: 0.22 }),
  nav:     () => { tone({ f: 660, d: 0.045, g: 0.25 }); tone({ f: 990, t: 0.045, d: 0.06, g: 0.25 }); },
  back:    () => { tone({ f: 880, d: 0.045, g: 0.22 }); tone({ f: 587, t: 0.045, d: 0.06, g: 0.22 }); },
  tick:    () => tone({ f: 1800, d: 0.022, g: 0.18, type: 'triangle' }),
  toggle:  () => { tone({ f: 1046, d: 0.03, g: 0.2 }); tone({ f: 1568, t: 0.03, d: 0.04, g: 0.18 }); },
  open:    () => tone({ f: 420, f2: 840, d: 0.09, g: 0.22, type: 'triangle' }),
  close:   () => tone({ f: 840, f2: 420, d: 0.08, g: 0.18, type: 'triangle' }),
  notify:  () => { tone({ f: 1318, d: 0.08, g: 0.2, type: 'triangle' }); tone({ f: 1760, t: 0.08, d: 0.14, g: 0.2, type: 'triangle' }); },
  success: () => [523, 659, 784, 1046].forEach((f, i) => tone({ f, t: i * 0.06, d: i === 3 ? 0.22 : 0.07, g: 0.24, type: 'square' })),
  error:   () => { tone({ f: 196, d: 0.09, g: 0.3, type: 'sawtooth' }); tone({ f: 147, t: 0.1, d: 0.16, g: 0.3, type: 'sawtooth' }); },
  swish:   () => noise({ d: 0.28, from: 5200, to: 1400, q: 0.9, g: 0.45 }),
  buzzer:  () => { tone({ f: 110, d: 0.7, g: 0.32, type: 'sawtooth', a: 0.01 }); tone({ f: 116, d: 0.7, g: 0.22, type: 'square', a: 0.01 }); },
  crowd:   () => { noise({ d: 1.2, from: 900, to: 1400, q: 0.6, g: 0.28, a: 0.25 }); noise({ t: 0.15, d: 1.0, from: 2400, to: 1800, q: 0.8, g: 0.14, a: 0.2 }); },
  pick:    () => { SOUNDS.swish(); [784, 1046, 1318].forEach((f, i) => tone({ f, t: 0.18 + i * 0.07, d: i === 2 ? 0.25 : 0.07, g: 0.22 })); },
  // The fans react to your pick: a roar for a steal, a chorus of boos for a reach.
  cheer:   () => {
    noise({ d: 1.6, from: 1400, to: 2200, q: 0.7, g: 0.42, a: 0.18 });
    noise({ t: 0.1, d: 1.4, from: 3200, to: 2600, q: 1.1, g: 0.22, a: 0.15 });
    for (let i = 0; i < 4; i++) tone({ f: 900 + Math.random() * 500, f2: 1500 + Math.random() * 700, t: 0.15 + i * 0.22 + Math.random() * 0.1, d: 0.32, g: 0.06, type: 'sine', a: 0.05 });   // whoops
    tone({ f: 1800, f2: 2600, t: 0.3, d: 0.4, g: 0.07, type: 'sine', a: 0.03 });   // a whistle
  },
  boo:     () => {
    for (let i = 0; i < 6; i++) { const f = 120 + Math.random() * 70; lowVoice(f, f * 0.82, Math.random() * 0.18, 1.3 + Math.random() * 0.3); }
    noise({ d: 1.5, from: 500, to: 350, q: 0.8, g: 0.16, a: 0.2, type: 'lowpass' });
  },
  coin:    () => { tone({ f: 988, d: 0.05, g: 0.22 }); tone({ f: 1319, t: 0.05, d: 0.2, g: 0.22 }); },
};
export const SOUND_NAMES = Object.keys(SOUNDS);

let last = { n: '', t: 0 };
export function play(name) {
  if (!on || !SOUNDS[name]) return;
  const now = performance.now();
  if (last.n === name && now - last.t < 45) return;   // a held stepper or a double event: one blip, not a buzz
  last = { n: name, t: now };
  try { SOUNDS[name](); } catch { /* no audio: carry on silently */ }
}

// Which sound a button makes, from what it does.
const NAV = new Set(['nav', 'open', 'go', 'next', 'openPlayer', 'openTeam']);
const TICKS = new Set(['uiTab', 'tab', 'setTab', 'sort', 'filter', 'seg', 'mode']);
export function soundForAct(act, el) {
  if (!act) return 'tap';
  if (act === 'back' || /^(close|cancel|dismiss)/i.test(act)) return 'back';
  if (el?.dataset?.sfx) return el.dataset.sfx;
  if (TICKS.has(act) || /Tab$|^sort|^filter/.test(act)) return 'tick';
  if (act === 'setOpt' || /^toggle|Toggle$/.test(act)) return 'toggle';
  if (NAV.has(act) || /^nav|^open|^go[A-Z]/.test(act)) return 'nav';
  return 'tap';
}
