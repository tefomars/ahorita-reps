import { extraSkills } from "./exercise-library.mjs";
// Skill records stay separate from Push/Pull/Legs repetition goals.
export const skillCatalog = {
  front: {
    name: "Front lever",
    apparatus: ["Barra", "Anillas"],
    variations: [
      "Tuck",
      "Advanced tuck",
      "One leg · izquierda",
      "One leg · derecha",
      "Straddle",
      "Half lay",
      "Full",
    ],
    movements: [
      { name: "Static hold", metric: "seconds" },
      { name: "Lever raises", metric: "reps" },
      { name: "Lever pulls", metric: "reps" },
      { name: "Negativas", metric: "reps" },
    ],
  },
  back: {
    name: "Back lever",
    apparatus: ["Barra", "Anillas"],
    variations: [
      "Tuck",
      "Advanced tuck",
      "One leg · izquierda",
      "One leg · derecha",
      "Straddle",
      "Half lay",
      "Full",
    ],
    movements: [
      { name: "Static hold", metric: "seconds" },
      { name: "Lever raises", metric: "reps" },
      { name: "Negativas", metric: "reps" },
    ],
  },
  planche: {
    name: "Planche",
    apparatus: ["Suelo", "Paralelas", "Anillas"],
    variations: [
      "Tuck",
      "Advanced tuck",
      "One leg · izquierda",
      "One leg · derecha",
      "Straddle",
      "Half lay",
      "Full",
    ],
    movements: [
      { name: "Static hold", metric: "seconds" },
      { name: "Planche pushups", metric: "reps" },
      { name: "Planche lean", metric: "seconds", variations: ["Lean"] },
      {
        name: "Pseudo planche pushups",
        metric: "reps",
        variations: ["Estándar"],
      },
    ],
  },
  muscle: {
    name: "Muscle-ups",
    apparatus: ["Barra", "Anillas"],
    variations: ["Estricto", "Con kipping"],
    movements: [
      { name: "Muscle-ups", metric: "reps" },
      { name: "Negativas", metric: "reps", variations: ["Controlada"] },
    ],
  },
  ...extraSkills,
  other: {
    name: "Otro ejercicio",
    apparatus: ["Barra", "Anillas", "Suelo", "Paralelas", "Otro"],
    variations: ["Estándar"],
    movements: [{ name: "Ejercicio propio", metric: "reps" }],
  },
};
export const skillSupports = [
  "Libre",
  "Banda",
  "Apoyo de pies",
  "Asistencia externa",
];
export function defaultSkill(family = "front") {
  const c = skillCatalog[family] ?? skillCatalog.front;
  return {
    family: skillCatalog[family] ? family : "front",
    movement: c.movements[0].name,
    variation: c.variations[0],
    metric: c.movements[0].metric,
    apparatus: c.apparatus[0],
    support: "Libre",
    supportNote: "",
    weight: 0,
    notes: "",
  };
}
export function defaultSkillStore() {
  return { entries: [], selected: defaultSkill() };
}
function short(s, max = 80) {
  return typeof s === "string" && s.trim().length > 0 && s.length <= max;
}
function validDay(key) {
  if (typeof key !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const d = new Date(key + "T12:00:00");
  return (
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` ===
    key
  );
}
export function validSkillConfig(e) {
  return !!(
    e &&
    Object.hasOwn(skillCatalog, e.family) &&
    short(e.movement) &&
    short(e.variation) &&
    ["seconds", "reps"].includes(e.metric) &&
    short(e.apparatus) &&
    skillSupports.includes(e.support) &&
    typeof e.supportNote === "string" &&
    e.supportNote.length <= 100 &&
    (e.support === "Libre" || e.supportNote.trim()) &&
    Number.isFinite(e.weight) &&
    e.weight >= 0 &&
    e.weight <= 2000 &&
    typeof e.notes === "string" &&
    e.notes.length <= 300
  );
}
export function validSkillEntry(e) {
  return !!(
    validSkillConfig(e) &&
    short(e.id, 100) &&
    validDay(e.day) &&
    Number.isFinite(e.at) &&
    e.at >= 0 &&
    Number.isFinite(e.value) &&
    e.value > 0 &&
    (e.metric === "reps"
      ? Number.isInteger(e.value) && e.value <= 10000
      : e.value <= 36000 &&
        Math.abs(e.value * 10 - Math.round(e.value * 10)) < 1e-7)
  );
}
export function validateSkillStore(s) {
  if (
    !s ||
    !Array.isArray(s.entries) ||
    !s.entries.every(validSkillEntry) ||
    new Set(s.entries.map((e) => e.id)).size !== s.entries.length ||
    !validSkillConfig(s.selected)
  )
    throw Error("Registros de calistenia no válidos.");
  return s;
}
export function skillEntriesOn(s, key) {
  return (s.skills?.entries ?? []).filter((e) => e.day === key);
}
export function skillTotals(list) {
  return {
    series: list.length,
    reps: list
      .filter((e) => e.metric === "reps")
      .reduce((n, e) => n + e.value, 0),
    seconds:
      Math.round(
        list
          .filter((e) => e.metric === "seconds")
          .reduce((n, e) => n + e.value, 0) * 10,
      ) / 10,
  };
}
const norm = (s) => s.trim().replace(/\s+/g, " ").toLocaleLowerCase();
export function skillRecordKey(e) {
  return JSON.stringify([
    e.source ?? "skill",
    e.baseGroup ?? "",
    e.family,
    norm(e.movement),
    norm(e.variation),
    e.metric,
    norm(e.apparatus),
    e.support,
    e.support === "Libre" ? "" : norm(e.supportNote),
  ]);
}
// Personal bests are derived from sets, never entered separately.
export function allTimeRecords(s, today) {
  const records = new Map();
  const list = (s.skills?.entries ?? [])
    .filter((e) => e.day <= today)
    .map((e) => ({ ...e, source: "skill" }));
  for (const [day, d] of Object.entries(s.days)) {
    if (day > today) continue;
    for (const e of d.entries)
      list.push({
        id: e.id,
        day,
        at: e.at,
        source: "base",
        baseGroup: e.group,
        family: "base",
        movement: e.exercise,
        variation:
          e.group === "legs"
            ? e.side === "both"
              ? "Ambas piernas"
              : e.side === "left"
                ? "Solo izquierda"
                : "Solo derecha"
            : "Estándar",
        metric: "reps",
        value: e.reps,
        apparatus: "",
        support: "Libre",
        supportNote: "",
        weight: e.weight,
        notes: "",
      });
  }
  list.sort(
    (a, b) =>
      a.day.localeCompare(b.day) || a.at - b.at || a.id.localeCompare(b.id),
  );
  for (const e of list) {
    const key = skillRecordKey(e);
    let r = records.get(key);
    if (!r) {
      r = {
        key,
        exercise: e,
        source: e.source,
        baseGroup: e.baseGroup,
        series: 0,
        best: e,
        heaviest: e,
        byWeight: new Map(),
      };
      records.set(key, r);
    }
    r.series++;
    if (
      e.value > r.best.value ||
      (e.value === r.best.value && e.weight > r.best.weight)
    )
      r.best = e;
    if (
      e.weight > r.heaviest.weight ||
      (e.weight === r.heaviest.weight && e.value > r.heaviest.value)
    )
      r.heaviest = e;
    const previous = r.byWeight.get(e.weight);
    if (!previous || e.value > previous.value) r.byWeight.set(e.weight, e);
  }
  return [...records.values()]
    .map((r) => ({
      ...r,
      byWeight: [...r.byWeight.values()].sort((a, b) => a.weight - b.weight),
    }))
    .sort(
      (a, b) =>
        a.exercise.family.localeCompare(b.exercise.family) ||
        a.exercise.movement.localeCompare(b.exercise.movement) ||
        a.exercise.variation.localeCompare(b.exercise.variation) ||
        a.exercise.apparatus.localeCompare(b.exercise.apparatus) ||
        a.exercise.support.localeCompare(b.exercise.support) ||
        a.exercise.supportNote.localeCompare(b.exercise.supportNote) ||
        a.exercise.metric.localeCompare(b.exercise.metric),
    );
}
