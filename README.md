# Hot Babe Collector

**Big Salty Gaming Studio** — prototype side-scrolling platformer.

Single-file game: open `index.html` in Chrome or Safari (double-click works offline). No network or CDN required.

## Controls

| Action | Keys |
|--------|------|
| Move | ← → or A D |
| Jump | Space / W / ↑ (hold for higher jump) |
| Babe gallery | C (or Esc to close) |
| Start | Enter / Space on title |
| Restart (after win) | R or Enter |

On touch devices, on-screen buttons appear (← → jump C).

## Design notes (prototype)

- **HUD**: tiny live **Babes** tray (bottom-right) during gameplay — all 12 slots, 3:4 thumbs, updates live.
- **Babe art**: all babes use a shared **3:4** aspect (`CARD_ASPECT = 72/96`); views scale uniformly (no squash).
- **Collectibles**: **6** babe-coins in the level (sparse: start, optional highs, pit, end). Respawns on death.
- **Coins → babes**: touching a coin runs a ~1.2s slot/lottery roll panel at the top as an **overlay** — gameplay does **not** pause (move, jump, enemies, physics, camera all keep going). Extra coins touched during a roll are **queued** (queue count shown). The strip eases onto a **pre-planted** result babe (no end snap). Short reveal (~0.275s) then `NEW!` / `DUPE` callout (~0.4s). Hits during a roll work normally; if you die mid-roll, the roll (and queue) still finish and grant babes; the lost babe is picked from babes you already owned.
- **Hearts**: 3 HP. Monster contact = −1 heart, knockback + invulnerability flash. Stomp from above to defeat enemies.
- **Death / win UI**: compact mini collection panel (owned thumbs + dupe counts, greyed missing, owned/total). On death the lost babe is highlighted/fades out.
- **Hearts → 0**: lose one random collected babe (`LOST: <name>`), hearts reset to 3, respawn at last checkpoint. **All level coins/babes respawn** on that respawn.
- **Pits / cliffs**: falling off the level is a **single full wipe** — all 3 hearts are lost at once, one random owned babe is taken (`LOST: <name>`), hearts reset to 3, coins respawn, checkpoint respawn (no multi-hit glitch).
- **Save**: collection is stored in `localStorage` key `hbc_collection_v1`.
- **Placeholder art only**: procedurally drawn gradient babes with silhouettes and generated names — no photos, nothing explicit.

## Files

- `index.html` — the whole game
- `README.md` — this file
