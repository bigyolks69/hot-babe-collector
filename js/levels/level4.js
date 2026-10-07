// Hot Babe Collector — Level 4 Neon Overpass (cliffs + cracked airwalks over pits)
// Design: ground islands with many pits; solid elevated airwalks; cracked airwalks
// often sit over empty air so a break means pit death, not a soft floor landing.
// No blue safety ledges beside cracked spans — brief foot contact arms the crack.
// 0-collection jump ≈2.73 tiles (87px); from ground (y=15) airwalk tops at y≥13.
// Cracked chains mix 1 / 2 / 3 short planks (hop gaps between when multiple).
registerSections({
  // Intro: gap1 = 1 crack, gap2 = 3 cracks (was identical 2+2)
  neonStart: { w: 46, plats: [
      G(0, 7), G(16, 5), G(30, 16),
      // gap 7–16 (~9): single short plank
      PC(10, 13, 3),
      // gap 21–30 (~9): triple with hop gaps (ends before island)
      PC(21, 13, 2), PC(24, 13, 2), PC(27, 13, 2),
      P(32, 13, 4), P(38, 12, 3) ],
    // babe on the single crack (+ keep one solid-route drop)
    picks: [[11, 10], [39, 10]], enemies: [
      WK(3, 15, 0, 7, 75), WK(18, 15, 16, 21, 80), HP(34, 13, 32, 36, 40, 1, 0.2), WK(36, 15, 30, 45, 80, 2) ],
    cps: [2], cuts: [] },

  // Island hop: 1 / 3 / 2 / 1 crack chains across four pits
  cliffRun: { w: 56, plats: [
      G(0, 5), G(13, 4), G(25, 5), G(38, 4), G(50, 6),
      // gap 5–13: single
      PC(8, 13, 3),
      // gap 17–25: triple (2+1+2+1+2 = 8, ends at 25)
      PC(17, 13, 2), PC(20, 13, 2), PC(23, 13, 2),
      // gap 30–38: pair
      PC(31, 13, 3), PC(35, 13, 3),
      // gap 42–50: single
      PC(45, 13, 3),
      P(52, 13, 3) ],
    // babes on 1-crack and 3-crack mid; keep one island solid-route
    picks: [[9, 10], [21, 10], [39, 13]], enemies: [
      WK(1, 15, 0, 5, 70), WK(14, 15, 13, 17, 80), WK(27, 15, 25, 30, 85),
      WK(40, 15, 38, 42, 80, 2), HP(53, 13, 52, 55, 40, 1, 0.3) ],
    cps: [2], cuts: [] },

  // Cracked dash: 3 / 1 / 2 / 1
  crackDash: { w: 54, plats: [
      G(0, 5), G(14, 4), G(27, 5), G(40, 4), G(50, 4),
      // gap 5–14: triple (ends before island)
      PC(5, 13, 2), PC(8, 13, 2), PC(11, 13, 2),
      // gap 18–27: single
      PC(21, 13, 3),
      // gap 32–40: pair
      PC(33, 13, 3), PC(37, 13, 3),
      // gap 44–50: single
      PC(46, 13, 3),
      P(51, 13, 2) ],
    // babes on triple + single cracks; keep one island drop
    picks: [[9, 10], [22, 10], [28, 13]], enemies: [
      WK(1, 15, 0, 5, 75), WK(15, 15, 14, 18, 85), WK(29, 15, 27, 32, 90),
      HP(41, 15, 40, 44, 45, 2, 0.4), WK(42, 15, 40, 44, 80, 2) ],
    cps: [2], cuts: [] },

  // Long cracked commit: 3-chain then 2-chain (was 4+3)
  crackSpan: { w: 48, plats: [
      G(0, 6), G(22, 5), G(38, 10),
      // gap 6–22: triple
      PC(8, 13, 3), PC(12, 13, 3), PC(16, 13, 3),
      // gap 27–38: pair
      PC(28, 13, 3), PC(32, 13, 3),
      // high solid alternate (not beside cracked)
      P(2, 13, 3), P(5, 11, 3), P(9, 9, 3), P(13, 9, 3), P(17, 11, 3),
      P(40, 13, 3), P(44, 12, 3) ],
    // babes on cracked mid + keep one high solid
    picks: [[13, 10], [30, 10], [41, 11]], enemies: [
      WK(2, 15, 0, 6, 80), WK(24, 15, 22, 27, 90), WK(40, 15, 38, 48, 95),
      HP(10, 9, 9, 12, 40, 1, 0.3) ],
    cps: [2], cuts: [] },

  // High neon road: cracked shortcuts mix 1 / 3 / 2 between solids
  // (shortcuts may sit above ground route by design)
  neonHigh: { w: 46, plats: [
      G(0, 5), G(16, 4), G(32, 5), G(40, 6),
      P(3, 13, 3),
      // single crack shortcut
      PC(7, 13, 3),
      P(14, 12, 3), P(18, 12, 4),
      // triple crack shortcut
      PC(23, 13, 2), PC(26, 13, 2), PC(29, 13, 2),
      P(33, 12, 3),
      // pair (over approach to far pads)
      PC(37, 13, 2), PC(40, 13, 2),
      P(43, 13, 2) ],
    // babes on single + triple cracks; keep one solid mid
    picks: [[8, 10], [19, 10], [27, 10]], enemies: [
      WK(1, 15, 0, 5, 80), WK(18, 15, 16, 20, 90), WK(34, 15, 32, 37, 95, 2),
      HP(19, 12, 18, 22, 40, 1, 0.5) ],
    cuts: [] },

  // Pillars: widen first pit for a real 3-chain over void, then a 1-chain
  neonGauntlet: { w: 50, plats: [
      G(0, 4), G(16, 3), G(26, 3), G(38, 3), G(46, 4),
      COL(6, 13, 2), COL(19, 13, 2), COL(30, 13, 2), COL(41, 13, 2),
      // gap COL6 end(8) → G16: triple over void
      PC(8, 13, 2), PC(11, 13, 2), PC(14, 13, 2),
      P(21, 13, 3),
      // gap COL30 end(32) → G38: single
      PC(33, 13, 3),
      P(44, 13, 3) ],
    // babes on triple + single cracks; keep one solid
    picks: [[12, 10], [22, 11], [34, 10]], enemies: [
      WK(1, 15, 0, 4, 80), WK(17, 15, 16, 19, 90), WK(27, 15, 26, 29, 95),
      WK(39, 15, 38, 41, 90, 2), HP(22, 13, 21, 24, 45, 2, 0.5) ],
    cps: [2], cuts: [] },

  // Mixed solid chain; cracked tease as single + pair
  overpass: { w: 40, plats: [
      G(0, 5), G(33, 7),
      P(5, 13, 3), P(9, 12, 3), P(13, 12, 4),
      // single crack over trench
      PC(18, 13, 3),
      P(24, 13, 3),
      // pair with hop gap (ends before G33)
      PC(28, 13, 2), PC(31, 13, 2),
      P(34, 13, 4) ],
    // babe on single crack; keep one solid-route
    picks: [[19, 10], [35, 11]], enemies: [
      WK(1, 15, 0, 5, 75), WK(34, 15, 32, 40, 90), HP(14, 12, 13, 17, 40, 1, 0.4),
      WK(10, 12, 9, 12, 50, 2) ],
    cps: [2], cuts: [] },

  // Zigzag: 1 then 3 (was 2+2)
  neonZig: { w: 40, plats: [
      G(0, 4), G(14, 3), G(26, 3), G(34, 4),
      // gap 4–14: single
      PC(8, 13, 3),
      P(14, 13, 3),
      // gap 17–26: triple (ends before island)
      PC(17, 13, 2), PC(20, 13, 2), PC(23, 13, 2),
      P(27, 13, 2) ],
    // babe on single + triple; bias onto cracks
    picks: [[9, 10], [21, 10]], enemies: [
      HP(15, 13, 14, 17, 35, 2, 0.2), WK(1, 15, 0, 4, 55), WK(28, 15, 26, 29, 70, 2) ],
    cuts: [] },

  // Breather: single cracked tease (was pair)
  neonRest: { w: 22, plats: [
      G(0, 10), G(17, 5),
      PC(12, 13, 3) ],
    // babe on the crack; keep one pad drop
    picks: [[2, 13], [13, 10]], enemies: [], cps: [3], cuts: [] },

  neonFinale: { w: 28, plats: [
      G(0, 6), G(14, 14),
      // pair over intro pit (finale stays a 2)
      PC(7, 13, 2), PC(10, 13, 2), P(16, 13, 3), P(20, 12, 3) ],
    // babe on cracked mid; keep far pad
    picks: [[8, 10], [21, 10]], enemies: [], goal: 24 },
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
