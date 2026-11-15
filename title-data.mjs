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
  "deepwoken",
  "common",
  "food",
  "Comida sencilla o bebida cotidiana; rango editorial de Reps.",
  "Bread|Cake|Cheese|Cooked Egg|Cooked Fish|Cooked Squid|Dried Seaweed|Fruit Salad|Mushroom Soup|Noodles|Omelette|Redd Juice|Sticky Bun|Tankard of Ongo Juice|Tankard of Plumfruit Juice",
);
group(
  "deepwoken",
  "rare",
  "food",
  "Plato preparado o receta con varios ingredientes; rango editorial de Reps.",
  "Calamari|Candied Fruit|Crab Pizza|Crab Stuffed Browncaps|Fish Omelette|Fish Stew|Fruit Cake|Glazed Fish|Grilled Cheese|Kyrsdog|Magic Bean|Megurger|Mushroom Bisque|Mushroom Omelette|Plain Boiled Brined Aged Fermented Hotdog|Plumfruit Muffin|Pumpkin Pie|Sauteed Scallops|Seafood Boil|Seafood Surprise|Squelcap Pilaf|Sushi|Urchin Stew|Scholar's Brew",
);
group(
  "deepwoken",
  "rare",
  "food",
  "Dulce o consumible especial; rareza editorial, no probabilidad oficial de obtención.",
  "Candy|Candy Suncorn|Toffee|YUM YUM BAR|Sweetgourd|Ambrosial Chum",
);
group(
  "deepwoken",
  "epic",
  "food",
  "Comida ligada a ingredientes de criaturas mayores; rango editorial de Reps.",
  "Dread Filet|Heavy Steak|Primal Cutlet|Grilled Parasol Brain",
);
group(
  "deepwoken",
  "common",
  "ingredient",
  "Fruta o material de recolección usado en recetas.",
  "Calabash|Redd|Ongo|Pomar|Plumfruit|Beeswax|Bamboo Bundle|Marram Grass|Egg|Sap|Fish Meat",
);
group(
  "deepwoken",
  "rare",
  "ingredient",
  "Recolección de zonas particulares o ingrediente de criaturas; rango editorial.",
  "Glumfig|Alestrian Coral|Scallop|Urchin|Thresher Egg|Crustacean Meat|Arkasid Pupa",
);
group(
  "deepwoken",
  "common",
  "ore",
  "Mineral básico de fabricación.",
  "Rock|Coal|Iron|Gold",
);
group(
  "deepwoken",
  "rare",
  "ore",
  "Mineral de fabricación más especializado; rango editorial.",
  "Erisore|Irithine|Astruline|Umbrite",
);
group(
  "deepwoken",
  "rare",
  "monster",
  "Criatura o guardián de exploración; rango editorial de Reps.",
  "Brainsucker|Carbuncle|Rock Golem|Stone Knight|Stonespark|Arkasid|Mudskipper Brute|Mudskipper Knight|Bloatskipper|Sworn Angel|Hollow Angel|Diver Husk",
);
group(
  "deepwoken",
  "epic",
  "monster",
  "Variante peligrosa o criatura de progresión avanzada; rango editorial de Reps.",
  "Crimson Terrapod|Deep Widow|Blizzard Knight|Hive Construct|Rogue Construct|Glacial Lionfish|King Gigamed|Fury Nautilodaunt|Nautilodaunt Officiate|Ghost Bounder|Nightmare Thresher|Kyrsgarde Brute|Kyrsgarde Crawler|Kyrsgarde Lancer|Kyrsgarde Sniper|Golem Prime|Immortal Guardian|Nightmare Immortal Guardian|Ministry Necromancer|Maljuror|Grudge|Semblance|Ghost",
);
group(
  "deepwoken",
  "legendary",
  "monster",
  "Variante excepcional o guardián destacado; rango editorial de Reps.",
  "Exotic Megalodaunt|Prime Megalodaunt|Moon Knight|Parliament",
);
group(
  "deepwoken",
  "legendary",
  "boss",
  "Boss o amenaza mayor; rango editorial de Reps.",
  "Dread Serpent|Elder Primadon, The Titan Warlord|The Doom of Caeranthil|Interluminary Parasol",
);
group(
  "deepwoken",
  "rare",
  "drop",
  "Material obtenido de criaturas; rango editorial de Reps.",
  "Megalodaunt Hide|Megalodaunt Coral|Strange Claw|Terrapod Shell|Thresher Spine|Thresher Talon|Lionfish Scale",
);
group(
  "deepwoken",
  "epic",
  "drop",
  "Material de criaturas avanzadas; rango editorial de Reps.",
  "Exotic Hide|King Thresher Spine|Dark Feather|Void Feather|Worn Cog|Broken Gatling Gun|Enforcer Eye|Nautilodaunt Beak|Odd Tentacle|Giant Femur|Bounder Claw|Frozen Membrane|Kyrsan Schematic",
);
group(
  "deepwoken",
  "epic",
  "mantra modifier",
  "Modificador para personalizar mantras; rango editorial de Reps.",
  "Cloudstone|Stratus Stone|Crystal Lens|Perfect Lens|Aeon Logstone|Eternal Logstone|Drift Shard|Rush Shard|Amnesic Driftwood|Glass Stone|Magnifying Stone|Vibrant Gem|Blast Spark|Magnet Spark|Multiplying Spark|Reversal Spark|Round Spark|Spring Spark|Tornado Spark",
);
group(
  "deepwoken",
  "epic",
  "deep gem",
  "Gema para modificar mantras; rango editorial de Reps.",
  "Aegis Gem|Blessed Gem|Bloodless Gem|Blue Gem|Insignia Gem|Wayward Gem|Wind Gem",
);
group(
  "deepwoken",
  "epic",
  "primordial lotus",
  "Ingrediente para entrenar atributos; rango editorial de Reps.",
  "Hellfire Lotus|Empyrean Lotus|Zephyr Lotus|Brilliant Lotus|Skyvalor Lotus|Miasmic Lotus",
);
group(
  "deepwoken",
  "rare",
  "elemental ingredient",
  "Ingrediente asociado a una attunement; rango editorial de Reps.",
  "Dying Embers|Frigid Prism|Spark Gland|Gale Stone|Umbral Obsidian|Heartstar",
);
group(
  "deepwoken",
  "rare",
  "npc",
  "Personaje vinculado a la cocina y sus encargos; rango editorial de Reps.",
  "Chef Buongustino|Chef Odiolavoro",
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
