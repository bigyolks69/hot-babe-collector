# Hot Babe Collector

**Big Salty Gaming Studio** — prototype side-scrolling platformer.

Open `index.html` in Chrome or Safari (double-click / `file://` works offline), or use GitHub Pages: https://saltybro333.github.io/hot-babe-collector/

No build step or CDN. Scripts load as classic globals (see `CHANGELOG.md` for layout). Edit the relevant `js/*.js` file — not one mega HTML.

## Controls

| Action | Keys |
|--------|------|
| Move | ← → or A D |
| Jump | Space / W / ↑ (hold for higher jump) |
| Babe gallery | C (Esc closes; Esc also closes detail) |
| Gallery filters | 1–7 or click tabs |
| Gallery scroll | Mouse wheel / arrows / on-screen ▲▼ |
| Start | Enter / Space on title |
| Restart (after win) | R or Enter |
| Reset collection | Gallery **Reset collection** button (confirm popup) |

On touch devices, large on-screen buttons appear (← → Jump, Collection). Portrait and landscape both work — title screen notes you can use either. Tap title/win to start/restart; gallery supports swipe scroll and tap filters.

### Mobile / share link
Open `index.html` (or host the file) on iOS Safari / Android Chrome. Viewport is locked (no zoom); WebAudio unlocks on first tap; optional fullscreen button. Add to Home Screen friendly (`apple-mobile-web-app-capable`).

## Design notes (prototype)

- **Audio**: Music Macky `cry_death` one-shot on death (WebAudio; mute with **M** / 🔊). Beeps share a master gain.
- **Hero**: 32×48 pixel-art sprite (`art/hero/pixel/`), crisp nearest-neighbor; hitbox 18×44 (opaque inset). Idle breath / run sheet / jump / hurt / dead. Falls back to shapes if PNGs fail to load.
- **Babe pool**: **30** placeholders — **22 Common / 6 Rare / 2 Ultra Rare**. Pull: 88% / 10% / 2% tier then uniform. Same Iris cardback for all tiers; Rare/Ultra get glow borders until fronts arrive. in `BABE_POOL` (append entries to grow). Shared **3:4** aspect (`CARD_ASPECT = 72/96`).
- **HUD**: bottom-right 5-slot window into the sorted 30-babe list (`Babes N/30`, icon-only 3:4); slides to focus gains/losses with a brief highlight.
- **Gallery (C)**: scrollable grid, rarity→name sort, filters All / Owned / Missing / Common / Rare / Epic / Legendary, click for detail.
- **Collectibles**: **6** babe-coins in the level (sparse). Coins **and enemies** respawn on death.
- **Coins → babes**: ~1.2s slot roll overlay (gameplay continues); queued pickups; pre-planted result (no snap).
- **Hearts**: 3 HP. Hit = knockback (~290 px/s away, vy −280) + 0.25s stun + invuln flash. Stomp from above = bounce (STOMP_V ≈ −339 / held ≈ −438; half prior apex height) + brief grace. Enemies gravity-snap to platforms and turn at ledges; respawn with coins on death.
- **Flyer (Level 2 only) — art is FINAL**: the 13×10 pixel bat-drone drawn in code (`FLYER_FRAMES` + `drawFlyer` in `js/game.js` / related draw helpers, violet body / cyan eyes, 2-frame flap, red eyes + shake during the swoop warning) is the approved final look, not a placeholder. Do not replace or restyle it, and do not add any drop/ground shadow or ellipse under it (removed on purpose).
- **Death**: gallery-style scrolled grid (rarity→name) with the lost babe crossed by a pen-stroke red X; owned count in header. Pit = full wipe + lose one babe.
- **Win**: babes gained this run (scrollable row) + totals.
- **Save**: `hbc_collection_v1` counts map; also writes `hbc_collection_v2` wrapper (v1 still loaded/migrated).
- **Level 3 — Gacha Machine Demon**: neon rooftop run-in then arena lock. Boss HP 3 (stomp the crank). Attacks: pity beam (low = jump / high = stay down), coin spit, Mini Oni / Mochi Slime minions. After each crank hit the boss is stunned ~1.15s (cyan/white, no contact damage) before the next attack. Reward roll is Rare-or-better (10:2 rare:ultra).
- **All-30 aura + Double Jump**: when every babe is owned (live unique count), a looping yellow Super Saiyan aura draws behind the hero (`art/vfx/aura/aura_ss_0..5.png`, 56×80 @ ~110 ms) and Jump grants one extra mid-air hop. Losing a unique on death turns both off until the set is complete again. Congrats popup announces Double Jump.
- **Collection reset**: open the gallery (**C**) → **Reset collection** → confirm (Reset / Cancel). Clears babe counts, tray, and complete flag; keeps level progress and mute.

## Files

- `index.html` — shell (canvas + script tags)
- `css/game.css` — styles
- `js/` — game modules (boot, audio, babes, input, cards, level registry, game, boss, update, ui, main)
- `js/levels/` — per-level data (`common.js`, `level1.js`…`level6.js`)
- `art/`, `audio/` — assets
- `CHANGELOG.md` — how to run, recent changes, workflow notes
- `README.md` — this file
