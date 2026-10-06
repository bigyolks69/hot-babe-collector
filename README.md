# Hot Babe Collector

**Big Salty Gaming Studio** — prototype side-scrolling platformer.

Single-file game: open `index.html` in Chrome or Safari (double-click works offline). No network or CDN required.

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

On touch devices, large on-screen buttons appear (← → jump, C gallery). Portrait and landscape both work — title screen notes you can use either. Tap title/win to start/restart; gallery supports swipe scroll and tap filters.

### Mobile / share link
Open `index.html` (or host the file) on iOS Safari / Android Chrome. Viewport is locked (no zoom); WebAudio unlocks on first tap; optional fullscreen button. Add to Home Screen friendly (`apple-mobile-web-app-capable`).

## Design notes (prototype)

- **Audio**: Music Macky `cry_death` one-shot on death (WebAudio; mute with **M** / 🔊). Beeps share a master gain.
- **Hero**: 32×48 pixel-art sprite (`art/hero/pixel/`), crisp nearest-neighbor; hitbox 18×44 (opaque inset). Idle breath / run sheet / jump / hurt / dead. Falls back to shapes if PNGs fail to load.
- **Babe pool**: **30** babes (5 with Artist Iris card art: Mika/Sora Common, Rin Rare, Kaede Epic, Yuki Legendary). Mystery A5 cardback in-level; regular cardback for missing slots. in `BABE_POOL` (append entries to grow). Shared **3:4** aspect (`CARD_ASPECT = 72/96`).
- **HUD**: bottom-right 5-slot window into the sorted 30-babe list (`Babes N/30`, icon-only 3:4); slides to focus gains/losses with a brief highlight.
- **Gallery (C)**: scrollable grid, rarity→name sort, filters All / Owned / Missing / Common / Rare / Epic / Legendary, click for detail.
- **Collectibles**: **6** babe-coins in the level (sparse). Coins **and enemies** respawn on death.
- **Coins → babes**: ~1.2s slot roll overlay (gameplay continues); queued pickups; pre-planted result (no snap).
- **Hearts**: 3 HP. Hit = knockback (~290 px/s away, vy −280) + 0.25s stun + invuln flash. Stomp from above = bounce (STOMP_V ≈ −339 / held ≈ −438; half prior apex height) + brief grace. Enemies gravity-snap to platforms and turn at ledges; respawn with coins on death.
- **Death**: gallery-style scrolled grid (rarity→name) with the lost babe crossed by a pen-stroke red X; owned count in header. Pit = full wipe + lose one babe.
- **Win**: babes gained this run (scrollable row) + totals.
- **Save**: `hbc_collection_v1` counts map; also writes `hbc_collection_v2` wrapper (v1 still loaded/migrated).

## Files

- `index.html` — the whole game
- `README.md` — this file
