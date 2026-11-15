import {
  skillCatalog,
  validSkillEntry,
  allJournalEntries,
  allExerciseEntries,
  skillRecordKey,
} from "./skills-core.mjs";
const copy = (x) => JSON.parse(JSON.stringify(x)),
  str = (x, n = 100) =>
    typeof x === "string" && x.trim().length > 0 && x.length <= n;
export function isoDay(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function validDay(k) {
  return (
    typeof k === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(k) &&
    isoDay(new Date(k + "T12:00:00")) === k
  );
}
export function shift(k, n) {
  const d = new Date(k + "T12:00:00");
  d.setDate(d.getDate() + n);
  return isoDay(d);
}
export function weekStart(k) {
  return shift(k, -((new Date(k + "T12:00:00").getDay() + 6) % 7));
}
export function trainingDefaults() {
  return { goals: [], templates: [], sessions: [], activeSessionId: null };
}
export function validBasePreset(f) {
  return !!(
    f &&
    ["push", "pull", "legs"].includes(f.group) &&
    str(f.exercise, 80) &&
    ["apparatus", "variation"].every(
      (k) =>
        f[k] === undefined || (typeof f[k] === "string" && f[k].length <= 80),
    ) &&
    Number.isInteger(f.reps) &&
    f.reps > 0 &&
    f.reps <= 10000 &&
    Number.isFinite(f.weight) &&
    f.weight >= 0 &&
    f.weight <= 2000 &&
    ["both", "left", "right"].includes(f.side)
  );
}
export function validPreset(p) {
  return (
    p &&
    ["base", "skill"].includes(p.kind) &&
    (p.kind === "base"
      ? validBasePreset(p.preset)
      : p.preset.outcome !== "attempt" &&
        p.preset.value > 0 &&
        validSkillEntry({
          ...p.preset,
          id: "preset",
          day: "2000-01-01",
          at: 0,
        }))
  );
}
export function validGoal(g) {
  return !!(
    g &&
    str(g.id) &&
    str(g.name, 80) &&
    ["day", "week"].includes(g.period) &&
    ["seconds", "reps", "sets", "days"].includes(g.metric) &&
    Number.isFinite(g.target) &&
    g.target > 0 &&
    g.target <= 100000 &&
    (g.metric !== "days" || g.target <= (g.period === "week" ? 7 : 1)) &&
    (g.metric === "seconds" || Number.isInteger(g.target)) &&
    (g.family === "all" || Object.hasOwn(skillCatalog, g.family)) &&
    ["movement", "variation", "apparatus"].every(
      (k) => g[k] === null || (typeof g[k] === "string" && g[k].length <= 80),
    ) &&
    (g.weight === null ||
      (Number.isFinite(g.weight) && g.weight >= 0 && g.weight <= 2000)) &&
    validDay(g.createdDay)
  );
}
export function validTemplate(t) {
  return !!(
    t &&
    str(t.id) &&
    str(t.name, 80) &&
    Array.isArray(t.steps) &&
    t.steps.length > 0 &&
    t.steps.length <= 30 &&
    t.steps.every(
      (x) =>
        str(x.id) &&
        validPreset(x) &&
        Number.isInteger(x.sets) &&
        x.sets >= 1 &&
        x.sets <= 20 &&
        Number.isInteger(x.rest) &&
        x.rest >= 0 &&
        x.rest <= 600,
    ) &&
    new Set(t.steps.map((x) => x.id)).size === t.steps.length
  );
}
export function validSession(s) {
  return !!(
    s &&
    str(s.id) &&
    str(s.name, 80) &&
    Number.isFinite(s.startedAt) &&
    s.startedAt >= 0 &&
    (s.endedAt === null ||
      (Number.isFinite(s.endedAt) && s.endedAt >= s.startedAt)) &&
    Array.isArray(s.steps) &&
    (s.steps.length === 0 ||
      validTemplate({ id: s.id, name: s.name, steps: s.steps })) &&
    Array.isArray(s.skipped) &&
    s.skipped.every((x) => typeof x === "string")
  );
}
export function validateTraining(s) {
  const t = s.training;
  if (t === undefined) return;
  if (
    !t ||
    !Array.isArray(t.goals) ||
    t.goals.length > 30 ||
    !t.goals.every(validGoal) ||
    !Array.isArray(t.templates) ||
    t.templates.length > 100 ||
    !t.templates.every(validTemplate) ||
    !Array.isArray(t.sessions) ||
    !t.sessions.every(validSession) ||
    ![t.goals, t.templates, t.sessions].every(
      (a) => new Set(a.map((x) => x.id)).size === a.length,
    ) ||
    (t.activeSessionId !== null &&
      (!str(t.activeSessionId) ||
        !t.sessions.some(
          (x) => x.id === t.activeSessionId && x.endedAt === null,
        )))
  )
    throw Error("Planes, metas o sesiones no válidos.");
}
export function goalProgress(s, g, today) {
  const start = [g.period === "week" ? weekStart(today) : today, g.createdDay]
    .sort()
    .at(-1);
  const list = allJournalEntries(s, today).filter(
    (e) =>
      e.day >= start &&
      (g.family === "all" || e.family === g.family) &&
      (!g.movement || e.movement.toLowerCase() === g.movement.toLowerCase()) &&
      (!g.variation ||
        e.variation.toLowerCase() === g.variation.toLowerCase()) &&
      (!g.apparatus ||
        e.apparatus.toLowerCase() === g.apparatus.toLowerCase()) &&
      (g.weight === null || e.weight === g.weight),
  );
  const completed = list.filter((e) => e.outcome !== "attempt");
  let value =
    g.metric === "days"
      ? new Set(list.map((e) => e.day)).size
      : g.metric === "sets"
        ? completed.length
        : completed
            .filter((e) => e.metric === g.metric)
            .reduce((n, e) => n + e.value, 0);
  value = Math.round(value * 10) / 10;
  return {
    value,
    target: g.target,
    complete: value >= g.target,
    percent: Math.min(100, (value / g.target) * 100),
    start,
  };
}
export function activeSession(s) {
  return (
    s.training?.sessions.find(
      (x) => x.id === s.training.activeSessionId && x.endedAt === null,
    ) ?? null
  );
}
export function sessionSummary(s, session, today) {
  const entries = allJournalEntries(s, today).filter(
      (e) => e.sessionId === session.id,
    ),
    completed = entries.filter((e) => e.outcome !== "attempt");
  return {
    entries,
    completed: completed.length,
    attempts: entries.length - completed.length,
    reps: completed
      .filter((e) => e.metric === "reps")
      .reduce((n, e) => n + e.value, 0),
    seconds:
      Math.round(
        completed
          .filter((e) => e.metric === "seconds")
          .reduce((n, e) => n + e.value, 0) * 10,
      ) / 10,
    duration: Math.max(
      0,
      Math.floor(((session.endedAt ?? Date.now()) - session.startedAt) / 1000),
    ),
  };
}
export function nextSessionStep(s, session, today) {
  const entries = allJournalEntries(s, today).filter(
    (e) => e.sessionId === session.id && e.outcome !== "attempt",
  );
  for (const step of session.steps) {
    if (session.skipped.includes(step.id)) continue;
    const done = entries.filter((e) => e.sessionStepId === step.id).length;
    if (done < step.sets)
      return { step, done, index: session.steps.indexOf(step) };
  }
  return null;
}
function presetKey(p) {
  const f = p.preset;
  if (p.kind === "skill") return skillRecordKey({ ...f, source: "skill" });
  return skillRecordKey({
    family: "base",
    source: "base",
    movement: f.exercise,
    variation:
      f.variation ||
      (f.group === "legs"
        ? f.side === "left"
          ? "Izquierda"
          : f.side === "right"
            ? "Derecha"
            : "Ambas piernas"
        : "Estándar"),
    metric: "reps",
    apparatus: f.apparatus ?? "",
    support: "Libre",
    supportNote: "",
    baseGroup: f.group,
  });
}
export function attachSession(s, e, kind, today, meta = {}) {
  delete e.sessionId;
  delete e.sessionStepId;
  const session = activeSession(s);
  if (!session || (e.day && e.day !== today)) return e;
  e.sessionId = session.id;
  const next = nextSessionStep(s, session, today);
  if (
    meta.sessionStepId &&
    session.steps.some((x) => x.id === meta.sessionStepId)
  )
    e.sessionStepId = meta.sessionStepId;
  else if (
    next &&
    e.outcome !== "attempt" &&
    presetKey(next.step) === presetKey({ kind, preset: e }) &&
    (kind === "base" ? e.reps : e.value) ===
      (next.step.kind === "base"
        ? next.step.preset.reps
        : next.step.preset.value) &&
    e.weight === next.step.preset.weight
  )
    e.sessionStepId = next.step.id;
  return e;
}
function stable(x) {
  if (Array.isArray(x)) return "[" + x.map(stable).join(",") + "]";
  if (x && typeof x === "object")
    return (
      "{" +
      Object.keys(x)
        .sort()
        .filter((k) => x[k] !== undefined)
        .map((k) => JSON.stringify(k) + ":" + stable(x[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(x);
}
export function dataFingerprint(s) {
  const x = copy(s);
  delete x.backup;
  return stable(x);
}
export function mergeBackups(current, incoming, prefer = "local") {
  const out = copy(current),
    report = { added: 0, duplicates: 0, conflicts: 0, examples: [] };
  function union(a, b, label) {
    const map = new Map(a.map((e) => [e.id, e]));
    for (const e of b) {
      if (!map.has(e.id)) {
        map.set(e.id, copy(e));
        report.added++;
      } else if (stable(map.get(e.id)) === stable(e)) report.duplicates++;
      else {
        report.conflicts++;
        if (report.examples.length < 8)
          report.examples.push({ label, id: e.id });
        if (prefer === "incoming") map.set(e.id, copy(e));
      }
    }
    return [...map.values()];
  }
  for (const [day, d] of Object.entries(incoming.days)) {
    if (!out.days[day]) out.days[day] = { goals: copy(d.goals), entries: [] };
    out.days[day].entries = union(
      out.days[day].entries,
      d.entries,
      "Registros " + day,
    );
  }
  out.exerciseBook = union(
    out.exerciseBook ?? [],
    incoming.exerciseBook ?? [],
    "Biblioteca propia",
  );
  out.skills.entries = union(
    out.skills.entries,
    incoming.skills.entries,
    "Calistenia",
  );
  out.favorites = union(out.favorites, incoming.favorites, "Favoritas");
  out.skillFavorites = union(
    out.skillFavorites,
    incoming.skillFavorites,
    "Favoritas de calistenia",
  );
  for (const type of ["goals", "templates", "sessions"])
    out.training[type] = union(
      out.training[type],
      incoming.training[type],
      type,
    );
  if (out.economy && incoming.economy)
    out.economy.customTitles = union(
      out.economy.customTitles ?? [],
      incoming.economy.customTitles ?? [],
      "Catálogo de títulos",
    );
  if (out.economy && incoming.economy)
    out.economy.rolls = union(
      out.economy.rolls,
      incoming.economy.rolls,
      "Cofres y títulos",
    );
  if (
    out.economy?.equipped &&
    !out.economy.rolls.some((r) => r.titleId === out.economy.equipped)
  )
    out.economy.equipped = null;
  out.shortcutOrder = [
    ...new Set([...out.shortcutOrder, ...incoming.shortcutOrder]),
  ];
  if (
    out.training.activeSessionId &&
    !out.training.sessions.some(
      (x) => x.id === out.training.activeSessionId && x.endedAt === null,
    )
  )
    out.training.activeSessionId = null;
  return { state: out, report };
}
export function progressInsights(s, today) {
  const currentStart = shift(today, -29),
    previousStart = shift(today, -59),
    entries = allExerciseEntries(s, today),
    groups = new Map();
  for (const e of entries) {
    if (e.day < previousStart) continue;
    const key = skillRecordKey(e) + "|" + e.weight;
    let g = groups.get(key);
    if (!g) {
      g = { entry: e, current: null, previous: null };
      groups.set(key, g);
    }
    const field = e.day >= currentStart ? "current" : "previous";
    if (!g[field] || e.value > g[field].value) g[field] = e;
  }
  const improvements = [...groups.values()]
    .filter(
      (g) => g.current && g.previous && g.current.value > g.previous.value,
    )
    .sort(
      (a, b) =>
        b.current.value / b.previous.value - a.current.value / a.previous.value,
    )
    .slice(0, 3)
    .map((g) => ({
      movement: g.current.movement,
      variation: g.current.variation,
      apparatus: g.current.apparatus,
      weight: g.current.weight,
      from: g.previous.value,
      to: g.current.value,
      metric: g.current.metric,
      key: skillRecordKey(g.current),
    }));
  return {
    activeDays: new Set(
      allJournalEntries(s, today)
        .filter((e) => e.day >= currentStart)
        .map((e) => e.day),
    ).size,
    improvements,
  };
}
