// Hot Babe Collector — Level 3 (Gacha Demon)
registerSections({
  rooftopRun: { w: 18, plats: [
      G(0, 18), P(6, 13, 3), P(11, 12, 3) ],
    picks: [[7, 11], [12, 10]], enemies: [], cps: [2] },
  // Boss arena (~1 screen / 30 tiles). Entrance CP; goal unlocks after defeat.
  // One mid sidewalk at y=13 (2-tile rise from floor). Gap before flush-right boss; crank reachable via floor jump when yellow.,
  bossArena: { w: 30, plats: [G(0, 30), P(12, 13, 3)],
    picks: [], enemies: [], cps: [1], goal: 26 },

  // ---- Level 4 Neon Overpass (cracked shortcuts + solid required path) ----,
});
registerLevel({ id: 3, name: "Level 3", theme: "neon", sections: ["rooftopRun", "bossArena"], boss: true, bossKind: "main" });
