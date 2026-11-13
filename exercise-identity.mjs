import { normalizeSearch } from "./exercise-library.mjs";
const compact = (s) => normalizeSearch(s).replaceAll(" ", "");
const explicit = {
  rows: ["rows", "Inverted rows"],
  australianpullups: ["rows", "Inverted rows"],
  inclinepushups: ["pushups", "Pushups", "Inclinada"],
  declinepushups: ["pushups", "Pushups", "Declinada"],
  pushups: ["pushups", "Pushups"],
  pullups: ["pullups", "Pull-ups"],
  chinups: ["pullups", "Chin-ups"],
  neutralgrippullups: ["pullups", "Neutral grip pull-ups"],
};
export function identifyExercise(catalog, e) {
  let family = e.family,
    movement = e.movement,
    variation = e.variation || "Estándar";
  if (e.source === "base" || family === "base" || family === "other") {
    const mapped = explicit[compact(movement)];
    let found =
      mapped && e.metric === "reps"
        ? { family: mapped[0], movement: mapped[1], variation: mapped[2] }
        : null;
    if (!found) {
      outer: for (const [id, c] of Object.entries(catalog)) {
        if (id === "other") continue;
        for (const m of c.movements) {
          if (
            m.metric !== e.metric ||
            ["statichold", "negativas", "bottomhold"].includes(compact(m.name))
          )
            continue;
          if (
            [m.name, m.es, ...(m.aliases ?? [])]
              .filter(Boolean)
              .some((x) => compact(x) === compact(movement))
          ) {
            found = { family: id, movement: m.name };
            break outer;
          }
        }
      }
    }
    if (found) {
      family = found.family;
      movement = found.movement;
      if (found.variation && (!e.variation || e.variation === "Estándar"))
        variation = found.variation;
    } else family = "other";
  }
  if (variation === "Solo izquierda") variation = "Izquierda";
  if (variation === "Solo derecha") variation = "Derecha";
  return { family, movement, variation };
}
export function profileId(catalog, e) {
  const x = identifyExercise(catalog, e);
  return JSON.stringify([x.family, compact(x.movement), e.metric]);
}
