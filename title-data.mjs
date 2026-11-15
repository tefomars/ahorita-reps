// Rarities are editorial tiers for Reps, based on category and progression context.
const out = [];
function group(theme, rarity, category, reason, names) {
  for (const name of names.split("|"))
    out.push({
      id: `${theme}-wiki-${name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}`,
      name,
      theme,
      rarity,
      category,
      reason,
    });
}
group(
  "deepwoken",
  "common",
  "ingredient",
  "Ingrediente o material corriente.",
  "Gobletto|Browncap|Bluecap|Dentifilo|Gathered Wheat|Wood|Fiber|Stick|Sea Bass|Red Snapper",
);
group(
  "deepwoken",
  "common",
  "location",
  "Zona de exploración inicial o asentamiento.",
  "Etris|Isle of Vigils|Lower Erisia|Etrean Luminant",
);
group(
  "deepwoken",
  "common",
  "monster",
  "Enemigo de la progresión inicial.",
  "Mudskipper|Bandit|Bandit Captain",
);
group(
  "deepwoken",
  "common",
  "rank",
  "Identidad inicial o rango de progresión.",
  "Pathfinder|Initiate|Novice|Apprentice",
);
group(
  "deepwoken",
  "rare",
  "monster",
  "Criatura peligrosa; nivel inferior a sus variantes excepcionales.",
  "Megalodaunt|Terrapod|Lionfish|Thresher|Gigamed|Crab",
);
group(
  "deepwoken",
  "rare",
  "oath",
  "Juramento de progresión; rareza relativa editorial de Reps.",
  "Jetstriker|Blindseer|Oathless|Fadetrimmer",
);
group(
  "deepwoken",
  "rare",
  "location",
  "Zona de exploración con mayor riesgo.",
  "Songseeker Wilds|Starswept Valley|Greathive Aratel|Summer Isle|Miner’s Landing|Celtor Wastes",
);
group(
  "deepwoken",
  "rare",
  "weapon",
  "Arma de progresión, por debajo del grupo legendario.",
  "Katana|Vigil Longsword|Shattered Katana|Serpent’s Edge|Darksteel Greatsword|Flintlock|Dawnshot",
);
group(
  "deepwoken",
  "epic",
  "monster",
  "Variante o criatura avanzada de mayor peligro.",
  "Crimson Megalodaunt|Alpha Megalodaunt|Deep Owl|Nautilodaunt|King Thresher|Bone Keeper|Bounder|The Enforcer|Mudskipper Broodlord|Mechalodaunt|Crustaceous Rex",
);
group(
  "deepwoken",
  "epic",
  "oath",
  "Juramento especializado de progresión avanzada.",
  "Silentheart|Visionshaper|Starkindred|Arcwarder|Linkstrider|Chainwarden|Saltchemist|Bladeharper|Blightsurger|Soulbreaker|Saintsworn",
);
group(
  "deepwoken",
  "epic",
  "bell",
  "Resonance normal: habilidad individual de gran impacto.",
  "Crazy Slots|Sacred Field|Resonance",
);
group(
  "deepwoken",
  "epic",
  "location",
  "Lugar de progresión avanzada.",
  "Castle Light|The Depths|The Diluvian Mechanism|The Chime of Conflict|The Voidsea|The Eternal Gale",
);
group(
  "deepwoken",
  "legendary",
  "boss",
  "Boss importante; se distingue del dios al que representa.",
  "Duke Ishamon Erisia|The Ferryman|Chaser, Scholar of the Crimson Contract|Scion of Ethiron|Primadon, Titan of the East|Maestro Evengarde Rest",
);
group(
  "deepwoken",
  "legendary",
  "npc",
  "Personaje destacado por su papel y capacidades.",
  "Akira|Klaris|Aelita|Sibex|Lord Regent|Warden Jericho",
);
group(
  "deepwoken",
  "legendary",
  "weapon",
  "Arma del grupo legendario de la wiki; traducción editorial a Reps.",
  "Crypt Blade|Curved Blade of Winds|Gran Sudaruska|Stormseye|Pleeksty’s Inferno|Deepspindle|Flareblood Kamas|Ignition Deepcrusher|Iron Requiem|Rosen’s Hellflame|Soulthorn|Hailbreaker|Boltcrusher|Eye of Malice|Light’s Final Toll",
);
group(
  "deepwoken",
  "legendary",
  "oath",
  "Juramento de rango alto dentro de esta colección.",
  "Dawnwalker|Contractor",
);
group(
  "deepwoken",
  "legendary",
  "bell",
  "Resonance legendaria dentro del juego.",
  "Teleportation|Dimensional Travel",
);
group(
  "deepwoken",
  "legendary",
  "relic",
  "Objeto de categoría Relic; alto valor de progresión.",
  "Moonseye Tome|Idol of Yun’Shul|Sinner’s Ash|Smith’s Alloy|Armorer’s Needle|Pluripotent Alloy",
);
group(
  "deepwoken",
  "legendary",
  "location",
  "Escenario avanzado o vinculado al final de una ruta.",
  "New Kyrsa|Temple of Hearts|Crypt of the Unbroken",
);
group(
  "deepwoken",
  "mythic",
  "bell",
  "Resonance excepcional o variante extraordinaria.",
  "Corrupted Resonance|Drowned Resonance",
);
group(
  "deepwoken",
  "mythic",
  "relic",
  "Reliquia de enorme importancia en el lore.",
  "The Forge of Sin|The Coral Throne",
);
group(
  "deepwoken",
  "mythic",
  "npc",
  "Figura de gran poder y relevancia en el lore.",
  "Amorus Pleeksty|Kaide, the Drowned Light",
);
group(
  "deepwoken",
  "secret",
  "lore",
  "Soberano inmortal del lore; no un NPC tangible ordinario.",
  "Drallis Ehr",
);
group(
  "deepwoken",
  "secret",
  "lore",
  "Drowned God: escala distinta a un boss combatible.",
  "Ethiron|Yun’Shul, Keeper of Hearts|Korilfiend",
);
group(
  "deepwoken",
  "secret",
  "lore",
  "Término central y excepcional del lore, reservado al rango más alto.",
  "Deepwoken",
);
group(
  "minecraft",
  "common",
  "item",
  "Recurso corriente de exploración o construcción.",
  "Stone|Cobblestone|Oak Log|Coal|Iron Ingot|Crafting Table|Torch|Redstone Dust",
);
group(
  "minecraft",
  "common",
  "mob",
  "Criatura habitual del mundo.",
  "Zombie|Skeleton|Creeper|Villager",
);
group(
  "minecraft",
  "rare",
  "item",
  "Recurso u objeto de progreso intermedio.",
  "Diamond|Obsidian|Ender Pearl|Enchanted Book|Blaze Rod",
);
group(
  "minecraft",
  "rare",
  "location",
  "Lugar de exploración con retos específicos.",
  "Nether Fortress|Stronghold|Ocean Monument",
);
group(
  "minecraft",
  "epic",
  "item",
  "Equipo o tesoro de progresión avanzada.",
  "Elytra|Netherite Ingot|Totem of Undying|Ancient Debris|Trident|Heavy Core",
);
group(
  "minecraft",
  "epic",
  "mob",
  "Enemigo de alto peligro en la exploración.",
  "Warden|Elder Guardian",
);
group(
  "minecraft",
  "legendary",
  "boss",
  "Boss principal o recompensa ligada a un reto mayor.",
  "Ender Dragon|Wither|Nether Star|Dragon Egg",
);
group(
  "minecraft",
  "mythic",
  "item",
  "Objeto de progresión excepcional, con rango editorial de Reps.",
  "Mace|Silence Armor Trim",
);
group(
  "minecraft",
  "secret",
  "administrative",
  "Objeto administrativo excepcional, fuera de la progresión normal.",
  "Command Block|Barrier",
);
export const WIKI_TITLES = out;
