// Hot Babe Collector — audio.js
// ---------- WebAudio SFX + Music Macky death cry ----------
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx = null;
let masterGain = null;
const MUTE_KEY = "hbc_muted";
let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (_) {}

/** Create the playback graph if needed. Does not await resume (safe during preload). */
function createAudioGraph() {
  if (!actx) {
    actx = new AudioCtx();
    masterGain = actx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(actx.destination);
  }
  if (masterGain) masterGain.gain.value = muted ? 0 : 1;
  return actx;
}

/**
 * Kick actx.resume() but never hang forever — iOS can leave resume() pending
 * indefinitely when called outside a user gesture.
 */
function resumeAudio(timeoutMs) {
  createAudioGraph();
  if (actx.state === "running") return Promise.resolve(actx);
  const ms = timeoutMs == null ? 800 : timeoutMs;
  const resumeP = actx.resume().then(() => actx).catch(() => actx);
  return Promise.race([
    resumeP,
    new Promise((resolve) => setTimeout(() => resolve(actx), ms)),
  ]);
}

/**
 * Ensure playback AudioContext exists and kick resume (timed).
 * Preload must NOT await this — see fetchDecode (uses OfflineAudioContext).
 */
function ensureAudio() {
  createAudioGraph();
  if (actx.state === "suspended" || actx.state === "interrupted") {
    return resumeAudio(800);
  }
  return Promise.resolve(actx);
}

function setMuted(v) {
  muted = !!v;
  try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (_) {}
  if (masterGain) masterGain.gain.value = muted ? 0 : 1;
  if (cryHtmlAudio) cryHtmlAudio.muted = muted;
  if (cryLoopHtmlAudio) cryLoopHtmlAudio.muted = muted;
  if (bgm.el) bgm.el.muted = muted;
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
  if (ogg && ogg !== "no") return audioAssetUrl(baseNoExt + ".ogg");
  return audioAssetUrl(baseNoExt + ".mp3");
}

/** Absolute URL rooted at the js/ folder sibling (survives missing trailing slash / nested paths). */
function audioAssetUrl(relFromRoot) {
  // relFromRoot: "audio/bgm_main.mp3"
  try {
    const scripts = document.getElementsByTagName("script");
    for (let i = scripts.length - 1; i >= 0; i--) {
      const src = scripts[i].src || "";
      if (/audio\.js(\?|$)/.test(src)) {
        return new URL("../" + relFromRoot, src).href;
      }
    }
  } catch (_) {}
  try { return new URL(relFromRoot, document.baseURI).href; } catch (_) {}
  return relFromRoot;
}

async function fetchDecode(url) {
  // Fetch + decode WITHOUT awaiting playback-context resume. Under mobile / strict
  // autoplay, actx.resume() from a pre-gesture ensureAudio can hang forever and
  // would deadlock BGM/cry preload (wanted=true, buf never set → permanent silence).
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch " + url + " " + res.status);
  const ab = await res.arrayBuffer();
  try {
    const offline = new OfflineAudioContext(1, 1, 44100);
    return await offline.decodeAudioData(ab.slice(0));
  } catch (_) {
    // Fallback: decode on playback ctx (create only — do not await resume)
    createAudioGraph();
    return await actx.decodeAudioData(ab.slice(0));
  }
}

async function preloadCryAudio() {
  cryAudio.oneshotUrl = pickAudioUrl("audio/cry_death");
  cryAudio.loopUrl = pickAudioUrl("audio/cry_death_loop");
  // Prefer OGG path when supported; pickAudioUrl already chose
  try {
    // Do not create/resume playback AudioContext during preload
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
// One HTMLAudioElement.loop. Preload on load; .play() after gesture (Start/first tap).
// No visibility/blur/focus pause-resume — OS/browser handles backgrounding.
const BGM_VOLUME = 0.35;
const BGM_DUCK = 0.4;
const bgm = {
  el: null,
  url: null,
  wanted: false,
  ready: false,
  unlocked: false,
  starts: 0,
};

function tryPlayBgm() {
  if (!bgm.wanted || !bgm.el) return;
  const el = bgm.el;
  el.muted = muted;
  el.volume = BGM_VOLUME * (cryAudio.playing ? BGM_DUCK : 1);
  if (!el.loop) el.loop = true;
  if (!el.paused && !el.ended) return;
  try {
    const pr = el.play();
    if (pr && pr.then) {
      pr.then(() => {
        bgm.starts++;
        console.log("[HBC] BGM playing", bgm.url);
      }).catch((err) => {
        console.warn("[HBC] BGM play blocked", err && err.message);
      });
    } else {
      bgm.starts++;
    }
  } catch (e) {
    console.warn("[HBC] BGM play failed", e && e.message);
  }
}

/** Preload BGM; play later when wanted + (preferably) ready. */
function loadBgm() {
  bgm.url = audioAssetUrl("audio/bgm_main.mp3");
  const el = new Audio();
  el.preload = "auto";
  el.loop = true;
  el.volume = BGM_VOLUME;
  el.muted = muted;
  el.src = bgm.url;
  try { el.load(); } catch (_) {}
  const markReady = () => {
    if (bgm.ready) return;
    bgm.ready = true;
    tryPlayBgm();
  };
  el.addEventListener("canplaythrough", markReady);
  el.addEventListener("loadeddata", markReady);
  if (el.readyState >= 2) markReady();
  bgm.el = el;
  console.log("[HBC] BGM preload", bgm.url);
}

/** Mark music wanted and attempt .play() (Start / unlock). */
function startBgm() {
  bgm.wanted = true;
  bgm.unlocked = true;
  tryPlayBgm();
}

/** First key/tap unlocks autoplay + resumes WebAudio for SFX/cry. */
function unlockAudio() {
  bgm.wanted = true;
  bgm.unlocked = true;
  createAudioGraph();
  if (actx && (actx.state === "suspended" || actx.state === "interrupted")) {
    try { actx.resume(); } catch (_) {}
  }
  tryPlayBgm();
}
["keydown", "pointerdown", "touchstart", "touchend", "mousedown"].forEach(ev =>
  window.addEventListener(ev, unlockAudio, { capture: true, passive: true }));

function duckBgm(on) {
  if (bgm.el) bgm.el.volume = BGM_VOLUME * (on ? BGM_DUCK : 1);
}
function bgmPosition() {
  return bgm.el ? bgm.el.currentTime : 0;
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

