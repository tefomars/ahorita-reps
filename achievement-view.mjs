// Display-only guidance: never changes eligibility, XP, coins or saved records.
const dedicationModes = new Set([
  "day",
  "total",
  "volume",
  "load-volume",
  "sets",
  "days",
]);
const grades = ["Inicial", "Base", "Intermedio", "Avanzado", "Élite"];
export function achievementInfo(a) {
  const kind = dedicationModes.has(a.mode) ? "dedication" : "technique";
  const unit =
    a.mode === "sets"
      ? "series"
      : a.mode === "days"
        ? "días"
        : a.mode === "load-volume"
          ? a.metric === "seconds"
            ? "lb·s"
            : "lb·reps"
          : a.metric === "weight" || a.mode === "weight"
            ? "lb"
            : a.metric === "seconds"
              ? "s"
              : "reps";
  // Round upward so a fractional remainder never appears as zero before earning.
  const remaining = Math.ceil(Math.max(0, a.target - a.value - 1e-8) * 10) / 10;
  if (kind === "dedication") {
    const label =
      a.mode === "day"
        ? "En un día"
        : a.mode === "sets" || a.mode === "days"
          ? "Constancia"
          : a.mode === "load-volume"
            ? "Volumen con lastre"
            : "Acumulativa";
    return {
      kind,
      label: `Dedicación · ${label}`,
      grade: null,
      unit,
      remaining,
    };
  }
  const c = a.config ?? a,
    family = a.family,
    variation = (c.variation ?? "").toLowerCase();
  let grade = null;
  if (
    [
      "front",
      "back",
      "planche",
      "flag",
      "maltese",
      "victorian",
      "ironCross",
    ].includes(family)
  ) {
    grade = /full|completa/.test(variation)
      ? 5
      : /straddle|half lay|one leg/.test(variation)
        ? 4
        : /advanced/.test(variation)
          ? 3
          : 2;
    if (
      family === "planche" ||
      ["maltese", "victorian", "ironCross"].includes(family)
    )
      grade++;
    if (unit === "s" && a.target >= 30) grade++;
    if (unit === "reps" && a.target >= 10) grade++;
  } else if (
    [
      "pullups",
      "pushups",
      "dips",
      "muscle",
      "handstand",
      "lsit",
      "pistol",
      "dragon",
    ].includes(family)
  ) {
    const thresholds =
      unit === "lb"
        ? [10, 25, 50, 75]
        : a.metric === "seconds"
          ? [5, 10, 20, 30]
          : family === "pushups"
            ? [10, 20, 40, 75]
            : [1, 5, 10, 20];
    grade = 1 + thresholds.filter((t) => a.target > t).length;
    if (["muscle", "pistol", "dragon"].includes(family)) grade++;
    if (
      /archer|one arm|one-arm|una mano/.test((c.movement ?? "").toLowerCase())
    )
      grade++;
  }
  if (grade !== null) {
    const load = unit === "lb" ? a.target : (c.weight ?? 0);
    grade = Math.max(
      grade,
      1 + [10, 25, 50, 75].filter((t) => load > t).length,
    );
    if (c.support && c.support !== "Libre") grade--;
    grade = Math.max(1, Math.min(5, grade));
  }
  return {
    kind,
    grade,
    unit,
    remaining,
    label:
      grade === null
        ? "Técnica · Sin clasificar"
        : `Técnica · ${grades[grade - 1]} ${grade}/5`,
  };
}
export function compareAchievements(a, b, order = "nearest") {
  const name = () =>
    a.name.localeCompare(b.name, "es") || a.id.localeCompare(b.id);
  if (order === "xp") return b.xp - a.xp || b.percent - a.percent || name();
  if (order === "exercise") {
    const family = a.family.localeCompare(b.family);
    if (family) return family;
  }
  return Number(a.earned) - Number(b.earned) || b.percent - a.percent || name();
}
