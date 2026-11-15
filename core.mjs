import { validateExerciseBook } from "./exercise-book.mjs";
import {
  economyDefaults,
  validateEconomy,
  upgradeEconomy,
} from "./economy-store.mjs";
import { trainingDefaults, validateTraining } from "./training-core.mjs";
import { validateJourney } from "./journey-core.mjs";
import {
  defaultSkillStore,
  validateSkillStore,
  skillEntriesOn,
  skillTotals,
  skillContributions,
} from "./skills-core.mjs";
export const groups = ["push", "pull", "legs"];
export const exercises = {
  push: [
    "Pushups",
    "Dips",
    "Diamond pushups",
    "Incline pushups",
    "Decline pushups",
    "Pike pushups",
  ],
  pull: [
    "Pullups",
    "Chinups",
    "Neutral grip pullups",
    "Rows",
    "Australian pullups",
  ],
  legs: [
    "Bulgarian squats",
    "Squats",
    "Lunges",
    "Reverse lunges",
    "Step-ups",
    "Calf raises",
  ],
};
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function initial() {
  return {
    version: 1,
    goals: { push: 100, pull: 30, legs: 40 },
    quick: [1, 5, 10],
    selected: Object.fromEntries(
      groups.map((g) => [
        g,
        { exercise: exercises[g][0], weight: 0, side: "both" },
      ]),
    ),
    days: {},
  };
}
export function ensureDay(s, key) {
  return (
    s.days[key] ?? (s.days[key] = { goals: goalsForDate(s, key), entries: [] })
  );
}
export function totals(entries, g) {
  const list = entries.filter((e) => e.group === g);
  if (g !== "legs") return { count: list.reduce((n, e) => n + e.reps, 0) };
  const left = list.reduce((n, e) => n + (e.side !== "right" ? e.reps : 0), 0),
    right = list.reduce((n, e) => n + (e.side !== "left" ? e.reps : 0), 0);
  return { count: Math.min(left, right), left, right };
}
export function counterEntries(s, key) {
  return [...(s.days[key]?.entries ?? []), ...skillContributions(s, key)];
}
export function dayTotals(s, key, g) {
  return totals(counterEntries(s, key), g);
}
export function validateEntry(e) {
  return (
    e &&
    typeof e.id === "string" &&
    (e.difficulty === undefined ||
      (Number.isInteger(e.difficulty) &&
        e.difficulty >= 1 &&
        e.difficulty <= 5)) &&
    (e.durationSeconds === undefined ||
      (Number.isFinite(e.durationSeconds) &&
        e.durationSeconds > 0 &&
        e.durationSeconds <= 3600)) &&
    (e.apparatus === undefined ||
      (typeof e.apparatus === "string" && e.apparatus.length <= 80)) &&
    (e.variation === undefined ||
      (typeof e.variation === "string" && e.variation.length <= 80)) &&
    (e.sessionId === undefined ||
      (typeof e.sessionId === "string" && e.sessionId.length <= 100)) &&
    (e.sessionStepId === undefined ||
      (typeof e.sessionStepId === "string" && e.sessionStepId.length <= 100)) &&
    groups.includes(e.group) &&
    typeof e.exercise === "string" &&
    e.exercise.length > 0 &&
    e.exercise.length <= 80 &&
    Number.isInteger(e.reps) &&
    e.reps > 0 &&
    e.reps <= 10000 &&
    Number.isFinite(e.weight) &&
    e.weight >= 0 &&
    e.weight <= 2000 &&
    ["both", "left", "right"].includes(e.side) &&
    Number.isFinite(e.at)
  );
}
export function validateBackup(s) {
  if (
    !s ||
    s.version !== 1 ||
    !s.days ||
    typeof s.days !== "object" ||
    Array.isArray(s.days) ||
    !s.selected
  )
    throw Error("Copia no válida.");
  const goals = (g) =>
    g &&
    groups.every((k) => Number.isInteger(g[k]) && g[k] >= 0 && g[k] <= 10000);
  if (
    !goals(s.goals) ||
    !Array.isArray(s.quick) ||
    s.quick.length !== 3 ||
    !s.quick.every((n) => Number.isInteger(n) && n > 0 && n <= 999)
  )
    throw Error("Configuración no válida.");
  for (const g of groups) {
    const p = s.selected[g];
    if (
      !p ||
      typeof p.exercise !== "string" ||
      !p.exercise.trim() ||
      p.exercise.length > 80 ||
      !["apparatus", "variation"].every(
        (k) =>
          p[k] === undefined || (typeof p[k] === "string" && p[k].length <= 80),
      ) ||
      !Number.isFinite(p.weight) ||
      p.weight < 0 ||
      p.weight > 2000 ||
      !["both", "left", "right"].includes(p.side)
    )
      throw Error("Ejercicio no válido.");
  }
  for (const [key, d] of Object.entries(s.days)) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(key) ||
      dayKey(new Date(key + "T12:00:00")) !== key ||
      !goals(d.goals) ||
      !Array.isArray(d.entries) ||
      !d.entries.every(validateEntry) ||
      new Set(d.entries.map((e) => e.id)).size !== d.entries.length
    )
      throw Error("Historial no válido.");
  }
  validateExtras(s);
  return s;
}

export function shiftDay(key, amount) {
  const d = new Date(key + "T12:00:00");
  d.setDate(d.getDate() + amount);
  return dayKey(d);
}
// These optional fields preserve compatibility with all existing version 1 backups.
export function upgrade(s) {
  s.favorites ??= [];
  s.skillFavorites ??= [];
  s.shortcutOrder ??= [];
  s.focusSkills ??= [];
  s.schedules ??= [];
  s.backup ??= { enabled: true, lastExportAt: null, snoozedUntil: null };
  s.preferences ??= { timerSound: false };
  s.preferences.activeShortcut ??= null;
  s.preferences.weightPresets ??= [];
  s.skills ??= defaultSkillStore();
  s.training ??= trainingDefaults();
  s.exerciseBook ??= [];
  s.economy ??= economyDefaults();
  upgradeEconomy(s);
  return s;
}
export function validateExtras(s) {
  validateExerciseBook(s);
  validateEconomy(s);
  validateJourney(s);
  validateTraining(s);
  if (s.skills !== undefined) validateSkillStore(s.skills);
  if (
    s.favorites !== undefined &&
    (!Array.isArray(s.favorites) ||
      s.favorites.length > 100 ||
      !s.favorites.every((f) => validateEntry({ ...f, at: 0 })) ||
      new Set(s.favorites.map((f) => f.id)).size !== s.favorites.length)
  )
    throw Error("Favoritas no válidas.");
  if (
    s.schedules !== undefined &&
    (!Array.isArray(s.schedules) ||
      !s.schedules.every(
        (x) =>
          x &&
          validDay(x.from) &&
          Array.isArray(x.week) &&
          x.week.length === 7 &&
          x.week.every(
            (d) => d && groups.every((g) => typeof d[g] === "boolean"),
          ),
      ))
  )
    throw Error("Calendario no válido.");
  if (
    s.backup !== undefined &&
    (!s.backup ||
      typeof s.backup.enabled !== "boolean" ||
      !["lastExportAt", "snoozedUntil"].every(
        (k) =>
          s.backup[k] === null ||
          (Number.isFinite(s.backup[k]) && s.backup[k] >= 0),
      ))
  )
    throw Error("Respaldo no válido.");
  if (
    s.preferences?.weightPresets !== undefined &&
    (!Array.isArray(s.preferences.weightPresets) ||
      s.preferences.weightPresets.length > 24 ||
      !s.preferences.weightPresets.every(
        (p) =>
          p &&
          typeof p.exercise === "string" &&
          p.exercise.length > 0 &&
          p.exercise.length <= 300 &&
          Number.isFinite(p.weight) &&
          p.weight > 0 &&
          p.weight <= 2000,
      ) ||
      new Set(
        s.preferences.weightPresets.map((p) =>
          JSON.stringify([p.exercise, p.weight]),
        ),
      ).size !== s.preferences.weightPresets.length)
  )
    throw Error("Pesos recientes no válidos.");
  if (
    s.preferences !== undefined &&
    (!s.preferences ||
      typeof s.preferences.timerSound !== "boolean" ||
      !(
        s.preferences.activeShortcut === undefined ||
        s.preferences.activeShortcut === null ||
        (typeof s.preferences.activeShortcut === "string" &&
          /^(base|skill):.+/.test(s.preferences.activeShortcut) &&
          s.preferences.activeShortcut.length <= 110)
      ))
  )
    throw Error("Preferencias no válidas.");
}
export function validDay(k) {
  return (
    typeof k === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(k) &&
    dayKey(new Date(k + "T12:00:00")) === k
  );
}
export function weekPlan(s, key) {
  const plan = [...(s.schedules ?? [])]
    .filter((x) => x.from <= key)
    .sort((a, b) => a.from.localeCompare(b.from))
    .at(-1);
  return (
    plan?.week ??
    Array.from({ length: 7 }, () =>
      Object.fromEntries(groups.map((g) => [g, true])),
    )
  );
}
export function goalsForDate(s, key) {
  const weekday = (new Date(key + "T12:00:00").getDay() + 6) % 7,
    week = weekPlan(s, key);
  return Object.fromEntries(
    groups.map((g) => [g, week[weekday][g] ? s.goals[g] : 0]),
  );
}
export function setSchedule(s, from, week) {
  upgrade(s);
  s.schedules = s.schedules.filter((x) => x.from < from);
  s.schedules.push({ from, week });
  ensureDay(s, from).goals = goalsForDate(s, from);
}
export function startOfWeek(key) {
  return shiftDay(key, -((new Date(key + "T12:00:00").getDay() + 6) % 7));
}
export function streakStats(s, today, group = null) {
  const keys = [
    ...new Set([
      ...Object.keys(s.days),
      ...(s.skills?.entries ?? []).map((e) => e.day),
    ]),
  ]
    .filter((k) => k <= today)
    .sort();
  if (!keys.length) return { current: 0, best: 0, total: 0 };
  let run = 0,
    best = 0,
    total = 0;
  for (let key = keys[0]; key <= today; key = shiftDay(key, 1)) {
    const d = s.days[key],
      goal = d?.goals[group] ?? (group ? goalsForDate(s, key)[group] : 0);
    const qualifies = group
      ? goal > 0 && dayTotals(s, key, group).count >= goal
      : hasActivity(s, key);
    const rest =
      group &&
      (d
        ? goal === 0
        : (s.schedules ?? []).some((x) => x.from <= key) &&
          !weekPlan(s, key)[(new Date(key + "T12:00:00").getDay() + 6) % 7][
            group
          ]);
    if (qualifies) {
      run++;
      total++;
      best = Math.max(best, run);
    } else if (!rest && key !== today) run = 0;
  }
  return { current: run, best, total };
}
export function weeklySummary(s, start, today) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const key = shiftDay(start, i),
      d = s.days[key],
      goals = d?.goals ?? goalsForDate(s, key),
      entries = key <= today ? (d?.entries ?? []) : [];
    return {
      key,
      future: key > today,
      active: !(key > today) && hasActivity(s, key),
      series:
        entries.length + (key <= today ? skillEntriesOn(s, key).length : 0),
      counts: Object.fromEntries(
        groups.map((g) => [g, key <= today ? dayTotals(s, key, g).count : 0]),
      ),
      met: groups.filter(
        (g) =>
          goals[g] > 0 &&
          dayTotals(s, key, g).count >= goals[g] &&
          key <= today,
      ).length,
    };
  });
  const elapsed = days.filter((d) => !d.future).length,
    previous = shiftDay(start, -7);
  const previousCounts = Object.fromEntries(
    groups.map((g) => [
      g,
      Array.from(
        { length: elapsed },
        (_, i) => dayTotals(s, shiftDay(previous, i), g).count,
      ).reduce((a, b) => a + b, 0),
    ]),
  );
  return {
    days,
    active: days.filter((d) => d.active).length,
    series: days.reduce((n, d) => n + d.series, 0),
    met: days.reduce((n, d) => n + d.met, 0),
    skills: skillTotals(
      (s.skills?.entries ?? []).filter(
        (e) => e.day >= start && e.day <= shiftDay(start, 6) && e.day <= today,
      ),
    ),
    elapsed,
    counts: Object.fromEntries(
      groups.map((g) => [g, days.reduce((n, d) => n + d.counts[g], 0)]),
    ),
    previousCounts,
  };
}
export function personalRecords(s, today) {
  const records = new Map();
  for (const [key, d] of Object.entries(s.days).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    if (key > today) continue;
    for (const e of d.entries) {
      const id = JSON.stringify([
        e.group,
        e.exercise.trim().toLocaleLowerCase(),
        e.weight,
        e.group === "legs" ? e.side : "both",
      ]);
      const old = records.get(id);
      if (!old || e.reps > old.reps) records.set(id, { ...e, day: key });
    }
  }
  return [...records.values()].sort(
    (a, b) =>
      a.group.localeCompare(b.group) ||
      a.exercise.localeCompare(b.exercise) ||
      a.weight - b.weight ||
      a.side.localeCompare(b.side),
  );
}
export function backupDue(s, today, now = Date.now()) {
  const b = s.backup;
  if (!b?.enabled || (b.snoozedUntil ?? 0) > now) return false;
  const keys = [
    ...new Set([
      ...Object.keys(s.days),
      ...(s.skills?.entries ?? []).map((e) => e.day),
    ]),
  ];
  const active = keys.filter((key) => key <= today && hasActivity(s, key));
  if (!b.lastExportAt) return active.length >= 3;
  return (
    now - b.lastExportAt >= 7 * 86400000 &&
    active.some(
      (key) =>
        (s.days[key]?.entries ?? []).some((e) => e.at > b.lastExportAt) ||
        skillEntriesOn(s, key).some((e) => e.at > b.lastExportAt),
    )
  );
}

export function hasActivity(s, key) {
  return !!s.days[key]?.entries.length || skillEntriesOn(s, key).length > 0;
}
