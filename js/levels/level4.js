// Hot Babe Collector — Level 4 Neon Overpass (cliffs + cracked airwalks over pits)
// Design: ground islands with many pits; solid elevated airwalks; cracked airwalks
// often sit over empty air so a break means pit death, not a soft floor landing.
registerSections({
  // Intro pad → first pit under cracked span → solid air → island
  neonStart: { w: 38, plats: [
      G(0, 8), G(14, 6), G(26, 12),
      P(6, 13, 3), PC(9, 12, 5), P(16, 13, 3), PC(20, 11, 4), P(28, 13, 4), P(33, 11, 3) ],
    picks: [[7, 11], [29, 11]], enemies: [
      WK(3, 15, 0, 8, 75), WK(16, 15, 14, 20, 80), HP(29, 13, 28, 32, 40, 1, 0.2), WK(30, 15, 26, 37, 80, 2) ],
    cps: [2], cuts: [] },

  // Island hop with cracked bridges over 3–4 tile pits
  cliffRun: { w: 44, plats: [
      G(0, 5), G(9, 4), G(18, 5), G(28, 4), G(37, 7),
      P(4, 13, 3), PC(6, 12, 4), P(13, 13, 3), PC(15, 11, 4),
      P(22, 13, 3), PC(24, 12, 5), P(32, 13, 3), PC(34, 11, 4), P(40, 13, 3) ],
    picks: [[14, 11], [33, 11]], enemies: [
      WK(1, 15, 0, 5, 70), WK(11, 15, 9, 13, 80), WK(20, 15, 18, 23, 85),
      WK(30, 15, 28, 32, 80, 2), HP(41, 13, 40, 43, 40, 1, 0.3) ],
    cps: [2], cuts: [] },

  // Cracked dash: solid airwalks + cracked over mid pits, thin ground islands
  crackDash: { w: 42, plats: [
      G(0, 5), G(10, 4), G(20, 5), G(30, 4), G(38, 4),
      P(3, 13, 3), PC(6, 12, 5), P(14, 13, 3), PC(17, 11, 4),
      P(24, 13, 4), PC(28, 12, 3), P(34, 13, 3), PC(36, 11, 3) ],
    picks: [[15, 11], [25, 11]], enemies: [
      WK(1, 15, 0, 5, 75), WK(12, 15, 10, 14, 85), WK(22, 15, 20, 25, 90),
      HP(25, 13, 24, 28, 45, 2, 0.4), WK(32, 15, 30, 34, 80, 2) ],
    cps: [2], cuts: [] },

  // Long cracked span over a wide pit — must commit or take solid side path
  crackSpan: { w: 40, plats: [
      G(0, 6), G(18, 5), G(32, 8),
      P(4, 13, 3), PC(8, 12, 5), P(14, 13, 3),
      PC(20, 11, 5), P(26, 13, 3), PC(30, 12, 3), P(35, 13, 3) ],
    picks: [[5, 11], [27, 11]], enemies: [
      WK(2, 15, 0, 6, 80), WK(20, 15, 18, 23, 90), WK(34, 15, 32, 40, 95),
      HP(15, 13, 14, 17, 40, 1, 0.3) ],
    cps: [2], cuts: [] },

  // High neon road with ground mostly gone — airwalks required, cracked shortcuts over voids
  neonHigh: { w: 40, plats: [
      G(0, 5), G(14, 4), G(28, 5), G(36, 4),
      P(3, 13, 3), PC(7, 11, 4), P(12, 9, 3), P(16, 9, 4),
      PC(21, 9, 4), P(26, 11, 3), PC(30, 11, 4), P(35, 13, 3) ],
    picks: [[17, 7], [36, 11]], enemies: [
      WK(1, 15, 0, 5, 80), WK(16, 15, 14, 18, 90), WK(30, 15, 28, 33, 95, 2),
      HP(17, 9, 16, 20, 40, 1, 0.5) ],
    cuts: [] },

  // Pillar columns with pits between; cracked floats over the gaps
  neonGauntlet: { w: 42, plats: [
      G(0, 4), G(10, 3), G(20, 3), G(30, 3), G(38, 4),
      COL(5, 13, 2), COL(14, 12, 2), COL(24, 13, 2), COL(34, 12, 2),
      PC(7, 11, 4), P(17, 10, 3), PC(27, 11, 4), P(37, 13, 3) ],
    picks: [[8, 9], [18, 8], [35, 10]], enemies: [
      WK(1, 15, 0, 4, 80), WK(11, 15, 10, 13, 90), WK(21, 15, 20, 23, 95),
      WK(31, 15, 30, 33, 90, 2), HP(18, 10, 17, 20, 45, 2, 0.5) ],
    cps: [2], cuts: [] },

  // Mixed: solid mid airwalk chain over a long pit trench
  overpass: { w: 36, plats: [
      G(0, 5), G(28, 8),
      P(5, 13, 3), P(9, 12, 3), P(13, 11, 4), PC(18, 11, 4), P(23, 12, 3),
      PC(12, 13, 3), P(30, 13, 4) ],
    picks: [[14, 9], [31, 11]], enemies: [
      WK(1, 15, 0, 5, 75), WK(30, 15, 28, 36, 90), HP(14, 11, 13, 17, 40, 1, 0.4),
      WK(10, 12, 9, 12, 50, 2) ],
    cps: [2], cuts: [] },

  // Zigzag air over pit islands (cliffier than shared zigzag)
  neonZig: { w: 32, plats: [
      G(0, 4), G(12, 3), G(22, 3), G(28, 4),
      P(5, 13, 3), PC(8, 12, 4), P(14, 11, 3), PC(18, 13, 3), P(24, 11, 3) ],
    picks: [[15, 9]], enemies: [
      HP(15, 11, 14, 17, 35, 2, 0.2), WK(1, 15, 0, 4, 55), WK(24, 15, 22, 25, 70, 2) ],
    cuts: [] },

  // Breather with short pit + one cracked tease (still fair)
  neonRest: { w: 18, plats: [
      G(0, 10), G(14, 4),
      P(8, 13, 3), PC(11, 12, 3) ],
    picks: [[9, 11]], enemies: [], cps: [3], cuts: [] },

  neonFinale: { w: 24, plats: [
      G(0, 6), G(10, 14),
      P(5, 13, 3), PC(7, 12, 3), P(14, 13, 3), P(18, 11, 3) ],
    picks: [[19, 9]], enemies: [], goal: 20 },
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
