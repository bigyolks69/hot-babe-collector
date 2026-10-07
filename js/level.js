// Hot Babe Collector — level.js
// ---------- Level data ----------
// Tile size 32. Levels are DATA (a list of hand-built sections) + a DIFFICULTY object.
// buildLevel() lays the sections end to end and applies the difficulty:
//   enemySpeed — multiplies patrol speed (and hopper hop rate)
//   enemyCount — enemies = round(base "tier 1" count × mult), filled from "tier 2" bonus slots
//   pitFreq    — share of the marked ground spots that get a 2-tile pit cut into them
//   dropRate   — share of babe pickup spots kept (1.0 = all)
// An escalating multiplier later only has to scale these four numbers.
const TILE = 32;
const LEVEL_H = 18;
const GROUND_Y = 15;
let LEVEL_W = 130; // set by loadLevel()

// Section helpers (local tile coords). Every section starts and ends on ground (y 15).
const G = (x, w) => [x, GROUND_Y, w, LEVEL_H - GROUND_Y];   // ground block
const P = (x, y, w) => [x, y, w, 1];                        // floating ledge
const COL = (x, y, w) => [x, y, w, LEVEL_H - y];            // pillar to the floor
const WK = (x, y, a, b, vx, tier) => ({ type: "walker", x, y, a, b, vx, tier: tier || 1 });
const HP = (x, y, a, b, vx, tier, hopT) => ({ type: "hopper", x, y, a, b, vx, tier: tier || 1, hopT: hopT || 0 });

const SECTIONS = {
  // The original Level 1 (0–130), unchanged except its goal moved to the new finale
  classic: { w: 116, plats: [
      G(0, 18), P(20, 13, 5), P(27, 11, 4), P(33, 13, 6), G(40, 12), G(55, 8),
      P(46, 13, 3), P(49, 11, 3), P(53, 9, 3), P(57, 7, 4),
      P(64, 13, 3), P(69, 11, 3), P(74, 13, 4),
      G(80, 16), P(84, 13, 3), P(88, 11, 3), P(92, 13, 4),
      G(99, 8), P(109, 13, 5) ],
    picks: [[8, 13], [28, 9], [58, 5], [71, 9], [89, 9]],
    enemies: [
      WK(14, 15, 10, 22, 60), WK(44, 15, 40, 50, 70), HP(34, 13, 33, 39, 40, 1, 0),
      WK(86, 15, 80, 94, 80), HP(70, 11, 69, 72, 30, 1, 0.5), WK(110, 13, 109, 113.875, 55), HP(102, 15, 99, 106, 35, 1, 1.2),
    ],
    cps: [2, 42, 82] },
  // old end stretch (116–130) + perch, kept as the hand-off into the new content
  classicEnd: { w: 16, plats: [G(0, 16), P(4, 13, 3)], picks: [[5, 11]], enemies: [WK(10, 15, 8, 15, 60, 2)], cuts: [] },
  meadow: { w: 24, plats: [G(0, 24), P(6, 13, 3), P(11, 11, 3), P(16, 13, 3)],
    picks: [[12, 9]], enemies: [WK(4, 15, 1, 22, 65), HP(12, 11, 11, 14, 30, 2, 0.4)], cps: [2], cuts: [20] },
  pitIslands: { w: 26, plats: [G(0, 5), G(8, 4), P(14, 13, 3), G(19, 7)],
    picks: [[15, 11]], enemies: [WK(9, 15, 8, 12, 45, 2), WK(21, 15, 19, 26, 70)], cps: [2] },
  staircase: { w: 28, plats: [G(0, 6), COL(6, 13, 3), COL(9, 11, 3), COL(12, 9, 4), COL(16, 11, 3), COL(19, 13, 3), G(22, 6)],
    picks: [[13, 7]], enemies: [HP(13, 9, 12, 16, 35, 1, 0.3), WK(24, 15, 22, 28, 60, 2)], cuts: [2] },
  // breather pad (no enemies) — mid-level checkpoints land on these
  rest: { w: 16, plats: [G(0, 16), P(10, 13, 3)], picks: [[11, 11]], enemies: [], cps: [3] },
  highRoad: { w: 34, plats: [G(0, 34), P(4, 13, 3), P(8, 11, 4), P(13, 9, 5), P(19, 9, 5), P(25, 11, 3), P(29, 13, 3)],
    picks: [[16, 7], [30, 11]], enemies: [WK(10, 15, 1, 33, 75), WK(24, 15, 1, 33, 70, 2), HP(21, 9, 19, 24, 30, 2, 0.8)], cuts: [2, 17] },
  zigzag: { w: 30, plats: [G(0, 4), P(6, 13, 3), P(11, 11, 3), P(16, 13, 3), P(21, 11, 3), G(26, 4)],
    picks: [[22, 9]], enemies: [HP(12, 11, 11, 14, 30, 2, 0.2), WK(26, 15, 26, 30, 50, 2), WK(7, 13, 6, 9, 40)] },
  arena: { w: 30, plats: [G(0, 30), P(8, 13, 4), P(13, 11, 4), P(18, 13, 4)],
    picks: [[14, 9]], enemies: [WK(5, 15, 1, 14, 70), WK(22, 15, 15, 29, 70), WK(12, 15, 6, 24, 85, 2), HP(14, 11, 13, 17, 30, 2, 0.6)], cps: [2], cuts: [25] },
  valley: { w: 26, plats: [G(0, 6), [6, 16, 14, 2], P(10, 14, 4), G(20, 6)],
    picks: [[11, 12]], enemies: [WK(8, 16, 6, 20, 60), WK(16, 16, 6, 20, 70, 2)], cps: [2] },
  towers: { w: 28, plats: [G(0, 5), COL(5, 13, 2), COL(9, 11, 2), COL(13, 13, 2), COL(17, 11, 2), COL(21, 13, 2), G(23, 5)],
    picks: [[17, 9]], enemies: [WK(1, 15, 0, 5, 40), WK(24, 15, 23, 28, 55, 2)], cps: [2] },
  doubleGap: { w: 28, plats: [G(0, 6), G(9, 5), G(17, 4), G(24, 4)],
    picks: [[12, 13]], enemies: [WK(10, 15, 9, 14, 55), WK(18, 15, 17, 21, 50, 2)], cps: [2] },
  bridge: { w: 32, cps: [1], plats: [G(0, 3), P(3, 13, 26), G(29, 3)],
    picks: [[16, 11], [8, 11]], enemies: [WK(8, 13, 3, 29, 60), WK(20, 13, 3, 29, 65), HP(14, 13, 11, 18, 30, 2, 0.5)] },
  ladder: { w: 24, plats: [G(0, 24), P(4, 13, 4), P(9, 11, 4), P(4, 9, 4), P(10, 7, 6), P(17, 9, 3), P(21, 11, 3)],
    picks: [[12, 5]], enemies: [WK(14, 15, 1, 23, 70), HP(12, 7, 10, 16, 30, 1, 0.1)], cuts: [1] },
  gauntlet: { w: 36, plats: [G(0, 36), COL(8, 14, 2), COL(16, 13, 2), COL(24, 14, 2)], cps: [2], cuts: [33],
    picks: [[17, 11], [30, 13]], enemies: [WK(4, 15, 0, 8, 55), WK(12, 15, 10, 16, 60), WK(20, 15, 18, 24, 65, 2), WK(30, 15, 26, 36, 70), HP(28, 15, 26, 34, 35, 2, 0.9)] },
  finale: { w: 20, plats: [G(0, 20), P(6, 13, 3), P(10, 11, 3)], picks: [[11, 9]], enemies: [], goal: 16 },
  // Level 3 run-in: short neon rooftops (no regular enemies), 2 babe drops, then the boss arena
  rooftopRun: { w: 18, plats: [
      G(0, 18), P(6, 13, 3), P(11, 12, 3) ],
    picks: [[7, 11], [12, 10]], enemies: [], cps: [2] },
  // Boss arena (~1 screen / 30 tiles). Entrance CP; goal unlocks after defeat.
  // Side ledges at y=13 (2 tiles). P(15,13) sits by the crank for stomps.
  bossArena: { w: 30, plats: [G(0, 30), P(8, 13, 3), P(15, 13, 3)],
    picks: [], enemies: [], cps: [1], goal: 26 },
};

// Difficulty per level. dropRate stays 1.0 on every level for now (same babe density).
const DIFFICULTY = {
  1: { enemySpeed: 1.0, enemyCount: 1.0, pitFreq: 1.0, dropRate: 1.0 },
  2: { enemySpeed: 1.4, enemyCount: 1.5, pitFreq: 1.4, dropRate: 1.0 },
  3: { enemySpeed: 1.0, enemyCount: 0.0, pitFreq: 0.0, dropRate: 1.0 },
};
const LEVELS = [
  { id: 1, name: "Level 1", theme: "dusk", sections: [
      "classic", "classicEnd", "rest", "meadow", "pitIslands", "staircase", "highRoad", "zigzag",
      "rest", "arena", "valley", "towers", "doubleGap", "finale"] },
  { id: 2, name: "Level 2", theme: "night", sections: [
      "rest", "meadow", "bridge", "ladder", "towers", "rest", "gauntlet", "pitIslands", "highRoad",
      "zigzag", "rest", "doubleGap", "arena", "valley", "staircase", "finale"],
    // Flyers: [section index, start x, patrol a, patrol b, base speed] — over open stretches only,
    // hover height derived from the floor so walking underneath is always safe (see buildLevel)
    flyers: [[1, 19, 16, 25, 45], [2, 10, 5, 17, 50], [6, 30, 27, 36, 50], [7, 22, 19, 26, 45], [12, 25, 23, 30, 55], [15, 2, 0, 5, 40]] },
  { id: 3, name: "Level 3", theme: "neon", sections: ["rooftopRun", "bossArena"], boss: true },
];
const LEVEL_THEMES = {
  dusk:  { sky: ["#1b0f2e", "#3a1a4a", "#6b2d5c"], hills: "#2a1538", dirt: "#5c3a28", grass: "#4ec96a", edge: "#3a8f4c" },
  night: { sky: ["#07142a", "#123457", "#2c6a86"], hills: "#0f2a44", dirt: "#4a3d63", grass: "#5fd6e8", edge: "#3793a8" },
  neon:  { sky: ["#140528", "#2a0a4a", "#4a1870"], hills: "#1a0a30", dirt: "#3a2a55", grass: "#ff5ec8", edge: "#c43a9a",
           neon: true, signs: ["#ff4ad2", "#5ef0ff", "#ffe66d", "#b48cff"] },
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
    for (const [x, y, w, h] of sec.plats) if (w > 0) plats.push({ x: x + ox, y, w, h });
    for (const [x, y] of sec.picks || []) picks.push([x + ox, y]);
    for (const e of sec.enemies || []) slots.push(Object.assign({}, e, { x: e.x + ox, a: e.a + ox, b: e.b + ox }));
    for (const c of sec.cps || []) cps.push(c + ox); // only the first (start spawn) is used
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
  cps.sort((a, b) => a - b);
  const startX = cps.length ? cps[0] : 2;
  const endX = goalX != null ? goalX : width - 4;
  const safeCp = x => plats.some(p => p.y === GROUND_Y && p.x <= x - 2 && p.x + p.w >= x + 3) &&
    !plats.some(p => p.y < GROUND_Y && p.y >= GROUND_Y - 4 && p.x < x + 3 && p.x + p.w > x - 1) &&
    !chosen.concat(flyers).some(e => x >= e.a - CP_ENEMY_CLEAR && x <= e.b + CP_ENEMY_CLEAR) &&
    !keptPicks.some(([px]) => Math.abs(px - x) < 2);
  const keptCps = [startX];
  if (def.boss) {
    // Arena entrance: prefer the second section's cp; fall back to the first tile of ground past the run-in
    let mid = cps.find(c => c > startX + 8);
    if (mid == null) mid = Math.round(width * 0.4);
    // Snap onto solid ground (boss arenas start mid-level so the usual ±2 pad can miss the seam)
    for (let d = 0; d < 40; d++) {
      const tryX = [mid + d, mid - d].find(x => x > startX + 4 &&
        plats.some(p => p.y === GROUND_Y && p.x <= x && p.x + p.w >= x + 2));
      if (tryX != null) { keptCps.push(tryX); break; }
    }
  } else {
    for (const f of CP_FRACTIONS) {
      const target = Math.round(startX + (endX - startX) * f);
      for (let d = 0; d < 80; d++) {
        const x = [target + d, target - d].find(safeCp);
        if (x != null) { keptCps.push(x); break; }
      }
    }
  }
  // Pits: cut a 2-tile gap into a share of the marked ground spots (never under a pickup/enemy/flag)
  const blocked = x => keptPicks.some(([px]) => Math.abs(px - x) < 3) || chosen.some(e => Math.abs(e.x - x) < 3) ||
    keptCps.some(c => Math.abs(c - x) < 4) || (goalX != null && Math.abs(goalX - x) < 4);
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
  return {
    id: def.id, name: def.name, theme: LEVEL_THEMES[def.theme] || LEVEL_THEMES.dusk, diff,
    width, plats, picks: keptPicks, enemySlots: chosen.concat(flyers), pits: cuts, boss: !!def.boss,
    checkpoints: keptCps.map(x => ({ x: x * TILE, y: GROUND_Y * TILE })),
    // Boss levels: the goal starts inactive (unlocked after the fight); arenaLeft = second checkpoint
    goal: { x: (goalX != null ? goalX : width - 4) * TILE, y: 12 * TILE, w: 20, h: 96, active: !def.boss },
    arenaLeft: def.boss && keptCps.length > 1 ? keptCps[1] * TILE : null,
  };
}

let levelNum = 1;
let level = null;
let platforms = [];
let checkpoints = [];
let goal = { x: 0, y: 0, w: 20, h: 96 };

function loadLevel(n) {
  levelNum = Math.max(1, Math.min(LEVELS.length, n | 0));
  level = buildLevel(LEVELS[levelNum - 1], DIFFICULTY[levelNum] || DIFFICULTY[1]);
  LEVEL_W = level.width;
  platforms = level.plats;
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
  try { const o = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "null"); if (o && o.level >= 1) return o; } catch (e) {}
  return { level: 1, beatGame: false };
}
function saveProgress(o) { try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(o)); } catch (e) {} }
let progress = loadProgress();

