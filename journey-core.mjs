import {
  skillCatalog,
  validSkillEntry,
  allExerciseEntries,
  allTimeRecords,
  skillRecordKey,
  exerciseProfileId,
} from "./skills-core.mjs";
export function validateJourney(s) {
  if (
    s.skillFavorites !== undefined &&
    (!Array.isArray(s.skillFavorites) ||
      s.skillFavorites.length > 100 ||
      !s.skillFavorites.every(
        (f) =>
          f.outcome !== "attempt" &&
          f.value > 0 &&
          validSkillEntry({ ...f, day: "2000-01-01", at: 0 }),
      ) ||
      new Set(s.skillFavorites.map((f) => f.id)).size !==
        s.skillFavorites.length)
  )
    throw Error("Favoritas de calistenia no válidas.");
  if (
    s.shortcutOrder !== undefined &&
    (!Array.isArray(s.shortcutOrder) ||
      s.shortcutOrder.length > 200 ||
      !s.shortcutOrder.every(
        (k) =>
          typeof k === "string" &&
          /^(base|skill):.+/.test(k) &&
          k.length <= 110,
      ) ||
      new Set(s.shortcutOrder).size !== s.shortcutOrder.length)
  )
    throw Error("Orden de favoritas no válido.");
  if (
    s.focusSkills !== undefined &&
    (!Array.isArray(s.focusSkills) ||
      s.focusSkills.length > 6 ||
      !s.focusSkills.every(
        (k) => k !== "other" && Object.hasOwn(skillCatalog, k),
      ) ||
      new Set(s.focusSkills).size !== s.focusSkills.length)
  )
    throw Error("Enfoques no válidos.");
}
export function universalFavorites(s) {
  const items = [
    ...(s.favorites ?? []).map((item) => ({
      key: "base:" + item.id,
      kind: "base",
      item,
    })),
    ...(s.skillFavorites ?? []).map((item) => ({
      key: "skill:" + item.id,
      kind: "skill",
      item,
    })),
  ];
  const order = s.shortcutOrder ?? [];
  return items.sort((a, b) => {
    const ai = order.indexOf(a.key),
      bi = order.indexOf(b.key);
    return (ai < 0 ? 1e6 : ai) - (bi < 0 ? 1e6 : bi);
  });
}
export function moveShortcut(s, key, delta) {
  if (![-1, 1].includes(delta)) return false;
  const order = universalFavorites(s).map((f) => f.key),
    i = order.indexOf(key),
    j = i + delta;
  if (i < 0 || j < 0 || j >= order.length) return false;
  [order[i], order[j]] = [order[j], order[i]];
  s.shortcutOrder = order;
  return true;
}
export function favoriteSignature(f) {
  return (
    skillRecordKey({ ...f, source: "skill" }) +
    "|" +
    f.weight +
    "|" +
    f.value +
    "|" +
    (f.counterGroup ?? "") +
    "|" +
    (f.counterSide ?? "both")
  );
}
function dayShift(key, n) {
  const d = new Date(key + "T12:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function exerciseDetail(
  s,
  key,
  today,
  weight = "last",
  mode = "performance",
  range = "all",
) {
  const records = allTimeRecords(s, today),
    record = records.find((r) => r.key === key);
  if (!record) return null;
  const entries = allExerciseEntries(s, today).filter(
      (e) => skillRecordKey(e) === key,
    ),
    latest = entries.at(-1),
    weights = [...new Set(entries.map((e) => e.weight))].sort((a, b) => a - b);
  const selectedWeight = weights.includes(Number(weight))
    ? Number(weight)
    : latest.weight;
  const selected =
      mode === "weight"
        ? entries
        : entries.filter((e) => e.weight === selectedWeight),
    last = selected.at(-1),
    best = selected.reduce((a, b) => (b.value > a.value ? b : a)),
    start = range === "all" ? null : dayShift(today, 1 - Number(range)),
    byDay = new Map();
  for (const e of selected) {
    if (start && e.day < start) continue;
    const old = byDay.get(e.day),
      value = mode === "weight" ? e.weight : e.value;
    if (
      !old ||
      value > old.value ||
      (value === old.value && e.value > old.entry.value)
    )
      byDay.set(e.day, { day: e.day, value, entry: e });
  }
  const points = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
  const variants = records
    .filter(
      (r) =>
        exerciseProfileId(r.exercise) === exerciseProfileId(record.exercise),
    )
    .map((r) => ({
      key: r.key,
      label: [
        r.exercise.variation,
        r.exercise.apparatus || "Equipo no especificado",
        r.exercise.support === "Libre"
          ? "Libre"
          : r.exercise.support + ": " + r.exercise.supportNote,
      ].join(" · "),
    }));
  return {
    record,
    entries,
    last,
    best,
    latest,
    selected,
    selectedWeight,
    weights,
    variants,
    points,
    days: new Set(selected.map((e) => e.day)).size,
    total: Math.round(selected.reduce((n, e) => n + e.value, 0) * 10) / 10,
    unit:
      mode === "weight"
        ? "lb"
        : record.exercise.metric === "seconds"
          ? "s"
          : "reps",
    mode,
    range,
  };
}

export function appendShortcut(s, key) {
  const list = universalFavorites(s).map((f) => f.key);
  if (!list.includes(key)) return false;
  s.shortcutOrder = [...list.filter((k) => k !== key), key];
  return true;
}
