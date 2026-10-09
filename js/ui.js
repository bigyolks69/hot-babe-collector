// Hot Babe Collector — ui.js
// ---------- Draw ----------
function drawBackground() {
  // sky gradient
  const g = ctx.createLinearGradient(0, 0, 0, H);
  const th = (level && level.theme) || LEVEL_THEMES.dusk;
  g.addColorStop(0, th.sky[0]);
  g.addColorStop(0.5, th.sky[1]);
  g.addColorStop(1, th.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Neon city-pop skyline (Level 3) — drawn behind the hills as a far parallax layer
  if (th.neon) {
    const px = cameraX * 0.25;
    const signs = th.signs || ["#ff4ad2", "#5ef0ff", "#ffe66d"];
    for (let i = -1; i < 14; i++) {
      const bx = ((i * 110 - px) % (W + 220) + W + 220) % (W + 220) - 80;
      const bh = 60 + (i * 37) % 90, by = H - 130 - bh;
      ctx.fillStyle = "#1a0a28"; ctx.fillRect(bx, by, 70, bh + 40);
      // Windows
      for (let wy = by + 8; wy < by + bh; wy += 14)
        for (let wx = bx + 8; wx < bx + 60; wx += 14) {
          const on = ((Math.floor(performance.now() / 400) + i * 3 + wx) % 7) !== 0;
          ctx.fillStyle = on ? signs[(i + wx) % signs.length] : "#2a1538";
          ctx.globalAlpha = on ? 0.85 : 0.35;
          ctx.fillRect(wx, wy, 8, 8);
        }
      ctx.globalAlpha = 1;
      // Blinking rooftop sign
      if ((i + Math.floor(performance.now() / 350)) % 5 !== 0) {
        ctx.fillStyle = signs[i % signs.length];
        ctx.fillRect(bx + 10, by - 10, 40, 8);
        ctx.fillStyle = "#fff"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "left";
        ctx.fillText(["LOVE", "NEON", "POP", "GACHA", "CITY"][i % 5], bx + 12, by - 3);
      }
    }
  }

  // parallax hills
  ctx.fillStyle = th.hills;
  for (let i = 0; i < 8; i++) {
    const hx = ((i * 280) - cameraX * 0.2) % (W + 300) - 80;
    ctx.beginPath();
    ctx.ellipse(hx + 120, H - 40, 160, 70, 0, 0, Math.PI*2);
    ctx.fill();
  }
  // stars
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 97) * 13 - cameraX * 0.05) % W;
    const sy = (i * 37) % (H * 0.55);
    ctx.fillRect(sx, sy, 2, 2);
  }
}

function drawWorld() {
  ctx.save();
  ctx.translate(-Math.floor(cameraX), -Math.floor(cameraY || 0));

  // platforms (only those on screen — levels are ~3x longer now)
  const th = level.theme;
  const viewL = cameraX - 64, viewR = cameraX + W + 64;
  for (const p of platforms) {
    // Fallen cracked plats are fully destroyed (debris = particles only). Old bug kept
    // fallT stuck at ~0 so a non-collidable "ghost" ledge stayed fully opaque.
    if (p.fallen) continue;
    const x = p.x*TILE, y = p.y*TILE;
    const w = p.w*TILE, h = p.h*TILE;
    if (x + w < viewL || x > viewR) continue;
    const shakeX = (p.cracked && p.crackTimer > CRACK_STAND) ? Math.sin(performance.now() / 30) * 2 : 0;
    // dirt body — cracked undersides drawn thin (~1/4 prior dark band); collision h unchanged
    ctx.fillStyle = p.cracked ? "#6a4a38" : th.dirt;
    const grassH = 8;
    const darkH = p.cracked ? Math.max(4, Math.round((h - grassH) / 4)) : (h - grassH); // was ~24px → ~6px
    const bodyH = p.cracked ? (grassH + darkH) : h; // cracked visual ~14px; solids keep full h
    ctx.fillRect(x + shakeX, y, w, bodyH);
    // grass top
    ctx.fillStyle = p.cracked ? "#c4a070" : th.grass;
    ctx.fillRect(x + shakeX, y, w, grassH);
    // pixel edge
    ctx.fillStyle = th.edge;
    for (let i = 0; i < w; i += 8) ctx.fillRect(x + shakeX + i, y + grassH, 6, 3);
    if (p.cracked) {
      ctx.strokeStyle = "rgba(20,10,0,0.55)"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 4 + shakeX, y + 3); ctx.lineTo(x + w * 0.4 + shakeX, y + 7);
      ctx.moveTo(x + w * 0.35 + shakeX, y + 2); ctx.lineTo(x + w * 0.7 + shakeX, y + 8);
      ctx.moveTo(x + w * 0.55 + shakeX, y + 4); ctx.lineTo(x + w - 4 + shakeX, y + 6);
      ctx.stroke();
    }
    // bricks hint on tall
    if (h > TILE) {
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      for (let ty = y + TILE; ty < y + h; ty += TILE) {
        ctx.fillRect(x, ty, w, 2);
        for (let tx = x; tx < x + w; tx += TILE) ctx.fillRect(tx, ty, 2, TILE);
      }
    }
  }

  // checkpoints flags
  for (let i = 0; i < checkpoints.length; i++) {
    const c = checkpoints[i];
    const active = i <= checkpointIdx;
    ctx.fillStyle = "#ddd";
    ctx.fillRect(c.x, c.y - 48, 4, 48);
    ctx.fillStyle = active ? "#ff5a9a" : "#888";
    ctx.beginPath();
    ctx.moveTo(c.x + 4, c.y - 48);
    ctx.lineTo(c.x + 28, c.y - 36);
    ctx.lineTo(c.x + 4, c.y - 24);
    ctx.fill();
  }

  // coins — mystery cardback (Iris A5), bob + sparkle
  for (const c of coins) {
    if (c.collected || c.x + c.w < viewL || c.x > viewR) continue;
    const by = c.y + Math.sin(c.bob) * 4;
    const cx = Math.floor(c.x), cy = Math.floor(by);
    const cw = Math.floor(c.w), ch = Math.floor(c.h);
    const back = cardImgs.mystery.sm || cardImgs.mystery.md;
    if (!drawCardBitmap(back, cx, cy, cw, ch, false)) {
      const g = ctx.createLinearGradient(cx, cy, cx, cy + ch);
      g.addColorStop(0, "#6b3a8a");
      g.addColorStop(1, "#2a1040");
      roundRect(cx, cy, cw, ch, 3);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.fillStyle = "#ffd24a";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("?", cx + cw / 2, cy + ch / 2 + 3);
    }
    // sparkle
    const sp = (Math.sin(c.bob * 2) + 1) * 0.5;
    ctx.globalAlpha = 0.35 + sp * 0.55;
    ctx.fillStyle = "#fff";
    ctx.fillRect(cx + cw - 4, cy + 2, 2, 2);
    ctx.fillRect(cx + 2, cy + ch * 0.4, 2, 2);
    ctx.globalAlpha = 1;
  }

  // enemies
  for (const e of enemies) {
    if (e.x + e.w < viewL || e.x > viewR) continue;
    if (!e.alive) {
      if (e.squishT != null && e.squishT < ENEMY_SQUISH_SHOW && e.type !== "flyer")
        drawEnemySprite(e, e.type === "walker" ? "oni_squished" : "slime_squished");
      continue;
    }
    if (e.type === "flyer") {
      drawFlyer(e);
    } else if (drawEnemySprite(e, enemyFrame(e))) {
      // sprite drawn
    } else if (e.type === "walker") {
      ctx.fillStyle = "#e85d4c";
      roundRect(e.x, e.y, e.w, e.h, 4);
      ctx.fill();
      // eyes
      ctx.fillStyle = "#fff";
      ctx.fillRect(e.x + 6 + (e.dir>0?8:0), e.y + 8, 6, 6);
      ctx.fillRect(e.x + 16 + (e.dir>0?8:0), e.y + 8, 6, 6);
      ctx.fillStyle = "#111";
      ctx.fillRect(e.x + 8 + (e.dir>0?8:0), e.y + 10, 3, 3);
      ctx.fillRect(e.x + 18 + (e.dir>0?8:0), e.y + 10, 3, 3);
      // feet
      ctx.fillStyle = "#a03028";
      ctx.fillRect(e.x + 2, e.y + e.h - 4, 8, 4);
      ctx.fillRect(e.x + e.w - 10, e.y + e.h - 4, 8, 4);
    } else {
      // hopper — green blob with spring
      ctx.fillStyle = "#5dcf6a";
      ctx.beginPath();
      ctx.ellipse(e.x + e.w/2, e.y + e.h/2, e.w/2, e.h/2 * (e.vy < -50 ? 1.15 : 0.9), 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(e.x + 8, e.y + 10, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(e.x + 18, e.y + 10, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#111";
      ctx.fillRect(e.x + 8, e.y + 10, 3, 3);
      ctx.fillRect(e.x + 18, e.y + 10, 3, 3);
    }
  }

  // Neon rooftop props (AC units + water tanks) along the ground
  if (level && level.theme && level.theme.neon) {
    for (let tx = Math.floor(viewL / TILE); tx < Math.ceil(viewR / TILE); tx++) {
      if (tx % 7 === 3) {
        const x = tx * TILE + 4, y = GROUND_Y * TILE - 18;
        ctx.fillStyle = "#4a3a60"; ctx.fillRect(x, y, 22, 18);
        ctx.fillStyle = "#5ef0ff"; ctx.fillRect(x + 3, y + 3, 6, 4); ctx.fillRect(x + 12, y + 3, 6, 4);
      } else if (tx % 11 === 5) {
        const x = tx * TILE + 6, y = GROUND_Y * TILE - 28;
        ctx.fillStyle = "#6a7a90"; ctx.beginPath(); ctx.arc(x + 12, y + 14, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#8aa0b8"; ctx.fillRect(x + 8, y - 4, 8, 10);
      }
    }
  }

  // Boss
  if (boss) drawBoss();

  // goal flag (hidden until active on boss levels)
  if (goal.active === false) { /* sealed until the demon falls */ }
  else {
  ctx.fillStyle = "#eee";
  ctx.fillRect(goal.x, goal.y, 5, goal.h);
  ctx.fillStyle = "#ffd24a";
  ctx.beginPath();
  ctx.moveTo(goal.x + 5, goal.y);
  ctx.lineTo(goal.x + 40, goal.y + 16);
  ctx.lineTo(goal.x + 5, goal.y + 32);
  ctx.fill();
  ctx.fillStyle = "#ff5a9a";
  ctx.beginPath();
  ctx.arc(goal.x + 2, goal.y, 6, 0, Math.PI*2);
  ctx.fill();
  }

  // map + sky hearts (world space; HUD hearts stay in drawHUD)
  drawHeartPickups();
  drawFloatHeart();

  // player (pixel hero or fallback shapes)
  drawPlayer();

  // particles in world space
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}


// Bottom-right mini tray: only owned babes, newest acquisition on the right, at most 5.
function drawHudLiveBabes() {
  if (state !== "play" && state !== "dead" && state !== "dying") { hudTrayHit = null; return; }
  const lostId = state === "dead" && loseAnim ? loseAnim.lostId : null;
  // newest-first, owned (keep a just-lost babe visible during the Ouch screen for her X)
  const recent = recentBabes.filter(id => (collection[id] || 0) > 0 || id === lostId).slice(0, HUD_SLOTS);
  const list = recent.slice().reverse().map(babeById).filter(Boolean); // oldest → newest (left → right)
  const n = list.length;
  const cw = HUD_CW, ch = cardHeight(cw), gap = HUD_GAP;
  const pad = 8, counterH = 16;
  const unique = ownedUniqueCount(collection);
  const label = "Babes " + unique + "/" + BABE_POOL.length;
  ctx.font = "bold 11px sans-serif";
  const cardsW = n ? n * cw + (n - 1) * gap : 0;
  const panelW = pad * 2 + Math.max(cardsW, Math.ceil(ctx.measureText(label).width));
  const panelH = pad + counterH + (n ? ch + pad : 0);
  const margin = 10;
  // Touch: lift tray above on-screen jump; portrait needs less canvas-space lift (letterbox absorbs chrome)
  const portrait = window.innerHeight > window.innerWidth;
  const lift = isTouch ? (portrait ? 78 : 130) : 18;
  const panelX = W - panelW - margin;
  // L6 dual fight: park tray top-right (under HP bar, clear of both demons) so the right boss isn't covered
  const dualFight = !!(boss && boss.dual && boss.locked && !boss.defeated && state === "play");
  const panelY = dualFight
    ? 68
    : (H - panelH - lift - (n ? 0 : ch + pad));
  const step = cw + gap;
  hudTrayHit = { x: panelX, y: panelY, w: panelW, h: panelH };

  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = "rgba(12,8,22,0.78)";
  roundRect(panelX, panelY, panelW, panelH, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,90,154,0.45)";
  ctx.lineWidth = 1.5;
  roundRect(panelX, panelY, panelW, panelH, 8);
  ctx.stroke();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = "#ffb0d0";
  ctx.textAlign = "left";
  ctx.fillText(label, panelX + pad, panelY + 13);

  if (n) {
    const viewX = panelX + panelW - pad - cardsW; // right-aligned
    const viewY = panelY + pad + counterH;
    ctx.save();
    ctx.beginPath();
    ctx.rect(panelX + 2, viewY - 2, panelW - 4, ch + 4);
    ctx.clip();
    const slide = step * Math.max(0, 1 - (performance.now() - (hudTray.slideAt || -1e9)) / 200);
    for (let i = 0; i < n; i++) {
      const babe = list[i];
      const isNewest = i === n - 1;
      const x = viewX + i * step + slide;
      const y = viewY;
      const count = collection[babe.id] || 0;
      const isLost = babe.id === lostId;
      ctx.globalAlpha = isNewest && slide > 0 ? 0.95 * (1 - slide / step) : 0.95;
      if (isLost) {
        const displayCount = count > 0 ? count : (loseAnim.lostPrevCount > 1 ? loseAnim.lostPrevCount - 1 : null);
        drawCard(babe, x, y, cw, ch, { iconOnly: true, count: displayCount && displayCount > 1 ? displayCount : null });
        drawLostBabeX(x, y, cw, ch, loseAnim.t);
      } else {
        // 15x20 face crops (nearest-neighbour), dupe count, no MAX tag in the tray
        drawCard(babe, x, y, cw, ch, { iconOnly: true, count: count > 1 ? count : null });
      }
      if (hudTray.highlightId === babe.id && hudTray.highlightT > 0) {
        const pulse = 0.5 + 0.5 * Math.sin((0.55 - hudTray.highlightT) * 20);
        ctx.strokeStyle = `rgba(255,230,109,${0.55 + 0.45 * pulse})`;
        ctx.lineWidth = 2;
        roundRect(x - 1, y - 1, cw + 2, ch + 2, 5);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  ctx.restore();
}


/** Play-time readout — pixel/city-pop pill matching hearts / tray HUD.
 *  M:SS in the main font, then smaller ".hh" hundredths on the same baseline. */
function playTimerFonts(big) {
  return big ? { main: "bold 18px sans-serif", small: "bold 12px sans-serif", px: 18, padX: 12, bh: 28, r: 8 }
             : { main: "bold 13px sans-serif", small: "bold 9px sans-serif", px: 13, padX: 8, bh: 22, r: 6 };
}
function playTimerPillWidth(big) {
  const f = playTimerFonts(!!big);
  ctx.save();
  ctx.font = f.main;
  const mw = Math.ceil(ctx.measureText(formatPlayTime(playTimerMs)).width);
  ctx.font = f.small;
  const fw = Math.ceil(ctx.measureText(".00").width); // fixed slot so the pill doesn't jitter
  ctx.restore();
  return mw + 1 + fw + f.padX * 2;
}
function drawPlayTimer(x, y, opts) {
  const o = opts || {};
  const big = !!o.big;
  const f = playTimerFonts(big);
  const label = formatPlayTime(playTimerMs);
  const frac = formatPlayTimeHundredths(playTimerMs);
  ctx.save();
  ctx.font = f.main;
  const mm = ctx.measureText(label);
  const mw = Math.ceil(mm.width);
  const asc = mm.actualBoundingBoxAscent || f.px * 0.72; // digit cap height
  const bw = playTimerPillWidth(big), bh = f.bh;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  roundRect(x, y, bw, bh, f.r);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,230,109,0.55)";
  ctx.lineWidth = 1.25;
  roundRect(x, y, bw, bh, f.r);
  ctx.stroke();
  const baseY = Math.round(y + bh / 2 + asc / 2);
  ctx.fillStyle = "#ffe66d";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(label, x + f.padX, baseY);
  ctx.font = f.small;
  ctx.fillStyle = "rgba(255,230,109,0.85)";
  ctx.fillText(frac, x + f.padX + mw + 1, baseY);
  ctx.restore();
  return { w: bw, h: bh };
}

function drawHUD() {
  // hearts
  for (let i = 0; i < MAX_HEARTS; i++) {
    const hx = 16 + i * 28, hy = 14;
    ctx.fillStyle = i < hearts ? "#ff4d6d" : "#44222a";
    ctx.beginPath();
    ctx.moveTo(hx, hy + 6);
    ctx.bezierCurveTo(hx, hy, hx + 12, hy, hx + 12, hy + 6);
    ctx.bezierCurveTo(hx + 12, hy + 14, hx, hy + 18, hx, hy + 18);
    ctx.bezierCurveTo(hx, hy + 18, hx - 12, hy + 14, hx - 12, hy + 6);
    ctx.bezierCurveTo(hx - 12, hy, hx, hy, hx, hy + 6);
    ctx.fill();
  }

  // play timer — top-left under hearts (avoids centre level bar + right collection box)
  drawPlayTimer(8, 36);

  // level number + distance-to-flag bar (top centre)
  {
    const lw = 132, lx = W / 2 - lw / 2, ly = 6;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    roundRect(lx, ly, lw, 30, 8); ctx.fill();
    ctx.fillStyle = "#ffe66d";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LEVEL " + levelNum + " / " + LEVELS.length, W / 2, ly + 15);
    const bossLocked = boss && (boss.dual ? boss.locked : boss.locked);
    const prog = bossLocked
      ? Math.max(0, 1 - boss.hp / boss.maxHp)
      : Math.max(0, Math.min(1, (player.x - checkpoints[0].x) / Math.max(1, (goal.x || LEVEL_W * TILE) - checkpoints[0].x)));
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(lx + 12, ly + 21, lw - 24, 4);
    ctx.fillStyle = "#ff5a9a";
    ctx.fillRect(lx + 12, ly + 21, (lw - 24) * prog, 4);
    for (const cp of checkpoints) { // checkpoint ticks
      const f = (cp.x - checkpoints[0].x) / Math.max(1, goal.x - checkpoints[0].x);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(lx + 12 + (lw - 24) * f - 0.5, ly + 20, 1.5, 6);
    }
  }

  if (boss) drawBossHud();

  // collection count
  const unique = ownedUniqueCount(collection);
  const total = totalPulls(collection);
  // Box grows leftward to fit the hint; right edge stays at W - 12
  const pullsLine = "Total pulls: " + total + (isTouch ? "  [Menu]" : "  [press C = Collection]");
  ctx.font = "11px sans-serif";
  const boxW = Math.max(158, Math.ceil(ctx.measureText(pullsLine).width) + 24);
  const boxX = W - 12 - boxW;
  if (boxX !== hudBoxX) { hudBoxX = boxX; positionMuteBtn(); }
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  roundRect(boxX, 8, boxW, 36, 8);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Babes " + unique + "/" + BABE_POOL.length, boxX + 12, 24);
  ctx.font = "11px sans-serif";
  ctx.fillStyle = "#ffb0d0";
  ctx.fillText(pullsLine, boxX + 12, 38);

  // studio tag
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Big Salty Gaming Studio", W/2, H - 8);

  // callouts
  for (const c of callouts) {
    const y = c.y == null ? calloutBaseY() : c.y;
    ctx.globalAlpha = calloutAlpha(c);
    ctx.font = "bold 18px sans-serif";
    const cwBox = Math.max(280, Math.ceil(ctx.measureText(c.text).width) + 32);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    roundRect(W/2 - cwBox/2, y, cwBox, CALLOUT_H, 8);
    ctx.fill();
    ctx.fillStyle = c.color;
    ctx.textAlign = "center";
    ctx.fillText(c.text, W/2, y + 24);
    ctx.globalAlpha = 1;
  }

  drawHudLiveBabes();
}

function drawSlot() {
  // Overlay only — no screen dimming; world keeps rendering underneath
  // Panel height is 70% of the original 150px; cards scale uniformly (3:4)
  const panelY = SLOT_PANEL_Y;
  const panelH = SLOT_PANEL_H; // 105
  const scale = 0.7;
  ctx.fillStyle = "rgba(20,10,30,0.92)";
  roundRect(40, panelY, W - 80, panelH, 12);
  ctx.fill();
  ctx.strokeStyle = "#ff5a9a";
  ctx.lineWidth = 2.5;
  roundRect(40, panelY, W - 80, panelH, 12);
  ctx.stroke();

  ctx.fillStyle = "#ffb0d0";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(slot.done ? "★ YOU GOT ★" : "✦ ROLLING… ✦", W/2, panelY + 18);

  if (slotQueue > 0) {
    ctx.fillStyle = "#ffe66d";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Queue +" + slotQueue, W - 56, panelY + 18);
  }

  // card window — width derived from height via CARD_ASPECT
  const cw = 72 * scale;           // 50.4
  const ch = cardHeight(cw);       // exact 3:4
  const gap = 14 * scale;
  const centerX = W/2;
  const cy = panelY + 26;
  const viewW = cw * 5 + gap * 4;
  const vx = centerX - viewW/2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(vx - 3, cy - 3, viewW + 6, ch + 6);
  ctx.clip();

  const base = slot.offset;
  for (let i = -3; i <= 3; i++) {
    const idx = Math.floor(base) + i;
    if (idx < 0 || idx >= slot.strip.length) continue;
    const frac = base - Math.floor(base);
    const cx = centerX + (i - frac) * (cw + gap) - cw/2;
    const char = slot.strip[idx];
    drawCard(char, cx, cy, cw, ch, { glow: slot.done && idx === slot.targetIndex ? 1 : 0 });
  }
  ctx.restore();

  // center highlight frame
  ctx.strokeStyle = "#ffe66d";
  ctx.lineWidth = 2.5;
  roundRect(centerX - cw/2 - 3, cy - 3, cw + 6, ch + 6, 8);
  ctx.stroke();

  if (slot.done) {
    const rar = rarityOf(slot.result.id);
    ctx.fillStyle = rar.color;
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(slot.result.name + " — " + rar.label, W/2, panelY + panelH - 8);
  }
}

function sortedBabeList() {
  return BABE_POOL.slice().sort((a, b) => {
    const rd = rarityRank(a.id) - rarityRank(b.id);
    if (rd !== 0) return rd;
    return a.name.localeCompare(b.name);
  });
}

function focusHudOnBabe(id) {
  if (!id) return;
  hudTray.highlightId = id;
  hudTray.highlightT = 0.55;
}

function updateHudTray(dt) {
  if (hudTray.highlightT > 0) hudTray.highlightT -= dt;
}

function galleryFilteredList() {
  let list = BABE_POOL.slice();
  const f = gallery.filter;
  if (f === "owned") list = list.filter(b => (collection[b.id] || 0) > 0);
  else if (f === "missing") list = list.filter(b => !(collection[b.id] > 0));
  else if (f === "common" || f === "rare" || f === "ultra") {
    list = list.filter(b => b.rarity === f);
  }
  list.sort((a, b) => {
    const rd = rarityRank(a.id) - rarityRank(b.id);
    if (rd !== 0) return rd;
    return a.name.localeCompare(b.name);
  });
  return list;
}

function galleryResetBtn() {
  // Top-right of the gallery — reset entry point (P opens gallery; does not reset)
  return { x: W - 178, y: 12, w: 160, h: 36 };
}
function galleryRefreshCacheBtn() {
  // Directly under Reset collection — same panel for mobile + desktop
  const rb = galleryResetBtn();
  return { x: rb.x, y: rb.y + rb.h + 8, w: rb.w, h: rb.h };
}
function galleryBackToL1Btn() {
  // Under Refresh Cache — same gallery menu (mobile Menu + desktop C/P)
  const rcb = galleryRefreshCacheBtn();
  return { x: rcb.x, y: rcb.y + rcb.h + 8, w: rcb.w, h: rcb.h };
}
function handleGalleryClick(sx, sy) {
  // Reset-confirm popup buttons (mobile) take priority over the gallery underneath
  if (resetConfirm) {
    const L = resetConfirmLayout();
    const hit = (b) => sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h;
    if (hit(L.resetBtn)) confirmResetCollection();
    else if (hit(L.cancelBtn)) cancelResetConfirm();
    return;
  }
  // Gallery "Reset" / "Refresh Cache" buttons
  const rb = galleryResetBtn();
  if (sx >= rb.x && sx <= rb.x + rb.w && sy >= rb.y && sy <= rb.y + rb.h) {
    openResetConfirm();
    return;
  }
  const rcb = galleryRefreshCacheBtn();
  if (sx >= rcb.x && sx <= rcb.x + rcb.w && sy >= rcb.y && sy <= rcb.y + rcb.h) {
    hardRefreshCache();
    return;
  }
  const bl1 = galleryBackToL1Btn();
  if (sx >= bl1.x && sx <= bl1.x + bl1.w && sy >= bl1.y && sy <= bl1.y + bl1.h) {
    goBackToLevel1();
    return;
  }
  // Filter tabs
  const tabY = 56, tabH = 28, tabGap = 6;
  const labels = GALLERY_FILTERS;
  let tx = 40;
  for (const lab of labels) {
    const label = galleryFilterLabel(lab);
    ctx.font = "bold 11px sans-serif";
    const tw = Math.max(54, ctx.measureText(label).width + 16);
    if (sx >= tx && sx <= tx + tw && sy >= tabY && sy <= tabY + tabH) {
      gallery.filter = lab;
      gallery.scroll = 0;
      gallery.selected = null;
      return;
    }
    tx += tw + tabGap;
  }
  // Page buttons
  if (sx >= W - 120 && sx <= W - 70 && sy >= H - 42 && sy <= H - 14) {
    gallery.scroll = Math.max(0, gallery.scroll - 160);
    return;
  }
  if (sx >= W - 60 && sx <= W - 10 && sy >= H - 42 && sy <= H - 14) {
    gallery.scroll += 160;
    return;
  }
  // Detail close
  if (gallery.selected) {
    if (sx >= W / 2 - 40 && sx <= W / 2 + 40 && sy >= H - 50 && sy <= H - 22) {
      gallery.selected = null;
      return;
    }
  }
  // Grid hit
  const list = galleryFilteredList();
  const cols = 5;
  const cw = 100, ch = cardHeight(cw), gapX = 16, gapY = 14;
  const gridW = cols * cw + (cols - 1) * gapX;
  const startX = (W - gridW) / 2;
  const startY = 100 - gallery.scroll;
  for (let i = 0; i < list.length; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const x = startX + col * (cw + gapX);
    const y = startY + row * (ch + gapY);
    if (sx >= x && sx <= x + cw && sy >= y && sy <= y + ch) {
      gallery.selected = list[i].id;
      return;
    }
  }
}

function updateGalleryInput() {
  if (justPressed["arrowleft"] || justPressed["a"]) gallery.scroll = Math.max(0, gallery.scroll - 120);
  if (justPressed["arrowright"] || justPressed["d"]) gallery.scroll += 120;
  if (justPressed["arrowup"] || justPressed["w"]) gallery.scroll = Math.max(0, gallery.scroll - 80);
  if (justPressed["arrowdown"] || justPressed["s"]) gallery.scroll += 80;
  if (justPressed["pageup"]) gallery.scroll = Math.max(0, gallery.scroll - 220);
  if (justPressed["pagedown"]) gallery.scroll += 220;
  // number keys 1-7 for filters
  for (let i = 0; i < GALLERY_FILTERS.length; i++) {
    if (justPressed[String(i + 1)]) {
      gallery.filter = GALLERY_FILTERS[i];
      gallery.scroll = 0;
      gallery.selected = null;
    }
  }
  if (justPressed["escape"] && gallery.selected) {
    gallery.selected = null;
    justPressed["escape"] = false; // consume so we don't close gallery
  }
}

function drawCollection() {
  updateGalleryInput();
  ctx.fillStyle = "rgba(12,8,20,0.94)";
  ctx.fillRect(0, 0, W, H);

  const unique = ownedUniqueCount(collection);
  drawPlayTimer(12, 10);
  // Collection Bonus — top-left under the timer pill (clear of title, count, tabs + right-side buttons)
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = collectionBuffStacks() > 0 ? "#9aefc4" : "#bbb";
  ctx.fillText(collectionBonusText(), 14, 50);
  ctx.fillStyle = "#ff8ec8";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Babe Gallery", W / 2, 34);
  // Reset + Refresh Cache + Go back to level 1 (same gallery panel for mobile Menu + desktop C/P)
  {
    const rb = galleryResetBtn();
    ctx.fillStyle = "rgba(224,69,127,0.55)";
    roundRect(rb.x, rb.y, rb.w, rb.h, 10); ctx.fill();
    ctx.strokeStyle = "#ffe66d"; ctx.lineWidth = 1.5;
    roundRect(rb.x, rb.y, rb.w, rb.h, 10); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("Reset collection", rb.x + rb.w / 2, rb.y + rb.h / 2 + 1);
    const rcb = galleryRefreshCacheBtn();
    ctx.fillStyle = "rgba(80,120,200,0.55)";
    roundRect(rcb.x, rcb.y, rcb.w, rcb.h, 10); ctx.fill();
    ctx.strokeStyle = "#a8d4ff"; ctx.lineWidth = 1.5;
    roundRect(rcb.x, rcb.y, rcb.w, rcb.h, 10); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif";
    ctx.fillText("Refresh Cache", rcb.x + rcb.w / 2, rcb.y + rcb.h / 2 + 1);
    const bl1 = galleryBackToL1Btn();
    ctx.fillStyle = "rgba(60,160,120,0.55)";
    roundRect(bl1.x, bl1.y, bl1.w, bl1.h, 10); ctx.fill();
    ctx.strokeStyle = "#9aefc4"; ctx.lineWidth = 1.5;
    roundRect(bl1.x, bl1.y, bl1.w, bl1.h, 10); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "bold 13px sans-serif";
    ctx.fillText("Go back to level 1", bl1.x + bl1.w / 2, bl1.y + bl1.h / 2 + 1);
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "center";
  }
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#fff";
  ctx.fillText("Babes " + unique + "/" + BABE_POOL.length, W / 2, 54);
  if (collectionCompleteFlag) {
    // small badge, right of the count
    ctx.font = "bold 11px sans-serif";
    const label = "★ Collection complete";
    const bw = Math.ceil(ctx.measureText(label).width) + 14;
    const bx = W / 2 + 52, by = 42;
    ctx.fillStyle = "#ffd24a";
    roundRect(bx, by, bw, 16, 8); ctx.fill();
    ctx.fillStyle = "#3a1600";
    ctx.textAlign = "left";
    ctx.fillText(label, bx + 7, by + 12);
    ctx.textAlign = "center";
  }
  ctx.font = "11px sans-serif";
  ctx.fillStyle = "#888";
  ctx.fillText("Reset collection clears babes  ·  C / Esc close  ·  Wheel / arrows scroll  ·  1–6 filters", W / 2, H - 10);

  // Filter tabs
  const tabY = 62, tabH = 26, tabGap = 6;
  let tx = 36;
  ctx.textAlign = "center";
  for (const lab of GALLERY_FILTERS) {
    const label = galleryFilterLabel(lab);
    ctx.font = "bold 11px sans-serif";
    const tw = Math.max(54, ctx.measureText(label).width + 16);
    const active = gallery.filter === lab;
    ctx.fillStyle = active ? "rgba(255,90,154,0.55)" : "rgba(255,255,255,0.1)";
    roundRect(tx, tabY, tw, tabH, 6);
    ctx.fill();
    ctx.strokeStyle = active ? "#ff8ec8" : "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    roundRect(tx, tabY, tw, tabH, 6);
    ctx.stroke();
    ctx.fillStyle = active ? "#fff" : "#bbb";
    ctx.fillText(label, tx + tw / 2, tabY + 17);
    tx += tw + tabGap;
  }

  const list = galleryFilteredList();
  const cols = 5;
  const cw = 100, ch = cardHeight(cw), gapX = 16, gapY = 14;
  const gridW = cols * cw + (cols - 1) * gapX;
  const startX = (W - gridW) / 2;
  const startY = 100;
  const rows = Math.ceil(list.length / cols) || 1;
  const contentH = rows * (ch + gapY);
  const viewH = H - startY - 48;
  const maxScroll = Math.max(0, contentH - viewH);
  gallery.scroll = Math.max(0, Math.min(gallery.scroll, maxScroll));

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, startY - 4, W, viewH + 8);
  ctx.clip();
  for (let i = 0; i < list.length; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const x = startX + col * (cw + gapX);
    const y = startY + row * (ch + gapY) - gallery.scroll;
    if (y + ch < startY - 10 || y > startY + viewH + 10) continue;
    const babe = list[i];
    const count = collection[babe.id] || 0;
    drawCard(babe, x, y, cw, ch, {
      locked: count === 0,
      count: count > 0 ? count : null,
    });
    if (gallery.selected === babe.id) {
      ctx.strokeStyle = "#ffe66d";
      ctx.lineWidth = 3;
      roundRect(x - 2, y - 2, cw + 4, ch + 4, 10);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Page buttons
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  roundRect(W - 120, H - 42, 46, 28, 6);
  ctx.fill();
  roundRect(W - 60, H - 42, 46, 28, 6);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("▲", W - 97, H - 23);
  ctx.fillText("▼", W - 37, H - 23);

  // Detail overlay
  if (gallery.selected) {
    const babe = babeById(gallery.selected);
    if (babe) {
      const count = collection[babe.id] || 0;
      const rar = rarityOf(babe.id);
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(0, 0, W, H);
      const dw = 220, dh = cardHeight(dw); // uses lg 440 art (smoothed downscale)
      const dx = (W - dw) / 2, dy = 90;
      drawCard(babe, dx, dy, dw, dh, {
        locked: count === 0,
        count: count > 0 ? count : null,
        glow: count > 0 ? 0.6 : 0,
      });
      ctx.fillStyle = "#fff";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(count > 0 ? babe.name : "???", W / 2, dy + dh + 36);
      ctx.fillStyle = rar.color;
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(rar.label, W / 2, dy + dh + 60);
      ctx.fillStyle = "#ccc";
      ctx.font = "14px sans-serif";
      ctx.fillText(count > 0 ? ("Owned ×" + count + (count >= MAX_COPIES ? " · MAX (out of the pull pool)" : "")) : "Not yet collected", W / 2, dy + dh + 84);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      roundRect(W / 2 - 50, H - 52, 100, 30, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("Close", W / 2, H - 32);
    }
  }
}

function drawTitle() {
  drawBackground();
  // decorative cards
  for (let i = 0; i < 5; i++) {
    const ch = CHAR_DEFS[i * 2];
    drawCard(ch, 60 + i * 180, 160 + Math.sin(performance.now()/500 + i)*10, 90, cardHeight(90), {});
  }
  ctx.fillStyle = "rgba(10,5,20,0.55)";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#ff5a9a";
  ctx.font = "bold 48px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Hot Babe Collector", W/2, 200);
  ctx.fillStyle = "#ffb0d0";
  ctx.font = "18px sans-serif";
  ctx.fillText("Big Salty Gaming Studio", W/2, 236);

  ctx.fillStyle = "#fff";
  ctx.font = "16px sans-serif";
  ctx.fillText("Collect babes • Stomp foes • Reach the flag", W/2, 300);
  ctx.fillStyle = "#ffe66d";
  ctx.font = "bold 20px sans-serif";
  const blink = Math.sin(performance.now()/300) > 0;
  if (!heroSprites.ready && !heroSprites.failed) {
    ctx.fillStyle = "#ffb0d0";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("Loading hero…", W/2, 360);
  } else if (blink) {
    const lv = progress.level > 1 ? " — Level " + progress.level : "";
    ctx.fillText((isTouch ? "Tap to Start" : "Press Enter / Space to Start") + lv, W/2, 360);
  }

  ctx.fillStyle = "#999";
  ctx.font = "12px sans-serif";
  ctx.fillText(isTouch
    ? "On-screen ← → Jump  •  Menu"
    : "←→ / A D move  •  Space / W / ↑ jump  •  C babe gallery", W/2, 420);
  if (isTouch) {
    ctx.fillStyle = "#c8a0b8";
    ctx.font = "13px sans-serif";
    ctx.fillText("Play in portrait or landscape — whichever you prefer", W/2, 458);
  }
}

// Compact collection strip for death / win overlays
// Bold red X: pen-stroke draw — stroke1 then stroke2, ~0.15s each, no delay, then hold
const LOST_X_STROKE = 0.15;
function drawLostBabeX(x, y, w, h, t) {
  const inset = Math.max(3, w * 0.12);
  const x0 = x + inset, y0 = y + inset;
  const x1 = x + w - inset, y1 = y + h - inset;
  ctx.save();
  ctx.strokeStyle = "#ff2030";
  ctx.lineWidth = Math.max(3, Math.min(8, w * 0.14));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // Stroke 1 grows TL → BR
  const a = Math.max(0, Math.min(1, t / LOST_X_STROKE));
  if (a > 0) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a);
    ctx.stroke();
  }
  // Stroke 2 grows TR → BL after stroke 1 finishes
  const b = Math.max(0, Math.min(1, (t - LOST_X_STROKE) / LOST_X_STROKE));
  if (b > 0) {
    ctx.beginPath();
    ctx.moveTo(x1, y0);
    ctx.lineTo(x1 + (x0 - x1) * b, y0 + (y1 - y0) * b);
    ctx.stroke();
  }
  ctx.restore();
}

function layoutMiniCollection(panelW, maxPanelH) {
  const cols = 6, rows = 2;
  const gapX = 8, gapY = 8;
  const padX = 14, padTop = 28, padBot = 12;
  const gridW = panelW - padX * 2;
  let cw = (gridW - gapX * (cols - 1)) / cols;
  let ch = cardHeight(cw);
  let contentH = padTop + rows * ch + (rows - 1) * gapY + padBot;
  if (maxPanelH && contentH > maxPanelH) {
    // Shrink uniformly so 2 rows fit without squashing
    const maxCh = (maxPanelH - padTop - padBot - (rows - 1) * gapY) / rows;
    ch = maxCh;
    cw = cardWidth(ch);
    contentH = padTop + rows * ch + (rows - 1) * gapY + padBot;
  }
  return { cols, rows, gapX, gapY, padX, padTop, padBot, cw, ch, contentH };
}

function drawMiniCollection(opts) {
  opts = opts || {};
  const panelX = opts.x != null ? opts.x : 100;
  const panelY = opts.y != null ? opts.y : 175;
  const panelW = opts.w != null ? opts.w : W - 200;
  const maxH = opts.maxH != null ? opts.maxH : (H - panelY - 20);
  const lostId = opts.lostId || null;
  const lostPrevCount = opts.lostPrevCount || 0;
  const animT = opts.animT != null ? opts.animT : 0;
  const animDur = opts.animDur != null ? opts.animDur : 2.2;

  const L = layoutMiniCollection(panelW, maxH);
  const panelH = L.contentH;

  // Center grid horizontally if cards shrank below full width
  const gridW = L.cols * L.cw + (L.cols - 1) * L.gapX;
  const gridOriginX = panelX + (panelW - gridW) / 2;

  ctx.fillStyle = "rgba(12,8,22,0.88)";
  roundRect(panelX, panelY, panelW, panelH, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,90,154,0.55)";
  ctx.lineWidth = 2;
  roundRect(panelX, panelY, panelW, panelH, 12);
  ctx.stroke();

  const unique = Object.keys(collection).filter(k => collection[k] > 0).length;
  ctx.fillStyle = "#ffb0d0";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Babes", panelX + 14, panelY + 20);
  ctx.fillStyle = "#fff";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(unique + " / " + CHAR_DEFS.length + " owned", panelX + panelW - 14, panelY + 20);

  for (let i = 0; i < CHAR_DEFS.length; i++) {
    const col = i % L.cols, row = Math.floor(i / L.cols);
    const x = gridOriginX + col * (L.cw + L.gapX);
    const y = panelY + L.padTop + row * (L.ch + L.gapY);
    const char = CHAR_DEFS[i];
    const count = collection[char.id] || 0;
    const isLost = lostId && char.id === lostId;
    const cw = L.cw, ch = L.ch;

    ctx.save();
    if (isLost) {
      // Keep babe colored as pre-loss; pen-stroke red X draws in (~0.15s × 2)
      const displayCount = count > 0 ? count : (lostPrevCount > 1 ? lostPrevCount - 1 : null);
      drawCard(char, x, y, cw, ch, {
        locked: false,
        count: displayCount,
        showRarity: false,
      });
      drawLostBabeX(x, y, cw, ch, animT);
    } else {
      drawCard(char, x, y, cw, ch, {
        locked: count === 0,
        count: count > 0 ? count : null,
        showRarity: false,
      });
    }
    ctx.restore();
  }
  return { panelH, cw: L.cw, ch: L.ch, ratio: L.cw / L.ch };
}

function drawDead() {
  // Solid black — same stage as the cry beat; layout unchanged on top
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ff6b8a";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Ouch!", W / 2, 48);
  const unique = ownedUniqueCount(collection);
  ctx.fillStyle = "#ffb0d0";
  ctx.font = "13px sans-serif";
  ctx.fillText("Babes owned: " + unique + "/" + BABE_POOL.length, W / 2, 72);

  if (loseAnim && loseAnim.name) {
    ctx.fillStyle = "#ffe66d";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("LOST: " + loseAnim.name, W / 2, 98);
    ctx.fillStyle = "#bbb";
    ctx.font = "12px sans-serif";
    ctx.fillText("A random babe was taken from your collection", W / 2, 118);
  } else {
    ctx.fillStyle = "#ccc";
    ctx.font = "14px sans-serif";
    ctx.fillText("No babes to lose… this time.", W / 2, 100);
  }

  // Gallery-style grid (rarity→name), auto-scrolled to lost babe
  const list = sortedBabeList();
  const cols = 6;
  const cw = 92, ch = cardHeight(cw), gapX = 12, gapY = 10;
  const panelX = 48, panelY = 132;
  const panelW = W - 96;
  const panelH = H - panelY - 40;
  const gridW = cols * cw + (cols - 1) * gapX;
  const startX = panelX + (panelW - gridW) / 2;
  const rows = Math.ceil(list.length / cols);
  const contentH = rows * ch + (rows - 1) * gapY;
  const maxScroll = Math.max(0, contentH - panelH + 8);

  let focusIdx = loseAnim && loseAnim.lostId
    ? list.findIndex(b => b.id === loseAnim.lostId) : -1;
  if (deathGridScroll < 0) {
    if (focusIdx >= 0) {
      const row = Math.floor(focusIdx / cols);
      const rowY = row * (ch + gapY);
      deathGridScroll = Math.max(0, Math.min(maxScroll, rowY - (panelH - ch) / 2));
    } else {
      deathGridScroll = 0;
    }
  }
  deathGridScroll = Math.max(0, Math.min(maxScroll, deathGridScroll));

  ctx.fillStyle = "rgba(12,8,22,0.88)";
  roundRect(panelX, panelY, panelW, panelH, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,90,154,0.5)";
  ctx.lineWidth = 2;
  roundRect(panelX, panelY, panelW, panelH, 12);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.rect(panelX + 4, panelY + 4, panelW - 8, panelH - 8);
  ctx.clip();

  for (let i = 0; i < list.length; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const x = startX + col * (cw + gapX);
    const y = panelY + 10 + row * (ch + gapY) - deathGridScroll;
    if (y + ch < panelY || y > panelY + panelH) continue;
    const babe = list[i];
    const count = collection[babe.id] || 0;
    const isLost = loseAnim && loseAnim.lostId === babe.id;
    if (isLost) {
      const displayCount = count > 0 ? count : (loseAnim.lostPrevCount > 1 ? loseAnim.lostPrevCount - 1 : null);
      drawCard(babe, x, y, cw, ch, {
        locked: false,
        count: displayCount,
      });
      drawLostBabeX(x, y, cw, ch, loseAnim.t);
    } else {
      drawCard(babe, x, y, cw, ch, {
        locked: count === 0,
        count: count > 0 ? count : null,
      });
    }
  }
  ctx.restore();

  ctx.fillStyle = "#aaa";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Respawning at checkpoint…", W / 2, H - 14);
}

function drawWin() {
  ctx.fillStyle = "rgba(10,5,30,0.85)";
  ctx.fillRect(0, 0, W, H);
  const fin = !winStats || winStats.final;

  if (fin) {
    // Beat-game ending: picture + one line (Card nest)
    ctx.fillStyle = "#ffe66d";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("You beat the game!", W / 2, 40);

    const marginX = 40, top = 56, bottomReserve = 100;
    const imgAreaW = W - marginX * 2;
    const imgAreaH = H - top - bottomReserve;
    const AR = 16 / 9;
    let iw = imgAreaW, ih = iw / AR;
    if (ih > imgAreaH) { ih = imgAreaH; iw = ih * AR; }
    const ix = (W - iw) / 2, iy = top + Math.max(0, (imgAreaH - ih) / 2) * 0.35;

    if (imgOk(endingImg)) {
      ctx.drawImage(endingImg, ix, iy, iw, ih);
      ctx.strokeStyle = "rgba(255,230,109,0.85)";
      ctx.lineWidth = 2;
      ctx.strokeRect(ix - 0.5, iy - 0.5, iw + 1, ih + 1);
    } else {
      ctx.fillStyle = "#2a1040";
      ctx.fillRect(ix, iy, iw, ih);
      ctx.fillStyle = "#ff8ec8";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("…", W / 2, iy + ih / 2);
    }

    ctx.fillStyle = "#ff8ec8";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(ENDING_LINE, W / 2, iy + ih + 28);

    drawPlayTimer((W - playTimerPillWidth(true)) / 2, iy + ih + 48, { big: true });

    ctx.fillStyle = "#ffe66d";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(isTouch ? "Tap to play again from Level 1" : "Press Enter to play again from Level 1", W / 2, H - 36);
    ctx.fillStyle = "#aaa";
    ctx.font = "13px sans-serif";
    ctx.fillText(isTouch ? "Open Menu to view your babes" : "Press C to view full babe gallery", W / 2, H - 16);
    return;
  }

  ctx.fillStyle = "#ffe66d";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Level " + levelNum + " Complete!", W / 2, 48);
  ctx.fillStyle = "#ff8ec8";
  ctx.font = "15px sans-serif";
  ctx.fillText("Big Salty Gaming Studio thanks you — Level " + (levelNum + 1) + " awaits", W / 2, 74);

  {
    drawPlayTimer((W - playTimerPillWidth(true)) / 2, 86, { big: true });
  }
  if (winStats) {
    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    ctx.fillText(
      "Babe drops " + winStats.coins + "/" + winStats.coinsMax +
      "   ·   Babes " + winStats.unique + "/" + BABE_POOL.length +
      "   ·   Pulls " + winStats.total,
      W / 2, 128
    );
  }

  ctx.fillStyle = "#ffb0d0";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("Babes gained this run", W / 2, 156);

  const gained = (winStats && winStats.gained) ? winStats.gained : [];
  if (!gained.length) {
    ctx.fillStyle = "#888";
    ctx.font = "14px sans-serif";
    ctx.fillText("No babes collected this run — next time!", W / 2, 236);
  } else {
    const cw = 72, ch = cardHeight(cw), gap = 12;
    const totalW = gained.length * cw + (gained.length - 1) * gap;
    // Scrollable row if too wide
    const maxW = W - 80;
    const scrollMax = Math.max(0, totalW - maxW);
    if (winStats._gScroll == null) winStats._gScroll = 0;
    if (justPressed["arrowleft"] || justPressed["a"]) winStats._gScroll = Math.max(0, winStats._gScroll - 80);
    if (justPressed["arrowright"] || justPressed["d"]) winStats._gScroll = Math.min(scrollMax, winStats._gScroll + 80);
    const origin = (W - Math.min(totalW, maxW)) / 2 - winStats._gScroll;
    ctx.save();
    ctx.beginPath();
    ctx.rect(40, 176, W - 80, ch + 40);
    ctx.clip();
    for (let i = 0; i < gained.length; i++) {
      const babe = babeById(gained[i]);
      if (!babe) continue;
      const x = origin + i * (cw + gap);
      drawCard(babe, x, 184, cw, ch, { showRarity: false, max: isMaxed(babe.id) });
    }
    ctx.restore();
    if (scrollMax > 0) {
      ctx.fillStyle = "#888";
      ctx.font = "11px sans-serif";
      ctx.fillText("← → scroll", W / 2, 184 + ch + 28);
    }
  }

  ctx.fillStyle = "#ffe66d";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(isTouch ? "Tap to continue to Level " + (levelNum + 1) : "Press Enter to continue to Level " + (levelNum + 1) + "  ·  R to replay", W / 2, H - 48);
  ctx.fillStyle = "#aaa";
  ctx.font = "13px sans-serif";
  ctx.fillText(isTouch ? "Open Menu to view your babes" : "Press C to view full babe gallery", W / 2, H - 26);
}


function frame(dt) {
  // Reset confirm pauses the whole game (including congrats / death / boss / slots) and sits on top.
  if (resetConfirm) {
    resetConfirm.t += dt;
    if (justPressed["enter"]) confirmResetCollection();
    else if (justPressed[" "] || justPressed["escape"]) cancelResetConfirm();
    for (const k in justPressed) delete justPressed[k];
    keys[" "] = false; keys["enter"] = false;
  } else if (congrats) {
    congrats.t += dt;
    if (justPressed["enter"]) dismissCongrats();
    for (const k in justPressed) delete justPressed[k];
  } else if (performance.now() - congratsClosedAt < 120) {
    for (const k in justPressed) delete justPressed[k];
  }
  if (resetToast) { resetToast.t += dt; if (resetToast.t >= resetToast.dur) resetToast = null; }
  if (buffToast) { buffToast.t += dt; if (buffToast.t >= buffToast.dur) buffToast = null; }
  const frozen = !!congrats || !!resetConfirm;
  frameInner(frozen ? 0 : dt);
  // Buff toast is non-blocking (drawn over world; does not freeze). Congrats still pauses.
  if (buffToast && !congrats && !resetConfirm) drawBuffToast();
  if (congrats && !resetConfirm) drawCongrats(dt);
  if (resetConfirm) drawResetConfirm();
  if (resetToast) drawResetToast();
}

// Popup geometry (canvas units). The Continue button is sized so it is at least ~200x56 CSS px on
// screen, which makes it a comfortable tap target even on a portrait phone where the canvas is small.

function congratsLayout() {
  const r = canvas.getBoundingClientRect();
  const scale = r.width > 0 ? r.width / W : 1;
  // Continue stays ≥ ~200×56 CSS px so it is tappable on a small phone canvas
  const bw = Math.min(560, Math.max(240, 200 / scale)), bh = Math.min(140, Math.max(60, 56 / scale));
  const marginX = 20, marginY = 8, pad = 14, gap = 8, titleH = 90;
  const pw = W - marginX * 2;
  const phMax = H - marginY * 2;
  const imgAreaW = pw - pad * 2;
  const imgAreaH = Math.max(120, phMax - titleH - bh - pad * 2 - gap * 3);
  // Contain 16:9 inside the image area (source is 1280×720)
  const AR = 16 / 9;
  let iw = imgAreaW, ih = iw / AR;
  if (ih > imgAreaH) { ih = imgAreaH; iw = ih * AR; }
  const ph = Math.min(phMax, titleH + ih + bh + pad * 2 + gap * 3);
  const px = (W - pw) / 2, py = Math.max(marginY, (H - ph) / 2);
  const img = { x: px + (pw - iw) / 2, y: py + pad + titleH + gap, w: iw, h: ih };
  const btn = { x: W / 2 - bw / 2, y: py + ph - pad - bh, w: bw, h: bh };
  return { pw, ph, px, py, btn, img, titleH, pad };
}

function drawCongrats(dt) {
  const c = congrats, t = c.t;
  const a = Math.min(1, t / 0.35);
  const L = congratsLayout(), { pw, ph, px, py, btn, img } = L;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(12,4,26,0.78)";
  ctx.fillRect(0, 0, W, H);
  // sparkles behind the panel
  for (const sp of c.sparks) {
    sp.y += sp.vy * dt; if (sp.y > H + 8) { sp.y = -8; sp.x = Math.random() * W; }
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + sp.p));
    ctx.globalAlpha = a * tw;
    ctx.fillStyle = `hsl(${(sp.hue + t * 60) % 360}, 100%, 75%)`;
    const rr = sp.s;
    ctx.fillRect(sp.x - rr, sp.y - 0.5, rr * 2, 1.5);
    ctx.fillRect(sp.x - 0.5, sp.y - rr, 1.5, rr * 2);
  }
  ctx.globalAlpha = a;
  const pop = 1 + 0.05 * Math.max(0, 1 - t / 0.35);
  ctx.translate(W / 2, py + ph / 2); ctx.scale(pop, pop); ctx.translate(-W / 2, -(py + ph / 2));
  const bg = ctx.createLinearGradient(px, py, px + pw, py + ph);
  bg.addColorStop(0, "#3a0f4f"); bg.addColorStop(1, "#5a1640");
  ctx.fillStyle = bg;
  roundRect(px, py, pw, ph, 18); ctx.fill();
  const bd = ctx.createLinearGradient(px, py, px + pw, py);
  for (let i = 0; i <= 6; i++) bd.addColorStop(i / 6, `hsl(${(i * 60 + t * 120) % 360}, 100%, 65%)`);
  ctx.strokeStyle = bd; ctx.lineWidth = 4;
  roundRect(px, py, pw, ph, 18); ctx.stroke();
  // Title (exact copy, three lines — collection + Double Jump reward)
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(255,90,154,0.8)"; ctx.shadowBlur = 14;
  ctx.fillStyle = "#ffe66d";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(CONGRATS_LINE1, W / 2, py + 26);
  ctx.fillStyle = "#ff8ec8";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(CONGRATS_LINE2, W / 2, py + 50);
  ctx.fillStyle = "#ffe66d";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(CONGRATS_LINE3, W / 2, py + 76);
  ctx.shadowBlur = 0;
  // Iris all-30 group pic — draw contain into the 16:9 slot (letterbox only if aspect drifts)
  if (imgOk(congratsImg)) {
    const sw = congratsImg.naturalWidth, sh = congratsImg.naturalHeight;
    const sAr = sw / sh, dAr = img.w / img.h;
    let sx = 0, sy = 0, sW = sw, sH = sh, dx = img.x, dy = img.y, dW = img.w, dH = img.h;
    if (Math.abs(sAr - dAr) > 0.01) {
      // contain: letterbox inside dest
      if (sAr > dAr) { dH = img.w / sAr; dy = img.y + (img.h - dH) / 2; }
      else { dW = img.h * sAr; dx = img.x + (img.w - dW) / 2; }
      ctx.fillStyle = "#1a0a28";
      ctx.fillRect(img.x, img.y, img.w, img.h);
    }
    ctx.drawImage(congratsImg, sx, sy, sW, sH, dx, dy, dW, dH);
    ctx.strokeStyle = "rgba(255,230,109,0.85)"; ctx.lineWidth = 2;
    ctx.strokeRect(img.x - 0.5, img.y - 0.5, img.w + 1, img.h + 1);
  } else {
    // Fallback while loading / if missing: soft placeholder + tiny face row
    ctx.fillStyle = "#2a1040";
    ctx.fillRect(img.x, img.y, img.w, img.h);
    ctx.fillStyle = "#ff8ec8"; ctx.font = "bold 16px sans-serif";
    ctx.fillText("All " + BABE_POOL.length + " babes", W / 2, img.y + img.h / 2);
  }
  // Continue button (dimmed during the short input guard)
  const ready = t >= CONGRATS_GUARD;
  const glow = ready ? 0.5 + 0.5 * Math.sin(t * 4) : 0;
  ctx.globalAlpha = a * (ready ? 1 : 0.55);
  ctx.shadowColor = "rgba(255,230,109,0.9)"; ctx.shadowBlur = 10 + 14 * glow;
  const bgr = ctx.createLinearGradient(0, btn.y, 0, btn.y + btn.h);
  bgr.addColorStop(0, "#ff7ab8"); bgr.addColorStop(1, "#e0457f");
  ctx.fillStyle = bgr;
  roundRect(btn.x, btn.y, btn.w, btn.h, Math.min(22, btn.h / 2)); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#ffe66d"; ctx.lineWidth = 3;
  roundRect(btn.x, btn.y, btn.w, btn.h, Math.min(22, btn.h / 2)); ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "bold " + Math.round(Math.min(48, btn.h * 0.45)) + "px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(isTouch ? "Continue" : "Continue  ⏎", W / 2, btn.y + btn.h / 2 + 1);
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function frameInner(dt) {
  if (justPressed["m"]) { ensureAudio(); setMuted(!muted); }
  if (state === "title") {
    drawTitle();
    if ((justPressed[" "] || justPressed["enter"]) && (heroSprites.ready || heroSprites.failed)) {
      startLevel(progress.level, { newRun: true });
      // startLevel already calls startBgm; ensure context resume from this key gesture
      ensureAudio();
    }
    return;
  }

  if (state === "collection") {
    if (slot) updateSlot(dt);
    updateParticles(dt);
    drawBackground();
    drawWorld();
    drawHUD();
    if (slot) drawSlot();
    drawCollection();
    if (justPressed["c"] || justPressed["p"] || (justPressed["escape"] && !gallery.selected)) {
      gallery.selected = null;
      state = collectionReturn; // back to play, or to the win panel it was opened from
    }
    return;
  }

  if (state === "win") {
    if (slot) updateSlot(dt);
    updateParticles(dt);
    drawBackground();
    drawWorld();
    drawHUD();
    if (slot) drawSlot();
    drawWin();
    if (justPressed["enter"] || justPressed[" "]) winContinue();
    else if (justPressed["r"]) startLevel(winStats && winStats.final ? 1 : levelNum, winStats && winStats.final ? { newRun: true } : null); // replay
    if (justPressed["c"] || justPressed["p"]) openCollection();
    return;
  }

  // update — gameplay + slot overlay run together
  updateParticles(dt);
  updateHudTray(dt);
  if (slot) updateSlot(dt);
  if (state === "play") {
    updatePlay(dt);
    if ((justPressed["c"] || justPressed["p"]) && state === "play") openCollection();
  } else if (state === "dying") {
    updateDying(dt);
  } else if (state === "dead") {
    updateDead(dt);
  }

  // draw
  if (state === "dying") {
    drawDyingCry(); // black + zoomed cry; hide world/HUD
  } else if (state === "dead") {
    drawDead(); // black stage + Ouch layout
  } else {
    drawBackground();
    drawWorld();
    drawHUD();
  }
  // Slot overlay stays on top (including over death) so the roll remains visible
  if (slot) drawSlot();
}

// Debug: stitched whole-level overview (rows of 150 tiles) — used for docs/screenshots only
function renderLevelOverview(n) {
  const def = LEVELS[(n || levelNum) - 1];
  const L = buildLevel(def, DIFFICULTY[def.id] || DIFFICULTY[1]);
  const th = LEVEL_THEMES[def.theme];
  const S = 6, ROW = 150, rows = Math.ceil(L.width / ROW), rowH = LEVEL_H * S, top = 34, gapY = 22;
  const cv = document.createElement("canvas");
  cv.width = ROW * S + 40; cv.height = top + rows * (rowH + gapY) + 10;
  const g = cv.getContext("2d");
  g.fillStyle = "#120a1e"; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = "#ffe66d"; g.font = "bold 15px sans-serif";
  g.fillText(def.name + " overview — " + L.width + " tiles (" + L.width * TILE + "px), " + L.checkpoints.length + " checkpoints, " +
    L.picks.length + " babe drops, " + L.enemySlots.length + " enemies, speed x" + L.diff.enemySpeed, 20, 22);
  for (let r = 0; r < rows; r++) {
    const ox = 20 - r * ROW * S, oy = top + r * (rowH + gapY);
    g.save();
    g.beginPath(); g.rect(20, oy, ROW * S, rowH); g.clip();
    const sky = g.createLinearGradient(0, oy, 0, oy + rowH);
    sky.addColorStop(0, th.sky[0]); sky.addColorStop(1, th.sky[2]);
    g.fillStyle = sky; g.fillRect(20, oy, ROW * S, rowH);
    for (const p of L.plats) {
      g.fillStyle = th.dirt; g.fillRect(ox + p.x * S, oy + p.y * S, p.w * S, p.h * S);
      g.fillStyle = th.grass; g.fillRect(ox + p.x * S, oy + p.y * S, p.w * S, 2);
    }
    for (const [tx, ty] of L.picks) { g.fillStyle = "#ff5a9a"; g.fillRect(ox + tx * S + 1, oy + ty * S, 5, 7); g.fillStyle = "#ffe66d"; g.fillRect(ox + tx * S + 3, oy + ty * S + 2, 1, 3); }
    for (const e of L.enemySlots) {
      if (e.type === "flyer") { // patrol band + body
        g.fillStyle = "rgba(180,140,255,0.25)"; g.fillRect(ox + e.a * S, oy + (e.hoverY - FLY_BOB) / TILE * S, (e.b - e.a) * S, (FLY_BOB * 2 + FLY_SWOOP + FLY_H) / TILE * S);
        g.fillStyle = "#b48cff"; g.fillRect(ox + e.x * S, oy + e.hoverY / TILE * S, 6, 4); continue;
      }
      g.fillStyle = e.type === "hopper" ? "#7cff8a" : "#ff4a4a"; g.fillRect(ox + e.x * S, oy + (e.y - 1) * S + 1, 5, 5);
    }
    for (const c of L.checkpoints) { const cx = ox + c.x / TILE * S; g.fillStyle = "#fff"; g.fillRect(cx, oy + 11 * S, 1, 4 * S); g.fillStyle = "#ff8ec8"; g.fillRect(cx + 1, oy + 11 * S, 7, 5); }
    const gx = ox + L.goal.x / TILE * S; g.fillStyle = "#ffe66d"; g.fillRect(gx, oy + 12 * S, 2, 3 * S); g.fillRect(gx + 2, oy + 12 * S, 8, 6);
    g.restore();
    g.fillStyle = "#aaa"; g.font = "10px sans-serif";
    for (let t = r * ROW; t <= Math.min(L.width, (r + 1) * ROW); t += 25) g.fillText(String(t), ox + t * S, oy + rowH + 12);
  }
  g.fillStyle = "#ddd"; g.font = "11px sans-serif";
  g.fillText("pink = babe drop · red = walker · green = hopper · violet = flyer (+ swoop zone) · flag = checkpoint · gold = goal", 20, cv.height - 4);
  return cv.toDataURL("image/png");
}

