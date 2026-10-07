# Changelog — Hot Babe Collector

## How to run

- **Live (GitHub Pages):** https://bigyolks69.github.io/hot-babe-collector/
- **Local:** open `index.html` in Chrome/Safari (double-click / `file://` works), or `python3 -m http.server` from this folder and visit `http://localhost:8000/`

No build step. Classic `<script>` tags (not ES modules) so offline `file://` keeps working.

## Source layout (Oct 2026)

| Path | Role |
|------|------|
| `index.html` | Shell: canvas, touch/mute buttons, CSS + script tags |
| `css/game.css` | Layout / touch UI styles |
| `js/boot.js` | Canvas, hero sprites, all-30 aura |
| `js/audio.js` | BGM, SFX, mute |
| `js/babes.js` | `BABE_POOL`, pull odds, max-6, localStorage |
| `js/input.js` | Keyboard + touch |
| `js/cards.js` | Card draw / slot roll / reveal |
| `js/level.js` | Levels, platforms, checkpoints, enemy spawn |
| `js/game.js` | Shared game state, player, enemies helpers |
| `js/boss.js` | Level 3 Gacha Machine Demon |
| `js/update.js` | Per-frame gameplay update |
| `js/ui.js` | HUD, gallery, tray, congrats, reset overlays |
| `js/main.js` | Game loop + draw orchestration |

Script load order (do not reorder): boot → audio → babes → input → cards → level → game → boss → update → ui → main.

## Recent changes
- **SS aura solid fill:** solid yellow interior (no punch); closes gap above hair (`?v=aura5`).
- **Mobile Menu + Refresh Cache:** touch `#tColl` label is **Menu** (desktop keeps Collection / C). Gallery panel adds **Refresh Cache** under Reset (hard reload via `?_=` timestamp). Desktop **P** opens the same gallery (not a collection reset).
- **Aura PNG cache-bust:** `?v=aura3` on aura frames + boot.js so the yellow-interior-fill refresh shows after hard-refresh (no new art).

- **L5 mini-boss camera:** vertical follow may go above y=0 and frames the demon body + jump arc under the HUD (boss was at y≈−99, mostly off-screen).
- **L6 left demon spacing:** left spawn inset `56` → `BOSS_EDGE_PAD` (220), matching right-side breathing room for crank jumps.

- **Checkpoints:** horizontal levels use start + 1/3 + 2/3 only (no per-section flag spam).
- **Levels 4–6:** Neon Overpass (cracked plats, denser/faster foes, flyers), Capsule Yard (vertical climb + 2 HP mini demon), Dual Demon Arena (two 3 HP demons, Rare+ when both down). HUD `LEVEL x / 6`.
- **Cracked platforms:** stand ~0.6s → shake → fall; restore on death/respawn. Required path stays mostly solid.
- **Level files split:** `js/level.js` registry + `js/levels/common.js` / `level1.js`…`level6.js` (edit one level without opening the mega file).
- **Buff toast timing:** fully visible **3.5s** (plus 0.2s in / 0.35s out).
- **Buff toast percents:** shows total stack bonus, e.g. `(14% faster, 10% higher jump)` at 2 stacks.
- **Cache-bust:** `index.html` script/css URLs use `?v=` so browsers pick up toast (not old Continue popup).
- **Collection buff:** every **5 unique** babes (5/10/15/20/25/30) stacks +**7%** move / +**5%** jump height (soft cap 6 → 1.42× / 1.30×). Live unique count. Threshold notice is a **non-blocking top toast** (~2.4s fade), not a pause overlay.
- **Boss mobile clear:** boss inset **220px** from arena right so iPhone 13 portrait/landscape tray + jump no longer cover the cabinet.
- **Boss arena sidewalks:** one mid ledge only (`P(12,13,3)`); extras removed. Ranged attacks already cover full arena (beam strip / coin aim) — no range change.
- **Boss failsafe (L3):** yellow/vulnerable always after **12s** in a minion wave (minion-clear still early-paths). Clears leftover minions on yellow so a vanished minion cannot softlock.
- **Boss arena layout:** boss flush to arena/screen **right**; mid-arena sidewalk trail (`P(5/10/15/20,13,3)`, 2-tile gaps); near-crank ledge not flush (gap before cabinet).

- **Modular split** — giant `index.html` → CSS + JS modules above. **No gameplay changes.**
- **Levels 1–3** — side-scroll platforms; L2 flyer (final art); L3 neon rooftop + Gacha Machine Demon (crank stomps, pity beam, coin spit, minions, Rare+ reward).
- **All-30 aura** — Super Saiyan fire loop behind hero when every babe is owned (`art/vfx/aura/`, `?v=2`).
- **Tray** — bottom-right 5-slot window; click opens Collection.
- **Collection reset** — gallery-only **Reset collection** + confirm (not mid-run P).
- **Jackie QA** — one-way ledges, boss defeat burst, ledges/crank, minions required, L1 spawn, quieter cry logs.
- **Congrats** — group pic when collection completes.
- **Roster** — 30 babes (22C / 6R / 2UR); saves `hbc_collection_v1` / `v2`.

## Known issues

- Browser autoplay may keep BGM silent until first key/tap (then WebAudio unlocks).
- Some older `shot-*.png` QA captures live in the repo root; ignore for play.

## Workflow (for agents / Jackie)

- No auto-screenshots unless verifying a real regression.
- Push less often (batch related fixes).
- Don’t auto-ping Jackie on every push.
