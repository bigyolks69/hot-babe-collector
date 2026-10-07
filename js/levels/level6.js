// Hot Babe Collector — Level 6 Dual Demon Arena
registerSections({
  dualArena: { w: 42, plats: [
      G(0, 42), P(14, 13, 3), P(25, 13, 3) ],
    picks: [], enemies: [], cps: [[21, 15]], goal: 38 },
});
registerLevel({ id: 6, name: "Dual Demon Arena", theme: "neon", sections: ["dualArena"],
  boss: true, bossKind: "dual", bossLockImmediate: true, startMid: true });
// All LEVELS registered — clamp saved progress now
progress = loadProgress();
