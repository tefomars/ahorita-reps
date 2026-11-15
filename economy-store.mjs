import { TITLES } from "./title-catalog.mjs";
export function economyDefaults() {
  return { rolls: [], equipped: null };
}
export function validateEconomy(state) {
  const e = state.economy;
  if (e === undefined) return;
  const title = (id) => TITLES.some((t) => t.id === id);
  if (
    !e ||
    !Array.isArray(e.rolls) ||
    !e.rolls.every(
      (r) =>
        r &&
        typeof r.id === "string" &&
        r.id.length > 0 &&
        r.id.length <= 100 &&
        Number.isFinite(r.at) &&
        r.at >= 0 &&
        title(r.titleId) &&
        r.price === 100 &&
        [0, 25].includes(r.refund),
    ) ||
    new Set(e.rolls.map((r) => r.id)).size !== e.rolls.length ||
    !(
      e.equipped === null ||
      (title(e.equipped) && e.rolls.some((r) => r.titleId === e.equipped))
    )
  )
    throw Error("Colección o movimientos de monedas no válidos.");
}
