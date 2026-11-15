import { validTitle, activeTitles } from "./title-pack.mjs";
import { TITLES } from "./title-catalog.mjs";
export function economyDefaults() {
  return { rolls: [], equipped: null, catalogMode: "append", customTitles: [] };
}
export function validateEconomy(state) {
  const e = state.economy;
  if (e === undefined) return;
  const fail = () => {
    throw Error("Colección o catálogo de títulos no válidos.");
  };
  if (
    !e ||
    !Array.isArray(e.rolls) ||
    (e.catalogMode !== undefined &&
      !["append", "replace"].includes(e.catalogMode)) ||
    (e.customTitles !== undefined &&
      (!Array.isArray(e.customTitles) ||
        e.customTitles.length > 10000 ||
        !e.customTitles.every(validTitle) ||
        new Set(e.customTitles.map((t) => t.id)).size !==
          e.customTitles.length))
  )
    fail();
  const known = new Set(
      [...TITLES, ...(e.customTitles ?? [])].map((t) => t.id),
    ),
    ids = new Set();
  for (const r of e.rolls) {
    if (
      !r ||
      typeof r.id !== "string" ||
      !r.id ||
      r.id.length > 100 ||
      ids.has(r.id) ||
      !Number.isFinite(r.at) ||
      r.at < 0 ||
      r.price !== 100 ||
      ![0, 25].includes(r.refund) ||
      (r.title !== undefined &&
        (!validTitle(r.title) || r.title.id !== r.titleId))
    )
      fail();
    ids.add(r.id);
    if (r.title) known.add(r.titleId);
  }
  if (
    e.rolls.some((r) => !known.has(r.titleId)) ||
    !(
      e.equipped === null ||
      (known.has(e.equipped) && e.rolls.some((r) => r.titleId === e.equipped))
    )
  )
    fail();
}

export function upgradeEconomy(state) {
  const e = state.economy;
  e.catalogMode ??= "append";
  e.customTitles ??= [];
  const catalog = new Map(
    [...TITLES, ...activeTitles(state)].map((t) => [t.id, t]),
  );
  for (const r of e.rolls)
    if (!r.title && catalog.has(r.titleId))
      r.title = { ...catalog.get(r.titleId) };
  return e;
}
