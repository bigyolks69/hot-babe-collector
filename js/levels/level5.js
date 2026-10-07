// Hot Babe Collector — Level 5 Capsule Yard (vertical + mini boss)
registerSections({
  capsuleClimb: { w: 22, plats: [
      G(0, 22),
      P(2, 13, 3), P(9, 12, 3), P(15, 11, 3),
      P(4, 10, 3), P(11, 9, 3), P(17, 8, 3),
      P(3, 7, 3), P(10, 6, 4), P(16, 5, 3),
      P(6, 4, 4), P(13, 3, 4),
      // top deck (connects to mini pad floor height)
      [0, 2, 22, LEVEL_H - 2] ],
    picks: [[3, 11], [12, 7], [14, 1]], enemies: [
      HP(10, 12, 9, 12, 35, 1, 0.2), WK(16, 11, 15, 18, 50),
      HP(12, 9, 11, 14, 35, 1, 0.4), WK(5, 7, 3, 6, 45),
      HP(11, 6, 10, 14, 30, 2, 0.3), WK(14, 3, 13, 17, 40) ],
    cps: [[2, 15], [11, 6]] },
  miniBossPad: { w: 28, plats: [
      [0, 2, 28, LEVEL_H - 2], P(11, 0, 3) ],
    picks: [], enemies: [], cps: [[2, 2]], goal: 24 },

  // ---- Level 6 dual demon arena ----,
});
registerLevel({ id: 5, name: "Capsule Yard", theme: "capsule", sections: ["capsuleClimb", "miniBossPad"],
  boss: true, bossKind: "mini", vertical: true, bossFloorY: 2 });
