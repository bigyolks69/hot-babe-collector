// Hot Babe Collector — input.js
// ---------- Input ----------
const keys = Object.create(null);
const justPressed = Object.create(null);
window.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if (["arrowup","arrowdown","arrowleft","arrowright"," ","w","a","s","d","c","r","m","p","escape","enter"].includes(k) || e.code === "Space") {
    e.preventDefault();
  }
  const code = e.code === "Space" ? " " : k;
  if (!keys[code]) justPressed[code] = true;
  keys[code] = true;
  ensureAudio();
});
window.addEventListener("keyup", e => {
  const code = e.code === "Space" ? " " : e.key.toLowerCase();
  keys[code] = false;
});
window.addEventListener("wheel", e => {
  if (state !== "collection") return;
  e.preventDefault();
  gallery.scroll += e.deltaY;
}, { passive: false });
// ---------- Mobile / pointer helpers ----------
const isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
// Desktop: pin the mute button to the canvas, just left of the top-right
// babes/pulls box (game coords), so it never covers HUD text. Touch keeps CSS layout.
let hudBoxX = 960 - 12 - 158; // updated by drawHUD (box grows to fit its hint)
function positionMuteBtn() {
  if (isTouch) return;
  const btn = document.getElementById("muteBtn");
  const cv = document.getElementById("game");
  if (!btn || !cv) return;
  const r = Math.min(window.innerWidth / cv.width, window.innerHeight / cv.height);
  const cssW = Math.floor(cv.width * r), cssH = Math.floor(cv.height * r);
  const offX = (window.innerWidth - cssW) / 2, offY = (window.innerHeight - cssH) / 2;
  const size = Math.round(Math.max(28, Math.min(40, 36 * r)));
  btn.style.width = btn.style.height = size + "px";
  btn.style.fontSize = Math.round(size * 0.45) + "px";
  btn.style.right = "auto";
  btn.style.left = Math.round(offX + (hudBoxX - 8) * r - size) + "px";
  btn.style.top = Math.round(offY + Math.max(2, (8 + 18) * r - size / 2)) + "px";
}
const touchEl = document.getElementById("touch");
const fsBtn = document.getElementById("fsBtn");
let gallerySwipeY0 = null;
let gallerySwipeScroll0 = 0;

function canvasCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (W / Math.max(1, rect.width)),
    y: (clientY - rect.top) * (H / Math.max(1, rect.height)),
  };
}

// Start (or restart) a level from its first checkpoint and remember it as the current level
function startLevel(n, opts) {
  loadLevel(n);
  progress.level = levelNum;
  saveProgress(progress);
  resetLevel(true);
  // newRun: title start / play-again from L1 after beating the game
  if (opts && opts.newRun) resetPlayTimer();
  state = "play";
  // Start / restart BGM if silent (first Start is a user gesture; unlock may have raced decode)
  try { startBgm(); } catch (_) {}
}
// Win panel primary action: Level 1 → continue to Level 2; last level → back to Level 1
function winContinue() {
  if (winStats && !winStats.final) startLevel(levelNum + 1); // keep cumulative timer
  else startLevel(1, { newRun: true });
}

function handleCanvasTap(sx, sy) {
  ensureAudio();
  if (resetConfirm) return; // Reset/Cancel handled by the capture listener
  if (congrats) return; // only its Continue button closes it (handled in the pointerdown listener)
  if (performance.now() - congratsClosedAt < 300) return; // the dismissing tap does nothing else
  if (tryTrayOpenCollection(sx, sy)) return;
  if (state === "title") {
    if (!heroSprites.ready && !heroSprites.failed) return;
    startLevel(progress.level, { newRun: true });
    return;
  }
  if (state === "win") {
    winContinue();
    return;
  }
  if (state === "collection") {
    handleGalleryClick(sx, sy);
  }
}

// Celebration popup: only a click/tap on its Continue button closes it. While it's up (and for a
// moment after), taps elsewhere — canvas, on-screen ← → Jump, Collection — are swallowed so they
// can't act behind it. The mute button keeps working.
function congratsHit(clientX, clientY) {
  const { x, y } = canvasCoords(clientX, clientY);
  const b = congratsLayout().btn, pad = 10;
  return x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad;
}
function congratsBlocks(e) {
  const t = e.target;
  return (congrats || performance.now() - congratsClosedAt < 300) && !(t && t.closest && t.closest("#muteBtn"));
}
function resetHit(clientX, clientY) {
  if (!resetConfirm) return null;
  const { x, y } = canvasCoords(clientX, clientY);
  const L = resetConfirmLayout();
  const hit = (b) => x >= b.x - 8 && x <= b.x + b.w + 8 && y >= b.y - 8 && y <= b.y + b.h + 8;
  if (hit(L.resetBtn)) return "reset";
  if (hit(L.cancelBtn)) return "cancel";
  return null;
}
function overlayBlocks(e) {
  const t = e.target;
  if (t && t.closest && t.closest("#muteBtn")) return false;
  return !!(resetConfirm || congrats || performance.now() - congratsClosedAt < 300);
}
window.addEventListener("pointerdown", e => {
  if (!overlayBlocks(e)) return;
  if (resetConfirm) {
    const which = resetHit(e.clientX, e.clientY);
    if (which === "reset") confirmResetCollection();
    else if (which === "cancel") cancelResetConfirm();
    e.stopPropagation();
    return;
  }
  if (congrats && congratsHit(e.clientX, e.clientY)) dismissCongrats();
  e.stopPropagation();
}, true);
["touchstart", "mousedown"].forEach(ev => window.addEventListener(ev, e => {
  if (!overlayBlocks(e)) return;
  e.stopPropagation();
  if (ev === "touchstart" && e.cancelable) e.preventDefault();
}, { capture: true, passive: false }));

canvas.addEventListener("mousedown", e => {
  if (e.button !== 0) return;
  const { x, y } = canvasCoords(e.clientX, e.clientY);
  if (state === "collection") handleGalleryClick(x, y);
  else if (tryTrayOpenCollection(x, y)) { ensureAudio(); }
  else if (state === "title" || state === "win") handleCanvasTap(x, y);
});

canvas.addEventListener("touchstart", e => {
  if (!e.changedTouches.length) return;
  e.preventDefault();
  ensureAudio();
  const touch = e.changedTouches[0];
  const { x, y } = canvasCoords(touch.clientX, touch.clientY);
  if (state === "collection") {
    gallerySwipeY0 = touch.clientY;
    gallerySwipeScroll0 = gallery.scroll;
    // defer click to touchend unless swipe
    canvas._tapX = x; canvas._tapY = y; canvas._didSwipe = false;
  } else {
    handleCanvasTap(x, y);
  }
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  if (state !== "collection" || gallerySwipeY0 == null) return;
  e.preventDefault();
  const touch = e.changedTouches[0] || e.touches[0];
  if (!touch) return;
  const dy = gallerySwipeY0 - touch.clientY; // finger up → content up
  if (Math.abs(dy) > 8) canvas._didSwipe = true;
  gallery.scroll = gallerySwipeScroll0 + dy * (H / Math.max(1, canvas.getBoundingClientRect().height));
}, { passive: false });

canvas.addEventListener("touchend", e => {
  if (state === "collection") {
    e.preventDefault();
    if (!canvas._didSwipe && canvas._tapX != null) {
      handleGalleryClick(canvas._tapX, canvas._tapY);
    }
    gallerySwipeY0 = null;
    canvas._tapX = canvas._tapY = null;
    canvas._didSwipe = false;
  }
}, { passive: false });

// Block page scroll / bounce / zoom gestures
["gesturestart", "gesturechange", "gestureend"].forEach(ev => {
  document.addEventListener(ev, e => e.preventDefault(), { passive: false });
});
document.addEventListener("touchmove", e => {
  if (e.target === canvas || (e.target && e.target.classList && e.target.classList.contains("tbtn"))) return;
  e.preventDefault();
}, { passive: false });

if (isTouch) {
  touchEl.classList.add("show");
  fsBtn.classList.add("show");
}
function bindTouch(id, key) {
  const el = document.getElementById(id);
  const down = e => {
    e.preventDefault();
    e.stopPropagation();
    keys[key] = true;
    justPressed[key] = true;
    el.classList.add("active");
    ensureAudio();
  };
  const up = e => {
    e.preventDefault();
    keys[key] = false;
    el.classList.remove("active");
  };
  el.addEventListener("touchstart", down, { passive: false });
  el.addEventListener("touchend", up, { passive: false });
  el.addEventListener("touchcancel", up, { passive: false });
  el.addEventListener("mousedown", down);
  el.addEventListener("mouseup", up);
  el.addEventListener("mouseleave", up);
  el.addEventListener("contextmenu", e => e.preventDefault());
}
bindTouch("tLeft", "a");
bindTouch("tRight", "d");
bindTouch("tJump", " ");
bindTouch("tColl", "c");

fsBtn.addEventListener("click", e => {
  e.preventDefault();
  ensureAudio();
  const root = document.documentElement;
  if (!document.fullscreenElement && root.requestFullscreen) root.requestFullscreen().catch(() => {});
  else if (document.exitFullscreen) document.exitFullscreen();
});
const muteBtn = document.getElementById("muteBtn");
setMuted(muted); // sync icon
muteBtn.addEventListener("click", e => {
  e.preventDefault();
  ensureAudio();
  setMuted(!muted);
});
muteBtn.addEventListener("touchstart", e => {
  e.preventDefault();
  ensureAudio();
  setMuted(!muted);
}, { passive: false });
window.addEventListener("orientationchange", () => {
  setTimeout(() => fit(), 200);
});

