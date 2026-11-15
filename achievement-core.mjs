import { masterySummary } from "./mastery-core.mjs";
import {
  allExerciseEntries,
  allJournalEntries,
  defaultSkill,
  suggestedCounterGroup,
} from "./skills-core.mjs";
const defs = [];
const norm = (x) => String(x).toLowerCase();
function add(
  id,
  name,
  family,
  movement,
  variation,
  metric,
  targets,
  mode = "best",
  label = "",
  factor = 1,
) {
  for (const target of targets) {
    const unit =
      metric === "seconds" ? "s" : metric === "weight" ? "lb" : "reps";
    defs.push({
      id: `${id}-${target}`,
      name: `${target === 1 ? "Primer " : ""}${name} · ${metric === "weight" ? "+" : ""}${target} ${unit}`,
      family,
      movement,
      variation,
      metric,
      target,
      mode,
      description: `${label || name}: ${mode === "day" ? "acumuladas en un día" : mode === "total" ? "acumuladas de por vida" : "en una sola serie"}. Sin asistencia.${variation === "Estándar" ? " Variante Estándar; cualquier equipo y lastre." : ""}${metric === "weight" ? " Al menos una rep completada." : ""}`,
      xp: Math.round(
        (20 +
          target *
            (metric === "weight"
              ? 2
              : mode === "total"
                ? 0.15
                : mode === "day"
                  ? 0.5
                  : 5)) *
          factor,
      ),
      coins: Math.round((8 + Math.sqrt(target) * 3) * factor),
      config: {
        ...defaultSkill(family),
        movement,
        variation: variation ?? defaultSkill(family).variation,
        metric: metric === "weight" ? "reps" : metric,
      },
    });
  }
}
for (const [family, name, movement] of [
  ["front", "Front lever", "Lever raises"],
  ["back", "Back lever", "Lever raises"],
  ["planche", "Planche", "Planche pushups"],
]) {
  for (const [variant, factor] of [
    ["Tuck", 1],
    ["Advanced tuck", 1.3],
    ["One leg", 1.5],
    ["Straddle", 1.8],
    ["Half lay", 2],
    ["Full", 2.5],
  ]) {
    add(
      `${family}-${variant}-hold`,
      `${name} ${variant}`,
      family,
      "Static hold",
      variant,
      "seconds",
      variant === "Full" ? [1, 5, 10, 15, 20, 30, 60] : [1, 5, 10, 20, 30],
      "best",
      "",
      factor,
    );
    add(
      `${family}-${variant}-reps`,
      `${name} ${variant} · ${movement}`,
      family,
      movement,
      variant,
      "reps",
      [1, 5, 10, 20],
      "best",
      "",
      factor,
    );
  }
}
for (const [family, name, movement] of [
  ["pullups", "Pull-ups", "Pull-ups"],
  ["pushups", "Pushups", "Pushups"],
  ["dips", "Dips", "Dips"],
]) {
  add(
    `${family}-set`,
    name,
    family,
    movement,
    "Estándar",
    "reps",
    [1, 5, 10, 15, 20, 30, 50, 75, 100],
  );
  add(
    `${family}-day`,
    `${name} en un día`,
    family,
    movement,
    "Estándar",
    "reps",
    [25, 50, 100, 200, 500],
    "day",
  );
  add(
    `${family}-total`,
    `${name} acumuladas`,
    family,
    movement,
    "Estándar",
    "reps",
    [100, 500, 1000, 5000, 10000, 25000],
    "total",
  );
  add(
    `${family}-weight`,
    `${name} con lastre`,
    family,
    movement,
    "Estándar",
    "weight",
    [10, 25, 50, 75, 100],
  );
}
for (const variant of ["Estricto", "Con kipping"])
  add(
    `muscle-${variant}`,
    `Muscle-up ${variant}`,
    "muscle",
    "Muscle-ups",
    variant,
    "reps",
    [1, 3, 5, 10, 15],
    "best",
    "",
    2,
  );
for (const [family, name, variant] of [
  ["handstand", "Handstand libre", "Libre"],
  ["lsit", "L-sit completo", "Full"],
  ["flag", "Human flag completo", "Full"],
])
  add(
    `${family}-hold`,
    name,
    family,
    "Static hold",
    variant,
    "seconds",
    [1, 5, 10, 15, 20, 30, 60],
    "best",
    `${name} (cualquier lado si aplica)`,
    2,
  );
for (const side of ["Izquierda", "Derecha"])
  add(
    `pistol-${side}`,
    `Pistol squat ${side}`,
    "pistol",
    "Pistol squats",
    side,
    "reps",
    [1, 5, 10, 20],
  );
add(
  "dragon-full",
  "Dragon flag Full",
  "dragon",
  "Dragon flag raises",
  "Full",
  "reps",
  [1, 5, 10, 20],
  "best",
  "",
  2,
);
for (const [mode, targets] of [
  ["sets", [1, 10, 100, 1000]],
  ["days", [7, 30, 100, 365]],
])
  for (const target of targets)
    defs.push({
      id: `activity-${mode}-${target}`,
      name: `${target} ${mode === "sets" ? "series completadas" : "días activos"}`,
      family: "activity",
      target,
      mode,
      description: "Constancia acumulada en tu historial.",
      xp: target * 2 + 30,
      coins: Math.ceil(Math.sqrt(target) * 5),
    });
export const ACHIEVEMENTS = defs;
export function achievementSummary(state, today) {
  const journal = allJournalEntries(state, today),
    entries = allExerciseEntries(state, today).filter(
      (e) => e.support === "Libre",
    ),
    buckets = new Map();
  for (const e of entries) {
    const key = e.family + "|" + norm(e.movement);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(e);
  }
  const achievements = defs.map((d) => {
    let value = 0,
      earnedDay = null;
    const days = new Map();
    const candidates =
      d.family === "activity"
        ? journal
        : (buckets.get(d.family + "|" + norm(d.movement)) ?? []);
    for (const e of candidates) {
      if (d.family === "activity") {
        if (d.mode === "sets") {
          if (e.outcome === "attempt") continue;
          value++;
        } else {
          days.set(e.day, 1);
          value = days.size;
        }
        if (value >= d.target && !earnedDay) earnedDay = e.day;
        continue;
      }
      if (
        e.family !== d.family ||
        norm(e.movement) !== norm(d.movement) ||
        e.metric !== (d.metric === "weight" ? "reps" : d.metric)
      )
        continue;
      const v = norm(e.variation),
        wanted = norm(d.variation);
      if (v !== wanted && !v.startsWith(wanted + " ·")) continue;
      if (d.metric === "weight") {
        value = Math.max(value, e.weight);
      } else if (d.mode === "total") {
        value += e.value;
      } else if (d.mode === "day") {
        days.set(e.day, (days.get(e.day) ?? 0) + e.value);
        value = Math.max(value, days.get(e.day));
      } else value = Math.max(value, e.value);
      if (value >= d.target && !earnedDay) earnedDay = e.day;
    }
    const config = d.config ? { ...d.config } : null;
    if (config) {
      config.counterGroup = suggestedCounterGroup(config);
      if (config.variation === "One leg")
        config.variation = "One leg · izquierda";
      if (config.family === "flag") config.variation += " · izquierda";
    }
    return {
      ...d,
      config,
      value,
      earned: !!earnedDay,
      earnedDay,
      percent: Math.min(100, (value / d.target) * 100),
    };
  });
  const staticEarned = achievements.filter((a) => a.earned),
    mastery = masterySummary(state, today);
  achievements.push(...mastery.achievements);
  const earned = achievements.filter((a) => a.earned);
  return {
    achievements,
    earned,
    earnedCount: staticEarned.length + mastery.count,
    mastery,
    xp: staticEarned.reduce((n, a) => n + a.xp, 0) + mastery.xp,
    coins: staticEarned.reduce((n, a) => n + a.coins, 0) + mastery.coins,
    todayXP:
      staticEarned
        .filter((a) => a.earnedDay === today)
        .reduce((n, a) => n + a.xp, 0) + mastery.todayXP,
  };
}
