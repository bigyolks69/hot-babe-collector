# Hot Babe Collector

**Big Salty Gaming Studio** — prototype side-scrolling platformer.

Single-file game: open `index.html` in Chrome or Safari (double-click works offline). No network or CDN required.

## Controls

| Action | Keys |
|--------|------|
| Move | ← → or A D |
| Jump | Space / W / ↑ (hold for higher jump) |
| Collection gallery | C (or Esc to close) |
| Start | Enter / Space on title |
| Restart (after win) | R or Enter |

On touch devices, on-screen buttons appear (← → jump C).

## Design notes (prototype)

- **Coins → cards**: touching a coin runs a ~1.2s slot/lottery roll panel at the top as an **overlay** — gameplay does **not** pause (move, jump, enemies, physics, camera all keep going). Extra coins touched during a roll are **queued** (queue count shown). The strip eases onto a **pre-planted** result card (no end snap). Short reveal (~0.275s) then `NEW!` / `DUPE` callout (~0.4s). Hits during a roll work normally; if you die mid-roll, the roll (and queue) still finish and grant cards; the lost card is picked from cards you already owned.
- **Hearts**: 3 HP. Monster contact = −1 heart, knockback + invulnerability flash. Stomp from above to defeat enemies.
- **Hearts → 0**: lose one random collected card (`LOST: <name>`), hearts reset to 3, respawn at last checkpoint. **All level coins/cards respawn** on that respawn.
- **Pits / cliffs**: falling off the level is a **single full wipe** — all 3 hearts are lost at once, one random owned card is taken (`LOST: <name>`), hearts reset to 3, coins respawn, checkpoint respawn (no multi-hit glitch).
- **Save**: collection is stored in `localStorage` key `hbc_collection_v1`.
- **Placeholder art only**: procedurally drawn gradient cards with silhouettes and generated names — no photos, nothing explicit.

## Files

- `index.html` — the whole game
- `README.md` — this file
