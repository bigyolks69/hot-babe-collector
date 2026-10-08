// Hot Babe Collector — update.js
// ---------- Update ----------
function updatePlay(dt) {
  tickPlayTimer(dt);
  if (player.stun > 0) player.stun -= dt;
  if (player.stompGrace > 0) player.stompGrace -= dt;

  // movement (disabled briefly while stunned so knockback reads)
  if (player.stun <= 0) {
    let move = 0;
    if (keys["arrowleft"] || keys["a"]) move -= 1;
    if (keys["arrowright"] || keys["d"]) move += 1;
    if (move !== 0) {
      player.vx += move * MOVE_ACC * dt;
      player.facing = move;
    } else {
      const fr = FRICTION * dt;
      if (Math.abs(player.vx) <= fr) player.vx = 0;
      else player.vx -= Math.sign(player.vx) * fr;
    }
    player.vx = Math.max(-moveMaxNow(), Math.min(moveMaxNow(), player.vx));

    // jump buffer / coyote + all-30 double jump (live unique count, same as aura)
    if (justPressed[" "] || justPressed["arrowup"] || justPressed["w"]) {
      player.jumpBuf = JUMP_BUF;
    }
    if (player.onGround) {
      player.coyote = COYOTE;
      player.airJumpsUsed = 0; // reset air jumps on land
    } else {
      player.coyote -= dt;
    }
    player.jumpBuf -= dt;

    if (player.jumpBuf > 0 && player.coyote > 0) {
      player.vy = jumpVNow();
      player.onGround = false;
      player.coyote = 0;
      player.jumpBuf = 0;
      sfx.jump();
    } else if (
      player.jumpBuf > 0 &&
      !player.onGround &&
      player.coyote <= 0 &&
      hasAllBabesAura() &&
      player.airJumpsUsed < 1
    ) {
      // one extra jump in air while full unique collection is held
      player.vy = jumpVNow();
      player.airJumpsUsed = 1;
      player.jumpBuf = 0;
      player.fromStomp = false;
      sfx.jump();
    }
    // variable jump height — never cut an active stomp bounce until apex
    const jumpHeld = keys[" "] || keys["arrowup"] || keys["w"];
    if (player.fromStomp && player.vy >= 0) player.fromStomp = false;
    if (!jumpHeld && player.vy < 0 && !player.fromStomp) {
      player.vy *= JUMP_CUT;
    }
  } else {
    // Stunned: light air drag only; do not clamp to MOVE_MAX (preserves knockback)
    player.jumpBuf = 0;
    player.coyote = 0;
    player.vx *= (1 - Math.min(1, 1.2 * dt));
  }

  player.vy += GRAV * dt;
  if (player.vy > 900) player.vy = 900;
  resolvePlayer(dt);
  updateCrackedPlatforms(dt);

  // Pit / cliff: one deliberate full wipe — all hearts gone, lose one card, then checkpoint respawn.
  // Guarded by state !== "play" inside onHeartsZero path (state flips to "dead" immediately) so no multi-trigger.
  if (player.y > (LEVEL_H + 2) * TILE) {
    hearts = 0;
    player.vx = 0;
    player.vy = 0;
    // Park at checkpoint immediately so we are not still "in the pit" next frame
    const cp = checkpoints[checkpointIdx];
    player.x = cp.x;
    player.y = cp.y - player.h;
    sfx.hit();
    onHeartsZero();
    return;
  }

  // checkpoints
  for (let i = checkpointIdx + 1; i < checkpoints.length; i++) {
    const c = checkpoints[i];
    if (player.x + player.w / 2 >= c.x && (!level.vertical || player.y + player.h <= c.y + 8)) checkpointIdx = i;
  }

  // coins (bob + collect; multiple hits while rolling are queued)
  for (const c of coins) {
    if (c.collected) continue;
    c.bob += dt * 3;
    if (aabb(player, c)) {
      c.collected = true;
      spawnParticles(c.x + 8, c.y + 10, "#ffd24a", 8);
      onCoinCollected();
    }
  }

  // enemies — gravity + ledge turns (never float mid-air)
  for (const e of enemies) {
    if (!e.alive) { if (e.squishT != null) e.squishT += dt; continue; }
    e.prevX = e.x;
    e.prevY = e.y;
    e.animT = (e.animT || 0) + dt;

    if (e.type === "flyer") updateFlyer(e, dt);
    else {
    if (e.x < e.minX) { e.x = e.minX; e.dir = 1; }
    if (e.x + e.w > e.maxX) { e.x = e.maxX - e.w; e.dir = -1; }

    const feetY = e.y + e.h;
    const aheadX = e.dir > 0 ? e.x + e.w - 2 : e.x - 4;
    const aheadTop = platformTopNear(aheadX, 6, feetY);
    if (aheadTop == null || Math.abs(aheadTop - feetY) > 10) e.dir *= -1;

    e.x += e.vx * e.dir * dt;
    if (e.x < e.minX) { e.x = e.minX; e.dir = 1; }
    if (e.x + e.w > e.maxX) { e.x = e.maxX - e.w; e.dir = -1; }

    e.vy = (e.vy || 0) + GRAV * dt * (e.type === "hopper" ? 0.85 : 1);
    e.y += e.vy * dt;

    const top = platformTopNear(e.x, e.w, e.y + e.h);
    const onGround = top != null && (e.y + e.h) >= top - 1 && (e.y + e.h) <= top + 18 && e.vy >= 0;
    if (e.type === "hopper") {
      if (onGround && !e.grounded) e.landT = SLIME_LAND; // just touched down → brief squash
      if (e.landT > 0) e.landT -= dt;
      e.grounded = onGround;
    }
    if (onGround) {
      e.y = top - e.h;
      e.vy = 0;
      if (e.type === "hopper") {
        e.hopT = (e.hopT || 0) + dt;
        if (e.hopT > (e.hopEvery || 1.1)) { e.vy = -520; e.hopT = 0; }
      }
    }
    } // walker / hopper

    if (!aabb(player, e)) continue;

    // Stomp if player was/is above (prev feet vs prev enemy top), even if enemy jumps up
    const STOMP_TOL = 8;
    const prevPlayerBottom = (player.prevY != null ? player.prevY : player.y) + player.h;
    const prevEnemyTop = e.prevY != null ? e.prevY : e.y;
    const fromAbove = prevPlayerBottom <= prevEnemyTop + STOMP_TOL;
    // Vertical-dominant overlap with player clearly above (hopper jump-into-feet)
    const playerAbove = player.y + player.h <= e.y + e.h * 0.55 && player.y < e.y;
    const stomping = fromAbove || playerAbove;

    if (stomping) {
      e.alive = false;
      e.squishT = 0; // show the squished frame briefly
      player.y = e.y - player.h;
      player.onGround = false;
      const jumpHeld = keys[" "] || keys["arrowup"] || keys["w"];
      player.vy = jumpHeld ? STOMP_V_HELD : STOMP_V;
      player.stompGrace = 0.12;
      player.fromStomp = true;
      player.jumpBuf = 0;
      sfx.stomp();
      spawnParticles(e.x + e.w/2, e.y + e.h/2, e.type === "hopper" ? "#7dff9a" : e.type === "flyer" ? "#b48cff" : "#ff8a5b", 12);
    } else {
      hurtPlayer(e.x + e.w/2);
    }
  }

  player.prevY = player.y;
  player.prevX = player.x;

  // Boss (Level 3) — runs before the camera so it can lock the view
  if (boss) updateBoss(dt);

  // goal (boss levels keep it inactive until the fight is won)
  if (goal.active !== false && aabb(player, goal)) {
    state = "win";
    const final = levelNum >= LEVELS.length;
    if (final) { progress.level = 1; progress.beatGame = true; }
    else progress.level = levelNum + 1; // next session picks up at the next level
    saveProgress(progress);
    winStats = {
      level: levelNum, final,
      unique: ownedUniqueCount(collection),
      total: totalPulls(collection),
      coins: coins.filter(c => c.collected).length,
      coinsMax: coins.length,
      gained: runGained.slice(),
    };
    sfx.win();
  }

  if (invuln > 0) invuln -= dt;
  if (player.flash > 0) player.flash -= dt;
  player.anim += dt * (Math.abs(player.vx) > 20 ? 10 : 4);

  // Sky heart drop (timer only advances here — paused in menu/win/death)
  updateFloatHeart(dt);
  updateHeartPickups(dt);

  // camera (single-boss lock freezes X; dual arenas can be wider than the view — follow then clamp)
  const bossLocked = boss && (boss.dual ? boss.locked && !boss.defeated : boss.locked && !boss.defeated);
  if (!bossLocked) {
    const target = player.x - W * 0.38;
    cameraX += (target - cameraX) * Math.min(1, 6 * dt);
    cameraX = Math.max(0, Math.min(cameraX, LEVEL_W * TILE - W));
  } else if (boss.dual) {
    const camMin = boss.arenaL, camMax = Math.max(camMin, boss.arenaR - W);
    const target = player.x - W * 0.38;
    cameraX += (target - cameraX) * Math.min(1, 6 * dt);
    cameraX = Math.max(camMin, Math.min(camMax, cameraX));
  } else {
    const camMin = boss.arenaL, camMax = Math.max(camMin, boss.arenaR - W);
    cameraX = Math.max(camMin, Math.min(camMax, cameraX));
  }
  if (level && level.vertical) {
    const vc = verticalCamTarget();
    cameraY += (vc.ty - cameraY) * Math.min(1, 6 * dt);
    const maxY = Math.max(0, LEVEL_H * TILE - H);
    cameraY = Math.max(vc.camMin, Math.min(maxY, cameraY));
  } else {
    cameraY = 0;
  }
}

// Flyer: horizontal patrol + sine bob. When the player is near and below it hovers in place for a
// short tell (fast flap, red eyes), dives gently toward them (never below head height on its floor),
// holds, rises back and cools down. Stomp from above = kill + bounce; any other touch hurts.
function updateFlyer(e, dt) {
  e.t += dt;
  e.flap += dt * (e.mode === "tell" ? 22 : 9);
  const pcx = player.x + player.w / 2, ecx = e.x + e.w / 2;
  const near = Math.abs(pcx - ecx) < FLY_RANGE && player.y + player.h / 2 > e.y + e.h / 2 && hearts > 0;
  if (e.cool > 0) e.cool -= dt;
  e.modeT += dt;
  if (e.mode === "patrol") { if (near && e.cool <= 0) { e.mode = "tell"; e.modeT = 0; } }
  else if (e.mode === "tell") { if (e.modeT >= FLY_TELL) { e.mode = "dive"; e.modeT = 0; } }
  else if (e.mode === "dive") { if (e.swoop >= FLY_SWOOP - 0.5 || (!near && e.modeT > 0.3)) { e.mode = "hold"; e.modeT = 0; } }
  else if (e.mode === "hold") { if (e.modeT >= FLY_HOLD) { e.mode = "rise"; e.modeT = 0; } }
  else if (e.mode === "rise") { if (e.swoop <= 0.5) { e.swoop = 0; e.mode = "patrol"; e.cool = FLY_COOL; } }
  const diving = e.mode === "dive" || e.mode === "hold";
  const want = diving ? Math.min(FLY_SWOOP, Math.max(0, (player.y + player.h / 2) - (e.baseY + e.h / 2))) : 0;
  const rate = e.mode === "dive" ? FLY_DIVE_V : FLY_RISE_V;
  e.swoop += Math.sign(want - e.swoop) * Math.min(Math.abs(want - e.swoop), rate * dt);
  let vx = e.vx * e.dir;
  if (e.mode === "tell") vx = 0;
  else if (diving) { const d = pcx - ecx; vx = Math.sign(d) * Math.min(e.vx, Math.abs(d) * 3); if (d) e.dir = Math.sign(d); }
  e.x += vx * dt;
  if (e.x < e.minX) { e.x = e.minX; e.dir = 1; }
  if (e.x + e.w > e.maxX) { e.x = e.maxX - e.w; e.dir = -1; }
  e.y = e.baseY + Math.sin(e.t * 2.4) * FLY_BOB + e.swoop;
  e.vy = dt > 0 ? (e.y - e.prevY) / dt : 0;
}

// 13x10 pixel bat-drone, 2 flap frames (2px per pixel). W wing, w wing edge, B body, b belly, E eye, F fang
const FLYER_FRAMES = [
  ["w...........w",
   "Ww.........wW",
   "WWw.BBBBB.wWW",
   ".WWBBBBBBBWW.",
   "..BBEBBBEBB..",
   "..BBBbbbBBB..",
   "...BBbbbBB...",
   "....BFBFB....",
   ".............",
   "............."],
  [".............",
   ".............",
   "....BBBBB....",
   "...BBBBBBB...",
   ".wBBEBBBEBBw.",
   "WWBBBbbbBBBWW",
   "Ww.BBbbbBB.wW",
   "w...BFBFB...w",
   ".............",
   "............."],
];
// Frame for the walker (oni) / hopper (slime) from its current state
function enemyFrame(e) {
  const t = e.animT || 0;
  if (e.type === "walker") {
    const sp = (level && level.diff.enemySpeed) || 1;
    if (Math.abs(e.vx) > 5) return "oni_walk_" + (Math.floor(t / (ONI_WALK_FRAME / sp)) % 4);
    return "oni_idle_" + (Math.floor(t / ONI_IDLE_FRAME) % 2);
  }
  // hopper
  if (e.grounded) {
    if ((e.landT || 0) > 0 || (e.hopT || 0) > (e.hopEvery || 1.1) - SLIME_PREHOP) return "slime_squash";
    return "slime_idle_" + (Math.floor(t / SLIME_IDLE_FRAME) % 2);
  }
  if (e.vy < -50) return "slime_rise";
  return "slime_fall";
}
function drawEnemySprite(e, name) {
  const im = ENEMY_IMG[name];
  if (!imgOk(im)) return false;
  const dx = Math.round(e.x + e.w / 2 - 16), dy = Math.round(e.y + e.h - 32);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (e.dir < 0) { ctx.translate(dx + 32, dy); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, 32, 32); }
  else ctx.drawImage(im, dx, dy, 32, 32);
  ctx.restore();
  return true;
}

function drawFlyer(e) {
  const tell = e.mode === "tell";
  const pal = { W: "#5a3fb0", w: "#c3adff", B: "#8f6cf2", b: "#c9b8ff", E: tell ? "#ff4a6a" : "#5fe8ff", F: "#ffffff" };
  const frame = FLYER_FRAMES[Math.floor(e.flap) % 2];
  const shake = tell ? (Math.floor(e.modeT * 40) % 2 ? 1 : -1) : 0;
  const ox = Math.round(e.x) + shake, oy = Math.round(e.y);
  for (let r = 0; r < frame.length; r++) {
    const row = frame[r];
    for (let c = 0; c < row.length; c++) {
      const col = pal[row[c]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(ox + c * 2, oy + r * 2, 2, 2);
    }
  }
}

function updateSlot(dt) {
  if (!slot) return;
  if (!slot.done) {
    slot.elapsed += dt;
    const t = Math.min(1, slot.elapsed / slot.duration);
    // Ease-out cubic on POSITION so we land exactly on targetIndex (the pre-planted result)
    const ease = 1 - Math.pow(1 - t, 3);
    const prev = Math.floor(slot.offset + 1e-9);
    slot.offset = slot.startOffset + (slot.targetIndex - slot.startOffset) * ease;
    if (Math.floor(slot.offset + 1e-9) !== prev) sfx.tick();
    if (t >= 1) {
      slot.offset = slot.targetIndex;
      slot.done = true;
      slot.revealT = 0;
    }
  } else {
    slot.revealT += dt;
    if (slot.revealT > 0.275) finishSlot(); // half of previous 0.55s reveal hold
  }
}

function updateDead(dt) {
  if (!loseAnim) { state = "play"; resetAfterDeath(); return; }
  loseAnim.t += dt;
  if (loseAnim.t >= loseAnim.dur) {
    loseAnim = null;
    resetAfterDeath();
    state = "play";
  }
}

function resetAfterDeath() {
  hearts = 3;
  invuln = 1.5;
  resetHeartDrop();
  deathCry = null;
  stopDeathCry();
  const cp = checkpoints[checkpointIdx];
  player.x = cp.x; player.y = cp.y - player.h;
  player.vx = 0; player.vy = 0;
  player.stun = 0;
  player.stompGrace = 0;
  player.fromStomp = false;
  player.prevX = player.x; player.prevY = player.y;
  syncRecent(); // a babe lost down to 0 leaves the tray now
  // Respawn coins AND enemies at original positions/state (same as level start)
  coins = makeCoins();
  heartPickups = makeHeartPickups();
  enemies = makeEnemies();
  restorePlatforms();
  // Boss fight: reset HP / clear minions & coins; player is already parked at the arena entrance CP
  if (boss) resetBossFight();
  if (level && level.startMid && boss) {
    const mid = (boss.arenaL + boss.arenaR) / 2;
    player.x = mid - player.w / 2;
    player.y = (level.bossFloorY != null ? level.bossFloorY : GROUND_Y) * TILE - player.h;
    player.prevX = player.x; player.prevY = player.y;
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 600*dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = callouts.length - 1; i >= 0; i--) {
    callouts[i].t += dt;
    if (callouts[i].t >= callouts[i].dur) callouts.splice(i, 1);
  }
  // Layout: newest on top, older ones stacked beneath; ease toward target slot
  const baseY = calloutBaseY();
  for (let i = callouts.length - 1, k = 0; i >= 0; i--, k++) {
    const c = callouts[i];
    const ty = baseY + k * (CALLOUT_H + CALLOUT_GAP);
    c.y = c.y == null ? ty : c.y + (ty - c.y) * Math.min(1, 12 * dt);
  }
}

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

