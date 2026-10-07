// Hot Babe Collector — babes.js
// ---------- Babe pool (data-driven; grow by appending entries) ----------
const RARITIES = [
  // Pull odds: roll tier first (weights), then uniform within tier
  { id: "common", label: "Common",     color: "#9aa0a6", weight: 88, order: 0 },
  { id: "rare",   label: "Rare",       color: "#7ec8ff", weight: 10, order: 1 },
  { id: "ultra",  label: "Ultra Rare", color: "#ffd24a", weight: 2,  order: 2 },
];
const RARITY_ORDER = Object.fromEntries(RARITIES.map(r => [r.id, r.order]));

// Final 30-girl roster (Artist Iris; art/cards/final/manifest.json, roster order).
// Rarities set by the user: Ultra = Luna, Carmilla; Rare = Sora, Hana, Tomoe, Natsu, Yume, Mina; rest Common.
// Art (see babeArtUrl): Common → art/cards/v3/card_<id>_<size>.png (as-is)
//                       Rare   → art/cards/final/rare/card_<id>_rare_<size>.png + shared rarity/rare/anim_* sheen
//                       Ultra  → art/cards/final/ultra/frames/card_<id>_ultra_<size>_NN.png (baked, cycled as-is)
// hue/shape only drive the procedural fallback if an image fails to load.
const BABE_POOL = [
  { id: "mika",     name: "Mika",     rarity: "common", banner: "#d62828", hue: 0,    shape: "heart" },
  { id: "sora",     name: "Sora",     rarity: "rare",   banner: "#288cdc", hue: 207, shape: "star" },
  { id: "rin",      name: "Rin",      rarity: "common", banner: "#f05aa0", hue: 332, shape: "circle" },
  { id: "kaede",    name: "Kaede",    rarity: "common", banner: "#f0b41e", hue: 43,   shape: "diamond" },
  { id: "yuki",     name: "Yuki",     rarity: "common", banner: "#826ec8", hue: 253, shape: "hourglass" },
  { id: "hana",     name: "Hana",     rarity: "rare",   banner: "#78b946", hue: 94,   shape: "heart" },
  { id: "aya",      name: "Aya",      rarity: "common", banner: "#c81e46", hue: 346, shape: "star" },
  { id: "nami",     name: "Nami",     rarity: "common", banner: "#14b4a5", hue: 174, shape: "circle" },
  { id: "momo",     name: "Momo",     rarity: "common", banner: "#f58287", hue: 357, shape: "diamond" },
  { id: "reiko",    name: "Reiko",    rarity: "common", banner: "#8c142d", hue: 348, shape: "hourglass" },
  { id: "saya",     name: "Saya",     rarity: "common", banner: "#464655", hue: 240, shape: "heart" },
  { id: "noa",      name: "Noa",      rarity: "common", banner: "#e6d732", hue: 55,   shape: "star" },
  { id: "tomoe",    name: "Tomoe",    rarity: "rare",   banner: "#28327d", hue: 233, shape: "circle" },
  { id: "akane",    name: "Akane",    rarity: "common", banner: "#c85014", hue: 20,   shape: "diamond" },
  { id: "hikari",   name: "Hikari",   rarity: "common", banner: "#e132aa", hue: 319, shape: "hourglass" },
  { id: "misaki",   name: "Misaki",   rarity: "common", banner: "#8cb496", hue: 135, shape: "heart" },
  { id: "natsu",    name: "Natsu",    rarity: "rare",   banner: "#3c6496", hue: 213, shape: "star" },
  { id: "lena",     name: "Lena",     rarity: "common", banner: "#8cbee1", hue: 205, shape: "circle" },
  { id: "mai",      name: "Mai",      rarity: "common", banner: "#d796eb", hue: 286, shape: "diamond" },
  { id: "yume",     name: "Yume",     rarity: "rare",   banner: "#5a73f5", hue: 230, shape: "hourglass" },
  { id: "izumi",    name: "Izumi",    rarity: "common", banner: "#be9b69", hue: 35,   shape: "heart" },
  { id: "kana",     name: "Kana",     rarity: "common", banner: "#784b2d", hue: 24,   shape: "star" },
  { id: "ruri",     name: "Ruri",     rarity: "common", banner: "#192db9", hue: 232, shape: "circle" },
  { id: "asuka",    name: "Asuka",    rarity: "common", banner: "#fa8214", hue: 29,   shape: "diamond" },
  { id: "chiyo",    name: "Chiyo",    rarity: "common", banner: "#147341", hue: 148, shape: "hourglass" },
  { id: "kiko",     name: "Kiko",     rarity: "common", banner: "#00c8eb", hue: 189, shape: "heart" },
  { id: "rumi",     name: "Rumi",     rarity: "common", banner: "#6edcaa", hue: 153, shape: "star" },
  { id: "mina",     name: "Mina",     rarity: "rare",   banner: "#ff785a", hue: 11,   shape: "circle" },
  { id: "luna",     name: "Luna",     rarity: "ultra",  banner: "#8c28be", hue: 280, shape: "diamond" },
  { id: "carmilla", name: "Carmilla", rarity: "ultra",  banner: "#910a05", hue: 2,    shape: "hourglass" },
];
// Old saves: placeholders replaced by real girls in 3bfac1f carry their counts over.
// Every other placeholder id (Kira, Mira, Suki, Zara, Ivy, Nyx, Aurora, Opal, Faye, …) is dropped.
const BABE_ID_MIGRATE = {
  cleo: "mika",
  daisy: "sora",
  vex: "rin",
  sage: "kaede",
};
// Placeholder ids that collide with a real girl's id: in pre-final saves they meant the
// placeholder (e.g. old Common "luna" ≠ Ultra Luna), so they're dropped, not carried over.
const LEGACY_PLACEHOLDER_IDS = new Set(["luna"]);
const ROSTER_VERSION = 2; // bump when ids change meaning; stored in the v2 save
// Alias for older call sites
const CHAR_DEFS = BABE_POOL;

function babeById(id) { return BABE_POOL.find(b => b.id === id) || null; }
function rarityOf(id) {
  const c = babeById(id);
  return RARITIES.find(r => r.id === (c ? c.rarity : "common"));
}
function rarityRank(id) { return RARITY_ORDER[(babeById(id) || {}).rarity] || 0; }

// Debug-only pull forcing (never changes tier data):
//   ?debugPull=<id>[,<id>…]  — next pulls land on these babes, in order
//   ?debugRarity=rare|ultra — every pull rolls this tier
//   console: __HBC.forcePull(id), __HBC.setDebugRarity(tier|null)
const debugPulls = [];
let debugRarity = null;
try {
  const qs = new URLSearchParams(location.search);
  if (qs.get("debugPull")) debugPulls.push(...qs.get("debugPull").split(",").map(x => x.trim()).filter(Boolean));
  if (qs.get("debugRarity")) debugRarity = qs.get("debugRarity");
} catch (e) {}

// A babe owned MAX_COPIES times leaves the pull pool (losing one on death puts her back).
const MAX_COPIES = 6;
function isMaxed(id) { return (collection[id] || 0) >= MAX_COPIES; }
function pullableBabes() { return BABE_POOL.filter(b => !isMaxed(b.id)); }
function clampCount(n) { return Math.max(0, Math.min(MAX_COPIES, Math.floor(+n || 0))); }

// Rare-or-better pull (boss reward): 10:2 Rare:Ultra among non-maxed; falls back to any available babe
function rollRareOrBetter() {
  while (debugPulls.length) {
    const forced = babeById(debugPulls.shift());
    if (forced && !isMaxed(forced.id)) return forced;
  }
  const tiers = [
    { id: "rare", weight: 10, pool: BABE_POOL.filter(c => c.rarity === "rare" && !isMaxed(c.id)) },
    { id: "ultra", weight: 2, pool: BABE_POOL.filter(c => c.rarity === "ultra" && !isMaxed(c.id)) },
  ].filter(t => t.pool.length > 0);
  if (!tiers.length) return rollCharacter(); // every Rare/Ultra maxed → any available babe
  const total = tiers.reduce((s, t) => s + t.weight, 0);
  let n = Math.random() * total, pick = tiers[tiers.length - 1];
  for (const t of tiers) { n -= t.weight; if (n <= 0) { pick = t; break; } }
  return pick.pool[Math.floor(Math.random() * pick.pool.length)];
}

// Returns a babe that isn't maxed, or null when all babes are maxed.
function rollCharacter() {
  // Debug forced pulls never plant a maxed babe (maxed ids are skipped)
  while (debugPulls.length) {
    const forced = babeById(debugPulls.shift());
    if (forced && !isMaxed(forced.id)) return forced;
  }
  if (debugRarity) {
    const tierPool = BABE_POOL.filter(c => c.rarity === debugRarity && !isMaxed(c.id));
    if (tierPool.length) return tierPool[Math.floor(Math.random() * tierPool.length)];
  }
  // Tier first (88% / 10% / 2%), then uniform among that tier's non-maxed babes.
  // Fully maxed tiers drop out and the roll is redone over the remaining tiers,
  // keeping their relative weights.
  const tiers = RARITIES
    .map(r => ({ r, pool: BABE_POOL.filter(c => c.rarity === r.id && !isMaxed(c.id)) }))
    .filter(t => t.pool.length > 0);
  if (!tiers.length) return null;
  const total = tiers.reduce((s, t) => s + t.r.weight, 0);
  let n = Math.random() * total;
  let pick = tiers[tiers.length - 1];
  for (const t of tiers) { n -= t.r.weight; if (n <= 0) { pick = t; break; } }
  return pick.pool[Math.floor(Math.random() * pick.pool.length)];
}

function ownedUniqueCount(col) {
  return Object.keys(col).filter(k => col[k] > 0 && babeById(k)).length;
}
function totalPulls(col) {
  return Object.values(col).reduce((s, n) => s + n, 0);
}

// ---------- Collection movement buff (every 5 unique babes) ----------
// Stacks at 5/10/15/20/25/30 (max 6). Soft-capped so L1–L3 stays fair.
const COLL_BUFF_STEP = 5;
const COLL_BUFF_MAX_STACKS = 6;
const COLL_BUFF_MOVE_PER = 0.07;   // +7% walk speed per stack → 1.42× at 6
const COLL_BUFF_JUMP_H_PER = 0.05; // +5% jump *height* per stack → 1.30× at 6 (vel = √height)
function collectionBuffStacks(col) {
  col = col || (typeof collection !== "undefined" ? collection : {});
  return Math.min(COLL_BUFF_MAX_STACKS, Math.floor(ownedUniqueCount(col) / COLL_BUFF_STEP));
}
function collectionMoveMul(col) {
  return 1 + COLL_BUFF_MOVE_PER * collectionBuffStacks(col);
}
function collectionJumpHeightMul(col) {
  return 1 + COLL_BUFF_JUMP_H_PER * collectionBuffStacks(col);
}
function collectionJumpVelMul(col) {
  return Math.sqrt(collectionJumpHeightMul(col));
}

// ---------- localStorage collection (v1 counts map; v2 wraps same map) ----------
const SAVE_KEY = "hbc_collection_v1";
const SAVE_KEY_V2 = "hbc_collection_v2";
function migrateCollectionCounts(col, legacy) {
  if (!col || typeof col !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(col)) {
    const n = +v || 0;
    if (!(n > 0)) continue;
    if (legacy && LEGACY_PLACEHOLDER_IDS.has(k)) continue; // old placeholder, not the real girl
    const id = BABE_ID_MIGRATE[k] || k;
    if (!babeById(id)) continue; // drop unknown / removed placeholders
    out[id] = clampCount((out[id] || 0) + n); // never above MAX_COPIES
  }
  return out;
}
function loadCollection() {
  try {
    let counts = null;
    let legacy = true; // saves written before the final roster
    const v2 = localStorage.getItem(SAVE_KEY_V2);
    if (v2) {
      const obj = JSON.parse(v2);
      if (obj && typeof obj === "object" && obj.counts && typeof obj.counts === "object") {
        counts = obj.counts;
        legacy = obj.roster !== ROSTER_VERSION;
      }
    }
    if (!counts) {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") counts = obj;
    }
    if (!counts) return {};
    const migrated = migrateCollectionCounts(counts, legacy);
    // Persist cleaned map so removed ids don't linger
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(migrated));
      localStorage.setItem(SAVE_KEY_V2, JSON.stringify({ v: 2, roster: ROSTER_VERSION, counts: migrated }));
    } catch {}
    return migrated;
  } catch { return {}; }
}
function saveCollection(col) {
  for (const k of Object.keys(col)) col[k] = clampCount(col[k]); // hard cap on every save
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(col)); // keep v1 readable
    localStorage.setItem(SAVE_KEY_V2, JSON.stringify({ v: 2, roster: ROSTER_VERSION, counts: col }));
  } catch {}
}

