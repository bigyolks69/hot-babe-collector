// Hot Babe Collector — audio.js
// ---------- WebAudio SFX + Music Macky death cry ----------
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx = null;
let masterGain = null;
const MUTE_KEY = "hbc_muted";
let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (_) {}

function ensureAudio() {
  if (!actx) {
    actx = new AudioCtx();
    masterGain = actx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(actx.destination);
  }
  if (masterGain) masterGain.gain.value = muted ? 0 : 1;
  // Await resume so BufferSource / HTML play start only after context is running
  // (fire-and-forget callers still kick resume; unlock/startBgm await this).
  if (actx.state === "suspended" || actx.state === "interrupted") {
    return actx.resume().then(() => actx).catch(() => actx);
  }
  return Promise.resolve(actx);
}

function setMuted(v) {
  muted = !!v;
  try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (_) {}
  if (masterGain) masterGain.gain.value = muted ? 0 : 1;
  if (cryHtmlAudio) cryHtmlAudio.muted = muted;
  if (cryLoopHtmlAudio) cryLoopHtmlAudio.muted = muted;
  if (bgm.html) bgm.html.muted = muted;
  const btn = document.getElementById("muteBtn");
  if (btn) {
    btn.textContent = muted ? "🔇" : "🔊";
    btn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
  }
}

function beep(freq, dur, type, vol, slide) {
  try {
    ensureAudio();
    if (muted) return;
    const t0 = actx.currentTime;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
    g.gain.setValueAtTime(vol || 0.08, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(masterGain || actx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  } catch (_) {}
}
const sfx = {
  jump:  () => beep(420, 0.12, "square", 0.07, 280),
  coin:  () => { beep(880, 0.08, "square", 0.06); setTimeout(() => beep(1175, 0.12, "square", 0.05), 60); },
  tick:  () => beep(600 + Math.random() * 400, 0.03, "triangle", 0.035),
  hit:   () => beep(160, 0.25, "sawtooth", 0.09, 60),
  stomp: () => beep(200, 0.1, "square", 0.07, 80),
  lose:  () => { beep(300, 0.2, "sawtooth", 0.08, 100); setTimeout(() => beep(150, 0.3, "sawtooth", 0.07, 50), 180); },
  win:   () => { [523,659,784,1047].forEach((f,i) => setTimeout(() => beep(f, 0.18, "square", 0.06), i*120)); },
  new:   () => { beep(700, 0.1, "square", 0.06); setTimeout(() => beep(1050, 0.2, "square", 0.06), 100); },
};

// Death cry (Music Macky): 1.500s one-shot, sobs on 260ms beats
const CRY_VOLUME = 0.25; // relative to prior full-level cry (other SFX unchanged)
const cryAudio = {
  oneshotBuf: null,
  loopBuf: null,       // available; only if dying ever exceeds 1.5s
  oneshotUrl: null,
  loopUrl: null,
  ready: false,
  source: null,        // active BufferSource
  loopSource: null,
  startedAt: null,     // actx.currentTime or performance when started
  playing: false,
};
let cryHtmlAudio = null;
let cryLoopHtmlAudio = null;

function pickAudioUrl(baseNoExt) {
  const probe = document.createElement("audio");
  const ogg = probe.canPlayType('audio/ogg; codecs="vorbis"') || probe.canPlayType("audio/ogg");
  if (ogg && ogg !== "no") return baseNoExt + ".ogg";
  return baseNoExt + ".mp3";
}

async function fetchDecode(url) {
  await ensureAudio();
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch " + url + " " + res.status);
  const ab = await res.arrayBuffer();
  return await actx.decodeAudioData(ab.slice(0));
}

async function preloadCryAudio() {
  cryAudio.oneshotUrl = pickAudioUrl("audio/cry_death");
  cryAudio.loopUrl = pickAudioUrl("audio/cry_death_loop");
  // Prefer OGG path when supported; pickAudioUrl already chose
  try {
    ensureAudio();
    cryAudio.oneshotBuf = await fetchDecode(cryAudio.oneshotUrl);
    try { cryAudio.loopBuf = await fetchDecode(cryAudio.loopUrl); } catch (_) { cryAudio.loopBuf = null; }
    cryAudio.ready = true;
  } catch (e) {
    // file:// or decode failure → HTMLAudioElement fallback
    console.warn("[HBC] WebAudio cry decode failed, using HTMLAudioElement", e && e.message);
    cryHtmlAudio = new Audio(cryAudio.oneshotUrl);
    cryHtmlAudio.preload = "auto";
    cryLoopHtmlAudio = new Audio(cryAudio.loopUrl);
    cryLoopHtmlAudio.preload = "auto";
    cryLoopHtmlAudio.loop = true;
    cryAudio.ready = true;
  }
}

function stopDeathCry() {
  try {
    if (cryAudio.source) {
      try { cryAudio.source.stop(0); } catch (_) {}
      cryAudio.source.disconnect();
      cryAudio.source = null;
    }
    if (cryAudio.loopSource) {
      try { cryAudio.loopSource.stop(0); } catch (_) {}
      cryAudio.loopSource.disconnect();
      cryAudio.loopSource = null;
    }
  } catch (_) {}
  if (cryHtmlAudio) { try { cryHtmlAudio.pause(); cryHtmlAudio.currentTime = 0; } catch (_) {} }
  if (cryLoopHtmlAudio) { try { cryLoopHtmlAudio.pause(); cryLoopHtmlAudio.currentTime = 0; } catch (_) {} }
  cryAudio.playing = false;
  cryAudio.startedAt = null;
  duckBgm(false);
}

/** Start one-shot once; no stack. Syncs with dead-anim frame 0. */
function playDeathCry() {
  if (cryAudio.playing) return; // no double-play
  ensureAudio();
  stopDeathCry(); // clear any stray
  cryAudio.playing = true;
  const wall = performance.now();
  try {
    if (cryAudio.oneshotBuf && actx) {
      const src = actx.createBufferSource();
      src.buffer = cryAudio.oneshotBuf;
      const cryGain = actx.createGain();
      cryGain.gain.value = CRY_VOLUME;
      src.connect(cryGain);
      cryGain.connect(masterGain || actx.destination);
      src.onended = () => {
        if (cryAudio.source === src) {
          cryAudio.source = null;
          cryAudio.playing = false;
          duckBgm(false);
        }
      };
      cryAudio.source = src;
      cryAudio.startedAt = actx.currentTime;
      duckBgm(true);
      src.start(0);
      return;
    }
  } catch (e) {
    console.warn("[HBC] cry BufferSource failed", e);
  }
  // HTMLAudio fallback
  if (!cryHtmlAudio) cryHtmlAudio = new Audio(cryAudio.oneshotUrl || "audio/cry_death.mp3");
  cryHtmlAudio.muted = muted;
  cryHtmlAudio.volume = CRY_VOLUME;
  cryHtmlAudio.currentTime = 0;
  cryAudio.startedAt = wall / 1000;
  duckBgm(true);
  const p = cryHtmlAudio.play();
  if (p && p.catch) p.catch(() => {});
}

// ---------- Background music ----------
// One looping track for the whole session: starts on the first key/tap (audio unlock) and is never
// restarted — deaths, slot rolls, level changes and the gallery leave it alone. Routed through
// masterGain so the mute toggle silences it; ducked briefly under the death cry.
const BGM_VOLUME = 0.35;   // relative to master (SFX beeps / cry sit above it)
const BGM_DUCK = 0.4;      // music multiplier while the death cry plays
const bgm = {
  url: null, buf: null, html: null, src: null, gain: null,
  wanted: false,     // set by the first user gesture
  starts: 0,         // times the loop was (re)started — should stay 1 per page load
  t0: 0, offset: 0, loopStart: 0, loopEnd: 0, failed: false, mode: null,
};
// Trim codec padding / dead air at both ends so the wrap has no audible gap
function bgmLoopPoints(buf) {
  // 10 ms windows; a window counts as silent when its RMS is under -50 dBFS (lossy codecs leave faint noise)
  const ch = [];
  for (let c = 0; c < buf.numberOfChannels; c++) ch.push(buf.getChannelData(c));
  const win = Math.max(1, Math.floor(buf.sampleRate * 0.01)), th2 = 0.00316 * 0.00316;
  const loudWin = (i0) => {
    let sum = 0, n = 0;
    for (const d of ch) for (let i = i0; i < Math.min(i0 + win, d.length); i++) { sum += d[i] * d[i]; n++; }
    return n && sum / n > th2;
  };
  const maxTrim = Math.floor(buf.sampleRate * 0.6);
  let a = 0, b = buf.length;
  while (a < maxTrim && !loudWin(a)) a += win;
  while (buf.length - b < maxTrim && !loudWin(b - win)) b -= win;
  return { start: a / buf.sampleRate, end: b / buf.sampleRate };
}
function bgmActuallyPlaying() {
  if (!actx || actx.state !== "running") return false;
  if (bgm.src) return true; // BufferSource still held → looping (onended clears it)
  if (bgm.html) return !bgm.html.paused && !bgm.html.ended;
  return false;
}
function clearBgmPlayback() {
  if (bgm.src) {
    try { bgm.src.onended = null; } catch (_) {}
    try { bgm.src.stop(0); } catch (_) {}
    try { bgm.src.disconnect(); } catch (_) {}
    bgm.src = null;
  }
  if (bgm.html) {
    try { bgm.html.pause(); } catch (_) {}
  }
}
async function loadBgm() {
  bgm.url = pickAudioUrl("audio/bgm_main");
  try {
    bgm.buf = await fetchDecode(bgm.url);
    const lp = bgmLoopPoints(bgm.buf);
    bgm.loopStart = lp.start; bgm.loopEnd = lp.end;
    bgm.mode = "webaudio";
  } catch (e) {
    console.warn("[HBC] music decode failed, using HTMLAudio loop", e && e.message);
    bgm.html = new Audio(bgm.url);
    bgm.html.loop = true;
    bgm.html.preload = "auto";
    bgm.html.volume = BGM_VOLUME;
    bgm.html.muted = muted;
    bgm.mode = "html";
  }
  if (bgm.wanted) startBgm();
}
let bgmStartLock = null; // coalesce concurrent unlock taps during resume
async function startBgm() {
  bgm.wanted = true;
  if (bgmStartLock) return bgmStartLock;
  bgmStartLock = (async () => {
    await ensureAudio();
    // Already audibly looping — stay idempotent
    if (bgmActuallyPlaying()) return;
    // Stale silent start (src set while ctx suspended, source ended, html paused) → clear & restart
    clearBgmPlayback();
    try {
      if (bgm.buf && actx) {
        if (actx.state !== "running") return; // still locked; next gesture retries
        if (!bgm.gain) {
          bgm.gain = actx.createGain();
          bgm.gain.gain.value = BGM_VOLUME;
          bgm.gain.connect(masterGain || actx.destination);
        }
        const src = actx.createBufferSource();
        src.buffer = bgm.buf;
        src.loop = true;
        src.loopStart = bgm.loopStart;
        src.loopEnd = bgm.loopEnd;
        src.connect(bgm.gain);
        src.onended = () => { if (bgm.src === src) bgm.src = null; };
        bgm.t0 = actx.currentTime;
        bgm.offset = bgm.loopStart;
        src.start(0, bgm.offset);
        bgm.src = src;
        bgm.starts++;
      } else if (bgm.html) {
        bgm.html.muted = muted;
        bgm.html.currentTime = 0;
        const pr = bgm.html.play();
        bgm.starts++;
        if (pr && pr.catch) pr.catch(() => { bgm.starts--; }); // not unlocked yet; next gesture retries
      }
    } catch (e) { console.warn("[HBC] music start", e && e.message); }
  })().finally(() => { bgmStartLock = null; });
  return bgmStartLock;
}
// Any key / tap / click unlocks audio and kicks the music off (idempotent when already audible)
function unlockAudio() {
  // Await resume, then startBgm (restarts if wanted but silent; idempotent if audible)
  ensureAudio().then(() => startBgm());
}
["keydown", "pointerdown", "touchend", "mousedown"].forEach(ev =>
  window.addEventListener(ev, unlockAudio, { capture: true, passive: true }));
document.addEventListener("visibilitychange", () => {
  // iOS can leave the context interrupted/suspended; resume + restart BGM if wanted but silent
  if (document.hidden || !bgm.wanted) return;
  ensureAudio().then(() => {
    if (!bgmActuallyPlaying()) startBgm();
  });
});
function duckBgm(on) {
  if (bgm.gain && actx) {
    const g = bgm.gain.gain, t = actx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(BGM_VOLUME * (on ? BGM_DUCK : 1), t + (on ? 0.15 : 0.6));
  } else if (bgm.html) bgm.html.volume = BGM_VOLUME * (on ? BGM_DUCK : 1);
}
function bgmPosition() {
  if (bgm.src && actx) {
    const len = bgm.loopEnd - bgm.loopStart;
    const el = actx.currentTime - bgm.t0 + (bgm.offset - bgm.loopStart);
    return bgm.loopStart + (el % len);
  }
  return bgm.html ? bgm.html.currentTime : 0;
}

function maybeStartCryLoop() {
  // Only if dying somehow exceeds one-shot length
  if (!deathCry || deathCry.t < 1.5 || cryAudio.loopSource || (cryLoopHtmlAudio && !cryLoopHtmlAudio.paused)) return;
  ensureAudio();
  try {
    if (cryAudio.loopBuf && actx) {
      const src = actx.createBufferSource();
      src.buffer = cryAudio.loopBuf;
      src.loop = true;
      const cryGain = actx.createGain();
      cryGain.gain.value = CRY_VOLUME;
      src.connect(cryGain);
      cryGain.connect(masterGain || actx.destination);
      cryAudio.loopSource = src;
      src.start(0);
      return;
    }
  } catch (_) {}
  if (cryLoopHtmlAudio) {
    cryLoopHtmlAudio.muted = muted;
    cryLoopHtmlAudio.volume = CRY_VOLUME;
    cryLoopHtmlAudio.currentTime = 0;
    const p = cryLoopHtmlAudio.play();
    if (p && p.catch) p.catch(() => {});
  }
}

