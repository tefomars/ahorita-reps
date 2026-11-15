import { TITLES, RARITIES, THEMES } from "./title-catalog.mjs";
export const TITLE_PACK_EXAMPLE = {
  format: "reps.titles.v1",
  titles: [
    {
      id: "my-gobletto",
      name: "Gobletto",
      theme: "deepwoken",
      rarity: "common",
      category: "ingredient",
      reason: "Common ingredient.",
    },
    {
      id: "my-akira",
      name: "Akira",
      theme: "deepwoken",
      rarity: "legendary",
      category: "npc",
      reason: "The Black Diver; high-tier character in this collection.",
    },
  ],
};
export const TITLE_AI_PROMPT = `Create a JSON title pack for my personal Reps app. Return ONLY valid JSON with this exact structure: {"format":"reps.titles.v1","titles":[{"id":"unique-stable-slug","name":"Gobletto","theme":"deepwoken","rarity":"common","category":"ingredient","reason":"Short context for the assigned tier."}]}. Use direct canonical names, not invented modifiers. Minecraft and Deepwoken names must be in English. Themes: dental, minecraft, deepwoken, custom. Rarities: common, rare, epic, legendary, mythic, secret. Categories are short plain text. Research context before assigning rarity: common materials/early enemies low; advanced variants, bosses, rare items and lore figures higher. These are editorial Reps tiers, not claims about the game's official rarity system. Keep IDs unique and stable; use a new ID for a new identity. Do not include URLs, HTML or Markdown fences. reason: max 500 characters; name: max 120. To replace the ENTIRE rollable catalog, include at least one title in EACH of the six rarities so a mixed chest can preserve its published odds. Partial packs can be added to the existing catalog. Ask me for desired themes and approximate count if unspecified.`;
export function validTitle(t) {
  return !!(
    t &&
    typeof t.id === "string" &&
    /^[a-zA-Z0-9_-]{1,100}$/.test(t.id) &&
    typeof t.name === "string" &&
    t.name.trim() &&
    t.name.length <= 120 &&
    THEMES.some((x) => x[0] === t.theme && x[0] !== "all") &&
    RARITIES.some((r) => r.id === t.rarity) &&
    ["category", "reason"].every(
      (k) =>
        t[k] === undefined ||
        (typeof t[k] === "string" &&
          t[k].length <= (k === "reason" ? 500 : 80)),
    )
  );
}
export function activeTitles(state) {
  const e = state.economy ?? {},
    map = new Map(
      (e.catalogMode === "replace" ? [] : TITLES).map((t) => [t.id, t]),
    );
  for (const t of e.customTitles ?? []) map.set(t.id, t);
  return [...map.values()];
}
export function allTitles(state) {
  const map = new Map(activeTitles(state).map((t) => [t.id, t]));
  for (const r of state.economy?.rolls ?? []) {
    if (r.title) map.set(r.titleId, r.title);
    else if (!map.has(r.titleId)) {
      const t = TITLES.find((t) => t.id === r.titleId);
      if (t) map.set(t.id, t);
    }
  }
  return [...map.values()];
}
export function themeReady(state, theme = "all") {
  return RARITIES.every((r) =>
    activeTitles(state).some(
      (t) => t.rarity === r.id && (theme === "all" || t.theme === theme),
    ),
  );
}
export function parseTitlePack(raw) {
  if (raw.length > 2 * 1024 * 1024) throw Error("La lista supera 2 MB.");
  let p;
  try {
    p = JSON.parse(raw);
  } catch {
    throw Error("JSON inválido: pega el objeto sin texto adicional.");
  }
  if (
    p?.format !== "reps.titles.v1" ||
    !Array.isArray(p.titles) ||
    !p.titles.length ||
    p.titles.length > 10000 ||
    !p.titles.every(validTitle) ||
    new Set(p.titles.map((t) => t.id)).size !== p.titles.length
  )
    throw Error(
      "Revisa formato, IDs únicos, nombres, temas y rarezas. Máximo 10000 títulos.",
    );
  return {
    format: p.format,
    titles: p.titles.map((t) => ({
      id: t.id,
      name: t.name.trim(),
      theme: t.theme,
      rarity: t.rarity,
      category: t.category ?? "term",
      reason: t.reason ?? "",
    })),
  };
}
export function applyTitlePack(state, pack, mode) {
  if (!["append", "replace"].includes(mode)) throw Error("Modo inválido.");
  const owned = new Map(
    allTitles(state)
      .filter((t) => state.economy.rolls.some((r) => r.titleId === t.id))
      .map((t) => [t.id, t]),
  );
  for (const t of pack.titles) {
    const old = owned.get(t.id);
    if (old && ["name", "rarity", "theme"].some((k) => old[k] !== t[k]))
      throw Error(
        `El ID ${t.id} ya está en tu colección con otros datos. Usa un ID nuevo.`,
      );
  }
  for (const r of state.economy.rolls)
    if (!r.title) r.title = owned.get(r.titleId);
  if (mode === "replace") {
    state.economy.catalogMode = "replace";
    state.economy.customTitles = structuredClone(pack.titles);
  } else {
    const map = new Map(
      (state.economy.customTitles ?? []).map((t) => [t.id, t]),
    );
    for (const t of pack.titles) map.set(t.id, structuredClone(t));
    if (map.size > 10000) throw Error("Máximo 10000 títulos personalizados.");
    state.economy.customTitles = [...map.values()];
  }
  return { count: activeTitles(state).length, ready: themeReady(state) };
}
