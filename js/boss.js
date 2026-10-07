// Hot Babe Collector — boss.js
// ---------- Gacha Machine Demon (Level 3 boss) ----------
// 3 HP. Attacks telegraph clearly; the glowing crank is only stompable while it "jams"
// after an attack (smoke + "OUT OF ORDER"). Hit → stunned recovery (cyan flash) before hostile.
// Death resets HP + clears minions/projectiles
// and parks the player at the arena entrance. Defeat → shake → rare-or-better slot pull → final win.
const BOSS_HP = 3;
const BOSS_W = 4 * TILE;   // 128
const BOSS_H = 6 * TILE;   // 192
const BOSS_CRANK_W = 28, BOSS_CRANK_H = 28;
const BOSS_BEAM_WARN = 0.6, BOSS_BEAM_FIRE = 0.55, BOSS_BEAM_FIRE_LOW = 0.2;
const BOSS_COIN_N = [3, 4, 5];     // coins per spit by phase (1–3)
const BOSS_MINION_N = [2, 3, 4];
const BOSS_VULN = [1.6, 1.35, 1.15];
const BOSS_HIT_STUN = 1.15; // post-stomp recovery before hostile again
const BOSS_IDLE = [1.1, 0.85, 0.65];
const BOSS_ATTACKS = ["beam", "coins", "minions"];

let boss = null; // null outside Level 3

function makeBoss() {
  if (!level || !level.boss) return null;
  const arenaL = level.arenaLeft != null ? level.arenaLeft : checkpoints[Math.min(1, checkpoints.length - 1)].x;
  const arenaR = LEVEL_W * TILE;
  const floor = GROUND_Y * TILE;
  // Sit on the right half of the arena, facing left toward the entrance
  const x = arenaL + Math.floor((arenaR - arenaL - BOSS_W) * 0.62);
  const y = floor - BOSS_H;
  const caps = [];
  for (let i = 0; i < 14; i++) {
    const b = BABE_POOL[i % BABE_POOL.length];
    caps.push({ id: b.id, a: Math.random() * Math.PI * 2, r: 10 + Math.random() * 28,
      sp: 1.2 + Math.random() * 1.6, bob: Math.random() * 6.28, col: ["#ff6ab0", "#7ec8ff", "#ffe66d", "#b48cff", "#7dff9a"][i % 5] });
  }
  return {
    x, y, w: BOSS_W, h: BOSS_H, hp: BOSS_HP, maxHp: BOSS_HP,
    phase: 0, // hits taken
    mode: "idle", modeT: 0, nextAtk: 0,
    locked: false, arenaL, arenaR,
    crank: { ox: 18, oy: BOSS_H - 70, w: BOSS_CRANK_W, h: BOSS_CRANK_H }, // relative to boss
    beam: null, // { y, warn, fire, high }
    coins: [],  // projectiles
    minions: [],
    caps, t: 0, shake: 0, flash: 0, grin: 0,
    wallPlats: [], // temporary solid walls that close the arena
    rewardPending: false, defeated: false,
  };
}

function bossPhase() { return Math.min(2, boss ? boss.phase : 0); }
function bossCrankRect() {
  const c = boss.crank;
  return { x: boss.x + c.ox, y: boss.y + c.oy, w: c.w, h: c.h };
}
function resetBossFight() {
  if (!boss) return;
  // Clear fight-only state; keep position / arena / caps
  boss.hp = BOSS_HP; boss.phase = 0; boss.mode = "idle"; boss.modeT = 0; boss.nextAtk = 0;
  boss.beam = null; boss.coins = []; clearBossMinions();
  boss.shake = 0; boss.flash = 0; boss.grin = 0; boss.rewardPending = false; boss.defeated = false; boss.domeBroken = false;
  for (const c of boss.caps) { c.falling = false; delete c.wx; delete c.wy; delete c.vx; delete c.vy; }
  // Remove the temporary walls so the next entry re-locks cleanly
  if (boss.wallPlats.length) {
    platforms = platforms.filter(p => !boss.wallPlats.includes(p));
    boss.wallPlats = [];
  }
  boss.locked = false;
  // Goal stays inactive until a fresh defeat
  if (goal) goal.active = false;
}

function lockBossArena() {
  if (!boss || boss.locked) return;
  boss.locked = true;
  // Solid wall just left of the arena entrance (and a matching right wall past the goal)
  const left = { x: (boss.arenaL / TILE) - 1, y: 0, w: 1, h: GROUND_Y + 1 };
  const right = { x: LEVEL_W - 1, y: 0, w: 1, h: GROUND_Y + 1 };
  boss.wallPlats = [left, right];
  platforms.push(left, right);
  addCallout("GACHA DEMON!", "#ff5ec8");
  sfx.win();
}

function pickBossAttack() {
  // Prefer attacks the player hasn't just seen; escalate mix by phase
  const opts = BOSS_ATTACKS.slice();
  if (boss.lastAtk) {
    const i = opts.indexOf(boss.lastAtk);
    if (i >= 0 && opts.length > 1) opts.splice(i, 1);
  }
  return opts[Math.floor(Math.random() * opts.length)];
}

function beginBossAttack(kind) {
  boss.lastAtk = kind; boss.mode = kind; boss.modeT = 0;
  if (kind === "beam") {
    // Low beam ≈ ankle height (jump over); high beam ≈ jump apex height (stay on ground)
    const high = Math.random() < 0.5;
    const y = high ? GROUND_Y * TILE - 118 : GROUND_Y * TILE - 12;
    boss.beam = { y, high, warn: BOSS_BEAM_WARN, fire: 0, active: false, fireDur: high ? BOSS_BEAM_FIRE : BOSS_BEAM_FIRE_LOW };
    boss.grin = 0.8;
  } else if (kind === "coins") {
    const n = BOSS_COIN_N[bossPhase()];
    boss.coins = [];
    for (let i = 0; i < n; i++) {
      const cx = boss.x + 20, cy = boss.y + 90;
      const tx = player.x + player.w / 2 + (i - (n - 1) / 2) * 50;
      const dx = tx - cx, dy = (GROUND_Y * TILE - 20) - cy;
      // Arc: give an upward launch so travel time is ~0.9–1.1s
      const t = 0.95 + i * 0.08;
      boss.coins.push({ x: cx, y: cy, w: 14, h: 14, vx: dx / t, vy: dy / t - 0.5 * GRAV * t, life: 2.4, spin: Math.random() * 6 });
    }
    boss.grin = 0.6;
  } else if (kind === "minions") {
    clearBossMinions();
    const n = BOSS_MINION_N[bossPhase()];
    const sp = (level && level.diff && level.diff.enemySpeed) || 1;
    const minX = boss.arenaL + 8, maxX = boss.x - 8;
    for (let i = 0; i < n; i++) {
      const hop = i % 2 === 1; // alternate Mini Oni walker / Mochi Slime hopper
      const mxTile = (boss.arenaL + 40 + i * 70) / TILE;
      const e = enemyOnPlat(hop ? "hopper" : "walker", mxTile, GROUND_Y, hop ? 26 : 28, hop ? 26 : 28, {
        vx: (hop ? 40 : 55 + bossPhase() * 10) * sp,
        dir: Math.random() < 0.5 ? -1 : 1,
        minX, maxX,
        hopT: hop ? Math.random() * 0.4 : 0,
        hopEvery: hop ? (0.95 - bossPhase() * 0.08) / sp : 1.1,
        bossMinion: true,
      });
      // Clamp into the arena walk band
      e.x = Math.max(minX, Math.min(maxX - e.w, e.x));
      e.prevX = e.x; e.prevY = e.y;
      enemies.push(e);
      boss.minions.push(e);
    }
    boss.grin = 0.5;
  }
}

function clearBossMinions() {
  if (!boss) return;
  for (const m of boss.minions) { m.alive = false; m.squishT = 99; }
  boss.minions = [];
  // Drop spent boss-minion corpses from the shared enemies list
  enemies = enemies.filter(e => !e.bossMinion);
}

function beginBossVulnerable() {
  boss.mode = "vulnerable"; boss.modeT = 0;
  boss.beam = null;
  boss.flash = BOSS_VULN[bossPhase()];
  addCallout("OUT OF ORDER!", "#ffe66d");
}

function hitBoss() {
  if (!boss || boss.mode !== "vulnerable") return false;
  boss.hp--; boss.phase++;
  boss.shake = 0.7;
  player.vy = STOMP_V_HELD; player.fromStomp = true; player.stompGrace = 0.4;
  player.onGround = false; player.jumpBuf = 0;
  // Nudge off the crank so we don't re-land on the cabinet
  player.vx = (player.x + player.w / 2 < boss.x + boss.w / 2 ? -1 : 1) * 180;
  sfx.stomp();
  spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, "#5ef0ff", 18);
  spawnParticles(boss.x + boss.w / 2, boss.y + 40, "#ffffff", 12);
  clearBossMinions();
  boss.coins = []; boss.beam = null;
  if (boss.hp <= 0) beginBossDefeat();
  else {
    // Stunned recovery: no contact damage / no attacks; cyan-white flash, then idle telegraph
    boss.mode = "stunned"; boss.modeT = 0; boss.flash = BOSS_HIT_STUN; boss.grin = 0;
    addCallout("Gacha jammed! ×" + (BOSS_HP - boss.hp), "#5ef0ff");
  }
  return true;
}

function beginBossDefeat() {
  boss.mode = "defeat"; boss.modeT = 0; boss.defeated = true;
  boss.shake = 2.2; boss.beam = null; boss.coins = [];
  boss.domeBroken = true;
  for (const c of boss.caps) {
    c.falling = true;
    c.wx = boss.x + boss.w / 2 + Math.cos(c.a) * c.r;
    c.wy = boss.y + 50 + Math.sin(c.a * 0.9) * (c.r * 0.55);
    c.vx = (Math.random() - 0.5) * 420;
    c.vy = -220 - Math.random() * 320;
    c.spin = (Math.random() - 0.5) * 10;
  }
  clearBossMinions();
  for (let i = 0; i < 28; i++) {
    spawnParticles(boss.x + 20 + Math.random() * 90, boss.y + 30 + Math.random() * 80,
      ["#ff6ab0", "#7ec8ff", "#ffe66d", "#fff", "#b48cff"][i % 5], 1);
  }
  addCallout("GACHA DEMON DOWN!", "#ffe66d");
  sfx.win();
}

function finishBossDefeat() {
  // Burst the dome; award a guaranteed Rare-or-better pull, then unlock the goal
  for (let i = 0; i < 20; i++) spawnParticles(boss.x + 20 + Math.random() * 90, boss.y + 20 + Math.random() * 60, ["#ff6ab0", "#7ec8ff", "#ffe66d", "#b48cff"][i % 4], 1);
  boss.mode = "done"; boss.rewardPending = true;
  const reward = rollRareOrBetter();
  if (reward) {
    if (slot) slotQueue++;
    else beginSlotRoll(reward);
  } else {
    addCallout("All babes maxed out!", "#ffe66d");
  }
  goal.active = true;
}

function updateBoss(dt) {
  if (!boss) return;
  boss.t += dt;
  if (boss.shake > 0) boss.shake -= dt;
  if (boss.grin > 0) boss.grin -= dt;
  if (boss.flash > 0) boss.flash -= dt;
  for (const c of boss.caps) {
    if (c.falling) {
      c.vy += GRAV * 0.85 * dt; c.wx += c.vx * dt; c.wy += c.vy * dt; c.spin = (c.spin || 0) + dt * 8;
      c.vx *= (1 - 0.4 * dt);
    } else { c.a += c.sp * dt; c.bob += dt * 3; }
  }

  // Lock when the player crosses the arena entrance
  if (!boss.locked && !boss.defeated && player.x + player.w / 2 >= boss.arenaL + 8) lockBossArena();
  if (!boss.locked) return;

  // Camera lock to the arena
  const camMin = boss.arenaL, camMax = Math.max(camMin, boss.arenaR - W);
  cameraX = Math.max(camMin, Math.min(camMax, cameraX));

  // Soft clamp the player inside the walls (walls are solid too)
  if (player.x < boss.arenaL) { player.x = boss.arenaL; if (player.vx < 0) player.vx = 0; }

  // Projectiles
  for (let i = boss.coins.length - 1; i >= 0; i--) {
    const c = boss.coins[i];
    c.vy += GRAV * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.life -= dt; c.spin += dt * 8;
    if (c.life <= 0 || c.y > (LEVEL_H + 2) * TILE) { boss.coins.splice(i, 1); continue; }
    if (aabb(player, c) && invuln <= 0) { hurtPlayer(c.x); boss.coins.splice(i, 1); }
  }

  // Boss minions live in `enemies` (walker/hopper AI + stomp rules). Keep the ref list tidy.
  boss.minions = boss.minions.filter(m => m.alive || (m.squishT != null && m.squishT < ENEMY_SQUISH_SHOW));

  // Beam
  if (boss.beam) {
    const b = boss.beam;
    if (b.warn > 0) { b.warn -= dt; if (b.warn <= 0) { b.active = true; b.fire = b.fireDur != null ? b.fireDur : BOSS_BEAM_FIRE; } }
    else if (b.fire > 0) {
      b.fire -= dt;
      // Hurt if overlapping the beam strip (full arena width, 14 px tall)
      const strip = { x: boss.arenaL, y: b.y, w: boss.arenaR - boss.arenaL, h: 14 };
      if (aabb(player, strip)) hurtPlayer(player.x + player.w / 2);
      if (b.fire <= 0) boss.beam = null;
    }
  }

  // Weak-point stomp while vulnerable
  if (boss.mode === "vulnerable") {
    const crank = bossCrankRect();
    if (aabb(player, crank)) {
      const prevPB = (player.prevY != null ? player.prevY : player.y) + player.h;
      if (prevPB <= crank.y + 10 && player.vy >= 0) hitBoss();
    }
  } else if (boss.mode !== "defeat" && boss.mode !== "done" && boss.mode !== "stunned") {
    // Body contact hurts (not stomping the body — only the crank is a weak point)
    if (aabb(player, boss) && invuln <= 0 && player.stompGrace <= 0) hurtPlayer(boss.x + boss.w / 2);
  }

  // State machine
  boss.modeT += dt;
  const ph = bossPhase();
  if (boss.mode === "idle") {
    if (boss.modeT >= (boss.nextAtk || BOSS_IDLE[ph])) beginBossAttack(pickBossAttack());
  } else if (boss.mode === "beam") {
    if (!boss.beam) beginBossVulnerable();
  } else if (boss.mode === "coins") {
    if (boss.coins.length === 0 && boss.modeT > 0.5) beginBossVulnerable();
  } else if (boss.mode === "minions") {
    // Must clear all spawned minions (long failsafe only)
    const allDead = boss.minions.length === 0 || boss.minions.every(m => !m.alive);
    if ((allDead && boss.modeT > 0.6) || boss.modeT > 45) beginBossVulnerable();
  } else if (boss.mode === "stunned") {
    if (boss.modeT >= BOSS_HIT_STUN) { boss.mode = "idle"; boss.modeT = 0; boss.nextAtk = 0.6; boss.flash = 0; }
  } else if (boss.mode === "vulnerable") {
    if (boss.modeT >= BOSS_VULN[ph]) { boss.mode = "idle"; boss.modeT = 0; boss.nextAtk = 0.3; }
  } else if (boss.mode === "defeat") {
    if (boss.modeT >= 1.6) finishBossDefeat();
  } else if (boss.mode === "done") {
    // Wait for the reward roll to finish, then let the player reach the unlocked goal
  }
}

function drawBoss() {
  if (!boss) return;
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
  const cr = bossCrankRect();
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
  ctx.fillText("GACHA MACHINE DEMON", bx + boss.w / 2, by + boss.h - 23);

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
  if (!boss || !boss.locked || boss.mode === "done") return;
  const bw = 320, bh = 18, bx = W / 2 - bw / 2, by = 42;
  ctx.fillStyle = "rgba(0,0,0,0.55)"; roundRect(bx - 4, by - 16, bw + 8, bh + 22, 8); ctx.fill();
  ctx.fillStyle = "#ff8ec8"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("GACHA DEMON", W / 2, by - 3);
  ctx.fillStyle = "rgba(255,255,255,0.15)"; roundRect(bx, by, bw, bh, 6); ctx.fill();
  const pct = Math.max(0, boss.hp / boss.maxHp);
  const hg = ctx.createLinearGradient(bx, by, bx + bw, by);
  hg.addColorStop(0, "#ff4ad2"); hg.addColorStop(1, "#ffe66d");
  ctx.fillStyle = hg; roundRect(bx, by, bw * pct, bh, 6); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
  roundRect(bx, by, bw, bh, 6); ctx.stroke();
}


