// Hot Babe Collector — main.js
// ---------- Main loop ----------
let last = performance.now();
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05;
  frame(dt);
  // clear justPressed at end of frame
  for (const k in justPressed) delete justPressed[k];
  requestAnimationFrame(loop);
}

// Fit canvas
function fit() {
  // Letterbox: scale canvas to fit while keeping 16:9 game aspect
  const r = Math.min(window.innerWidth / W, window.innerHeight / H);
  const cssW = Math.max(1, Math.floor(W * r));
  const cssH = Math.max(1, Math.floor(H * r));
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  positionMuteBtn();
}
window.addEventListener("resize", () => { fit(); });
fit();

loadLevel(progress.level);
resetLevel(true);
state = "title";
preloadHeroSprites().then(ok => {
  if (!ok) console.warn("[HBC] Hero sprites failed to load — using drawn fallback");
});
preloadCardArt().then(() => {
  console.log("[HBC] card art ready");
}).catch(e => console.warn("[HBC] card art preload", e));
loadBgm();
preloadCryAudio().then(() => {
}).catch(e => console.warn("[HBC] cry audio preload", e));
requestAnimationFrame(loop);

// Expose for headless testing
window.__HBC = {
  getHero: () => heroSprites,
  getPlayerSize: () => ({ w: player.w, h: player.h, sw: HERO_SW, sh: HERO_SH }),
  setDebugHeroPose: (p) => { debugHeroPose = p; },
  getState: () => state,
  setState: (s) => { state = s; },
  getPlayer: () => player,
  getCoins: () => coins,
  getEnemies: () => enemies,
  getHearts: () => hearts,
  getCollection: () => collection,
  getSlot: () => slot,
  getSlotQueue: () => slotQueue,
  getCallouts: () => callouts.map(c => ({ text: c.text, t: c.t, dur: c.dur, y: c.y, alpha: calloutAlpha(c) })),
  getCalloutTiming: () => ({ fadeIn: CALLOUT_IN, hold: CALLOUT_HOLD, fadeOut: CALLOUT_OUT }),
  // Debug: force the next pull(s) to a specific babe / tier (tier data is untouched)
  forcePull: (id) => { if (!babeById(id)) return false; debugPulls.push(id); return true; },
  setDebugRarity: (tier) => { debugRarity = tier || null; },
  grantBabe: (id, n) => { if (!babeById(id)) return false; collection[id] = clampCount((collection[id] || 0) + (n || 1)); saveCollection(collection); noteAcquired(id); return true; },
  // grant one of every babe except `exceptId` (then pull that one to complete the set for real)
  grantAll: (exceptId) => { for (const b of BABE_POOL) if (b.id !== exceptId && !(collection[b.id] > 0)) { collection[b.id] = 1; noteAcquired(b.id); } saveCollection(collection); return ownedUniqueCount(collection); },
  resetCompleteFlag: () => { collectionCompleteFlag = false; try { localStorage.removeItem(COMPLETE_KEY); } catch (e) {} },
  openResetConfirm: () => openResetConfirm(),
  getResetConfirm: () => resetConfirm && { t: resetConfirm.t },
  getResetToast: () => resetToast && { t: resetToast.t },
  confirmResetCollection: () => confirmResetCollection(),
  cancelResetConfirm: () => cancelResetConfirm(),
  getResetButtons: () => { if (!resetConfirm) return null; const L = resetConfirmLayout(), r = canvas.getBoundingClientRect(), s = r.width / W;
    const toClient = (b) => ({ x: r.left + b.x * s, y: r.top + b.y * s, w: b.w * s, h: b.h * s });
    return { reset: toClient(L.resetBtn), cancel: toClient(L.cancelBtn), gallery: (() => { const g = galleryResetBtn(); return toClient(g); })() }; },
  getCongrats: () => congrats && { t: congrats.t, text: CONGRATS_TEXT, hasImg: imgOk(congratsImg), img: congratsLayout().img },
  getCongratsButton: () => { if (!congrats) return null; const b = congratsLayout().btn, r = canvas.getBoundingClientRect(), s = r.width / W;
    return { canvas: b, client: { x: r.left + b.x * s, y: r.top + b.y * s, w: b.w * s, h: b.h * s } }; },
  isCollectionComplete: () => collectionCompleteFlag,
  hasAura: () => hasAllBabesAura(),
  hasDoubleJump: () => hasAllBabesAura(),
  getCollectionBuff: () => ({
    stacks: collectionBuffStacks(), uniques: ownedUniqueCount(collection),
    moveMul: collectionMoveMul(), jumpHeightMul: collectionJumpHeightMul(), jumpVelMul: collectionJumpVelMul(),
    moveMax: moveMaxNow(), jumpV: jumpVNow(),
    announced: buffAnnouncedStacks, toast: !!buffToast, pending: buffPending,
    toastT: buffToast && buffToast.t, toastDur: buffToast && buffToast.dur,
  }),
  getBuffToast: () => buffToast && { t: buffToast.t, dur: buffToast.dur, text: buffToast.text || buffToastMessage() },

  getAuraFrame: () => Math.floor(performance.now() / AURA_FRAME_MS) % 6,
  getRecent: () => recentBabes.slice(),
  getTrayIds: () => recentBabes.filter(id => (collection[id] || 0) > 0).slice(0, HUD_SLOTS).reverse(),
  getLevel: () => ({ num: levelNum, name: level.name, width: level.width, diff: level.diff, pits: level.pits,
    platforms: platforms.map(p => ({ ...p })), checkpoints: checkpoints.map(c => ({ ...c })), goal: { ...goal },
    picks: level.picks.slice(), enemySlots: level.enemySlots.map(e => ({ ...e })), checkpointIdx,
    boss: !!level.boss, bossKind: level.bossKind, vertical: !!level.vertical, arenaLeft: level.arenaLeft, theme: level.theme,
    flyerEnvelopes: level.enemySlots.filter(e => e.type === "flyer").map(e => ({ minX: e.a * TILE, maxX: e.b * TILE, top: e.hoverY - FLY_BOB, bottom: e.hoverY + FLY_BOB + FLY_SWOOP + FLY_H, floorTop: e.floorTop })),
    fly: { FLY_W, FLY_H, FLY_BOB, FLY_SWOOP, FLY_RANGE, FLY_TELL, FLY_DIVE_V, FLY_RISE_V, FLY_HOLD, FLY_COOL },
    TILE, LEVEL_H, physics: { GRAV, MOVE_ACC, MOVE_MAX, FRICTION, JUMP_V, JUMP_CUT, PLAYER_W, PLAYER_H } }),
  getLevelDefs: () => LEVELS.map(d => d.id),
  getProgress: () => ({ ...progress }),
  getBoss: () => boss && ({
    dual: !!boss.dual, kind: level && level.bossKind,
    hp: boss.hp, maxHp: boss.maxHp, mode: boss.dual ? "dual" : boss.mode, modeT: boss.dual ? 0 : boss.modeT, phase: boss.dual ? 0 : boss.phase,
    locked: boss.locked, defeated: boss.defeated, arenaL: boss.arenaL, arenaR: boss.arenaR,
    x: boss.dual ? boss.demons[0].x : boss.x, y: boss.dual ? boss.demons[0].y : boss.y,
    w: boss.dual ? boss.demons[0].w : boss.w, h: boss.dual ? boss.demons[0].h : boss.h,
    crank: boss.dual ? bossCrankRect(boss.demons[0]) : bossCrankRect(boss),
    demons: boss.dual ? boss.demons.map(d => ({ hp: d.hp, maxHp: d.maxHp, mode: d.mode, x: d.x, defeated: d.defeated })) : null,
    beam: (!boss.dual && boss.beam) ? { ...boss.beam } : null,
    coins: boss.dual ? boss.demons.reduce((s,d)=>s+d.coins.length,0) : boss.coins.length,
    minions: boss.dual ? boss.demons.reduce((s,d)=>s+d.minions.filter(m=>m.alive).length,0) : boss.minions.filter(m => m.alive).length,
    rewardPending: boss.rewardPending, shake: boss.dual ? 0 : boss.shake,
  }),
  forceBossAttack: (k) => { if (!boss) return false; if (!boss.locked) lockBossArena(); const d = boss.dual ? boss.demons.find(x=>!x.defeated) : boss; if (!d) return false; beginBossAttack(k || pickBossAttack(d), d); return true; },
  forceBossVulnerable: () => { if (!boss) return false; beginBossVulnerable(); return true; },
  forceBossHit: () => hitBoss(),
  forceBossDefeat: () => { if (!boss) return false; const d = boss.dual ? boss.demons.find(x=>!x.defeated) : boss; if (!d) return false; d.hp = 1; d.phase = d.maxHp - 1; beginBossVulnerable(d); hitBossDemon(d); return true; },
  getEnemySprites: () => Object.fromEntries(ENEMY_SPRITES.map(n => [n, imgOk(ENEMY_IMG[n])])),
  getEnemyFrames: () => enemies.map(e => ({ type: e.type, alive: e.alive, dir: e.dir, frame: e.type === "flyer" ? null : (e.alive ? enemyFrame(e) : (e.squishT != null && e.squishT < ENEMY_SQUISH_SHOW ? e.type + "-squished" : null)) })),
  getBgm: () => ({ mode: bgm.mode, url: bgm.url, wanted: bgm.wanted, ready: bgm.ready, unlocked: bgm.unlocked, starts: bgm.starts,
    playing: !!(bgm.html && !bgm.html.paused && !bgm.html.ended), pending: !!bgm.htmlPlayPending,
    loop: bgm.html ? bgm.html.loop : null, htmlMuted: bgm.html ? bgm.html.muted : null, htmlVol: bgm.html ? bgm.html.volume : null,
    lastError: bgm.lastError || null, pos: bgmPosition(), ctx: actx && actx.state,
    master: masterGain ? masterGain.gain.value : null, muted }),
  // measure output level after masterGain (what the speakers get) and of the music bus alone
  audioLevels: () => {
    if (!actx) return null;
    const mk = (node) => { const a = actx.createAnalyser(); a.fftSize = 2048; node.connect(a); return a; };
    if (!window.__hbcAn) window.__hbcAn = { out: mk(masterGain), music: bgm.gain ? mk(bgm.gain) : null };
    if (!window.__hbcAn.music && bgm.gain) window.__hbcAn.music = mk(bgm.gain);
    const rms = (a) => { if (!a) return null; const d = new Float32Array(a.fftSize); a.getFloatTimeDomainData(d); let s = 0; for (const v of d) s += v * v; return Math.sqrt(s / d.length); };
    return { out: rms(window.__hbcAn.out), music: rms(window.__hbcAn.music) };
  },
  // test-only: jump the playhead close to the loop end to watch the wrap (does not count as a start)
  bgmJumpNearEnd: (sec) => { if (!bgm.src) return false; const old = bgm.src; const src = actx.createBufferSource(); src.buffer = bgm.buf; src.loop = true; src.loopStart = bgm.loopStart; src.loopEnd = bgm.loopEnd; src.connect(bgm.gain); bgm.offset = bgm.loopEnd - (sec || 1); bgm.t0 = actx.currentTime; src.start(0, bgm.offset); bgm.src = src; old.stop(); old.disconnect(); return true; },
  teleport: (x, y) => { player.x = x; player.y = y; player.vx = 0; player.vy = 0; player.prevX = x; player.prevY = y; player.onGround = true; player.coyote = 0.1; player.stun = 0; cameraX = Math.max(0, Math.min(x - W * 0.38, LEVEL_W * TILE - W)); },
  renderOverview: (n) => renderLevelOverview(n),
  getMaxCopies: () => MAX_COPIES,
  isMaxed: (id) => isMaxed(id),
  getPullable: () => pullableBabes().map(b => b.id),
  rollMany: (n) => { const m = {}; for (let i = 0; i < n; i++) { const b = rollCharacter(); const k = b ? b.id : "(none)"; m[k] = (m[k] || 0) + 1; } return m; },
  setCount: (id, n) => { if (!babeById(id)) return false; const c = clampCount(n); if (c > 0) collection[id] = c; else delete collection[id]; saveCollection(collection); return true; },
  getArtCache: () => { let ok = 0, loading = 0, failed = 0, bytes = 0; const bad = [];
    for (const [u, v] of IMG_CACHE) { if (v === "loading") loading++; else if (imgOk(v)) { ok++; bytes += v.naturalWidth * v.naturalHeight * 4; } else { failed++; bad.push(u); } }
    return { ok, loading, failed, bad, decodedMB: +(bytes / 1048576).toFixed(1) }; },
  babeArtUrls: (id) => { const b = babeById(id); if (!b) return null; const out = ["sm", "md", "lg"].map(k => babeArtUrl(b, k));
    if (b.rarity === "ultra") for (const k of ["sm", "md", "lg"]) for (let i = 0; i < animFrameCount("ultra", k); i++) out.push(ultraFrameUrl(b, k, i));
    return out; },
  getTierCounts: () => BABE_POOL.reduce((m, b) => (m[b.rarity] = (m[b.rarity] || 0) + 1, m), {}),
  getCardAspect: () => CARD_ASPECT,
  getCardImgs: () => cardImgs,
  forceSlotResult: (id) => {
    const babe = babeById(id);
    if (!babe || isMaxed(id)) return false; // never plant a maxed babe
    // Plant a finished-looking roll that awards this babe
    const strip = [];
    for (let i = 0; i < 24; i++) strip.push(CHAR_DEFS[i % CHAR_DEFS.length]);
    strip.push(babe);
    for (let i = 0; i < 4; i++) strip.push(CHAR_DEFS[i % CHAR_DEFS.length]);
    slot = {
      strip, result: babe, targetIndex: 24,
      startOffset: 0, offset: 24, elapsed: 1.2, duration: 1.2,
      done: true, revealT: 0,
    };
    return true;
  },
  getCardLayouts: () => {
    const slot = { w: 72 * 0.7, h: cardHeight(72 * 0.7) };
    const collection = { w: 100, h: cardHeight(100) };
    const title = { w: 90, h: cardHeight(90) };
    const world = { w: 15, h: cardHeight(15) };
    const death = { w: 140, h: cardHeight(140) };
    const win = { w: 72, h: cardHeight(72) };
    const hud = { w: 28, h: cardHeight(28) };
    return {
      aspect: CARD_ASPECT,
      poolSize: BABE_POOL.length,
      slot: { ...slot, ratio: slot.w / slot.h },
      collection: { ...collection, ratio: collection.w / collection.h },
      title: { ...title, ratio: title.w / title.h },
      worldPickup: { ...world, ratio: world.w / world.h },
      miniDeath: { ...death, ratio: death.w / death.h },
      miniWin: { ...win, ratio: win.w / win.h },
      hudLive: { w: HUD_CW, h: cardHeight(HUD_CW), ratio: HUD_CW / cardHeight(HUD_CW) },
    };
  },
  getLoseAnim: () => loseAnim,
  getDeathCry: () => deathCry,
  getCryAudio: () => ({
    playing: cryAudio.playing,
    startedAt: cryAudio.startedAt,
    ready: cryAudio.ready,
    oneshotUrl: cryAudio.oneshotUrl,
    hasBuf: !!cryAudio.oneshotBuf,
    muted,
  }),
  stopDeathCry,
  playDeathCry,
  setMuted,
  setLoseAnimT: (v) => { if (loseAnim) loseAnim.t = v; },
  getLostXStroke: () => LOST_X_STROKE,
  getCenteredCard: () => {
    if (!slot) return null;
    const idx = Math.round(slot.offset);
    return slot.strip[idx] || null;
  },
  startPlay: (n) => { startLevel(n || levelNum); },
  forceCoin: () => {
    const c = coins.find(x => !x.collected);
    if (c) { player.x = c.x - 4; player.y = c.y - player.h + 4; }
  },
  triggerCoin: () => {
    const c = coins.find(x => !x.collected);
    if (!c) return false;
    c.collected = true;
    onCoinCollected();
    return true;
  },
  openCollection: () => { gallery.selected = null; openCollection(); },
  setGallerySelected: (id) => { gallery.selected = id; state = "collection"; },
  setGalleryFilter: (f) => { gallery.filter = f; gallery.scroll = 0; },
  getGallery: () => gallery,
  getBabePool: () => BABE_POOL,
  getRunGained: () => runGained,
  getHudTray: () => hudTray,
  getHudTrayHit: () => hudTrayHit && { ...hudTrayHit },
  focusHudOnBabe: (id) => focusHudOnBabe(id),
};