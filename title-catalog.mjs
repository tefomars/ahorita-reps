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
];
// Original title combinations inspired by terminology; rarity is specific to Reps.
const names = {
  dental: [
    [
      "Explorador del Esmalte",
      "Aprendiz de la Sonda",
      "Guardián de la Encía",
      "Portador del Espejo",
    ],
    [
      "Escultor de Resina",
      "Centinela de la Dentina",
      "Arquitecto de la Oclusión",
      "Custodio del Periodonto",
    ],
    [
      "Endodoncista de Acero",
      "Maestro de la Obturación",
      "Paladín del Esmalte",
      "Forjador de Sonrisas",
    ],
    ["Soberano de la Corona", "Titán del Titanio", "Oráculo de la Pulpa"],
    [
      "Monarca de la Hidroxiapatita",
      "Arcángel de la Oclusión",
      "Guardián del Ápice Eterno",
    ],
    ["El Molar Primordial", "La Última Cúspide"],
  ],
  minecraft: [
    [
      "Minero de Piedra",
      "Aprendiz de Redstone",
      "Guardián del Overworld",
      "Portador del Pico",
    ],
    [
      "Explorador del Nether",
      "Guardián de Obsidiana",
      "Forjador de Diamante",
      "Viajero del End",
    ],
    [
      "Alas de Elytra",
      "Arquitecto de Redstone",
      "Corazón de Netherite",
      "Centinela del Warden",
    ],
    [
      "Soberano del Ender Dragon",
      "Portador de la Nether Star",
      "Guardián del Dragon Egg",
    ],
    [
      "Elytra del Vacío Eterno",
      "Monarca de Ancient Debris",
      "Eco del Último Enderman",
    ],
    ["El Bloque Antes del Mundo", "El Último Chunk"],
  ],
  deepwoken: [
    [
      "Pathfinder Novato",
      "Viajero de Etris",
      "Aprendiz de los Oaths",
      "Eco de Erisia",
    ],
    [
      "Jetstriker del Alba",
      "Vigía Blindseer",
      "Guardián de los Oaths",
      "Caminante de las Depths",
    ],
    [
      "Silentheart Inquebrantable",
      "Visionshaper del Vacío",
      "Resonancia Despierta",
      "Contractor de Acero",
    ],
    [
      "Dawnwalker Eterno",
      "Heredero de Duke Erisia",
      "Eco del Scion of Ethiron",
    ],
    [
      "Campana de Yun’Shul",
      "Portador de Resonancia Corrupta",
      "Guardián de Layer 2",
    ],
    ["La Canción Antes del Abismo", "El Corazón que Yun’Shul Olvidó"],
  ],
};
export const TITLES = Object.entries(names).flatMap(([theme, tiers]) =>
  tiers.flatMap((list, index) =>
    list.map((name, n) => ({
      id: `${theme}-${RARITIES[index].id}-${n + 1}`,
      name,
      theme,
      rarity: RARITIES[index].id,
    })),
  ),
);
export const TITLE_SOURCES = [
  {
    name: "Deepwoken Wiki · Oaths",
    url: "https://deepwoken.fandom.com/wiki/Oaths",
  },
  {
    name: "Deepwoken Wiki · Resonance",
    url: "https://deepwoken.fandom.com/wiki/Resonance",
  },
  {
    name: "Minecraft Wiki · Encyclopedia",
    url: "https://minecraft.wiki/w/Encyclopedia",
  },
  {
    name: "Minecraft Wiki · Advancement",
    url: "https://minecraft.wiki/w/Advancement",
  },
];
