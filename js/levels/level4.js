// Hot Babe Collector — Level 4 Neon Overpass (cracked shortcuts)
registerSections({
  neonStart: { w: 36, plats: [
      G(0, 36), P(8, 13, 4), PC(14, 13, 3), P(20, 11, 4), PC(26, 12, 3), P(30, 13, 3) ],
    picks: [[9, 11], [21, 9]], enemies: [
      WK(6, 15, 2, 16, 70), WK(22, 15, 18, 34, 80), HP(21, 11, 20, 24, 40, 1, 0.2), WK(28, 15, 24, 35, 75, 2) ],
    cps: [2], cuts: [33] },
  crackDash: { w: 40, plats: [
      G(0, 8), G(12, 6), G(22, 8), G(34, 6),
      P(5, 13, 3), PC(9, 12, 3), P(15, 13, 3), PC(19, 11, 3), P(26, 13, 4), PC(31, 12, 3) ],
    picks: [[16, 11], [27, 11]], enemies: [
      WK(2, 15, 0, 8, 75), WK(14, 15, 12, 18, 80), WK(24, 15, 22, 30, 85), HP(27, 13, 26, 30, 45, 2, 0.4),
      WK(36, 15, 34, 40, 70, 2) ],
    cps: [2], cuts: [10, 20] },
  crackSpan: { w: 38, plats: [
      G(0, 10), G(16, 8), G(30, 8),
      P(6, 13, 3), PC(11, 12, 4), P(18, 13, 3), PC(23, 11, 3), P(28, 13, 3), PC(33, 12, 3) ],
    picks: [[7, 11], [24, 9]], enemies: [
      WK(3, 15, 0, 10, 80), WK(18, 15, 16, 24, 85), WK(32, 15, 30, 38, 90), HP(19, 13, 18, 21, 40, 1, 0.3) ],
    cps: [2], cuts: [14] },
  neonGauntlet: { w: 40, plats: [
      G(0, 40), COL(8, 13, 2), COL(16, 12, 2), COL(24, 13, 2), COL(32, 12, 2),
      PC(11, 11, 3), P(19, 10, 3), PC(27, 11, 3) ],
    picks: [[12, 9], [28, 9], [35, 13]], enemies: [
      WK(4, 15, 0, 8, 80), WK(12, 15, 10, 16, 85), WK(20, 15, 18, 24, 90), WK(28, 15, 26, 32, 85, 2),
      WK(34, 15, 32, 40, 95), HP(20, 10, 19, 22, 45, 2, 0.5) ],
    cps: [2], cuts: [38] },
  neonHigh: { w: 36, plats: [
      G(0, 36), P(4, 13, 3), PC(8, 11, 3), P(13, 9, 4), PC(19, 9, 3), P(24, 11, 3), P(29, 13, 3) ],
    picks: [[14, 7], [30, 11]], enemies: [
      WK(8, 15, 2, 34, 90), WK(20, 15, 2, 34, 85, 2), HP(14, 9, 13, 17, 40, 1, 0.6) ],
    cuts: [2, 18] },
  neonFinale: { w: 22, plats: [G(0, 22), P(6, 13, 3), PC(11, 12, 3), P(15, 11, 3)],
    picks: [[16, 9]], enemies: [], goal: 18 },

  // ---- Level 5 upward capsule climb + mini boss pad ----,
});
registerLevel({
  id: 4, name: "Neon Overpass", theme: "neonOverpass", sections: [
    "neonStart", "crackDash", "meadow", "crackSpan", "staircase", "rest",
    "neonHigh", "crackDash", "zigzag", "rest", "neonGauntlet", "crackSpan",
    "towers", "neonHigh", "highRoad", "crackDash", "arena", "crackSpan",
    "valley", "neonGauntlet", "zigzag", "rest", "neonHigh", "doubleGap",
    "crackDash", "neonGauntlet", "highRoad", "crackSpan", "neonStart", "neonFinale"],
  flyers: [
    [1, 14, 10, 20, 55], [1, 28, 24, 34, 50], [3, 20, 16, 28, 55], [6, 18, 12, 28, 60],
    [7, 22, 18, 32, 55], [10, 20, 14, 30, 60], [11, 18, 14, 28, 55], [14, 20, 16, 30, 55],
    [16, 18, 14, 28, 60], [19, 16, 12, 28, 55], [25, 18, 14, 30, 55], [28, 16, 12, 28, 50]]
});
