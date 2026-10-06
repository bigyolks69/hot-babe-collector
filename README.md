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

On touch devices, on-screen buttons appear (← → jump C).

## Design notes (prototype)

- **Babe pool**: **30** data-driven placeholders in `BABE_POOL` (append entries to grow). Shared **3:4** aspect (`CARD_ASPECT = 72/96`).
- **HUD**: bottom-right live tray — `Babes N/30` plus the last **4** pickup thumbs (icon-only, 3:4).
- **Gallery (C)**: scrollable grid, rarity→name sort, filters All / Owned / Missing / Common / Rare / Epic / Legendary, click for detail.
- **Collectibles**: **6** babe-coins in the level (sparse). Respawns on death.
- **Coins → babes**: ~1.2s slot roll overlay (gameplay continues); queued pickups; pre-planted result (no snap).
- **Hearts**: 3 HP. Hit = knockback (~290 px/s away, vy −280) + 0.25s stun + invuln flash. Stomp from above.
- **Death**: shows the **lost babe** with a fast pen-stroke red X + owned count (not the full grid). Pit = full wipe + lose one babe.
- **Win**: babes gained this run (scrollable row) + totals.
- **Save**: `hbc_collection_v1` counts map; also writes `hbc_collection_v2` wrapper (v1 still loaded/migrated).

## Files

- `index.html` — the whole game
- `README.md` — this file
