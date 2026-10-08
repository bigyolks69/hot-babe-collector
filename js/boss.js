// Hot Babe Collector — boss.js
// ---------- Gacha Machine Demon(s) ----------
// L3 main: 3 HP, full kit, Rare+ reward. L5 mini: 2 HP, coins+one minion, normal pull.
// L6 dual: two 3 HP demons, Rare+ when both down. Yellow failsafe ~8s on minion waves.
const BOSS_HP = 3;
const BOSS_W = 4 * TILE;   // 128
const BOSS_H = 6 * TILE;   // 192
const BOSS_CRANK_W = 28, BOSS_CRANK_H = 28;
const BOSS_BEAM_WARN = 0.6, BOSS_BEAM_FIRE = 0.55, BOSS_BEAM_FIRE_LOW = 0.2;
const BOSS_COIN_N = [3, 4, 5];
const BOSS_MINION_N = [2, 3, 4];
const BOSS_VULN = [1.6, 1.35, 1.15];
const BOSS_HIT_STUN = 1.15;
const BOSS_IDLE = [1.1, 0.85, 0.65];
const BOSS_MINION_VULN_FAILSAFE = 8;
const BOSS_ATTACKS = ["beam", "coins", "minions"];
const BOSS_EDGE_PAD = 220;

let boss = null; // single demon OR dual controller { dual:true, demons:[...] }

function makeDemonCaps() {
  const caps = [];
  for (let i = 0; i < 14; i++) {
    const b = BABE_POOL[i % BABE_POOL.length];
    caps.push({ id: b.id, a: Math.random() * Math.PI * 2, r: 10 + Math.random() * 28,
      sp: 1.2 + Math.random() * 1.6, bob: Math.random() * 6.28, col: ["#ff6ab0", "#7ec8ff", "#ffe66d", "#b48cff", "#7dff9a"][i % 5] });
  }
  return caps;
}

function createDemon(opts) {
  const floor = (opts.floorY != null ? opts.floorY : GROUND_Y) * TILE;
  const scale = opts.scale != null ? opts.scale : 1;
  const w = Math.round(BOSS_W * scale), h = Math.round(BOSS_H * scale);
  const hp = opts.hp != null ? opts.hp : BOSS_HP;
  return {
    x: opts.x, y: floor - h, w, h, hp, maxHp: hp,
    phase: 0, mode: "idle", modeT: 0, nextAtk: 0, lastAtk: null,
    arenaL: opts.arenaL, arenaR: opts.arenaR,
    crank: { ox: Math.round(18 * scale), oy: h - Math.round(70 * scale), w: BOSS_CRANK_W, h: BOSS_CRANK_H },
    beam: null, coins: [], minions: [],
    caps: makeDemonCaps(), t: 0, shake: 0, flash: 0, grin: 0,
    rewardPending: false, defeated: false, domeBroken: false,
    attacks: opts.attacks || BOSS_ATTACKS.slice(),
    minionKind: opts.minionKind || "both", // walker | hopper | both
    rareReward: opts.rareReward !== false,
    failsafe: opts.failsafe != null ? opts.failsafe : BOSS_MINION_VULN_FAILSAFE,
    scale, label: opts.label || "GACHA MACHINE DEMON",
  };
}

function makeBoss() {
  if (!level || !level.boss) return null;
  const kind = level.bossKind || "main";
  const arenaL = level.arenaLeft != null ? level.arenaLeft : 0;
  const arenaR = LEVEL_W * TILE;
  const floorY = level.bossFloorY != null ? level.bossFloorY : GROUND_Y;

  if (kind === "dual") {
    // Full arena; left matches right edge pad so crank-side jump isn't wall-cramped
    const left = createDemon({
      x: arenaL + BOSS_EDGE_PAD, arenaL, arenaR, floorY,
      hp: BOSS_HP, rareReward: false, label: "GACHA DEMON L",
    });
    const right = createDemon({
      x: arenaR - BOSS_W - BOSS_EDGE_PAD, arenaL, arenaR, floorY,
      hp: BOSS_HP, rareReward: false, label: "GACHA DEMON R",
    });
    return {
      dual: true, demons: [left, right],
      locked: false, arenaL, arenaR, wallPlats: [],
      defeated: false, rewardPending: false, mode: "idle",
      get hp() { return this.demons.reduce((s, d) => s + Math.max(0, d.hp), 0); },
      get maxHp() { return this.demons.reduce((s, d) => s + d.maxHp, 0); },
    };
  }

  if (kind === "mini") {
    const x = arenaR - Math.round(BOSS_W * 0.85) - BOSS_EDGE_PAD * 0.7;
    return createDemon({
      x, arenaL, arenaR, floorY, scale: 0.85, hp: 2,
      attacks: ["coins", "minions"], minionKind: "walker",
      rareReward: false, failsafe: 8, label: "MINI GACHA DEMON",
    });
  }

  // main (L3)
  const x = arenaR - BOSS_W - BOSS_EDGE_PAD;
  const d = createDemon({ x, arenaL, arenaR, floorY, hp: BOSS_HP, rareReward: true });
  d.locked = false; d.wallPlats = [];
  return d;
}

function bossList() {
  if (!boss) return [];
  return boss.dual ? boss.demons : [boss];
}
function livingBosses() { return bossList().filter(d => !d.defeated && d.mode !== "done"); }
function bossPhaseOf(d) { return Math.min(2, d ? d.phase : 0); }
function bossPhase() { const d = livingBosses()[0] || bossList()[0]; return bossPhaseOf(d); }
function bossCrankRect(d) {
  d = d || (boss && !boss.dual ? boss : null);
  if (!d || d.dual) return { x: 0, y: 0, w: 0, h: 0 };
  const c = d.crank;
  return { x: d.x + c.ox, y: d.y + c.oy, w: c.w, h: c.h };
}

function resetBossFight() {
  if (!boss) return;
  for (const d of bossList()) {
    d.hp = d.maxHp; d.phase = 0; d.mode = "idle"; d.modeT = 0; d.nextAtk = 0; d.lastAtk = null;
    d.beam = null; d.coins = [];
    d.shake = 0; d.flash = 0; d.grin = 0; d.rewardPending = false; d.defeated = false; d.domeBroken = false;
    for (const c of d.caps) { c.falling = false; delete c.wx; delete c.wy; delete c.vx; delete c.vy; }
  }
  clearAllBossMinions();
  const walls = boss.dual ? boss.wallPlats : boss.wallPlats;
  if (walls && walls.length) {
    platforms = platforms.filter(p => !walls.includes(p));
    if (boss.dual) boss.wallPlats = [];
    else boss.wallPlats = [];
  }
  if (boss.dual) { boss.locked = false; boss.defeated = false; boss.rewardPending = false; }
  else boss.locked = false;
  if (goal) goal.active = false;
  // Dual: re-park mid-arena on death
  if (boss.dual && level && level.startMid) {
    const mid = (boss.arenaL + boss.arenaR) / 2;
    player.x = mid - player.w / 2;
    player.y = (level.bossFloorY != null ? level.bossFloorY : GROUND_Y) * TILE - player.h;
  }
}


// Dual arena wider than view: pick cameraX that shows both demons when they fit, else follow player.
function dualFrameCameraX() {
  if (!boss || !boss.dual) return Math.max(0, Math.min(player.x - W * 0.35, LEVEL_W * TILE - W));
  const left = Math.min(boss.demons[0].x, boss.demons[1].x);
  const right = Math.max(boss.demons[0].x + boss.demons[0].w, boss.demons[1].x + boss.demons[1].w);
  const camMin = boss.arenaL, camMax = Math.max(camMin, boss.arenaR - W);
  if (right - left <= W) return Math.max(camMin, Math.min(camMax, (left + right) / 2 - W / 2));
  return Math.max(camMin, Math.min(camMax, player.x - W * 0.35));
}

function lockBossArena() {
  if (!boss) return;
  const locked = boss.dual ? boss.locked : boss.locked;
  if (locked) return;
  if (boss.dual) boss.locked = true; else boss.locked = true;
  const arenaL = boss.dual ? boss.arenaL : boss.arenaL;
  const left = { x: (arenaL / TILE) - 1, y: 0, w: 1, h: LEVEL_H };
  const right = { x: LEVEL_W - 1, y: 0, w: 1, h: LEVEL_H };
  if (boss.dual) boss.wallPlats = [left, right];
  else boss.wallPlats = [left, right];
  platforms.push(left, right);
  if (boss.dual) cameraX = dualFrameCameraX(); // both demons on-screen at lock (L6)
  addCallout(boss.dual ? "DUAL GACHA DEMONS!" : (boss.label || "GACHA DEMON!"), "#ff5ec8");
  sfx.win();
}

function pickBossAttack(d) {
  const opts = (d.attacks || BOSS_ATTACKS).slice();
  if (d.lastAtk) {
    const i = opts.indexOf(d.lastAtk);
    if (i >= 0 && opts.length > 1) opts.splice(i, 1);
  }
  return opts[Math.floor(Math.random() * opts.length)];
}

function beginBossAttack(kind, d) {
  d = d || (boss && !boss.dual ? boss : null);
  if (!d || d.dual) return;
  d.lastAtk = kind; d.mode = kind; d.modeT = 0;
  const floorY = (level && level.bossFloorY != null) ? level.bossFloorY : GROUND_Y;
  if (kind === "beam") {
    const high = Math.random() < 0.5;
    const y = high ? floorY * TILE - 118 : floorY * TILE - 12;
    d.beam = { y, high, warn: BOSS_BEAM_WARN, fire: 0, active: false, fireDur: high ? BOSS_BEAM_FIRE : BOSS_BEAM_FIRE_LOW };
    d.grin = 0.8;
  } else if (kind === "coins") {
    const n = BOSS_COIN_N[Math.min(2, bossPhaseOf(d))];
    d.coins = [];
    for (let i = 0; i < n; i++) {
      const cx = d.x + 20, cy = d.y + 90 * (d.scale || 1);
      const tx = player.x + player.w / 2 + (i - (n - 1) / 2) * 50;
      const dx = tx - cx, dy = (floorY * TILE - 20) - cy;
      const tt = 0.95 + i * 0.08;
      d.coins.push({ x: cx, y: cy, w: 14, h: 14, vx: dx / tt, vy: dy / tt - 0.5 * GRAV * tt, life: 2.4, spin: Math.random() * 6 });
    }
    d.grin = 0.6;
  } else if (kind === "minions") {
    clearBossMinions(d);
    const ph = bossPhaseOf(d);
    const n = Math.max(1, Math.min(BOSS_MINION_N[ph], d.minionKind === "both" ? BOSS_MINION_N[ph] : Math.max(1, BOSS_MINION_N[ph] - 1)));
    const sp = (level && level.diff && level.diff.enemySpeed) || 1;
    const minX = d.arenaL + 8, maxX = d.x - 8;
    for (let i = 0; i < n; i++) {
      let hop = d.minionKind === "hopper" ? true : d.minionKind === "walker" ? false : (i % 2 === 1);
      const mxTile = (d.arenaL + 40 + i * 70) / TILE;
      const e = enemyOnPlat(hop ? "hopper" : "walker", mxTile, floorY, hop ? 26 : 28, hop ? 26 : 28, {
        vx: (hop ? 40 : 55 + ph * 10) * sp,
        dir: Math.random() < 0.5 ? -1 : 1,
        minX, maxX,
        hopT: hop ? Math.random() * 0.4 : 0,
        hopEvery: hop ? (0.95 - ph * 0.08) / sp : 1.1,
        bossMinion: true, bossOwner: d,
      });
      e.x = Math.max(minX, Math.min(Math.max(minX, maxX - e.w), e.x));
      e.prevX = e.x; e.prevY = e.y;
      enemies.push(e);
      d.minions.push(e);
    }
    d.grin = 0.5;
  }
}

function clearBossMinions(d) {
  if (!d) return;
  for (const m of d.minions) { m.alive = false; m.squishT = 99; }
  d.minions = [];
  enemies = enemies.filter(e => e.bossOwner !== d);
}
function clearAllBossMinions() {
  for (const d of bossList()) clearBossMinions(d);
  enemies = enemies.filter(e => !e.bossMinion);
}

function beginBossVulnerable(d) {
  d = d || (boss && !boss.dual ? boss : null);
  if (!d || d.dual) return;
  clearBossMinions(d);
  d.mode = "vulnerable"; d.modeT = 0;
  d.beam = null;
  d.flash = BOSS_VULN[bossPhaseOf(d)];
  addCallout("OUT OF ORDER!", "#ffe66d");
}

function hitBossDemon(d) {
  if (!d || d.mode !== "vulnerable") return false;
  d.hp--; d.phase++;
  d.shake = 0.7;
  player.vy = STOMP_V_HELD; player.fromStomp = true; player.stompGrace = 0.4;
  player.onGround = false; player.jumpBuf = 0;
  player.vx = (player.x + player.w / 2 < d.x + d.w / 2 ? -1 : 1) * 180;
  sfx.stomp();
  spawnParticles(d.x + d.w / 2, d.y + d.h / 2, "#5ef0ff", 18);
  spawnParticles(d.x + d.w / 2, d.y + 40, "#ffffff", 12);
  clearBossMinions(d);
  d.coins = []; d.beam = null;
  if (d.hp <= 0) beginBossDefeat(d);
  else {
    d.mode = "stunned"; d.modeT = 0; d.flash = BOSS_HIT_STUN; d.grin = 0;
    addCallout("Gacha jammed! ×" + (d.maxHp - d.hp), "#5ef0ff");
  }
  return true;
}
function hitBoss() {
  if (!boss || boss.dual) return false;
  return hitBossDemon(boss);
}

function beginBossDefeat(d) {
  d = d || (boss && !boss.dual ? boss : null);
  if (!d || d.dual) return;
  d.mode = "defeat"; d.modeT = 0; d.defeated = true;
  d.shake = 2.2; d.beam = null; d.coins = [];
  d.domeBroken = true;
  for (const c of d.caps) {
    c.falling = true;
    c.wx = d.x + d.w / 2 + Math.cos(c.a) * c.r;
    c.wy = d.y + 50 + Math.sin(c.a * 0.9) * (c.r * 0.55);
    c.vx = (Math.random() - 0.5) * 420;
    c.vy = -220 - Math.random() * 320;
    c.spin = (Math.random() - 0.5) * 10;
  }
  clearBossMinions(d);
  for (let i = 0; i < 28; i++) {
    spawnParticles(d.x + 20 + Math.random() * 90, d.y + 30 + Math.random() * 80,
      ["#ff6ab0", "#7ec8ff", "#ffe66d", "#fff", "#b48cff"][i % 5], 1);
  }
  addCallout(boss && boss.dual ? "DEMON DOWN!" : "GACHA DEMON DOWN!", "#ffe66d");
  sfx.win();
}

function finishBossDefeat(d) {
  d = d || (boss && !boss.dual ? boss : null);
  if (!d || d.dual) return;
  for (let i = 0; i < 20; i++) spawnParticles(d.x + 20 + Math.random() * 90, d.y + 20 + Math.random() * 60, ["#ff6ab0", "#7ec8ff", "#ffe66d", "#b48cff"][i % 4], 1);
  d.mode = "done"; d.rewardPending = true;

  const allDown = bossList().every(x => x.defeated || x.mode === "done");
  if (!allDown) return;

  if (boss && boss.dual) { boss.defeated = true; boss.rewardPending = true; }

  // Reward: Rare+ for main/dual; normal pull for mini
  const rare = d.rareReward || (boss && boss.dual);
  if (rare) {
    const reward = rollRareOrBetter();
    if (reward) { if (slot) slotQueue++; else beginSlotRoll(reward); }
    else addCallout("All babes maxed out!", "#ffe66d");
  } else {
    if (pullableBabes().length) { if (slot) slotQueue++; else beginSlotRoll(); }
    else addCallout("All babes maxed out!", "#ffe66d");
  }
  goal.active = true;
}

function updateOneDemon(d, dt, arena) {
  d.t += dt;
  if (d.shake > 0) d.shake -= dt;
  if (d.grin > 0) d.grin -= dt;
  if (d.flash > 0) d.flash -= dt;
  for (const c of d.caps) {
    if (c.falling) {
      c.vy += GRAV * 0.85 * dt; c.wx += c.vx * dt; c.wy += c.vy * dt; c.spin = (c.spin || 0) + dt * 8;
      c.vx *= (1 - 0.4 * dt);
    } else { c.a += c.sp * dt; c.bob += dt * 3; }
  }
  if (d.defeated || d.mode === "done") {
    if (d.mode === "defeat") { d.modeT += dt; if (d.modeT >= 1.6) finishBossDefeat(d); }
    return;
  }

  for (let i = d.coins.length - 1; i >= 0; i--) {
    const c = d.coins[i];
    c.vy += GRAV * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.life -= dt; c.spin += dt * 8;
    if (c.life <= 0 || c.y > (LEVEL_H + 2) * TILE) { d.coins.splice(i, 1); continue; }
    if (aabb(player, c) && invuln <= 0) { hurtPlayer(c.x); d.coins.splice(i, 1); }
  }
  d.minions = d.minions.filter(m => m.alive || (m.squishT != null && m.squishT < ENEMY_SQUISH_SHOW));

  if (d.beam) {
    const b = d.beam;
    if (b.warn > 0) { b.warn -= dt; if (b.warn <= 0) { b.active = true; b.fire = b.fireDur != null ? b.fireDur : BOSS_BEAM_FIRE; } }
    else if (b.fire > 0) {
      b.fire -= dt;
      const strip = { x: arena.arenaL, y: b.y, w: arena.arenaR - arena.arenaL, h: 14 };
      if (aabb(player, strip)) hurtPlayer(player.x + player.w / 2);
      if (b.fire <= 0) d.beam = null;
    }
  }

  if (d.mode === "vulnerable") {
    const crank = bossCrankRect(d);
    if (aabb(player, crank)) {
      const prevPB = (player.prevY != null ? player.prevY : player.y) + player.h;
      if (prevPB <= crank.y + 10 && player.vy >= 0) hitBossDemon(d);
    }
  } else if (d.mode !== "defeat" && d.mode !== "done" && d.mode !== "stunned") {
    if (aabb(player, d) && invuln <= 0 && player.stompGrace <= 0) hurtPlayer(d.x + d.w / 2);
  }

  d.modeT += dt;
  const ph = bossPhaseOf(d);
  if (d.mode === "idle") {
    if (d.modeT >= (d.nextAtk || BOSS_IDLE[Math.min(2, ph)])) beginBossAttack(pickBossAttack(d), d);
  } else if (d.mode === "beam") {
    if (!d.beam) beginBossVulnerable(d);
  } else if (d.mode === "coins") {
    if (d.coins.length === 0 && d.modeT > 0.5) beginBossVulnerable(d);
  } else if (d.mode === "minions") {
    const allDead = d.minions.length === 0 || d.minions.every(m => !m.alive);
    if ((allDead && d.modeT > 0.6) || d.modeT >= d.failsafe) beginBossVulnerable(d);
  } else if (d.mode === "stunned") {
    if (d.modeT >= BOSS_HIT_STUN) { d.mode = "idle"; d.modeT = 0; d.nextAtk = 0.6; d.flash = 0; }
  } else if (d.mode === "vulnerable") {
    if (d.modeT >= BOSS_VULN[Math.min(2, ph)]) { d.mode = "idle"; d.modeT = 0; d.nextAtk = 0.3; }
  } else if (d.mode === "defeat") {
    if (d.modeT >= 1.6) finishBossDefeat(d);
  }
}

function updateBoss(dt) {
  if (!boss) return;
  const arena = boss.dual ? boss : boss;
  // Lock
  if (!arena.locked && !arena.defeated) {
    if (level && level.bossLockImmediate) lockBossArena();
    else if (player.x + player.w / 2 >= arena.arenaL + 8) lockBossArena();
  }
  if (!arena.locked) return;

  const camMin = arena.arenaL, camMax = Math.max(camMin, arena.arenaR - W);
  cameraX = Math.max(camMin, Math.min(camMax, cameraX));
  if (player.x < arena.arenaL) { player.x = arena.arenaL; if (player.vx < 0) player.vx = 0; }
  if (player.x + player.w > arena.arenaR) { player.x = arena.arenaR - player.w; if (player.vx > 0) player.vx = 0; }

  for (const d of bossList()) updateOneDemon(d, dt, arena);
}

function drawBoss() {
  if (!boss) return;
  for (const d of bossList()) drawOneDemon(d);
}

function drawOneDemon(boss) {
  if (!boss || boss.dual) return;
  const sk = boss.shake > 0 ? (Math.random() - 0.5) * 10 * Math.min(1, boss.shake) : 0;
  const bx = Math.round(boss.x + sk), by = Math.round(boss.y + sk * 0.4);
  // Body cabinet
  const body = ctx.createLinearGradient(bx, by + 50, bx + boss.w, by + boss.h);
  body.addColorStop(0, "#2a1040"); body.addColorStop(0.5, "#5a1a6a"); body.addColorStop(1, "#1a0a30");
  ctx.fillStyle = body;
  roundRect(bx + 8, by + 48, boss.w - 16, boss.h - 48, 10); ctx.fill();
  ctx.strokeStyle = (boss.mode === "stunned") ? "#5ef0ff" : "#ff5ec8"; ctx.lineWidth = 3;
  roundRect(bx + 8, by + 48, boss.w - 16, boss.h - 48, 10); ctx.stroke();
  if (boss.mode === "stunned") {
    const pulse = 0.25 + 0.2 * Math.abs(Math.sin(boss.t * 14));
    ctx.fillStyle = `rgba(255,255,255,${pulse})`;
    roundRect(bx + 8, by + 48, boss.w - 16, boss.h - 48, 10); ctx.fill();
    // Smoke while recovering
    for (let i = 0; i < 5; i++) {
      const sx = bx + 24 + i * 20 + Math.sin(boss.t * 4 + i) * 5;
      const sy = by + 36 - ((boss.modeT * 40 + i * 10) % 55);
      ctx.fillStyle = `rgba(200,230,255,${0.4 - i * 0.05})`;
      ctx.beginPath(); ctx.arc(sx, sy, 7 + (i % 3), 0, Math.PI * 2); ctx.fill();
    }
  }
  // Neon trim stripes
  ctx.fillStyle = "#5ef0ff"; ctx.fillRect(bx + 14, by + 56, boss.w - 28, 4);
  ctx.fillStyle = "#ffe66d"; ctx.fillRect(bx + 14, by + boss.h - 18, boss.w - 28, 4);
  // Glass dome (intact) or shattered wreck on defeat
  const dx = bx + boss.w / 2, dy = by + 58, rx = 46, ry = 52;
  const wrecked = !!(boss.domeBroken || boss.mode === "defeat" || boss.mode === "done");
  if (!wrecked) {
    ctx.beginPath(); ctx.ellipse(dx, dy, rx, ry, 0, Math.PI, 0); ctx.closePath();
    ctx.fillStyle = "rgba(180,220,255,0.22)"; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.ellipse(dx, dy, rx - 2, ry - 2, 0, Math.PI, 0); ctx.closePath(); ctx.clip();
    for (const c of boss.caps) {
      const px = dx + Math.cos(c.a) * c.r;
      const py = dy - 8 + Math.sin(c.a * 0.9) * (c.r * 0.55) + Math.sin(c.bob) * 3;
      ctx.fillStyle = c.col;
      ctx.beginPath(); ctx.ellipse(px, py, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1; ctx.stroke();
      const babe = babeById(c.id);
      if (babe) drawCard(babe, px - 7.5, py - 10, 15, 20, { iconOnly: true });
    }
    ctx.restore();
  } else {
    ctx.strokeStyle = "rgba(180,220,255,0.55)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(dx, dy + 8, rx, ry * 0.35, 0, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = "rgba(90,40,120,0.5)";
    ctx.beginPath(); ctx.ellipse(dx, dy + 10, rx - 4, 10, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 7; i++) {
      const ang = -Math.PI + (i / 6) * Math.PI;
      const sx = dx + Math.cos(ang) * (20 + i * 4);
      const sy = dy - 10 + Math.sin(ang) * 18 + (i % 3) * 6;
      ctx.fillStyle = `rgba(200,230,255,${0.35 + (i % 3) * 0.1})`;
      ctx.beginPath();
      ctx.moveTo(sx, sy); ctx.lineTo(sx + 10, sy + 14); ctx.lineTo(sx - 8, sy + 12);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(bx + 18, by + 70, boss.w - 36, 8);
    ctx.fillStyle = "#3a2030";
    roundRect(bx + 20, by + 150, 36, 22, 4); ctx.fill();
    for (const c of boss.caps) {
      if (!c.falling || c.wy > GROUND_Y * TILE + 40) continue;
      ctx.save(); ctx.translate(c.wx, c.wy); ctx.rotate(c.spin || 0);
      ctx.fillStyle = c.col;
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1; ctx.stroke();
      const babe = babeById(c.id);
      if (babe) drawCard(babe, -7.5, -10, 15, 20, { iconOnly: true });
      ctx.restore();
    }
  }
  // Demon face (stunned = cyan/white, vulnerable = dim, else hostile red)
  const stunned = boss.mode === "stunned";
  const eyeY = by + 100, eyeOpen = wrecked ? 2 : ((boss.mode === "vulnerable" || stunned) ? 3 : 6);
  ctx.fillStyle = wrecked ? "#442233" : stunned ? "#5ef0ff" : boss.mode === "vulnerable" ? "#888" : "#ff3a5a";
  ctx.beginPath(); ctx.ellipse(bx + 40, eyeY, 8, eyeOpen, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bx + boss.w - 40, eyeY, 8, eyeOpen, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffe66d";
  ctx.fillRect(bx + 37, eyeY - 2, 4, 4); ctx.fillRect(bx + boss.w - 43, eyeY - 2, 4, 4);
  // Horns
  ctx.fillStyle = "#b48cff";
  ctx.beginPath(); ctx.moveTo(bx + 22, by + 70); ctx.lineTo(bx + 14, by + 48); ctx.lineTo(bx + 32, by + 62); ctx.fill();
  ctx.beginPath(); ctx.moveTo(bx + boss.w - 22, by + 70); ctx.lineTo(bx + boss.w - 14, by + 48); ctx.lineTo(bx + boss.w - 32, by + 62); ctx.fill();
  // Coin-slot grin
  ctx.fillStyle = "#1a0a20";
  const grinW = 36 + (boss.grin > 0 ? 10 : 0);
  roundRect(bx + boss.w / 2 - grinW / 2, by + 120, grinW, 14, 4); ctx.fill();
  ctx.fillStyle = "#ffe66d";
  for (let i = 0; i < 5; i++) ctx.fillRect(bx + boss.w / 2 - grinW / 2 + 4 + i * 7, by + 123, 3, 8);
  // Stubby arms
  ctx.fillStyle = "#6a2a80";
  roundRect(bx - 6, by + 130, 18, 40, 6); ctx.fill();
  roundRect(bx + boss.w - 12, by + 130, 18, 40, 6); ctx.fill();
  // Crank / weak point
  const cr = bossCrankRect(boss);
  const vuln = boss.mode === "vulnerable";
  const stun = boss.mode === "stunned";
  ctx.fillStyle = stun ? "#ffffff" : vuln ? "#ffe66d" : "#ff5ec8";
  ctx.beginPath(); ctx.arc(cr.x + cr.w / 2 + sk, cr.y + cr.h / 2, cr.w / 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = vuln ? "#fff" : "#5ef0ff"; ctx.lineWidth = vuln ? 3 : 2; ctx.stroke();
  ctx.fillStyle = "#2a1040";
  ctx.fillRect(cr.x + cr.w / 2 - 3 + sk, cr.y + 4, 6, cr.h - 8);
  ctx.fillRect(cr.x + 4 + sk, cr.y + cr.h / 2 - 3, cr.w - 8, 6);
  if (vuln) {
    ctx.fillStyle = "rgba(255,230,109,0.35)";
    ctx.beginPath(); ctx.arc(cr.x + cr.w / 2 + sk, cr.y + cr.h / 2, cr.w / 2 + 6 + Math.sin(boss.t * 10) * 2, 0, Math.PI * 2); ctx.fill();
    // Smoke puffs
    for (let i = 0; i < 4; i++) {
      const sx = bx + 30 + i * 22 + Math.sin(boss.t * 3 + i) * 4;
      const sy = by + 40 - (boss.modeT * 30 + i * 8) % 50;
      ctx.fillStyle = `rgba(180,180,200,${0.35 - (sy < by ? 0.2 : 0)})`;
      ctx.beginPath(); ctx.arc(sx, sy, 8 + i, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#ffe66d"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("OUT OF ORDER", bx + boss.w / 2, by + 160);
  }
  if (stun) {
    ctx.fillStyle = "#5ef0ff"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("STUNNED", bx + boss.w / 2, by + 160);
  }
  // Nameplate
  ctx.fillStyle = "rgba(0,0,0,0.55)"; roundRect(bx + 16, by + boss.h - 36, boss.w - 32, 18, 4); ctx.fill();
  ctx.fillStyle = stun ? "#5ef0ff" : "#ff8ec8"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(boss.label || "GACHA MACHINE DEMON", bx + boss.w / 2, by + boss.h - 23);

  // Beam telegraph / fire
  if (boss.beam) {
    const b = boss.beam;
    if (b.warn > 0) {
      ctx.strokeStyle = `rgba(255,90,200,${0.4 + 0.5 * Math.sin(boss.t * 20)})`;
      ctx.setLineDash([8, 6]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(boss.arenaL, b.y + 7); ctx.lineTo(boss.arenaR, b.y + 7); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#ff8ec8"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(b.high ? "↓ STAY LOW" : "↑ JUMP!", boss.arenaL + 12, b.y - 6);
    } else if (b.active) {
      const g = ctx.createLinearGradient(boss.arenaL, b.y, boss.arenaR, b.y);
      g.addColorStop(0, "#ff4ad2"); g.addColorStop(0.5, "#fff"); g.addColorStop(1, "#5ef0ff");
      ctx.fillStyle = g; ctx.fillRect(boss.arenaL, b.y, boss.arenaR - boss.arenaL, 14);
      ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(boss.arenaL, b.y + 4, boss.arenaR - boss.arenaL, 6);
    }
  }
  // Coin projectiles
  for (const c of boss.coins) {
    ctx.save(); ctx.translate(c.x + 7, c.y + 7); ctx.rotate(c.spin);
    ctx.fillStyle = "#ffe66d"; ctx.beginPath(); ctx.ellipse(0, 0, 7, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#c4a020"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "#c4a020"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("¥", 0, 3); ctx.restore();
  }
  // Minions are drawn with the normal enemy pass (Mini Oni / Mochi Slime).
}

function drawBossHud() {
  if (!boss) return;
  const locked = boss.dual ? boss.locked : boss.locked;
  const done = boss.dual ? boss.defeated : (boss.mode === "done");
  if (!locked || done) return;
  const bw = 320, bh = 18, bx = W / 2 - bw / 2, by = 42;
  ctx.fillStyle = "rgba(0,0,0,0.55)"; roundRect(bx - 4, by - 16, bw + 8, bh + 22, 8); ctx.fill();
  ctx.fillStyle = "#ff8ec8"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
  const title = boss.dual ? "DUAL GACHA DEMONS" : (boss.label || "GACHA DEMON");
  ctx.fillText(title, W / 2, by - 3);
  ctx.fillStyle = "rgba(255,255,255,0.15)"; roundRect(bx, by, bw, bh, 6); ctx.fill();
  const hp = boss.dual ? boss.hp : boss.hp;
  const maxHp = boss.dual ? boss.maxHp : boss.maxHp;
  const pct = Math.max(0, hp / maxHp);
  const hg = ctx.createLinearGradient(bx, by, bx + bw, by);
  hg.addColorStop(0, "#ff4ad2"); hg.addColorStop(1, "#ffe66d");
  ctx.fillStyle = hg; roundRect(bx, by, bw * pct, bh, 6); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
  roundRect(bx, by, bw, bh, 6); ctx.stroke();
}
