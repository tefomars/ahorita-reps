import {
  allExerciseEntries,
  exerciseProfileId,
  skillRecordKey,
} from "./skills-core.mjs";
import { setExperience, levelFromXP } from "./experience-core.mjs";
import { logConfig, exerciseProfiles } from "./exercise-book.mjs";
function collect(entries, book = []) {
  const map = new Map();
  for (const e of entries) {
    const id = exerciseProfileId(e);
    if (!map.has(id)) map.set(id, { id, config: logConfig(e), entries: [] });
    map.get(id).entries.push(e);
  }
  for (const e of book) {
    const id = exerciseProfileId(e.config);
    if (!map.has(id)) map.set(id, { id, config: e.config, entries: [] });
  }
  return [...map.values()].map((p) => {
    const es = p.entries,
      metric = p.config.metric,
      days = new Set(es.map((e) => e.day)),
      contexts = new Map();
    let total = 0,
      volume = 0,
      xp = 0;
    for (const e of es) {
      total += e.value;
      volume += e.weight * e.value;
      xp += setExperience(e).xp;
      const key = skillRecordKey(e);
      if (!contexts.has(key))
        contexts.set(key, {
          key,
          entry: e,
          total: 0,
          sets: 0,
          best: 0,
          maxWeight: 0,
          weights: new Map(),
          xp: 0,
        });
      const c = contexts.get(key);
      c.total += e.value;
      c.sets++;
      c.best = Math.max(c.best, e.value);
      c.maxWeight = Math.max(c.maxWeight, e.weight);
      c.xp += setExperience(e).xp;
      c.weights.set(e.weight, Math.max(c.weights.get(e.weight) ?? 0, e.value));
    }
    const tracks = [];
    function track(kind, name, value, step, xpPer, coinsPer, context = null) {
      const rank = Math.floor((value + 1e-8) / step);
      tracks.push({
        id: `mastery:${p.id}:${kind}${context ? "|" + context.key : ""}`,
        kind,
        name,
        value,
        step,
        rank,
        next: (rank + 1) * step,
        xpPer,
        coinsPer,
        context,
        config: context ? logConfig(context.entry) : p.config,
      });
    }
    const unit = metric === "seconds" ? "s" : "reps";
    track(
      "volume",
      `Total ${p.config.movement} (${unit})`,
      total,
      metric === "seconds" ? 300 : 100,
      20,
      5,
    );
    track("sets", `Series de ${p.config.movement}`, es.length, 10, 15, 5);
    track("days", `Días de ${p.config.movement}`, days.size, 5, 30, 10);
    track(
      "load-volume",
      `Volumen con lastre · ${p.config.movement} (lb·${unit})`,
      volume,
      1000,
      20,
      5,
    );
    for (const c of contexts.values()) {
      const label = [
        c.entry.variation,
        c.entry.apparatus,
        c.entry.support === "Libre"
          ? "Libre"
          : c.entry.support + ": " + c.entry.supportNote,
      ]
        .filter(Boolean)
        .join(" · ");
      for (const [weight, best] of c.weights) {
        const atWeight = { ...c, entry: { ...c.entry, weight } };
        track(
          `best-${weight}`,
          `${p.config.movement} · ${label} · +${weight} lb · mejor ${unit}`,
          best,
          5,
          20,
          5,
          atWeight,
        );
      }
      if (c.entry.support === "Libre")
        track(
          "weight",
          `${p.config.movement} · ${label} · lastre (lb)`,
          c.maxWeight,
          10,
          25,
          8,
          c,
        );
    }
    return {
      ...p,
      total: Math.round(total * 10) / 10,
      volume,
      days: days.size,
      sets: es.length,
      xp: Math.floor(xp),
      mastery: levelFromXP(Math.floor(xp)),
      contexts: [...contexts.values()],
      tracks,
    };
  });
}
export function masterySummary(s, today) {
  const entries = allExerciseEntries(s, today),
    seeds = exerciseProfiles(s, today).map((p) => ({ config: p.config })),
    profiles = collect(entries, seeds),
    previous = collect(
      entries.filter((e) => e.day < today),
      seeds,
    );
  const rewards = (ps) =>
      ps
        .flatMap((p) => p.tracks)
        .reduce(
          (a, t) => ({
            xp: a.xp + t.rank * t.xpPer,
            coins: a.coins + t.rank * t.coinsPer,
            count: a.count + t.rank,
          }),
          { xp: 0, coins: 0, count: 0 },
        ),
    earned = rewards(profiles),
    before = rewards(previous);
  const achievements = profiles.flatMap((p) =>
    p.tracks.flatMap((t) => {
      const make = (rank, won) => ({
        id: `${t.id}:${rank}`,
        name: `${t.name} · rango ${rank}`,
        family: p.config.family,
        profileId: p.id,
        description: `Ruta sin límite. ${t.context ? "Misma variante, equipo y asistencia." : "Acumulado de series completadas, incluidas asistidas."} Cada ${t.step} unidades avanza otro rango.`,
        metric: p.config.metric,
        mode: t.kind,
        target: rank * t.step,
        value: t.value,
        earned: won,
        earnedDay: null,
        percent: Math.min(100, (t.value / (rank * t.step)) * 100),
        xp: t.xpPer,
        coins: t.coinsPer,
        config: t.config,
        infinite: true,
        rank,
      });
      return [...(t.rank ? [make(t.rank, true)] : []), make(t.rank + 1, false)];
    }),
  );
  return { profiles, achievements, ...earned, todayXP: earned.xp - before.xp };
}
