# Super Saiyan Aura VFX — Hot Babe Collector

Unlock reward for collecting **all 30 cards**. Tall vertical **yellow / gold** Super Saiyan–style energy field (jagged upward spikes, **solid yellow/gold interior** — no hero punch-out / cutout / black hole, foot V-notch, crackling white/lilac lightning). Drawn **behind** the hero; the PNG itself is fully filled yellow inside the jagged SS shape — hero is composited **on top** in-game.

Replaces the older circular orange fire-ring look.

## Files

| File | Notes |
|------|-------|
| `aura_ss_0.png` … `aura_ss_5.png` | 6 looping frames, **56×80** RGBA |
| `aura_fire.gif` | Looping preview (~110 ms/frame) |
| `aura_fire_sheet.png` | Horizontal strip of all 6 frames |
| `preview_aura_with_hero.png` | Scaled composite (aura + `hero_idle.png` on top) |
| `_scripts/make_aura.py` | Rebuild script (Pillow hand-pixel, no AI) |

Runtime frames are `aura_ss_0.png` … `aura_ss_5.png` (renamed from `aura_fire_*` to break sticky mobile/CDN cache). Preview gif/sheet may still use `aura_fire_*` names.

## Unlock

Only enable when the player has **all 30 cards** collected. Do not show otherwise.

## Draw order / anchor

Draw the aura **behind** the hero each frame.

Anchor: **aura bottom-center ↔ hero bottom-center**

Hero is **32×48**. Aura canvas is **56×80**. Hero top-left on the aura canvas is `(12, 24)`.

```
drawX = hero.x + hero.w / 2 - 28   // 56 / 2 = 28
drawY = hero.y + hero.h - 80            // 48 - 80 = -32
```

Equivalently: `auraX = hero.x - 12`, `auraY = hero.y - 24`.

> **Ash:** update any prior 48×64 anchor math (`- 24` / `- 64` / offset `(8,8)`) to the values above.

## Animation

- Loop frames `0 → 5 → 0…`
- Suggested timing: **110 ms** per frame (range 100–120 ms is fine)
- Spikes flicker and lightning bolts phase on/off across frames
- If the hero flips horizontally, flipping the aura keeps side bolts consistent

## Style notes

- Outline color `#1a1424` (same as hero / enemies)
- Entire silhouette interior is **solid mid yellow/gold** — **no** hero punch-out / cutout / black hole in the PNG. Draw aura **behind** the hero (hero on top)
- Chunky hand-pixel **yellow/gold** energy (not an orange-red ring): deep gold outer → bright rim → mid fill interior; near-white highlights on spikes; sparse tip orange only
- Tall crown spikes above the head; serrated upward / outward edges; **V-notch / split at the feet**
- White / light-lilac zig-zag lightning (SS2-style) on the sides; sparse diagonal spark dashes

## Rebuild

```bash
cd art/vfx/aura/_scripts
python3 make_aura.py
```

## Out of scope (this art pass)

Do **not** edit `index.html` from this pass — art assets only. Developer Ash wires unlock + draw (and the new 56×80 anchor).
