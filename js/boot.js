// Hot Babe Collector — boot.js (canvas, hero, aura)
"use strict";


// ============================================================
// Hot Babe Collector — Big Salty Gaming Studio
// Prototype: self-contained Canvas 2D platformer
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

// ---------- Pixel-art hero (32×48, faces right; flip for left) ----------
// Set true to use hero_idle_side.png for idle instead of front-facing breath cycle
const HERO_IDLE_USE_SIDE = false;
const HERO_SW = 32;
const HERO_SH = 48;
// Opaque idle ≈ (1,0)–(28,47). Slim collision inset; feet = sprite bottom.
const HERO_INSET_X = 7;  // → hitbox width 18
const HERO_INSET_TOP = 4; // → hitbox height 44
const PLAYER_W = HERO_SW - HERO_INSET_X * 2; // 18
const PLAYER_H = HERO_SH - HERO_INSET_TOP;   // 44
const HERO_IDLE_MS = 500;
const HERO_RUN_MS = 90;
const HERO_DEAD_MS = 260;
const DEATH_CRY_SCALE = 6; // 32×48 → 192×288
const DEATH_FLASH_HOLD = 0.08; // full white before black cry
const DEATH_FLASH_FADE = 0.10; // white → black+cry

const heroSprites = {
  ready: false,
  failed: false,
  idle: [null, null],      // front breath
  idleSide: null,
  runSheet: null,          // 192×48, 6 frames
  jumpUp: null,
  jumpFall: null,
  hurt: null,
  dead: [null, null],
};

function loadImg(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function preloadHeroSprites() {
  const base = "art/hero/pixel/";
  const [
    idle0, idle1, idleSide, runSheet,
    jumpUp, jumpFall, hurt, dead0, dead1,
  ] = await Promise.all([
    loadImg(base + "hero_idle.png"),
    loadImg(base + "hero_idle_1.png"),
    loadImg(base + "hero_idle_side.png"),
    loadImg(base + "hero_run_sheet.png"),
    loadImg(base + "hero_jump_up.png"),
    loadImg(base + "hero_jump_fall.png"),
    loadImg(base + "hero_hurt.png"),
    loadImg(base + "hero_dead_0.png"),
    loadImg(base + "hero_dead_1.png"),
  ]);
  heroSprites.idle = [idle0, idle1];
  heroSprites.idleSide = idleSide;
  heroSprites.runSheet = runSheet;
  heroSprites.jumpUp = jumpUp;
  heroSprites.jumpFall = jumpFall;
  heroSprites.hurt = hurt;
  heroSprites.dead = [dead0, dead1];
  const need = [idle0, idle1, runSheet, jumpUp, jumpFall, hurt, dead0, dead1];
  heroSprites.failed = need.some(im => !im);
  heroSprites.ready = !heroSprites.failed;
  return heroSprites.ready;
}

// Test/screenshot pose override: "idle"|"run"|"jumpUp"|"jumpFall"|"hurt"|"dead"|null
let debugHeroPose = null;

function heroFrameForState() {
  const pose = debugHeroPose || (
    (state === "dead" || state === "dying") ? "dead" :
    player.stun > 0 ? "hurt" :
    !player.onGround ? (player.vy < 0 ? "jumpUp" : "jumpFall") :
    Math.abs(player.vx) > 30 ? "run" : "idle"
  );
  if (pose === "dead") {
    // When dying: animT reset to 0 as black cry (+audio) starts — synced to 260ms beats
    const ms = (state === "dying" && deathCry && deathCry.animStarted)
      ? deathCry.animT * 1000
      : performance.now();
    const fi = Math.floor((ms / HERO_DEAD_MS) % 2);
    return { img: heroSprites.dead[fi], sx: 0, sy: 0, sw: HERO_SW, sh: HERO_SH };
  }
  if (pose === "hurt") {
    return { img: heroSprites.hurt, sx: 0, sy: 0, sw: HERO_SW, sh: HERO_SH };
  }
  if (pose === "jumpUp") {
    return { img: heroSprites.jumpUp, sx: 0, sy: 0, sw: HERO_SW, sh: HERO_SH };
  }
  if (pose === "jumpFall") {
    return { img: heroSprites.jumpFall, sx: 0, sy: 0, sw: HERO_SW, sh: HERO_SH };
  }
  if (pose === "run") {
    const fi = Math.floor((performance.now() / HERO_RUN_MS) % 6);
    return { img: heroSprites.runSheet, sx: fi * HERO_SW, sy: 0, sw: HERO_SW, sh: HERO_SH };
  }
  // idle
  if (HERO_IDLE_USE_SIDE && heroSprites.idleSide) {
    return { img: heroSprites.idleSide, sx: 0, sy: 0, sw: HERO_SW, sh: HERO_SH };
  }
  const fi = Math.floor((performance.now() / HERO_IDLE_MS) % 2);
  return { img: heroSprites.idle[fi], sx: 0, sy: 0, sw: HERO_SW, sh: HERO_SH };
}

function drawHeroSprite() {
  const fr = heroFrameForState();
  if (!fr.img) return false;
  const px = Math.floor(player.x + player.w / 2);
  const py = Math.floor(player.y + player.h);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(px, py);
  if (player.facing < 0) ctx.scale(-1, 1);
  ctx.drawImage(fr.img, fr.sx, fr.sy, fr.sw, fr.sh, -Math.floor(HERO_SW / 2), -HERO_SH, HERO_SW, HERO_SH);
  ctx.restore();
  return true;
}

function drawPlayerFallback() {
  const px = player.x, py = player.y;
  ctx.fillStyle = "#6ec8ff";
  roundRect(px, py + 8, player.w, player.h - 8, 4);
  ctx.fill();
  ctx.fillStyle = "#ffdbb0";
  ctx.fillRect(px + 2, py, player.w - 4, 14);
  ctx.fillStyle = "#ff5a9a";
  ctx.fillRect(px + 1, py - 2, player.w - 2, 6);
  ctx.fillStyle = "#222";
  const ex = player.facing >= 0 ? px + player.w - 8 : px + 4;
  ctx.fillRect(ex, py + 5, 3, 3);
  const leg = Math.sin(player.anim) * (player.onGround && Math.abs(player.vx) > 30 ? 4 : 0);
  ctx.fillStyle = "#3a6a9a";
  ctx.fillRect(px + 2, py + player.h - 8, 5, 8 + leg);
  ctx.fillRect(px + player.w - 7, py + player.h - 8, 5, 8 - leg);
}

// Super Saiyan aura — all-30 unique unlock (live count; turns off if a babe is lost)
const AURA_W = 56, AURA_H = 80, AURA_FRAME_MS = 110;
const AURA_FRAMES = [];
for (let i = 0; i < 6; i++) {
  const im = new Image();
  im.onerror = () => console.warn("[HBC] aura frame failed: aura_fire_" + i);
  im.src = "art/vfx/aura/aura_fire_" + i + ".png?v=2";
  AURA_FRAMES.push(im);
}
function hasAllBabesAura() {
  return ownedUniqueCount(collection) >= BABE_POOL.length;
}
function drawAura() {
  if (!hasAllBabesAura()) return;
  const im = AURA_FRAMES[Math.floor(performance.now() / AURA_FRAME_MS) % AURA_FRAMES.length];
  if (!imgOk(im)) return;
  // Bottom-center of aura ↔ bottom-center of hero (56×80 canvas; hero 32×48 inset at 12,24)
  const cx = Math.floor(player.x + player.w / 2);
  const by = Math.floor(player.y + player.h);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(cx, by);
  if (player.facing < 0) ctx.scale(-1, 1);
  ctx.drawImage(im, -Math.floor(AURA_W / 2), -AURA_H, AURA_W, AURA_H);
  ctx.restore();
}
function drawPlayer() {
  // Invulnerability flash (also during death we still draw)
  if (state !== "dead" && state !== "dying" && player.flash > 0 && Math.floor(player.flash * 12) % 2 !== 0) return;
  drawAura(); // behind the hero
  if (heroSprites.ready && drawHeroSprite()) return;
  drawPlayerFallback();
}


