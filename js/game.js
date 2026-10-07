// Hot Babe Collector — game.js
// ---------- Game state ----------
const GRAV = 2200;
const MOVE_ACC = 2400;
const MOVE_MAX = 260;
const FRICTION = 1800;
const JUMP_V = -620;
const JUMP_CUT = 0.45;
// Stomp bounce: HALF prior apex height → multiply |v| by √(1/2)
const STOMP_V = -480 * Math.SQRT1_2;       // ~-339.4 (was -480)
const STOMP_V_HELD = JUMP_V * Math.SQRT1_2; // ~-438.4 (was full JUMP_V)
function moveMaxNow() { return MOVE_MAX * collectionMoveMul(); }
function jumpVNow() { return JUMP_V * collectionJumpVelMul(); }

// Derived (full held jump): maxJumpH = v^2/(2g) ≈ 87.4px (~2.73 tiles).
// Level design uses ≤2 tile rises (~64px ≈ 73% of max) for comfort.
const COYOTE = 0.1;
const JUMP_BUF = 0.12;

let state = "title"; // title | play | collection | dying | dead | win

// Cumulative play timer (ms). Runs only in state==="play"; pauses in menu / win / death / overlays.
// Resets on title start and on a fresh post-credits L1 run — not on level continue, replay, or CP respawn.
let playTimerMs = 0;
function resetPlayTimer() { playTimerMs = 0; }
function tickPlayTimer(dt) { if (dt > 0) playTimerMs += dt * 1000; }
function formatPlayTime(ms) {
  const s = Math.max(0, Math.floor((ms || 0) / 1000));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return m + ":" + (ss < 10 ? "0" : "") + ss;
}
let collection = loadCollection();

// Mini tray: newest-first list of owned babes by latest acquisition (persisted)
const RECENT_KEY = "hbc_recent_v1";
let recentBabes = [];
try { const a = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); if (Array.isArray(a)) recentBabes = a; } catch (e) {}
function saveRecent() { try { localStorage.setItem(RECENT_KEY, JSON.stringify(recentBabes)); } catch (e) {} }
// Drop unknown / no-longer-owned ids; owned babes missing from the list (older saves) go in as oldest
function syncRecent() {
  const seen = new Set(), out = [];
  for (const id of recentBabes) if (!seen.has(id) && babeById(id) && (collection[id] || 0) > 0) { seen.add(id); out.push(id); }
  for (const b of BABE_POOL) if (!seen.has(b.id) && (collection[b.id] || 0) > 0) out.push(b.id);
  recentBabes = out;
  saveRecent();
}
function noteAcquired(id) {
  recentBabes = [id].concat(recentBabes.filter(x => x !== id));
  saveRecent();
  hudTray.slideAt = performance.now(); // newest slides in from the right (wall-clock, so it finishes even while paused)
}
syncRecent();

// Complete-collection celebration: fires once (flag persisted), right after the completing roll
const COMPLETE_KEY = "hbc_complete_v1";
const CONGRATS_LINE1 = "Congrats! You completed the collection!";
const CONGRATS_LINE2 = "Life doesn't suck anymore.";
const CONGRATS_LINE3 = "You attained Double Jump!";
const CONGRATS_TEXT = CONGRATS_LINE1 + " " + CONGRATS_LINE2 + " " + CONGRATS_LINE3;
const CONGRATS_GUARD = 0.4; // input ignored this long after it appears (held jump etc.)
const CONGRATS_IMG_SRC = "art/ui/congrats_all30.jpg"; // Iris all-30 group pic (1280×720, 16:9)
const congratsImg = new Image();
congratsImg.onerror = () => console.warn("[HBC] congrats group pic failed: " + CONGRATS_IMG_SRC);
congratsImg.src = CONGRATS_IMG_SRC;
let collectionCompleteFlag = false;
try { collectionCompleteFlag = localStorage.getItem(COMPLETE_KEY) === "1"; } catch (e) {}
let congrats = null; // { t, sparks }
function checkCollectionComplete() {
  if (collectionCompleteFlag) return;
  if (!BABE_POOL.every(b => (collection[b.id] || 0) > 0)) return;
  collectionCompleteFlag = true;
  try { localStorage.setItem(COMPLETE_KEY, "1"); } catch (e) {}
  const sparks = [];
  for (let i = 0; i < 70; i++) sparks.push({ x: Math.random() * W, y: Math.random() * H, p: Math.random() * 6.28, s: 1 + Math.random() * 3, vy: 20 + Math.random() * 60, hue: Math.floor(Math.random() * 360) });
  congrats = { t: 0, sparks };
  try { sfx.win(); } catch (e) {}
}
let congratsClosedAt = -1e9;

// Collection buff threshold toast (every +5 unique) — non-blocking, top of screen
const BUFF_TEXT = "Your collection is growing! It's making you faster and stronger!";
const BUFF_TOAST_IN = 0.2;
const BUFF_TOAST_OUT = 0.35;
const BUFF_TOAST_HOLD = 3.5; // fully visible
const BUFF_TOAST_DUR = BUFF_TOAST_IN + BUFF_TOAST_HOLD + BUFF_TOAST_OUT; // 4.05s
let buffToast = null; // { t, dur } while visible — does NOT pause gameplay
let buffAnnouncedStacks = 0; // last tier we announced this session
let buffPending = false; // wait for congrats to finish, then toast
function syncBuffAnnouncedFromCollection() {
  buffAnnouncedStacks = collectionBuffStacks();
}
function buffToastMessage(stacks) {
  stacks = stacks == null ? collectionBuffStacks() : stacks;
  const mv = Math.round(COLL_BUFF_MOVE_PER * stacks * 100);
  const jh = Math.round(COLL_BUFF_JUMP_H_PER * stacks * 100);
  return BUFF_TEXT + " (" + mv + "% faster, " + jh + "% higher jump)";
}
function showBuffToast() {
  buffToast = { t: 0, dur: BUFF_TOAST_DUR, text: buffToastMessage() };
  buffPending = false;
  try { sfx.new(); } catch (e) {}
}
function syncCollectionBuffAnnounce() {
  const stacks = collectionBuffStacks();
  if (stacks < buffAnnouncedStacks) {
    buffAnnouncedStacks = stacks; // dropped below — can re-fire on re-cross
    return;
  }
  if (stacks > buffAnnouncedStacks) {
    buffAnnouncedStacks = stacks;
    if (congrats) buffPending = true;
    else showBuffToast();
  }
}
// Seed from saved collection so refresh does not re-toast current tiers
syncBuffAnnouncedFromCollection();

function drawBuffToast() {
  // Non-modal top banner only — never dims / fills the canvas, never pauses gameplay.
  if (!buffToast) return;
  const t = buffToast.t, dur = buffToast.dur;
  let a = 1;
  if (t < BUFF_TOAST_IN) a = t / BUFF_TOAST_IN;
  else if (t > dur - BUFF_TOAST_OUT) a = Math.max(0, (dur - t) / BUFF_TOAST_OUT);
  const msg = buffToast.text || buffToastMessage();
  // Two lines: base sentence, then percents (or split at "! " if no stored percents line)
  const pctIdx = msg.lastIndexOf(" (");
  let line1, line2;
  if (pctIdx > 0) {
    line1 = msg.slice(0, pctIdx);
    line2 = msg.slice(pctIdx + 1); // includes leading "("
  } else {
    const cut = msg.indexOf("! ");
    line1 = cut > 0 ? msg.slice(0, cut + 1) : msg;
    line2 = cut > 0 ? msg.slice(cut + 2) : "";
  }
  ctx.save();
  ctx.globalAlpha = a * 0.92;
  const pw = Math.min(620, W - 48), ph = line2 ? 46 : 34;
  const px = (W - pw) / 2, py = 10;
  ctx.fillStyle = "rgba(22,10,36,0.9)";
  roundRect(px, py, pw, ph, 10); ctx.fill();
  ctx.strokeStyle = "rgba(255,230,109,0.7)"; ctx.lineWidth = 1.5;
  roundRect(px, py, pw, ph, 10); ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe66d";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(line1, W / 2, py + (line2 ? 17 : 22));
  if (line2) {
    ctx.fillStyle = "#9ad0ff";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(line2, W / 2, py + 34);
  }
  ctx.restore();
}

// Only the Continue button (click / tap) or Enter closes it; `force` is for debug hooks/tests only
function dismissCongrats(force) {
  if (!congrats || (!force && congrats.t < CONGRATS_GUARD)) return;
  congrats = null;
  congratsClosedAt = performance.now();
  const pendingBuff = buffPending;
  buffPending = false;
  if (pendingBuff) showBuffToast();
  // Rolls earned meanwhile resume now
  if (!slot && slotQueue > 0) { slotQueue--; if (!beginSlotRoll()) slotQueue = 0; }
}
// Collection reset: gallery "Reset collection" button → confirm popup (P opens gallery only, never resets).
// Wipes babe counts + tray order + complete flag; keeps level progress and mute.
let resetConfirm = null; // { t } while the confirm popup is up
let resetToast = null;   // { t, dur } brief "Collection reset" after confirming
const RESET_CONFIRM_GUARD = 0.25; // confirm ignored this long (key-repeat / double-fire)
function hardRefreshCache() {
  // Clear Cache Storage (if any), then unique-query navigate. Does not wipe localStorage.
  const go = () => {
    try {
      const base = location.pathname || "/";
      location.replace(base + "?_=" + Date.now() + (location.hash || ""));
    } catch (e) {
      location.reload();
    }
  };
  try {
    if (typeof caches !== "undefined" && caches.keys) {
      caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))).then(go, go);
      return;
    }
  } catch (e) { /* fall through */ }
  go();
}
function canOpenResetConfirm() {
  return !resetConfirm && state === "collection";
}
function openResetConfirm() {
  if (!canOpenResetConfirm()) return false;
  resetConfirm = { t: 0 };
  // Swallow any held jump / confirm keys so cancel can't also hop or advance a win panel
  keys[" "] = false; keys["arrowup"] = false; keys["w"] = false; keys["enter"] = false;
  delete justPressed[" "]; delete justPressed["arrowup"]; delete justPressed["w"];
  delete justPressed["enter"]; delete justPressed["p"];
  return true;
}
function cancelResetConfirm() {
  if (!resetConfirm) return;
  resetConfirm = null;
  delete justPressed[" "]; delete justPressed["escape"]; keys[" "] = false;
}
function confirmResetCollection() {
  if (!resetConfirm || resetConfirm.t < RESET_CONFIRM_GUARD) return; // guard against instant double-P
  resetConfirm = null;
  // Wipe babes + tray + complete flag. Keep level progress + mute.
  collection = {};
  saveCollection(collection);
  syncBuffAnnouncedFromCollection();
  buffPending = false;
  buffToast = null;
  recentBabes = [];
  saveRecent();
  collectionCompleteFlag = false;
  try { localStorage.removeItem(COMPLETE_KEY); } catch (e) {}
  runGained = [];
  hudTray.highlightId = null; hudTray.highlightT = 0; hudTray.slideAt = -1e9;
  // Safe mid-death / mid-roll: drop stale owned references; leave anims running so they finish cleanly
  if (loseAnim) { loseAnim.lostId = null; loseAnim.lostPrevCount = 0; loseAnim.name = null; }
  if (deathCry) { deathCry.lostId = null; deathCry.lostPrevCount = 0; deathCry.lostName = null; }
  if (gallery) gallery.selected = null;
  // Pending slot still resolves into an empty collection (earned pull); no crash on missing counts
  resetToast = { t: 0, dur: 1.6 };
  addCallout("Collection reset", "#ffe66d");
  try { sfx.lose(); } catch (e) {}
}
function resetConfirmLayout() {
  const pw = 560, ph = 220;
  const px = (W - pw) / 2, py = (H - ph) / 2;
  const bw = 180, bh = 52, gap = 24;
  const btnY = py + ph - bh - 22;
  return {
    pw, ph, px, py,
    resetBtn: { x: W / 2 - bw - gap / 2, y: btnY, w: bw, h: bh },
    cancelBtn: { x: W / 2 + gap / 2, y: btnY, w: bw, h: bh },
  };
}
function drawResetConfirm() {
  const L = resetConfirmLayout(), { pw, ph, px, py } = L;
  ctx.save();
  ctx.fillStyle = "rgba(8,4,18,0.72)"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#2a1038";
  roundRect(px, py, pw, ph, 16); ctx.fill();
  ctx.strokeStyle = "#ff8ec8"; ctx.lineWidth = 3;
  roundRect(px, py, pw, ph, 16); ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe66d"; ctx.font = "bold 22px sans-serif";
  ctx.fillText("Reset your babe collection?", W / 2, py + 48);
  ctx.fillStyle = "#ffb0d0"; ctx.font = "15px sans-serif";
  ctx.fillText("This clears every babe you've collected.", W / 2, py + 84);
  ctx.fillText("Level progress and mute stay as they are.", W / 2, py + 108);
  ctx.fillStyle = "#888"; ctx.font = "12px sans-serif";
  ctx.fillText(isTouch ? "Tap Cancel to keep your babes." : "Esc / Space cancels  ·  Enter confirms", W / 2, py + 132);
  const drawBtn = (b, label, fill, stroke) => {
    ctx.fillStyle = fill; roundRect(b.x, b.y, b.w, b.h, 12); ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = 2; roundRect(b.x, b.y, b.w, b.h, 12); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "bold 18px sans-serif";
    ctx.textBaseline = "middle"; ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1);
    ctx.textBaseline = "alphabetic";
  };
  drawBtn(L.resetBtn, "Reset", "#e0457f", "#ffe66d");
  drawBtn(L.cancelBtn, "Cancel", "#3a2a50", "#aaa");
  ctx.restore();
}
function drawResetToast() {
  if (!resetToast) return;
  const a = Math.min(1, resetToast.t / 0.15) * (resetToast.t > resetToast.dur - 0.35 ? Math.max(0, (resetToast.dur - resetToast.t) / 0.35) : 1);
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(20,8,30,0.85)";
  roundRect(W / 2 - 110, 70, 220, 36, 10); ctx.fill();
  ctx.fillStyle = "#ffe66d"; ctx.font = "bold 16px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("Collection reset", W / 2, 94);
  ctx.restore();
}

let hearts = 3;
let invuln = 0;
let checkpointIdx = 0;
let cameraX = 0;
let cameraY = 0;

// Vertical camera: follow player, but L5 mini-boss sits partly above y=0.
// During the top-deck fight, bias so demon body + jump arc sit under the HUD
// (cameraY may go negative). Returns { ty, camMin }.
function verticalCamTarget() {
  let ty = player.y - H * 0.55;
  let camMin = 0;
  const d = boss && !boss.dual && !boss.defeated && boss.mode !== "done" ? boss : null;
  const nearPad = d && level && level.bossFloorY != null && player.y < (level.bossFloorY + 4) * TILE;
  if (d && (d.locked || nearPad)) {
    const hudClear = 118; // hearts + HP bar + one callout clear of dome
    const top = d.y - 24; // small pad above dome
    ty = top - hudClear;
    // Keep player in the lower ~70% if they drop below the pad
    const keepPlayer = player.y - H * 0.72;
    if (ty < keepPlayer) ty = keepPlayer;
    if (player.y - ty < hudClear) ty = player.y - hudClear;
    camMin = Math.min(0, top - hudClear - 8);
  }
  return { ty, camMin };
}
let coins = [];
let enemies = [];
let particles = [];
let callouts = []; // floating text
let slot = null; // slot machine overlay (gameplay keeps running)
const SLOT_PANEL_Y = 48;
const SLOT_PANEL_H = Math.round(150 * 0.7); // 105
let slotQueue = 0; // pending rolls earned while a roll is already playing
let loseAnim = null;
let deathCry = null; // { t, dur, lostName, lostId, lostPrevCount } — in-world cry before Ouch
let winStats = null;
let runGained = [];   // babe ids gained this run (for win screen)
let collectionReturn = "play";
function openCollection() { collectionReturn = state === "win" ? "win" : "play"; state = "collection"; }
let hudTrayHit = null; // {x,y,w,h} canvas-space panel from last drawHudLiveBabes
function trayContains(sx, sy) {
  const r = hudTrayHit;
  return !!(r && sx >= r.x && sx <= r.x + r.w && sy >= r.y && sy <= r.y + r.h);
}
/** Click/tap the babe tray → same as C (open gallery). Ignores blocking overlays; only in play. */
function tryTrayOpenCollection(sx, sy) {
  if (resetConfirm || congrats) return false;
  if (performance.now() - congratsClosedAt < 300) return false;
  if (state !== "play") return false; // match C; death Ouch / win ignore tray
  if (!trayContains(sx, sy)) return false;
  openCollection();
  return true;
}
let gallery = {
  filter: "all", // all | owned | missing | common | rare | ultra
  scroll: 0,
  selected: null, // babe id
};
const GALLERY_FILTERS = ["all", "owned", "missing", "common", "rare", "ultra"];
function galleryFilterLabel(lab) {
  if (lab === "ultra") return "Ultra Rare";
  if (lab === "all") return "All";
  if (lab === "owned") return "Owned";
  if (lab === "missing") return "Missing";
  if (lab === "common") return "Common";
  if (lab === "rare") return "Rare";
  return galleryFilterLabel(lab);
}
// Bottom-right HUD: 5-slot window into sorted full pool
const HUD_SLOTS = 5;
const HUD_CW = 28;
const HUD_GAP = 4;
let hudTray = {
  scroll: 0,
  targetScroll: 0,
  highlightId: null,
  highlightT: 0,
  slideAt: -1e9,
};
let deathGridScroll = 0; // snap-scroll so lost babe is visible

const player = {
  x: 64, y: 15 * TILE - PLAYER_H, w: PLAYER_W, h: PLAYER_H,
  vx: 0, vy: 0, onGround: false,
  facing: 1, coyote: 0, jumpBuf: 0, airJumpsUsed: 0,
  anim: 0, flash: 0, stun: 0, stompGrace: 0, fromStomp: false,
  prevX: 64, prevY: 15 * TILE - PLAYER_H,
};


const CRACK_STAND = 0.6;   // armed delay before shake
const CRACK_SHAKE = 0.35;  // shake then fall
function updateCrackedPlatforms(dt) {
  // Brief foot contact arms a cracked plat; once armed the timer keeps running
  // even if the player already dashed off (no continuous-stand requirement).
  const feet = player.y + player.h;
  for (const p of platforms) {
    if (!p.cracked || p.fallen || p.crackArmed) continue;
    const x = p.x * TILE, y = p.y * TILE, w = p.w * TILE;
    const overlap = Math.min(player.x + player.w, x + w) - Math.max(player.x, x);
    if (overlap < 2) continue;
    // onGround + any brief overlap arms; timer then runs without needing to stay
    if (player.onGround && Math.abs(feet - y) < 8) {
      p.crackArmed = true;
      p.crackTimer = p.crackTimer || 0;
    }
  }
  for (const p of platforms) {
    if (!p.cracked) continue;
    // Fallen plats stay in the array for restore-on-death, but fallT advances so
    // any brief debris draw can expire. solidAt already skips p.fallen.
    if (p.fallen) {
      p.fallT = (p.fallT || 0) + dt;
      continue;
    }
    if (p.crackArmed) {
      p.crackTimer = (p.crackTimer || 0) + dt;
      if (p.crackTimer >= CRACK_STAND + CRACK_SHAKE) {
        p.fallen = true; p.falling = true; p.fallT = 0;
        // Burst debris across the whole ledge so nothing looks like a leftover platform
        const cx = p.x * TILE, cy = p.y * TILE, pw = p.w * TILE;
        for (let i = 0; i < Math.max(3, p.w); i++) {
          spawnParticles(cx + (i + 0.5) * (pw / Math.max(1, p.w)), cy + 4, "#c4a070", 4);
          spawnParticles(cx + (i + 0.5) * (pw / Math.max(1, p.w)), cy + 4, "#6a4a38", 2);
        }
      }
    }
  }
}

function resetLevel(full) {
  coins = makeCoins();
  enemies = makeEnemies();
  particles = [];
  callouts = [];
  slot = null;
  slotQueue = 0;
  loseAnim = null;
  deathCry = null;
  stopDeathCry();
  hearts = 3;
  invuln = 0;
  congrats = null;
  buffToast = null;
  buffPending = false;
  restorePlatforms();
  if (level && level.boss) boss = makeBoss();
  else boss = null;
  cameraY = 0;
  if (full) {
    checkpointIdx = 0;
    collection = loadCollection();
    syncBuffAnnouncedFromCollection();
    syncRecent();
    runGained = [];
    hudTray.scroll = 0;
    hudTray.targetScroll = 0;
    hudTray.highlightId = null;
    hudTray.highlightT = 0;
    deathGridScroll = 0;
    gallery.scroll = 0;
    gallery.selected = null;
    gallery.filter = "all";
  }
  let cp = checkpoints[checkpointIdx];
  if (level && level.startMid && boss) {
    const mid = ((boss.arenaL || 0) + (boss.arenaR || LEVEL_W * TILE)) / 2;
    player.x = mid - player.w / 2;
    player.y = (level.bossFloorY != null ? level.bossFloorY : GROUND_Y) * TILE - player.h;
  } else {
    player.x = cp.x;
    player.y = cp.y - player.h;
  }
  player.vx = 0; player.vy = 0;
  player.onGround = false;
  player.coyote = 0; player.jumpBuf = 0; player.airJumpsUsed = 0; player.stun = 0; player.stompGrace = 0; player.fromStomp = false;
  player.prevX = player.x; player.prevY = player.y;
  cameraX = Math.max(0, Math.min(player.x - W*0.35, LEVEL_W * TILE - W));
  if (level && level.vertical) {
    const vc = verticalCamTarget();
    const maxY = Math.max(0, LEVEL_H * TILE - H);
    cameraY = Math.max(vc.camMin, Math.min(maxY, vc.ty));
  } else {
    cameraY = 0;
  }
}

// Floating 1-tile ledges are one-way: walk/jump through from below/side, land from above.
function isOneWayPlat(p) { return p.y < GROUND_Y && p.h === 1; }

function solidAt(px, py, pw, ph, mode) {
  // mode "land" includes one-way tops when falling; otherwise skip one-way (no side/ceiling block)
  const land = mode === "land";
  for (const p of platforms) {
    if (p.fallen) continue;
    const x = p.x * TILE, y = p.y * TILE, w = p.w * TILE, h = p.h * TILE;
    if (!(px < x + w && px + pw > x && py < y + h && py + ph > y)) continue;
    if (isOneWayPlat(p)) {
      if (!land) continue;
      return { x, y, w, h, oneWay: true };
    }
    return { x, y, w, h, oneWay: false };
  }
  return null;
}

function resolvePlayer(dt) {
  const prevBottom = player.y + player.h;
  player.x += player.vx * dt;
  let hit = solidAt(player.x, player.y, player.w, player.h);
  if (hit) {
    if (player.vx > 0) player.x = hit.x - player.w;
    else if (player.vx < 0) player.x = hit.x + hit.w;
    player.vx = 0;
  }
  player.y += player.vy * dt;
  player.onGround = false;
  if (player.vy >= 0) {
    hit = solidAt(player.x, player.y, player.w, player.h, "land");
    if (hit && (!hit.oneWay || prevBottom <= hit.y + 6)) {
      player.y = hit.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  } else {
    hit = solidAt(player.x, player.y, player.w, player.h);
    if (hit) { player.y = hit.y + hit.h; player.vy = 0; }
  }
  if (player.x < 0) { player.x = 0; player.vx = 0; }
  if (player.x + player.w > LEVEL_W * TILE) { player.x = LEVEL_W * TILE - player.w; player.vx = 0; }
}

function groundUnder(px, feetY) {
  // Thin probe just below feet — true if a platform would catch a landing
  return !!solidAt(px, feetY, player.w, 6);
}

/** Platform top near feet supporting [x,x+w]; prefers the highest (smallest Y) match. */
function platformTopNear(x, w, feetY) {
  let best = null;
  for (const p of platforms) {
    const px = p.x * TILE, py = p.y * TILE, pw = p.w * TILE;
    const overlap = Math.min(x + w, px + pw) - Math.max(x, px);
    if (overlap < 6) continue;
    if (py >= feetY - 4 && py <= feetY + 48) {
      if (best == null || py < best) best = py;
    }
  }
  if (best == null) {
    for (const p of platforms) {
      const px = p.x * TILE, py = p.y * TILE, pw = p.w * TILE;
      const overlap = Math.min(x + w, px + pw) - Math.max(x, px);
      if (overlap < 6) continue;
      if (Math.abs(py - feetY) <= 8) {
        if (best == null || py < best) best = py;
      }
    }
  }
  return best;
}

function hurtPlayer(fromX) {
  if (invuln > 0 || player.stompGrace > 0 || state !== "play") return;
  hearts--;
  invuln = 1.4;
  player.flash = 1.4;
  // Bounce away from the enemy: horizontal knockback + small upward pop
  let dir = (player.x + player.w / 2 < fromX) ? -1 : 1;
  const feet = player.y + player.h;
  const probe = 56; // ~1.75 tiles ahead
  const awayHasGround = groundUnder(player.x + dir * probe, feet) ||
    groundUnder(player.x + dir * probe, feet + TILE);
  const towardHasGround = groundUnder(player.x - dir * probe, feet) ||
    groundUnder(player.x - dir * probe, feet + TILE);
  // Avoid knocking the player straight into a pit (unfair death loop near edges)
  let kb = 290;
  if (!awayHasGround) {
    if (towardHasGround) dir = -dir;
    else { dir = 0; kb = 0; } // pit both ways — just pop up in place
  }
  player.vx = dir * kb;
  player.vy = -280;
  player.onGround = false;
  player.stun = 0.25; // brief loss of control so knockback reads
  player.jumpBuf = 0;
  sfx.hit();
  spawnParticles(player.x + player.w/2, player.y + player.h/2, "#ff4466", 10);
  if (hearts <= 0) {
    onHeartsZero();
  }
}

function seatPlayerForDeathCry() {
  player.vx = 0;
  player.vy = 0;
  player.stun = 0;
  player.flash = 0;
  player.jumpBuf = 0;
  player.fromStomp = false;
  // Snap onto solid ground underfoot so the cry reads clearly (pit path already parked at checkpoint)
  const top = platformTopNear(player.x, player.w, player.y + player.h);
  if (top != null) {
    player.y = top - player.h;
    player.onGround = true;
  }
  // Keep camera locked on him
  cameraX = Math.max(0, Math.min(player.x - W * 0.38, LEVEL_W * TILE - W));
}

function onHeartsZero() {
  // Single clean event — ignore re-entry while already dying or on Ouch screen
  if (state === "dying" || state === "dead") return;
  // Lose one random *already owned* babe now (pending unrevealed roll is not owned yet).
  const owned = Object.keys(collection).filter(k => collection[k] > 0);
  let lostName = null;
  let lostId = null;
  let lostPrevCount = 0;
  if (owned.length) {
    const id = owned[Math.floor(Math.random() * owned.length)];
    lostPrevCount = collection[id];
    collection[id]--;
    if (collection[id] <= 0) delete collection[id];
    saveCollection(collection);
    syncCollectionBuffAnnounce(); // may drop stacks below announced tier
    const ch = CHAR_DEFS.find(c => c.id === id);
    lostName = ch ? ch.name : id;
    lostId = id;
    sfx.lose();
  }
  seatPlayerForDeathCry();
  // ~1.5s black-screen zoomed cry before Ouch; enemies frozen, no input, no re-hit
  deathCry = {
    t: 0, dur: 1.5, lostName, lostId, lostPrevCount,
    animT: 0, animStarted: false, cryStarted: false,
  };
  loseAnim = null;
  invuln = 99; // belt-and-suspenders vs any stray collision
  if (lostId) focusHudOnBabe(lostId);
  deathGridScroll = -1;
  state = "dying";
}

function beginOuchScreen() {
  stopDeathCry();
  if (!deathCry) {
    state = "dead";
    loseAnim = { t: 0, name: null, lostId: null, lostPrevCount: 0, dur: 2.2 };
    return;
  }
  loseAnim = {
    t: 0,
    name: deathCry.lostName,
    lostId: deathCry.lostId,
    lostPrevCount: deathCry.lostPrevCount,
    dur: 2.2,
  };
  deathCry = null;
  state = "dead";
}

function updateDying(dt) {
  if (!deathCry) { beginOuchScreen(); return; }
  deathCry.t += dt;
  player.vx = 0;
  player.vy = 0;
  // Start cry audio + dead-anim frame 0 exactly when black cry screen begins (after white flash hold)
  if (!deathCry.cryStarted && deathCry.t >= DEATH_FLASH_HOLD) {
    deathCry.cryStarted = true;
    deathCry.animStarted = true;
    deathCry.animT = 0;
    playDeathCry();
  }
  if (deathCry.animStarted) deathCry.animT += dt;
  maybeStartCryLoop(); // only if somehow past 1.5s
  // Enemies frozen (no update) — cannot re-hit
  if (deathCry.t >= deathCry.dur) beginOuchScreen();
}

/** Full-screen black + zoomed cry loop (integer scale, crisp). */
function drawDyingCry() {
  const t = deathCry ? deathCry.t : 0;
  // Phase 1: solid white flash (covers everything)
  if (t < DEATH_FLASH_HOLD) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    return;
  }
  // Phase 2+: black + cry, with optional white fade overlay
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  const fr = heroFrameForState();
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const dw = HERO_SW * DEATH_CRY_SCALE;
  const dh = HERO_SH * DEATH_CRY_SCALE;
  const dx = Math.floor((W - dw) / 2);
  const dy = Math.floor((H - dh) / 2);
  if (fr.img) {
    ctx.drawImage(fr.img, fr.sx, fr.sy, fr.sw, fr.sh, dx, dy, dw, dh);
  } else {
    ctx.fillStyle = "#6ec8ff";
    ctx.fillRect(dx + dw * 0.25, dy + dh * 0.2, dw * 0.5, dh * 0.7);
  }
  ctx.restore();
  // White fade into black cry (~0.1s); folded into the same 1.5s window
  const fadeT = t - DEATH_FLASH_HOLD;
  if (fadeT < DEATH_FLASH_FADE) {
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 1 - fadeT / DEATH_FLASH_FADE;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

function spawnParticles(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x, y,
      vx: (Math.random()-0.5)*220,
      vy: (Math.random()-0.8)*260,
      life: 0.4 + Math.random()*0.5,
      color, size: 2 + Math.random()*3
    });
  }
}

// Post-roll callout ("NEW! <name> · Common", "★ RARE DUPE x2 — <name>", …)
// Pop in, hold at full opacity, then fade smoothly to 0.
const CALLOUT_IN = 0.2;    // pop-in (unchanged)
const CALLOUT_HOLD = 1.4;  // full opacity: old ~0.4s visible time + 1.0s
const CALLOUT_OUT = 0.45;  // smooth fade-out
const CALLOUT_H = 36, CALLOUT_GAP = 6;
// Callouts sit where the roll panel was; if a (queued) roll is on screen they
// slide just below the panel so the next roll never hides them.
function calloutBaseY() {
  if (slot) return SLOT_PANEL_Y + SLOT_PANEL_H + 8;
  // Vertical mini-boss: sit callouts in the HUD band above the framed fight
  if (boss && !boss.dual && boss.locked && level && level.vertical) return 68;
  return 56;
}
function addCallout(text, color) {
  callouts.push({ text, color, t: 0, dur: CALLOUT_IN + CALLOUT_HOLD + CALLOUT_OUT, y: null });
}
function calloutAlpha(c) {
  if (c.t < CALLOUT_IN) return c.t / CALLOUT_IN;
  const fadeStart = CALLOUT_IN + CALLOUT_HOLD;
  if (c.t <= fadeStart) return 1;
  const u = Math.min(1, (c.t - fadeStart) / CALLOUT_OUT);
  return 1 - u * u * (3 - 2 * u); // smoothstep 1 → 0
}

function beginSlotRoll(forcedResult) {
  // Precompute result and plant it at targetIndex BEFORE spinning.
  // Offset eases exactly to that index — no end snap/swap.
  const result = forcedResult || rollCharacter();
  if (!result) { addCallout("All babes maxed out!", "#ffe66d"); return false; }
  // Start streaming the result's slot-size art now so it's animated when it lands
  if (result.rarity === "ultra") warmUltra(result, "md"); else img(babeArtUrl(result, "md"));
  const targetIndex = 24;
  const strip = [];
  // Filler: babes still in the pool (fall back to everyone when few remain, so the strip looks full)
  const avail = pullableBabes();
  const filler = avail.length >= 4 ? avail : CHAR_DEFS;
  const others = filler.filter(b => b.id !== result.id);
  for (let i = 0; i < targetIndex; i++) {
    // keep approach cards visually distinct from the result
    const src = i > targetIndex - 4 && others.length ? others : filler;
    strip.push(src[Math.floor(Math.random() * src.length)]);
  }
  strip.push(result);
  for (let i = 0; i < 4; i++) {
    strip.push(filler[Math.floor(Math.random() * filler.length)]);
  }
  slot = {
    strip,
    result,
    targetIndex,
    startOffset: 0,
    offset: 0,
    elapsed: 0,
    duration: 1.2,
    done: false,
    revealT: 0,
  };
  sfx.coin();
  return true;
}

// Coin pickup: start a roll, or queue if one is already playing. Gameplay never pauses.
function onCoinCollected() {
  if (slot) {
    slotQueue++;
    sfx.coin();
  } else if (!pullableBabes().length) {
    addCallout("All babes maxed out!", "#ffe66d"); // no roll
    sfx.coin();
  } else {
    beginSlotRoll();
  }
}

function finishSlot() {
  if (!slot) return;
  const id = slot.result.id;
  const prev = collection[id] || 0;
  collection[id] = clampCount(prev + 1);
  const nowMax = collection[id] >= MAX_COPIES;
  const maxTag = nowMax ? " MAX" : "";
  saveCollection(collection);
  noteAcquired(id); // dupes move to newest too
  runGained.push(id);
  focusHudOnBabe(id);
  const rar = rarityOf(id);
  const nm = slot.result.name;
  if (prev === 0) {
    if (rar.id === "ultra") {
      addCallout("✦ ULTRA RARE! NEW! " + nm, "#ffd24a");
      spawnParticles(W / 2, 120, "#ffd24a", 24);
      spawnParticles(W / 2, 120, "#ff7ab8", 12);
    } else if (rar.id === "rare") {
      addCallout("★ RARE! NEW! " + nm, "#7ec8ff");
      spawnParticles(W / 2, 120, "#7ec8ff", 14);
    } else {
      addCallout("NEW! " + nm + " · Common", "#ffe66d");
    }
    sfx.new();
  } else {
    const n = collection[id];
    if (rar.id === "ultra") addCallout("✦ ULTRA RARE DUPE x" + n + maxTag + " — " + nm, "#ffd24a");
    else if (rar.id === "rare") addCallout("★ RARE DUPE x" + n + maxTag + " — " + nm, "#9ad0ff");
    else addCallout("DUPE x" + n + maxTag + " — " + nm + " · Common", nowMax ? "#ffe66d" : "#9ad0ff");
  }
  slot = null;
  checkCollectionComplete(); // shows the celebration right after the completing roll
  if (prev === 0) syncCollectionBuffAnnounce();
  // Chain queued rolls immediately (even over death/win overlays — player earned them);
  // while the celebration is up they wait and resume when it's dismissed
  if (slotQueue > 0 && !congrats) {
    slotQueue--;
    // If that was the last babe in the pool, the queued pickups have nothing left to roll
    if (!beginSlotRoll()) slotQueue = 0;
  }
}


