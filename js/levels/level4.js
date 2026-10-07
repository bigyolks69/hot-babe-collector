// Hot Babe Collector — Level 4 Neon Overpass (cliffs + cracked airwalks over pits)
// Design: ground islands with many pits; solid elevated airwalks; cracked airwalks
// often sit over empty air so a break means pit death, not a soft floor landing.
// No blue safety ledges beside cracked spans — brief foot contact arms the crack.
// 0-collection jump ≈2.73 tiles (87px); from ground (y=15) airwalk tops at y≥13.
registerSections({
  // Intro pad → first pit under cracked span → solid air on far island only
  neonStart: { w: 46, plats: [
      G(0, 7), G(16, 5), G(30, 16),
      // gaps ~9 tiles; cracked lowered to y=13, halved + split (was w=7 @ y=11–12)
      PC(8, 13, 3), PC(12, 13, 3),
      PC(22, 13, 3), PC(26, 13, 3),
      P(32, 13, 4), P(38, 12, 3) ],
    picks: [[33, 11], [39, 10]], enemies: [
      WK(3, 15, 0, 7, 75), WK(18, 15, 16, 21, 80), HP(34, 13, 32, 36, 40, 1, 0.2), WK(36, 15, 30, 45, 80, 2) ],
    cps: [2], cuts: [] },

  // Island hop with cracked bridges over ~1.5× wider pits; no blue beside cracked
  cliffRun: { w: 56, plats: [
      G(0, 5), G(13, 4), G(25, 5), G(38, 4), G(50, 6),
      // gaps ~8 tiles; was PC w=6 @ y=11–12 → ≤3 each, split pair @ y=13
      PC(6, 13, 3), PC(10, 13, 3),
      PC(18, 13, 3), PC(22, 13, 3),
      PC(31, 13, 3), PC(35, 13, 3),
      PC(43, 13, 3), PC(47, 13, 3),
      P(52, 13, 3) ],
    picks: [[14, 13], [39, 13]], enemies: [
      WK(1, 15, 0, 5, 70), WK(14, 15, 13, 17, 80), WK(27, 15, 25, 30, 85),
      WK(40, 15, 38, 42, 80, 2), HP(53, 13, 52, 55, 40, 1, 0.3) ],
    cps: [2], cuts: [] },

  // Cracked dash: thin islands, cracked over mid pits — no adjacent blue safety
  crackDash: { w: 54, plats: [
      G(0, 5), G(14, 4), G(27, 5), G(40, 4), G(50, 4),
      // was w=7/7/6/5 @ y=11–12 → ≤3/3/3/2, split @ y=13
      PC(6, 13, 3), PC(10, 13, 3),
      PC(19, 13, 3), PC(23, 13, 3),
      PC(33, 13, 3), PC(37, 13, 3),
      PC(45, 13, 2), PC(48, 13, 2),
      P(51, 13, 2) ],
    picks: [[15, 13], [28, 13]], enemies: [
      WK(1, 15, 0, 5, 75), WK(15, 15, 14, 18, 85), WK(29, 15, 27, 32, 90),
      HP(41, 15, 40, 44, 45, 2, 0.4), WK(42, 15, 40, 44, 80, 2) ],
    cps: [2], cuts: [] },

  // Long cracked span over a wide pit — commit on crack, or take high solid side path
  crackSpan: { w: 48, plats: [
      G(0, 6), G(22, 5), G(38, 10),
      // cracked commit: was w=8 @ y=12 + w=6 @ y=12 → ≤4/≤3, multi-split @ y=13
      PC(7, 13, 3), PC(11, 13, 3), PC(15, 13, 3), PC(19, 13, 2),
      PC(28, 13, 3), PC(32, 13, 3), PC(36, 13, 2),
      // high solid alternate (2-tile steps from ground; not beside cracked)
      P(2, 13, 3), P(5, 11, 3), P(9, 9, 3), P(13, 9, 3), P(17, 11, 3),
      P(40, 13, 3), P(44, 12, 3) ],
    picks: [[3, 11], [41, 11]], enemies: [
      WK(2, 15, 0, 6, 80), WK(24, 15, 22, 27, 90), WK(40, 15, 38, 48, 95),
      HP(10, 9, 9, 12, 40, 1, 0.3) ],
    cps: [2], cuts: [] },

  // High neon road — solid mid airwalks are the required route; cracked = shortcuts
  neonHigh: { w: 46, plats: [
      G(0, 5), G(16, 4), G(32, 5), G(40, 6),
      // solids lowered into 0-coll reach; cracked halved (was w=5) + split @ y=13
      P(3, 13, 3), PC(7, 13, 2), PC(10, 13, 2), P(14, 12, 3), P(18, 12, 4),
      PC(23, 13, 2), PC(26, 13, 2), P(30, 12, 3), PC(34, 13, 2), PC(37, 13, 2), P(41, 13, 3) ],
    picks: [[19, 10], [42, 11]], enemies: [
      WK(1, 15, 0, 5, 80), WK(18, 15, 16, 20, 90), WK(34, 15, 32, 37, 95, 2),
      HP(19, 12, 18, 22, 40, 1, 0.5) ],
    cuts: [] },

  // Pillar columns with wider pits; cracked floats over the gaps
  neonGauntlet: { w: 50, plats: [
      G(0, 4), G(12, 3), G(24, 3), G(36, 3), G(46, 4),
      // COL tops were y=12 (unreachable from ground) → 13; cracked halved + split
      COL(6, 13, 2), COL(17, 13, 2), COL(29, 13, 2), COL(41, 13, 2),
      PC(8, 13, 2), PC(10, 13, 2), P(20, 13, 3), PC(32, 13, 2), PC(34, 13, 2), P(44, 13, 3) ],
    picks: [[9, 11], [21, 11], [42, 11]], enemies: [
      WK(1, 15, 0, 4, 80), WK(13, 15, 12, 15, 90), WK(25, 15, 24, 27, 95),
      WK(37, 15, 36, 39, 90, 2), HP(21, 13, 20, 23, 45, 2, 0.5) ],
    cps: [2], cuts: [] },

  // Mixed: solid mid airwalk chain over a long pit trench (meaningful route kept)
  overpass: { w: 40, plats: [
      G(0, 5), G(32, 8),
      // chain flattened into ≤2-tile rises; cracked halved (was w=4/3)
      P(5, 13, 3), P(9, 12, 3), P(13, 12, 4), PC(18, 13, 2), P(24, 13, 3),
      PC(15, 13, 2), P(34, 13, 4) ],
    picks: [[14, 10], [35, 11]], enemies: [
      WK(1, 15, 0, 5, 75), WK(34, 15, 32, 40, 90), HP(14, 12, 13, 17, 40, 1, 0.4),
      WK(10, 12, 9, 12, 50, 2) ],
    cps: [2], cuts: [] },

  // Zigzag air over wider pit islands — cracked over gaps, solid only on islands
  neonZig: { w: 40, plats: [
      G(0, 4), G(14, 3), G(26, 3), G(34, 4),
      // was PC w=6/5 @ y=12–13 → ≤3/≤2 split; island solids lowered to y=13
      PC(6, 13, 3), PC(10, 13, 3), P(14, 13, 3), PC(20, 13, 2), PC(23, 13, 2), P(27, 13, 2) ],
    picks: [[15, 11]], enemies: [
      HP(15, 13, 14, 17, 35, 2, 0.2), WK(1, 15, 0, 4, 55), WK(28, 15, 26, 29, 70, 2) ],
    cuts: [] },

  // Breather with widened pit + one cracked tease (no blue beside it)
  neonRest: { w: 22, plats: [
      G(0, 10), G(17, 5),
      // was PC w=5 @ y=12 → ≤2, split across gap 10–17
      PC(11, 13, 2), PC(14, 13, 2) ],
    picks: [[2, 13]], enemies: [], cps: [3], cuts: [] },

  neonFinale: { w: 28, plats: [
      G(0, 6), G(14, 14),
      // was PC w=5 @ y=12 → ≤2 split; far pad lowered for 0-coll chain
      PC(7, 13, 2), PC(10, 13, 2), P(16, 13, 3), P(20, 12, 3) ],
    picks: [[21, 10]], enemies: [], goal: 24 },
});

registerLevel({
  id: 4, name: "Neon Overpass", theme: "neonOverpass", sections: [
    "neonStart", "cliffRun", "crackDash", "neonRest", "crackSpan", "neonZig",
    "neonHigh", "cliffRun", "overpass", "neonRest", "neonGauntlet", "crackSpan",
    "crackDash", "neonHigh", "neonZig", "cliffRun", "overpass", "crackSpan",
    "neonGauntlet", "neonRest", "neonHigh", "crackDash", "cliffRun", "neonZig",
    "overpass", "neonGauntlet", "crackSpan", "neonStart", "cliffRun", "neonFinale"],
  flyers: [
    [1, 16, 10, 24, 55], [1, 30, 26, 38, 50], [2, 20, 14, 30, 55], [5, 14, 8, 22, 60],
    [6, 18, 12, 28, 55], [8, 16, 10, 26, 60], [10, 20, 14, 32, 55], [12, 18, 12, 30, 55],
    [14, 16, 10, 26, 60], [16, 18, 12, 28, 55], [20, 16, 10, 28, 55], [25, 18, 12, 30, 50],
    [27, 14, 8, 24, 55]]
});
