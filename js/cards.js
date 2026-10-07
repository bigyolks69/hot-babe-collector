// Hot Babe Collector — cards.js
// ---------- Drawing helpers ----------
function roundRect(x, y, w, h, r) {
  r = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

function drawSilhouette(cx, cy, size, shape, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha == null ? 1 : alpha;
  ctx.fillStyle = color;
  ctx.translate(cx, cy);
  const s = size;
  if (shape === "hourglass") {
    // stylized figure: head + torso
    ctx.beginPath();
    ctx.arc(0, -s*0.38, s*0.16, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s*0.12, -s*0.2);
    ctx.lineTo(s*0.12, -s*0.2);
    ctx.lineTo(s*0.22, s*0.15);
    ctx.lineTo(s*0.1, s*0.15);
    ctx.lineTo(s*0.14, s*0.45);
    ctx.lineTo(-s*0.14, s*0.45);
    ctx.lineTo(-s*0.1, s*0.15);
    ctx.lineTo(-s*0.22, s*0.15);
    ctx.closePath();
    ctx.fill();
  } else if (shape === "star") {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI/2 + i * Math.PI*2/5;
      const a2 = a + Math.PI/5;
      ctx.lineTo(Math.cos(a)*s*0.45, Math.sin(a)*s*0.45);
      ctx.lineTo(Math.cos(a2)*s*0.18, Math.sin(a2)*s*0.18);
    }
    ctx.closePath();
    ctx.fill();
  } else if (shape === "diamond") {
    ctx.beginPath();
    ctx.moveTo(0, -s*0.45); ctx.lineTo(s*0.35, 0); ctx.lineTo(0, s*0.45); ctx.lineTo(-s*0.35, 0);
    ctx.closePath(); ctx.fill();
  } else if (shape === "heart") {
    ctx.beginPath();
    ctx.moveTo(0, s*0.3);
    ctx.bezierCurveTo(s*0.45, s*0.05, s*0.4, -s*0.3, 0, -s*0.15);
    ctx.bezierCurveTo(-s*0.4, -s*0.3, -s*0.45, s*0.05, 0, s*0.3);
    ctx.fill();
  } else { // circle
    ctx.beginPath();
    ctx.arc(0, 0, s*0.38, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

// Canonical card aspect (width/height) from slot-roll card 72×96
const CARD_ASPECT = 72 / 96; // 3/4
function cardHeight(w) { return w / CARD_ASPECT; }
function cardWidth(h) { return h * CARD_ASPECT; }

// Iris cardbacks only (front art TBD). Graceful null → procedural.
const cardImgs = {
  ready: false,
  mystery: { sm: null, md: null, lg: null },
  normal: { sm: null, md: null, lg: null },
};

function pickCardSizeKey(drawW) {
  if (drawW <= 40) return "sm";
  if (drawW <= 200) return "md";
  return "lg";
}

function drawCardBitmap(img, x, y, w, h, smooth) {
  if (!img || !img.complete || img.naturalWidth < 1) return false;
  const ix = Math.floor(x), iy = Math.floor(y);
  const iw = Math.max(1, Math.floor(w)), ih = Math.max(1, Math.floor(h));
  ctx.save();
  ctx.imageSmoothingEnabled = !!smooth;
  if (smooth) ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, ix, iy, iw, ih);
  ctx.restore();
  return true;
}

// ---------- Babe card art (final roster) ----------
// Animation timing (art/cards/rarity/README_rarity.md + final/MANIFEST.md)
const RARITY_ANIM = {
  rare:  { big: { n: 8,  ms: 110, holdMs: 0 },    sm: { n: 4, ms: 180 } },  // shared sheen overlay
  ultra: { big: { n: 12, ms: 70,  holdMs: 1000 }, sm: { n: 4, ms: 180 } },  // baked frames; hold on 11
};
function rarityAnimFrame(tier, sizeKey) {
  const a = RARITY_ANIM[tier];
  const now = performance.now();
  if (sizeKey === "sm") return Math.floor(now / a.sm.ms) % a.sm.n;
  const sweep = a.big.n * a.big.ms;
  const t = now % (sweep + a.big.holdMs);
  return Math.min(a.big.n - 1, Math.floor(t / a.big.ms));
}
function imgOk(im) { return !!(im && im.complete && im.naturalWidth > 0); }

// URL-keyed image cache. img(url) returns a decoded Image or null (and starts loading it).
const IMG_CACHE = new Map(); // url -> Image | null (failed) | "loading"
function img(url) {
  const v = IMG_CACHE.get(url);
  if (v === undefined) { preloadUrls([url]); return null; }
  return imgOk(v) ? v : null;
}
function preloadUrls(urls) {
  return Promise.all(urls.map(u => {
    if (IMG_CACHE.has(u)) return null;
    IMG_CACHE.set(u, "loading");
    return loadImg(u).then(im => {
      IMG_CACHE.set(u, im);
      if (!im) console.warn("[HBC] missing card art", u);
    });
  }));
}

const ART_FILES = { sm: "15x20", md: "110x147", lg: "440x588" };
const pad2 = i => String(i).padStart(2, "0");
/** Static card for a babe at a size (Ultra: the still = frame 00 without shine). */
function babeArtUrl(b, key) {
  const f = ART_FILES[key];
  if (b.rarity === "rare") return "art/cards/final/rare/card_" + b.id + "_rare_" + f + ".png";
  if (b.rarity === "ultra") return "art/cards/final/ultra/card_" + b.id + "_ultra_" + f + ".png";
  return "art/cards/v3/card_" + b.id + "_" + f + ".png";
}
function ultraFrameUrl(b, key, i) {
  return "art/cards/final/ultra/frames/card_" + b.id + "_ultra_" + ART_FILES[key] + "_" + pad2(i) + ".png";
}
function rareSheenUrl(key, i) {
  return "art/cards/rarity/rare/anim_" + ART_FILES[key] + "_" + pad2(i) + ".png";
}
function animFrameCount(tier, key) { const a = RARITY_ANIM[tier]; return key === "sm" ? a.sm.n : a.big.n; }
// Ultra frames stream in per babe+size the first time they're drawn (440s are ~375KB each)
const ultraWarm = new Set();
function warmUltra(b, key) {
  const k = b.id + ":" + key;
  if (ultraWarm.has(k)) return;
  ultraWarm.add(k);
  const urls = [];
  for (let i = 0; i < animFrameCount("ultra", key); i++) urls.push(ultraFrameUrl(b, key, i));
  preloadUrls(urls);
}
function framesReady(b, key) {
  for (let i = 0; i < animFrameCount("ultra", key); i++) if (!img(ultraFrameUrl(b, key, i))) return false;
  return true;
}

/**
 * Draw a babe's final card, uniform 3:4, closest size: 15x20 for tiny spots (nearest-neighbour),
 * 110x147 up to 110px wide, 440x588 above that (lazy; 110 shown while it streams in).
 * Returns false if nothing is loaded yet (caller draws the procedural fallback).
 */
function drawBabeArt(b, x, y, w, h, sizeKey) {
  const want = sizeKey === "sm" ? "sm" : (Math.floor(w) <= 110 ? "md" : "lg");
  const keys = want === "lg" ? ["lg", "md"] : [want];
  for (const key of keys) {
    let base = null;
    if (b.rarity === "ultra") {
      warmUltra(b, key);
      // cycle the baked frames once all of them are in; until then show the still
      base = framesReady(b, key) ? img(ultraFrameUrl(b, key, rarityAnimFrame("ultra", key))) : null;
      if (!base) base = img(babeArtUrl(b, key));
    } else {
      base = img(babeArtUrl(b, key));
    }
    if (!base) continue;
    const smooth = key !== "sm" && Math.floor(w) < base.naturalWidth;
    drawCardBitmap(base, x, y, w, h, smooth);
    if (b.rarity === "rare") {
      const sheen = img(rareSheenUrl(key, rarityAnimFrame("rare", key)));
      if (sheen) drawCardBitmap(sheen, x, y, w, h, smooth);
    }
    return true;
  }
  return false;
}

// First load: every babe's 15x20 + 110x147 still and the small rare sheen frames.
// 440s and the Ultra animation frames load lazily when first drawn.
function preloadBabeArt() {
  const urls = [];
  for (const b of BABE_POOL) for (const key of ["sm", "md"]) urls.push(babeArtUrl(b, key));
  for (const key of ["sm", "md"]) for (let i = 0; i < animFrameCount("rare", key); i++) urls.push(rareSheenUrl(key, i));
  return preloadUrls(urls);
}

async function preloadCardArt() {
  const sizes = [
    ["sm", "15x20"],
    ["md", "110x147"],
    ["lg", "440x588"],
  ];
  const jobs = [];
  for (const [key, file] of sizes) {
    jobs.push(loadImg("art/cards/cardback/A5/cardback_" + file + ".png").then(im => { cardImgs.mystery[key] = im; }));
    jobs.push(loadImg("art/cards/cardback/normal/cardback_" + file + ".png").then(im => { cardImgs.normal[key] = im; }));
  }
  jobs.push(preloadBabeArt());
  await Promise.all(jobs);
  cardImgs.ready = true;
  return true;
}

function drawCard(char, x, y, w, h, opts) {
  opts = opts || {};
  // Uniform scale only — height always derived from width via CARD_ASPECT
  w = +w;
  h = cardHeight(w);
  const rar = rarityOf(char.id);
  const locked = !!opts.locked;
  const glow = opts.glow || 0;
  const iconOnly = !!opts.iconOnly;
  const sizeKey = pickCardSizeKey(w);
  // Smooth only when downscaling large (440) art into big UI views
  const useSmooth = sizeKey === "lg";

  if (glow > 0) {
    ctx.save();
    ctx.shadowColor = rar.color;
    ctx.shadowBlur = 18 * glow;
    roundRect(x, y, w, h, 8);
    ctx.fillStyle = rar.color;
    ctx.fill();
    ctx.restore();
  }

  // Locked / missing: regular cardback (Iris) instead of grey ??? silhouette
  if (locked) {
    const back = cardImgs.normal[sizeKey];
    if (drawCardBitmap(back, x, y, w, h, useSmooth)) {
      // light frame
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 2;
      roundRect(x + 1, y + 1, w - 2, h - 2, 6);
      ctx.stroke();
    } else {
      // procedural fallback
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, "#2a2a32");
      g.addColorStop(1, "#1a1a22");
      roundRect(x, y, w, h, 8);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 3;
      roundRect(x + 1.5, y + 1.5, w - 3, h - 3, 7);
      ctx.stroke();
      drawSilhouette(x + w / 2, y + h * (iconOnly ? 0.52 : 0.42), Math.min(w, h) * 0.55, char.shape, "#3a3a44");
    }
    if (!iconOnly) {
      ctx.textAlign = "center";
      ctx.font = `bold ${Math.max(10, Math.floor(w * 0.12))}px sans-serif`;
      ctx.fillStyle = "#666";
      ctx.fillText("???", x + w / 2, y + h - 12);
    }
    return;
  }

  // Owned: the girl's final card (frame + name banner baked in)
  if (drawBabeArt(char, x, y, w, h, sizeKey)) {
    drawCardBadges(char, x, y, w, h, opts, iconOnly);
    return;
  }

  // Fallback while art loads / if a file is missing: procedural card
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, `hsl(${char.hue}, 70%, 55%)`);
  g.addColorStop(0.55, `hsl(${char.hue + 20}, 65%, 35%)`);
  g.addColorStop(1, `hsl(${char.hue}, 50%, 18%)`);
  roundRect(x, y, w, h, 8);
  ctx.fillStyle = g;
  ctx.fill();
  // Base border (common; also rare/ultra fallback while frames load)
  ctx.strokeStyle = rar.color;
  ctx.lineWidth = 3;
  roundRect(x + 1.5, y + 1.5, w - 3, h - 3, 7);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  if (iconOnly) roundRect(x + 3, y + 3, w - 6, h - 6, 4);
  else roundRect(x + 8, y + 8, w - 16, h - 28, 4);
  ctx.stroke();
  drawSilhouette(
    x + w / 2,
    y + h * (iconOnly ? 0.52 : 0.42),
    Math.min(w, h) * (iconOnly ? 0.62 : 0.55),
    char.shape,
    "rgba(255,255,255,0.92)"
  );

  if (!iconOnly) {
    ctx.textAlign = "center";
    ctx.font = `bold ${Math.max(10, Math.floor(w * 0.12))}px sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.fillText(char.name, x + w / 2, y + h - 12);
    if (opts.showRarity !== false && !maxTagShown(opts, w, iconOnly)) { // MAX tag takes that corner
      ctx.font = `${Math.max(8, Math.floor(w * 0.08))}px sans-serif`;
      ctx.fillStyle = rar.color;
      ctx.fillText(rar.label, x + w / 2, y + 14);
    }
  }

  drawCardBadges(char, x, y, w, h, opts, iconOnly);
}

function maxTagShown(opts, w, iconOnly) {
  const isMax = opts.max != null ? !!opts.max : (opts.count != null && opts.count >= MAX_COPIES);
  return isMax && !iconOnly && w >= 44;
}
function drawCardBadges(char, x, y, w, h, opts, iconOnly) {
  // MAX tag (owned MAX_COPIES): top-left pill, only where it stays readable
  if (maxTagShown(opts, w, iconOnly)) {
    const fs = Math.max(8, Math.min(12, Math.floor(w * 0.11)));
    ctx.save();
    ctx.font = "bold " + fs + "px sans-serif";
    const tw = Math.ceil(ctx.measureText("MAX").width) + 8;
    const th = fs + 5;
    ctx.fillStyle = "#ffd24a";
    roundRect(x + 4, y + 4, tw, th, 3);
    ctx.fill();
    ctx.strokeStyle = "rgba(60,20,0,0.85)";
    ctx.lineWidth = 1;
    roundRect(x + 4, y + 4, tw, th, 3);
    ctx.stroke();
    ctx.fillStyle = "#3a1600";
    ctx.textAlign = "center";
    ctx.fillText("MAX", x + 4 + tw / 2, y + 4 + th - 4);
    ctx.restore();
  }
  // Dupe badge
  if (opts.count != null && opts.count > 1) {
    if (iconOnly) {
      if (w >= 22) {
        const r = Math.max(5, Math.min(7, w * 0.22));
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.beginPath();
        ctx.arc(x + w - r - 2, y + r + 2, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffe66d";
        ctx.font = "bold " + Math.max(7, Math.floor(r * 1.35)) + "px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(opts.count), x + w - r - 2, y + r + 2.5);
        ctx.textBaseline = "alphabetic";
      }
    } else {
      const bw = Math.max(16, Math.min(22, w * 0.35));
      const bh = Math.max(12, Math.min(16, h * 0.14));
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      roundRect(x + w - bw - 4, y + 4, bw, bh, 3);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold " + Math.max(8, Math.floor(bh * 0.75)) + "px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("x" + opts.count, x + w - bw / 2 - 4, y + 4 + bh * 0.78);
    }
  } else if (!iconOnly && opts.count != null && opts.count > 0) {
    const bw = Math.max(16, Math.min(22, w * 0.35));
    const bh = Math.max(12, Math.min(16, h * 0.14));
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    roundRect(x + w - bw - 4, y + 4, bw, bh, 3);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold " + Math.max(8, Math.floor(bh * 0.75)) + "px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("x" + opts.count, x + w - bw / 2 - 4, y + 4 + bh * 0.78);
  }
}

