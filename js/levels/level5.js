// Hot Babe Collector — Level 5 Capsule Yard (rooftop → mini boss)
// Yolks: skip buried capsule climb; first entry lands on deck y=2 (same as bossFloorY / mini pad).
registerSections({
  capsuleClimb: { w: 22, plats: [
      // solid rooftop deck (connects to mini pad floor height) — no mid-climb ledges inside the fill
      [0, 2, 22, LEVEL_H - 2] ],
    picks: [[8, 1], [14, 1]],
    enemies: [
      WK(10, 2, 4, 18, 50),
      HP(16, 2, 12, 20, 35, 1, 0.3) ],
    cps: [[2, 2]] },
  miniBossPad: { w: 28, plats: [
      [0, 2, 28, LEVEL_H - 2], P(11, 0, 3) ],
    picks: [], enemies: [], cps: [[2, 2]], goal: 24 },

  // ---- Level 6 dual demon arena ----,
});
registerLevel({ id: 5, name: "Capsule Yard", theme: "capsule", sections: ["capsuleClimb", "miniBossPad"],
  boss: true, bossKind: "mini", vertical: true, bossFloorY: 2 });
