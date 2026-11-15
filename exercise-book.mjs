import {
  skillCatalog,
  defaultSkill,
  validSkillConfig,
  allJournalEntries,
  exerciseProfileId,
  suggestedCounterGroup,
  inferCounterSide,
} from "./skills-core.mjs";
export function validateExerciseBook(s) {
  if (s.exerciseBook === undefined) return;
  if (
    !Array.isArray(s.exerciseBook) ||
    s.exerciseBook.length > 1000 ||
    !s.exerciseBook.every(
      (e) =>
        e &&
        typeof e.id === "string" &&
        e.id.length <= 100 &&
        validSkillConfig(e.config) &&
        typeof e.description === "string" &&
        e.description.length <= 1000 &&
        Array.isArray(e.aliases) &&
        e.aliases.length <= 20 &&
        e.aliases.every((a) => typeof a === "string" && a.length <= 80),
    ) ||
    new Set(s.exerciseBook.map((e) => e.id)).size !== s.exerciseBook.length
  )
    throw Error("Biblioteca de ejercicios no válida.");
}
export function logConfig(e) {
  const c = {
    ...defaultSkill(e.family === "base" ? "other" : e.family),
    movement: e.movement,
    metric: e.metric,
    variation: e.variation,
    apparatus: e.apparatus || skillCatalog[e.family]?.apparatus[0] || "Otro",
    support: e.support ?? "Libre",
    supportNote: e.supportNote ?? "",
    weight: e.weight ?? 0,
    notes: "",
    counterGroup:
      e.source === "base"
        ? e.baseGroup
        : Object.hasOwn(e, "counterGroup")
          ? e.counterGroup
          : suggestedCounterGroup(e),
    counterSide: e.counterSide ?? inferCounterSide(e),
  };
  return c;
}
export function exerciseProfiles(s, today) {
  const map = new Map();
  for (const [family, c] of Object.entries(skillCatalog)) {
    if (family === "other") continue;
    for (const m of c.movements) {
      const config = {
        ...defaultSkill(family),
        movement: m.name,
        metric: m.metric,
        variation: (m.variations ?? c.variations)[0],
      };
      config.counterGroup = suggestedCounterGroup(config);
      map.set(exerciseProfileId(config), {
        id: exerciseProfileId(config),
        family,
        name: m.name,
        familyName: c.name,
        config,
        aliases: [m.es ?? "", ...(m.aliases ?? [])],
        description: `${c.name} · ${m.es ?? m.name}. Se registra en ${m.metric === "seconds" ? "segundos" : "repeticiones"}.`,
        equipment: c.apparatus,
        variations: m.variations ?? c.variations,
      });
    }
  }
  for (const e of allJournalEntries(s, today)) {
    const id = exerciseProfileId(e);
    if (!map.has(id)) {
      const config = logConfig(e);
      map.set(id, {
        id,
        family: e.family,
        name: e.movement,
        familyName: skillCatalog[e.family]?.name ?? "Propio",
        config,
        aliases: [],
        description: "Ejercicio de tu historial.",
        equipment: [config.apparatus],
        variations: [config.variation],
      });
    }
  }
  for (const e of s.exerciseBook ?? []) {
    const id = exerciseProfileId(e.config),
      old = map.get(id);
    map.set(id, {
      ...(old ?? {
        id,
        family: e.config.family,
        name: e.config.movement,
        familyName: skillCatalog[e.config.family].name,
        equipment: [e.config.apparatus],
        variations: [e.config.variation],
      }),
      config: e.config,
      bookId: e.id,
      aliases: [...new Set([...(old?.aliases ?? []), ...e.aliases])],
      description:
        e.description || old?.description || "Ejercicio propio guardado.",
    });
  }
  return [...map.values()];
}
export function saveExercise(s, entry) {
  if (!validSkillConfig(entry.config))
    throw Error("Revisa ejercicio, variante y equipo.");
  const profile = exerciseProfileId(entry.config),
    old = s.exerciseBook.find((e) => exerciseProfileId(e.config) === profile);
  if (old) entry = { ...entry, id: old.id };
  const next = s.exerciseBook.filter(
    (e) => exerciseProfileId(e.config) !== profile,
  );
  next.push(entry);
  if (next.length > 1000) throw Error("Máximo 1000 ejercicios propios.");
  if (entry.aliases?.length > 20)
    throw Error("Usa hasta 20 nombres alternativos.");
  validateExerciseBook({ ...s, exerciseBook: next });
  s.exerciseBook = next;
  return profile;
}
