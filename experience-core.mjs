export function difficulty(e) {
  if (Number.isInteger(e.difficulty) && e.difficulty >= 1 && e.difficulty <= 5)
    return e.difficulty;
  const v = (e.variation ?? "").toLowerCase(),
    skill = [
      "front",
      "back",
      "planche",
      "flag",
      "maltese",
      "victorian",
      "ironCross",
      "muscle",
    ].includes(e.family);
  if (skill) {
    if (/full|completa/.test(v)) return 5;
    if (/straddle|half lay|one leg/.test(v)) return 4;
    if (/advanced/.test(v)) return 3;
    return 2;
  }
  return 2;
}
export function setExperience(e) {
  if (e.outcome === "attempt")
    return {
      xp: 0,
      seconds: 0,
      estimated: false,
      difficulty: difficulty(e),
      loadBonus: 0,
    };
  const seconds =
      e.metric === "seconds" ? e.value : (e.durationSeconds ?? e.value * 3),
    estimated = e.metric === "reps" && e.durationSeconds == null;
  const loadBonus = Math.min(1, Math.log2(1 + e.weight / 25) / 3),
    d = difficulty(e);
  const work =
    e.metric === "seconds"
      ? e.value / 3
      : e.value * 2 + Math.min(seconds, 3600) / 15;
  return {
    xp: work * (0.75 + d * 0.25) * (1 + loadBonus),
    seconds,
    estimated,
    difficulty: d,
    loadBonus,
  };
}
export function levelFromXP(xp) {
  const level = Math.floor((1 + Math.sqrt(1 + (8 * xp) / 100)) / 2),
    start = (100 * level * (level - 1)) / 2,
    next = (100 * level * (level + 1)) / 2;
  return {
    level,
    start,
    next,
    remaining: next - xp,
    percent: Math.max(0, Math.min(100, ((xp - start) / (next - start)) * 100)),
  };
}
