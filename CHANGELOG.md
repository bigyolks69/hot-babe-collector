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
- **Go back to level 1 (backl1):** gallery menu button under Refresh Cache (mobile Menu + desktop C/P). Keeps all babe collection progress; sends player to level 1 start; resets level progress + play timer like a fresh run. Does **not** wipe babes. Cache `?v=backl1`.

- **Heart aura polish (heartaura1):** sky heart drop interval fixed to every **10s** (was 20–30 random). L4 Neon Overpass: ~**2 placed heart pickups** between each checkpoint (and last CP→goal) on solid ground/airwalks — not only sky drops; collect +1 when HP < max, respawn on death. Full-collection yellow SS aura draw height scaled to **70%** (30% shorter, width unchanged, feet-anchored; visual only). Cache `?v=heartaura1`.

- **Sky heart drop (heartdrop1):** when hearts < 3, every 20–30s (random) one red heart floats slowly from above the camera; collide to restore +1 (capped). Horizontal X randomized across the visible camera each spawn (plus slight Y/speed/drift variation) so it never drops from the same spot. Only one at a time; timer pauses off play (menu/win/death); cleared on level reset / checkpoint respawn. Collect SFX reuses coin beep. Cache `?v=heartdrop1`.

- **BGM clean rewrite (bgmclean1):** delete pause-on-hide / dual-path / lock spaghetti. One `HTMLAudioElement` (`loop`, `audio/bgm_main.mp3`), preload on load, `.play()` after Start/first tap. OS/browser owns backgrounding — no visibility/blur/focus/pagehide BGM handlers. Mute + simple death-cry duck kept; SFX/cry untouched. Cache `?v=bgmclean1`.

- **BGM pause when hidden (bgmpause1):** pause `HTMLAudioElement` BGM on `document.hidden` (`visibilitychange`), plus `pagehide` / `blur` for mobile app switches; resume via `.play()` only if `bgm.wanted` (never auto-start if never unlocked). Cache `?v=bgmpause1`.

- **Double Jump (all-30):** while every unique babe is owned (same live check as the SS aura — `ownedUniqueCount >= BABE_POOL.length`), Jump grants one extra mid-air hop; `airJumpsUsed` resets on land and turns off if a unique is lost. Congrats popup: "You attained Double Jump!" Cache `?v=dbljump1`.

- **BGM pure HTML (bgmfix5):** hard fail — never played even on hard refresh. Dropped WebAudio BGM entirely. `loadBgm` sync-arms `HTMLAudioElement.loop` with script-relative absolute MP3 URL; `unlockAudio`/`startBgm` call `.play()` inside the gesture. Debug: `HBC.getBgm()`. Cache `?v=bgmfix5`.

- **BGM HTML-primary (bgmfix4):** bgmfix3 waited on WebAudio decode before `ready` and dropped gesture-sync HTML `.play()` → music stayed silent when Start raced decode / autoplay blocked post-await play. Arm `HTMLAudioElement` immediately in `loadBgm`, mark ready before decode, sync `.play()` inside `unlockAudio`/`startBgm`, WebAudio only if HTML blocked. Cache `?v=bgmfix4`.

- **BGM queue until decode (bgmfix3):** Start/unlock only sets `wanted` + resumes context; no start/HTML play before buffer exists (avoids hang). `loadBgm` → `onBgmDecodeComplete` starts if wanted. `startBgm` no-ops until `bgm.ready`. Global unlock kept. Cache `?v=bgmfix3`.

- **BGM global unlock (bgmfix2):** hung `bgmStartLock` when iOS left `actx.resume()` pending outside a gesture (common when Start→L4 before decode finished) blocked every later unlock. Timed resume, abandon stale lock, sync resume+HTML `.play()` inside gesture, HTML twin fallback, `ensureAudio` nudges silent BGM. Works on every refresh/level after first tap/key. Cache `?v=bgmfix2`.

- **BGM silent again (mobile/strict autoplay):** `fetchDecode` awaited `ensureAudio()`→`resume()` during preload; under autoplay that resume can hang forever so the buffer never loads (`wanted=true`, `starts=0`). Decode via `OfflineAudioContext` (no playback resume); add `touchstart` unlock; `startLevel` retries `startBgm`. Play timer unchanged. Cache `?v=bgmfix1`.

- **Play timer:** cumulative MM:SS while in active play (pauses in Menu / win / death / overlays). HUD top-left under hearts; also on babe gallery + level-complete panel. Resets on title start and play-again from L1 after beating the game — not on level continue, R-replay mid-run, or checkpoint respawn. Cache `?v=playtimer1`.

- **L4 polish (variation + look + babes on cracks):** mix 1/2/3 short cracked planks per gap (hop gaps when multiple); thin cracked dark underside ~1/4 (24px→6px visual, collision unchanged); bias L4 babe pickups onto breakable tops (jump-on then jump-up). Cache `?v=l4var1`.

- **L4 reach polish:** lower solid+cracked airwalks to 0-collection jump reach (max ~2.73 tiles / y≥13 from ground); cracked lengths ≤50% with 2+ short segments + small hop gaps on long pits; no gap-adjacent blue safety pads. Cache `?v=l4reach1`.

- **L4 cliff gaps:** remove blue safety airwalks beside cracked spans; widen those pits ~1.5×; brief foot contact arms crack (timer keeps running after dash-off). Cache `?v=l4cliff2`.

- **L4 Neon Overpass redesign:** many more built-in cliffs/pits; solid elevated airwalks; cracked airwalks mostly over voids (break → pit death). Ghost leftover after crack fixed (`fallT` never advanced → non-collidable ledge stayed drawn). Debris burst on break; fallen plats stop drawing immediately. Restore-on-death unchanged. Cache `?v=l4cliff1`.

- **Mobile BGM silent until refresh:** await `AudioContext.resume()` before starting BGM; restart if wanted but not audibly playing (stale `bgm.src` / suspended ctx / html paused). Cache `?v=bgm1`.

- **Aura rename + Refresh Cache:** frames renamed to `art/vfx/aura/aura_ss_0.png`…`aura_ss_5.png` (`?v=ss1`) to break sticky iOS/Pages cache of punched `aura_fire_*`; Refresh Cache clears Cache API then `location.replace` with unique `?_=`.
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
