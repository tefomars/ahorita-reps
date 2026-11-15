import { WIKI_TITLES } from "./title-data.mjs";
export const RARITIES = [
  {
    id: "common",
    name: "Común",
    tickets: 76889,
    percent: "76.889 %",
    odds: "≈ 1 de 1.3",
  },
  { id: "rare", name: "Raro", tickets: 20000, percent: "20 %", odds: "1 de 5" },
  {
    id: "epic",
    name: "Épico",
    tickets: 3000,
    percent: "3 %",
    odds: "≈ 1 de 33.3",
  },
  {
    id: "legendary",
    name: "Legendario",
    tickets: 100,
    percent: "0.1 %",
    odds: "1 de 1000",
  },
  {
    id: "mythic",
    name: "Mítico",
    tickets: 10,
    percent: "0.01 %",
    odds: "1 de 10000",
  },
  {
    id: "secret",
    name: "Súper secreto",
    tickets: 1,
    percent: "0.001 %",
    odds: "1 de 100000",
  },
];
export const THEMES = [
  ["all", "Mixto"],
  ["dental", "Odontología"],
  ["minecraft", "Minecraft"],
  ["deepwoken", "Deepwoken"],
  ["custom", "Personalizados"],
];
// Direct names; rarity tiers are editorial choices for Reps.
const names = {
  dental: [
    ["Esmalte", "Dentina", "Encía", "Espejo dental"],
    ["Resina compuesta", "Periodonto", "Ápice", "Obturación"],
    ["Endodoncia", "Ortodoncia", "Implante dental", "Prótesis fija"],
    ["Corona dental", "Titanio", "Pulpa dental"],
    ["Hidroxiapatita", "Oclusión", "Cemento radicular"],
    ["Amelogénesis", "Odontogénesis"],
  ],
  minecraft: [
    ["Stone", "Coal", "Iron Ingot", "Crafting Table"],
    ["Diamond", "Obsidian", "Ender Pearl", "Enchanted Book"],
    ["Elytra", "Netherite Ingot", "Totem of Undying", "Warden"],
    ["Ender Dragon", "Nether Star", "Dragon Egg"],
    ["Mace", "Silence Armor Trim", "Wither"],
    ["Command Block", "Barrier"],
  ],
  deepwoken: [
    ["Pathfinder", "Gobletto", "Mudskipper", "Etris"],
    ["Jetstriker", "Blindseer", "Megalodaunt", "Isle of Vigils"],
    ["Silentheart", "Visionshaper", "Resonance", "Contractor"],
    ["Dawnwalker", "Duke Ishamon Erisia", "Scion of Ethiron"],
    ["Corrupted Resonance", "Drowned Resonance", "Amorus Pleeksty"],
    ["Deepwoken", "Ethiron"],
  ],
};
const legacy = Object.entries(names).flatMap(([theme, tiers]) =>
  tiers.flatMap((list, index) =>
    list.map((name, n) => ({
      id: `${theme}-${RARITIES[index].id}-${n + 1}`,
      name,
      theme,
      rarity: RARITIES[index].id,
    })),
  ),
);
const seen = new Set(legacy.map((t) => t.theme + "|" + t.name.toLowerCase()));
export const TITLES = [
  ...legacy.map((t) => ({
    ...t,
    rarity:
      WIKI_TITLES.find((w) => w.name === t.name && w.theme === t.theme)
        ?.rarity ?? t.rarity,
    category:
      WIKI_TITLES.find((w) => w.name === t.name && w.theme === t.theme)
        ?.category ?? (t.theme === "dental" ? "odontología" : "term"),
    reason:
      WIKI_TITLES.find((w) => w.name === t.name && w.theme === t.theme)
        ?.reason ?? "Rareza editorial de Reps según contexto y progresión.",
  })),
  ...WIKI_TITLES.filter((t) => {
    const key = t.theme + "|" + t.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }),
];
