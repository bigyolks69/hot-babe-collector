# Enemy sprites — Mini Oni (walker) + Mochi Slime (hopper)

Cute monster replacements for the code-drawn red walker block and green hopper blob in `index.html` (enemies draw loop).

**Do not edit `index.html` from this art pass** — this README is the integration guide for Ash.

---

## Files to load

All under `art/enemies/pixel/` (32×32 RGBA PNG, face **RIGHT**, feet on bottom row).

### Mini Oni — walker (hitbox **28×28**)

| File | Use |
|------|-----|
| `oni_idle_0.png` | Idle / slow |
| `oni_idle_1.png` | Idle bob + blink |
| `oni_walk_0.png` … `oni_walk_3.png` | Patrol waddle |
| `oni_squished.png` | After player stomp |

Extras: `oni_idle.gif`, `oni_walk.gif`, `oni_walk_sheet.png`

### Mochi Slime — hopper (hitbox **26×26**)

| File | Use |
|------|-----|
| `slime_idle_0.png` | Grounded idle |
| `slime_idle_1.png` | Idle wobble |
| `slime_squash.png` | Pre-hop crouch **and** landing squash |
| `slime_rise.png` | Rising (`vy < -50`, same stretch cue as the old blob) |
| `slime_fall.png` | Falling (`vy > 0`) |
| `slime_squished.png` | After player stomp |

Extras: `slime_idle.gif`, `slime_hop.gif`, `monsters_sheet.png` (both enemies)

Preview: `art/enemies/preview_monsters.png`  
Rebuild: `python3 art/enemies/pixel/_scripts/make_monsters.py`

---

## Anchor & draw

- Canvas is **32×32**; hitbox is **28×28** (oni) or **26×26** (slime).
- **Anchor:** sprite bottom-centre ↔ hitbox bottom-centre.
  - `drawX = e.x + e.w/2 - 16`
  - `drawY = e.y + e.h - 32`
- That centres the 32×32 art over the smaller hitbox (2 px inset each side for oni; 3 px for slime).
- **Flip** horizontally when `e.dir < 0` (sprites face RIGHT).

---

## Suggested state → frame

### Walker (oni)

```
if !alive → oni_squished (hold ~300–400 ms, then remove / skip draw)
else if abs(vx) > walk threshold → oni_walk_[floor(anim) % 4]
else → oni_idle_[floor(anim) % 2]
```

**Timings**

- Walk: 4 frames @ **~120 ms** each, scaled by `enemySpeed` if you want faster tiers to animate faster (e.g. `duration = 120 / enemySpeed` ms).
- Idle: 2 frames @ **~400 ms** each (breath + blink).
- Squished: show **~300–400 ms** on stomp (particles can fire at the same time), then despawn.

### Hopper (slime)

```
if !alive → slime_squished (~300–400 ms)
else if onGround && about to hop / just landed → slime_squash
else if vy < -50 → slime_rise          // stretch (matches old ellipse)
else if vy > 0 → slime_fall
else if onGround → slime_idle_[0|1]
else → slime_fall or slime_idle_0       // brief apex
```

**Timings**

- Idle wobble: **~350 ms** per frame while grounded between hops.
- Squash: hold briefly **before** `vy = hop impulse` and again for **1–2 frames** on landing.
- Rise while `vy < -50`; fall while `vy > 0`.
- Hop cycle reference GIF: idle → squash → rise → fall → squash (`slime_hop.gif`, 160 ms/step).

---

## Where it plugs into the game

In `index.html`, replace the procedural draw in the **enemies** loop (the `e.type === "walker"` red `roundRect` + eyes, and the green hopper `ellipse`). Keep physics / stomp / `enemyOnPlat` hitbox sizes (**28** walker, **26** hopper) unchanged.

Suggested load (once at boot):

```js
const ENEMY_IMG = {};
for (const name of [
  "oni_idle_0","oni_idle_1","oni_walk_0","oni_walk_1","oni_walk_2","oni_walk_3","oni_squished",
  "slime_idle_0","slime_idle_1","slime_squash","slime_rise","slime_fall","slime_squished",
]) {
  const img = new Image();
  img.src = "art/enemies/pixel/" + name + ".png";
  ENEMY_IMG[name] = img;
}
```

---

## .gitignore whitelist

Repo ignores `art/**` by default. To commit these sprites, add exceptions like:

```gitignore
!art/enemies/
!art/enemies/**
!art/enemies/pixel/
!art/enemies/pixel/**
!art/enemies/pixel/_scripts/
!art/enemies/pixel/_scripts/make_monsters.py
!art/enemies/README_enemies.md
!art/enemies/preview_monsters.png
```

Exact runtime paths to whitelist (PNGs + GIFs + sheet):

```
art/enemies/README_enemies.md
art/enemies/preview_monsters.png
art/enemies/pixel/oni_idle_0.png
art/enemies/pixel/oni_idle_1.png
art/enemies/pixel/oni_walk_0.png
art/enemies/pixel/oni_walk_1.png
art/enemies/pixel/oni_walk_2.png
art/enemies/pixel/oni_walk_3.png
art/enemies/pixel/oni_squished.png
art/enemies/pixel/oni_idle.gif
art/enemies/pixel/oni_walk.gif
art/enemies/pixel/oni_walk_sheet.png
art/enemies/pixel/slime_idle_0.png
art/enemies/pixel/slime_idle_1.png
art/enemies/pixel/slime_squash.png
art/enemies/pixel/slime_rise.png
art/enemies/pixel/slime_fall.png
art/enemies/pixel/slime_squished.png
art/enemies/pixel/slime_idle.gif
art/enemies/pixel/slime_hop.gif
art/enemies/pixel/monsters_sheet.png
art/enemies/pixel/_scripts/make_monsters.py
```

(Optional: also whitelist `art/enemies/pixel/options/` if you want to keep the pick sheet.)

---

## Design notes

- Same cute style as the option key frames (W3 / H1): shiny eyes, blush, `#1a1424` outline.
- Oni ~28×26 opaque; slime idle ~24×21 (room to stretch on rise).
- Squished frames ~11–13 px tall, bottom-aligned, X eyes, horns/shine still readable.
