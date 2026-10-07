// Hot Babe Collector — level.js (registry + shared helpers)
// Per-level section data lives in js/levels/level1.js … level6.js (plus common.js).
// Tile size 32. Levels are DATA (sections) + DIFFICULTY; buildLevel() lays sections end to end.
const TILE = 32;
const LEVEL_H = 18;
const GROUND_Y = 15;
let LEVEL_W = 130; // set by loadLevel()

// Section helpers (local tile coords).
const G = (x, w) => [x, GROUND_Y, w, LEVEL_H - GROUND_Y];
const P = (x, y, w) => [x, y, w, 1];
const PC = (x, y, w) => [x, y, w, 1, 1]; // cracked (5th flag)
const COL = (x, y, w) => [x, y, w, LEVEL_H - y];
const WK = (x, y, a, b, vx, tier) => ({ type: "walker", x, y, a, b, vx, tier: tier || 1 });
const HP = (x, y, a, b, vx, tier, hopT) => ({ type: "hopper", x, y, a, b, vx, tier: tier || 1, hopT: hopT || 0 });

const SECTIONS = {};
const LEVELS = [];
function registerSections(map) {
  Object.assign(SECTIONS, map);
}
function registerLevel(def) {
  const i = LEVELS.findIndex(L => L.id === def.id);
  if (i >= 0) LEVELS[i] = def;
  else LEVELS.push(def);
  LEVELS.sort((a, b) => a.id - b.id);
}

const DIFFICULTY = {
  1: { enemySpeed: 1.0, enemyCount: 1.0, pitFreq: 1.0, dropRate: 1.0 },
  2: { enemySpeed: 1.4, enemyCount: 1.5, pitFreq: 1.4, dropRate: 1.0 },
  3: { enemySpeed: 1.0, enemyCount: 0.0, pitFreq: 0.0, dropRate: 1.0 },
  4: { enemySpeed: 1.6, enemyCount: 1.7, pitFreq: 1.2, dropRate: 1.0 },
  5: { enemySpeed: 1.2, enemyCount: 1.2, pitFreq: 0.0, dropRate: 1.0 },
  6: { enemySpeed: 1.0, enemyCount: 0.0, pitFreq: 0.0, dropRate: 1.0 },
};

const LEVEL_THEMES = {
  dusk:  { sky: ["#1b0f2e", "#3a1a4a", "#6b2d5c"], hills: "#2a1538", dirt: "#5c3a28", grass: "#4ec96a", edge: "#3a8f4c" },
  night: { sky: ["#07142a", "#123457", "#2c6a86"], hills: "#0f2a44", dirt: "#4a3d63", grass: "#5fd6e8", edge: "#3793a8" },
  neon:  { sky: ["#140528", "#2a0a4a", "#4a1870"], hills: "#1a0a30", dirt: "#3a2a55", grass: "#ff5ec8", edge: "#c43a9a",
           neon: true, signs: ["#ff4ad2", "#5ef0ff", "#ffe66d", "#b48cff"] },
  neonOverpass: { sky: ["#0c0620", "#221048", "#3a1868"], hills: "#160a28", dirt: "#2e2448", grass: "#5ef0ff", edge: "#3aa0c8",
           neon: true, signs: ["#5ef0ff", "#ff4ad2", "#ffe66d", "#b48cff"] },
  capsule: { sky: ["#081428", "#102848", "#1a4060"], hills: "#0a1c30", dirt: "#3a4860", grass: "#7dff9a", edge: "#4a9a6a" },
};

// Evenly spread pick of k items from an array (keeps order)
function spreadPick(arr, k) {
  if (k >= arr.length) return arr.slice();
  if (k <= 0) return [];
  const out = [];
  for (let i = 0; i < k; i++) out.push(arr[Math.floor((i + 0.5) * arr.length / k)]);
  return out;
}

// Mid-level checkpoints: placed near these fractions of the start→goal run, on safe ground
const CP_FRACTIONS = [1 / 3, 2 / 3];
const CP_ENEMY_CLEAR = 4; // tiles kept clear of any enemy patrol range
// Flyer motion envelope (px): hover band ± FLY_BOB, plus up to FLY_SWOOP lower while swooping.
// The lowest point keeps FLY_HEAD_CLEAR px above a standing player's head on the highest floor nearby.
const FLY_W = 26, FLY_H = 20, FLY_BOB = 8, FLY_SWOOP = 80, FLY_HEAD_CLEAR = 2;
const FLY_RANGE = 150, FLY_TELL = 0.3, FLY_DIVE_V = 120, FLY_RISE_V = 70, FLY_HOLD = 0.45, FLY_COOL = 1.4;

function buildLevel(def, diff) {
  const plats = [], picks = [], slots = [], cps = [], cutSpots = [], offs = [];
  let ox = 0, goalX = null;
  for (const key of def.sections) {
    offs.push(ox);
    const sec = SECTIONS[key];
    for (const row of sec.plats) {
      const x = row[0], y = row[1], w = row[2], h = row[3], cracked = !!row[4];
      if (w > 0) plats.push({ x: x + ox, y, w, h, cracked });
    }
    for (const [x, y] of sec.picks || []) picks.push([x + ox, y]);
    for (const e of sec.enemies || []) slots.push(Object.assign({}, e, { x: e.x + ox, a: e.a + ox, b: e.b + ox }));
    for (const c of sec.cps || []) {
      if (Array.isArray(c)) cps.push({ x: c[0] + ox, yTile: c[1] });
      else cps.push({ x: c + ox, yTile: GROUND_Y });
    }
    for (const c of sec.cuts || []) cutSpots.push(c + ox);
    if (sec.goal != null) goalX = sec.goal + ox;
    ox += sec.w;
  }
  const width = ox;
  // Babe pickups: keep dropRate share (1.0 → all)
  const keptPicks = spreadPick(picks, Math.round(picks.length * diff.dropRate));
  // Enemies: tier 1 base, scaled by enemyCount using tier 2 bonus slots
  const t1 = slots.filter(e => e.tier === 1), t2 = slots.filter(e => e.tier !== 1);
  const target = Math.round(t1.length * diff.enemyCount);
  const chosen = target <= t1.length ? spreadPick(t1, target) : t1.concat(spreadPick(t2, target - t1.length));
  chosen.sort((a, b) => a.x - b.x);
  // Flyers (explicit per level; not scaled by enemyCount). Hover from the highest floor under the patrol ±2 tiles.
  const flyers = (def.flyers || []).map(([si, x, a, b, vx]) => {
    const o = offs[si], A = a + o, B = b + o;
    let floorTop = Infinity;
    for (const p of plats) if (p.x < B + 2 && p.x + p.w > A - 2) floorTop = Math.min(floorTop, p.y * TILE);
    const PH = 44; // PLAYER_H
    const hoverY = floorTop - PH - FLY_HEAD_CLEAR - FLY_SWOOP - FLY_BOB - FLY_H;
    return { type: "flyer", x: x + o, a: A, b: B, vx, tier: 1, hoverY, floorTop };
  });
  // Checkpoints: start spawn + one near each CP_FRACTIONS point, searched outward for safe ground:
  // solid ground under [x-2, x+3], nothing low overhead, no enemy patrol within CP_ENEMY_CLEAR tiles
  cps.sort((a, b) => a.x - b.x);
  const startX = cps.length ? cps[0].x : 2;
  const startY = cps.length ? cps[0].yTile : GROUND_Y;
  const endX = goalX != null ? goalX : width - 4;
  const safeCp = x => plats.some(p => p.y === GROUND_Y && !p.cracked && p.x <= x - 2 && p.x + p.w >= x + 3) &&
    !plats.some(p => p.y < GROUND_Y && p.y >= GROUND_Y - 4 && p.x < x + 3 && p.x + p.w > x - 1) &&
    !chosen.concat(flyers).some(e => x >= e.a - CP_ENEMY_CLEAR && x <= e.b + CP_ENEMY_CLEAR) &&
    !keptPicks.some(([px]) => Math.abs(px - x) < 2);
  // Prefer explicit section checkpoints (with y); auto-fill mids on horizontal stages
  let keptCps = cps.map(c => ({ x: c.x, yTile: c.yTile != null ? c.yTile : GROUND_Y }));
  if (!keptCps.length) keptCps = [{ x: startX, yTile: startY }];
  if (def.boss && !def.bossLockImmediate && keptCps.length < 2) {
    let mid = cps.find(c => c.x > startX + 8);
    let midX = mid ? mid.x : Math.round(width * 0.4);
    const floorY = def.bossFloorY != null ? def.bossFloorY : GROUND_Y;
    for (let d = 0; d < 40; d++) {
      const tryX = [midX + d, midX - d].find(x => x > startX + 4 &&
        plats.some(p => p.y === floorY && p.x <= x && p.x + p.w >= x + 2));
      if (tryX != null) { keptCps.push({ x: tryX, yTile: floorY }); break; }
    }
  } else if (!def.boss && !def.vertical && keptCps.length < 3) {
    for (const f of CP_FRACTIONS) {
      const target = Math.round(startX + (endX - startX) * f);
      for (let d = 0; d < 80; d++) {
        const x = [target + d, target - d].find(safeCp);
        if (x != null && !keptCps.some(c => Math.abs(c.x - x) < 6)) {
          keptCps.push({ x, yTile: GROUND_Y }); break;
        }
      }
    }
  }
  keptCps.sort((a, b) => a.x - b.x);
  // Pits: cut a 2-tile gap into a share of the marked ground spots (never under a pickup/enemy/flag)
  const blocked = x => keptPicks.some(([px]) => Math.abs(px - x) < 3) || chosen.some(e => Math.abs(e.x - x) < 3) ||
    keptCps.some(c => Math.abs(c.x - x) < 4) || (goalX != null && Math.abs(goalX - x) < 4);
  const freeSpots = cutSpots.filter(x => !blocked(x) && !blocked(x + 1));
  const nCuts = Math.round(freeSpots.length * Math.min(1, 0.35 * diff.pitFreq));
  let cuts = 0;
  for (const cx of spreadPick(freeSpots, nCuts)) {
    const i = plats.findIndex(p => p.y === GROUND_Y && p.x + 1 < cx && p.x + p.w > cx + 3);
    if (i < 0) continue;
    const p = plats[i];
    plats.splice(i, 1, { x: p.x, y: p.y, w: cx - p.x, h: p.h }, { x: cx + 2, y: p.y, w: p.x + p.w - (cx + 2), h: p.h });
    cuts++;
  }
  const floorY = def.bossFloorY != null ? def.bossFloorY : GROUND_Y;
  return {
    id: def.id, name: def.name, theme: LEVEL_THEMES[def.theme] || LEVEL_THEMES.dusk, diff,
    width, plats, picks: keptPicks, enemySlots: chosen.concat(flyers), pits: cuts, boss: !!def.boss,
    bossKind: def.bossKind || (def.boss ? "main" : null),
    vertical: !!def.vertical, bossFloorY: floorY,
    bossLockImmediate: !!def.bossLockImmediate, startMid: !!def.startMid,
    checkpoints: keptCps.map(c => ({ x: c.x * TILE, y: (c.yTile != null ? c.yTile : GROUND_Y) * TILE })),
    // Boss levels: the goal starts inactive (unlocked after the fight); arenaLeft = second checkpoint
    goal: { x: (goalX != null ? goalX : width - 4) * TILE, y: (floorY - 3) * TILE, w: 20, h: 96, active: !def.boss },
    arenaLeft: def.bossLockImmediate ? 0 : (def.boss && keptCps.length > 1 ? keptCps[1].x * TILE : (def.boss ? keptCps[0].x * TILE : null)),
  };
}

let levelNum = 1;
let level = null;
let platforms = [];
let checkpoints = [];
let goal = { x: 0, y: 0, w: 20, h: 96 };

function clonePlats(plats) {
  return plats.map(p => ({ x: p.x, y: p.y, w: p.w, h: p.h, cracked: !!p.cracked }));
}
function restorePlatforms() {
  if (!level) return;
  platforms = clonePlats(level.plats);
}
function loadLevel(n) {
  levelNum = Math.max(1, Math.min(LEVELS.length, n | 0));
  level = buildLevel(LEVELS[levelNum - 1], DIFFICULTY[levelNum] || DIFFICULTY[1]);
  LEVEL_W = level.width;
  platforms = clonePlats(level.plats);
  checkpoints = level.checkpoints;
  goal = level.goal;
  checkpointIdx = 0;
  boss = makeBoss();
}

// Babe pickups (mystery cardbacks) — respawn on death like before
function makeCoins() {
  return level.picks.map(([tx, ty]) => {
    const cw = 15;
    return {
      x: tx * TILE + 8, y: ty * TILE + 4, w: cw, h: cardHeight(cw),
      collected: false, bob: Math.random() * Math.PI * 2,
    };
  });
}

// Enemy sprites (Iris): Mini Oni = walker, Mochi Slime = hopper. 32x32, face RIGHT, feet on the bottom
// row; drawn bottom-centre on the (unchanged) 28x28 / 26x26 hitbox, nearest-neighbour, flipped when dir<0.
const ENEMY_SPRITES = [
  "oni_idle_0", "oni_idle_1", "oni_walk_0", "oni_walk_1", "oni_walk_2", "oni_walk_3", "oni_squished",
  "slime_idle_0", "slime_idle_1", "slime_squash", "slime_rise", "slime_fall", "slime_squished",
];
const ENEMY_IMG = {};
for (const name of ENEMY_SPRITES) {
  const im = new Image();
  im.onerror = () => console.warn("[HBC] enemy sprite failed: " + name + " — using drawn fallback");
  im.src = "art/enemies/pixel/" + name + ".png";
  ENEMY_IMG[name] = im;
}
const ENEMY_SQUISH_SHOW = 0.35;   // squished frame stays this long after a stomp
const ONI_WALK_FRAME = 0.12;      // s per walk frame at enemySpeed 1 (faster tiers animate faster)
const ONI_IDLE_FRAME = 0.4;
const SLIME_IDLE_FRAME = 0.35;
const SLIME_PREHOP = 0.12;        // crouch before the hop impulse
const SLIME_LAND = 0.08;          // squash after landing

// Enemies: type 'walker' | 'hopper'
function enemyOnPlat(type, xTile, platY, w, h, extra) {
  const top = platY * TILE;
  return Object.assign({
    type, x: xTile * TILE, y: top - h, w, h,
    vx: 0, vy: 0, dir: 1, alive: true,
    prevX: xTile * TILE, prevY: top - h,
  }, extra || {});
}

function makeEnemies() {
  const sp = level.diff.enemySpeed;
  return level.enemySlots.map((e, i) => {
    if (e.type === "flyer") {
      return { type: "flyer", x: e.x * TILE, y: e.hoverY, w: FLY_W, h: FLY_H, vx: e.vx * sp, vy: 0, dir: i % 2 ? -1 : 1,
        alive: true, minX: e.a * TILE, maxX: e.b * TILE, baseY: e.hoverY, t: i * 1.3, flap: i * 0.7,
        mode: "patrol", modeT: 0, swoop: 0, cool: 0, prevX: e.x * TILE, prevY: e.hoverY };
    }
    const hop = e.type === "hopper";
    return enemyOnPlat(e.type, e.x, e.y, hop ? 26 : 28, hop ? 26 : 28, {
      vx: e.vx * sp, dir: i % 2 ? -1 : 1, minX: e.a * TILE, maxX: e.b * TILE,
      hopT: e.hopT || 0, hopEvery: 1.1 / sp,
    });
  });
}

// Level progress: the level you're on survives reloads; beating the last level resets to 1
const PROGRESS_KEY = "hbc_progress_v1";
function loadProgress() {
  try { const o = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "null"); if (o && o.level >= 1) { if (LEVELS.length) o.level = Math.min(Math.max(1, o.level|0), LEVELS.length); return o; } } catch (e) {}
  return { level: 1, beatGame: false };
}
function saveProgress(o) { try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(o)); } catch (e) {} }
let progress = loadProgress();

