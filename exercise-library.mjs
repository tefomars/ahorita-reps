// Search names are aliases only: stored exercise IDs and previous records do not change.
export const skillCategories = [
  ["all", "Todo"],
  ["levers", "Palancas"],
  ["balance", "Equilibrios"],
  ["statics", "Estáticos"],
  ["pull", "Tirón"],
  ["push", "Empuje"],
  ["core", "Core"],
  ["legs", "Piernas"],
  ["mobility", "Movilidad"],
];
export const familyInfo = {
  front: {
    category: "levers",
    es: "Palanca frontal",
    aliases: ["front lever", "palanca anterior", "palanca frontal"],
  },
  back: {
    category: "levers",
    es: "Palanca trasera",
    aliases: ["back lever", "palanca dorsal", "palanca posterior"],
  },
  planche: {
    category: "statics",
    es: "Plancha",
    aliases: ["planch", "plancha gimnastica"],
  },
  muscle: {
    category: "pull",
    es: "Muscle-ups",
    aliases: ["muscle up", "muscleup", "dominada con transicion"],
  },
  other: {
    category: "other",
    es: "Personalizado",
    aliases: ["custom", "propio", "otro"],
  },
};
const move = (name, metric, es, variations, aliases = []) => ({
  name,
  metric,
  es,
  aliases,
  ...(variations ? { variations } : {}),
});
const family = (
  name,
  es,
  category,
  apparatus,
  variations,
  movements,
  aliases = [],
) => ({ name, es, category, apparatus, variations, movements, aliases });
const leverVariants = [
  "Tuck",
  "Advanced tuck",
  "One leg · izquierda",
  "One leg · derecha",
  "Straddle",
  "Half lay",
  "Full",
];
const sides = ["Izquierda", "Derecha"];
export const extraSkills = {
  flag: family(
    "Human flag",
    "Bandera humana",
    "levers",
    ["Barra vertical", "Espaldera"],
    [
      "Tuck · izquierda",
      "Tuck · derecha",
      "One leg · izquierda",
      "One leg · derecha",
      "Straddle · izquierda",
      "Straddle · derecha",
      "Full · izquierda",
      "Full · derecha",
      "Vertical · izquierda",
      "Vertical · derecha",
    ],
    [
      move("Static hold", "seconds", "Aguante estático"),
      move("Flag raises", "reps", "Elevaciones de bandera"),
      move("Flag pulls", "reps", "Tirones de bandera"),
      move("Negativas", "reps", "Descensos controlados"),
    ],
    ["bandera", "humanflag"],
  ),
  dragon: family(
    "Dragon flag",
    "Bandera dragón",
    "levers",
    ["Banco", "Suelo"],
    leverVariants,
    [
      move("Static hold", "seconds", "Aguante estático"),
      move("Dragon flag raises", "reps", "Elevaciones de bandera dragón"),
      move("Negativas", "reps", "Descensos controlados"),
    ],
    ["dragonflag", "bandera del dragon"],
  ),
  handstand: family(
    "Handstand",
    "Pino / parada de manos",
    "balance",
    ["Suelo", "Paralelas", "Anillas"],
    [
      "Pecho a pared",
      "Espalda a pared",
      "Libre",
      "Una mano · izquierda",
      "Una mano · derecha",
    ],
    [
      move("Static hold", "seconds", "Aguante estático"),
      move("Handstand press", "reps", "Subidas a pino", [
        "Tuck",
        "Straddle",
        "Pike",
      ]),
      move("Handstand shoulder taps", "reps", "Toques de hombro", [
        "Pared",
        "Libre",
      ]),
      move("Handstand walking", "reps", "Pasos caminando de manos", ["Libre"]),
    ],
    [
      "pino",
      "vertical",
      "parado de manos",
      "parada de manos",
      "equilibrio de manos",
      "hand stand",
    ],
  ),
  headstand: family(
    "Headstand",
    "Parada de cabeza",
    "balance",
    ["Suelo", "Paralelas"],
    ["Trípode", "Antebrazos"],
    [move("Static hold", "seconds", "Aguante estático")],
    ["head stand", "pino de cabeza"],
  ),
  frog: family(
    "Frog stand",
    "Equilibrio de rana",
    "balance",
    ["Suelo", "Paralelas"],
    ["Estándar", "Advanced frog stand"],
    [move("Static hold", "seconds", "Aguante estático")],
    ["crow pose", "cuervo", "rana", "frogstand"],
  ),
  elbow: family(
    "Elbow lever",
    "Palanca de codos",
    "balance",
    ["Suelo", "Paralelas"],
    [
      "Dos brazos",
      "Un brazo · izquierda",
      "Un brazo · derecha",
      "Straddle",
      "Full",
    ],
    [move("Static hold", "seconds", "Aguante estático")],
    ["crocodile", "cocodrilo", "equilibrio sobre codos"],
  ),
  lsit: family(
    "L-sit",
    "Soporte en L",
    "statics",
    ["Paralelas", "Suelo", "Anillas", "Barra"],
    ["Tuck", "One leg · izquierda", "One leg · derecha", "Full"],
    [
      move("Static hold", "seconds", "Aguante estático"),
      move("L-sit raises", "reps", "Elevaciones a L-sit"),
    ],
    ["lsit", "l sit", "ele", "escuadra", "sentado en l"],
  ),
  vsit: family(
    "V-sit",
    "Soporte en V",
    "statics",
    ["Paralelas", "Suelo", "Anillas"],
    ["Tuck", "Straddle", "Full"],
    [
      move("Static hold", "seconds", "Aguante estático"),
      move("Compression lifts", "reps", "Elevaciones de compresión"),
    ],
    ["vsit", "v sit", "uve", "compresion en v"],
  ),
  manna: family(
    "Manna",
    "Manna",
    "statics",
    ["Suelo", "Paralelas"],
    ["Tuck", "Straddle", "Full"],
    [move("Static hold", "seconds", "Aguante estático")],
    ["mana"],
  ),
  cross: family(
    "Iron cross",
    "Cristo en anillas",
    "statics",
    ["Anillas"],
    ["Full"],
    [
      move("Static hold", "seconds", "Aguante estático"),
      move("Cross pulls", "reps", "Tirones de cristo"),
    ],
    ["cruz de hierro", "cristo", "cruz en anillas"],
  ),
  maltese: family(
    "Maltese",
    "Plancha maltesa",
    "statics",
    ["Anillas", "Suelo", "Paralelas"],
    ["Tuck", "Straddle", "Full"],
    [move("Static hold", "seconds", "Aguante estático")],
    ["swallow", "maltes", "maltesa", "golondrina"],
  ),
  victorian: family(
    "Victorian",
    "Victorian",
    "statics",
    ["Anillas", "Paralelas"],
    ["Straddle", "Full"],
    [move("Static hold", "seconds", "Aguante estático")],
    ["victoria", "victoriana"],
  ),
  ringSupport: family(
    "Ring support",
    "Soporte en anillas",
    "statics",
    ["Anillas"],
    ["Neutral", "Rings turned out"],
    [move("Static hold", "seconds", "Aguante estático")],
    ["rto", "apoyo en anillas", "soporte con anillas giradas"],
  ),
  pullups: family(
    "Pull-ups",
    "Dominadas",
    "pull",
    ["Barra", "Anillas"],
    ["Estándar", "Wide grip", "Narrow grip"],
    [
      move("Pull-ups", "reps", "Dominadas pronas"),
      move("Chin-ups", "reps", "Dominadas supinas"),
      move("Neutral grip pull-ups", "reps", "Dominadas neutras"),
      move("Chest-to-bar", "reps", "Dominadas pecho a barra"),
      move("Archer pull-ups", "reps", "Dominadas arqueras", sides),
      move("Typewriter pull-ups", "reps", "Dominadas máquina de escribir"),
      move("Negativas", "reps", "Descensos controlados"),
    ],
    ["pullup", "pull up", "pullups", "dominada", "dominadas"],
  ),
  oneArmPull: family(
    "One-arm pull-up",
    "Dominada a una mano",
    "pull",
    ["Barra", "Anillas"],
    sides,
    [
      move("One-arm pull-ups", "reps", "Dominadas a un brazo"),
      move("Negativas", "reps", "Descensos controlados"),
      move("Static hold", "seconds", "Aguante estático"),
    ],
    [
      "oap",
      "oacu",
      "dominada unilateral",
      "dominadas a una mano",
      "dominada a un brazo",
      "one arm chin up",
    ],
  ),
  rows: family(
    "Inverted rows",
    "Remos invertidos",
    "pull",
    ["Barra baja", "Anillas"],
    ["Rodillas flexionadas", "Piernas extendidas", "Pies elevados"],
    [
      move("Inverted rows", "reps", "Remos invertidos"),
      move("Archer rows", "reps", "Remos arqueros", sides),
      move("One-arm rows", "reps", "Remos a una mano", sides),
    ],
    [
      "australian pullups",
      "australian pull ups",
      "australianas",
      "remo australiano",
      "remo invertido",
    ],
  ),
  hangs: family(
    "Hangs & scapula",
    "Colgados y escápulas",
    "pull",
    ["Barra", "Anillas"],
    ["Ambas manos"],
    [
      move("Dead hang", "seconds", "Colgado pasivo"),
      move("Active hang", "seconds", "Colgado activo"),
      move("Scapular pull-ups", "reps", "Dominadas escapulares"),
      move("One-arm hang", "seconds", "Colgado a una mano", sides),
    ],
    ["hanging", "hang", "suspension", "colgarse"],
  ),
  hspu: family(
    "Handstand push-ups",
    "Flexiones en pino",
    "push",
    ["Suelo", "Paralelas"],
    [
      "Pecho a pared",
      "Espalda a pared",
      "Libre",
      "Déficit en pared",
      "Déficit libre",
    ],
    [
      move("Handstand push-ups", "reps", "Flexiones de parada de manos"),
      move("Negativas", "reps", "Descensos controlados"),
      move("Bottom hold", "seconds", "Aguante abajo"),
    ],
    [
      "hspu",
      "handstand pushups",
      "flexiones verticales",
      "flexion vertical",
      "flexiones de pino",
    ],
  ),
  pike: family(
    "Pike push-ups",
    "Flexiones pica",
    "push",
    ["Suelo", "Paralelas"],
    ["Suelo", "Pies elevados", "Déficit"],
    [
      move("Pike push-ups", "reps", "Flexiones pica"),
      move("Negativas", "reps", "Descensos controlados"),
    ],
    ["pike pushups", "flexiones en v", "flexion pica"],
  ),
  pushups: family(
    "Push-ups",
    "Flexiones",
    "push",
    ["Suelo", "Paralelas", "Anillas"],
    ["Estándar", "Inclinada", "Declinada"],
    [
      move("Pushups", "reps", "Flexiones estándar"),
      move("Diamond pushups", "reps", "Flexiones diamante"),
      move("Wide push-ups", "reps", "Flexiones abiertas"),
      move("Archer push-ups", "reps", "Flexiones arqueras", sides),
      move("Typewriter push-ups", "reps", "Flexiones máquina de escribir"),
      move("Explosive push-ups", "reps", "Flexiones explosivas"),
      move("Clap push-ups", "reps", "Flexiones con palmada"),
      move("Tiger bend push-ups", "reps", "Flexiones tigre"),
      move("Bodyweight triceps extensions", "reps", "Extensiones de tríceps"),
    ],
    [
      "pushup",
      "push up",
      "pushups",
      "flexion",
      "lagartija",
      "lagartijas",
      "pechadas",
    ],
  ),
  oneArmPush: family(
    "One-arm push-up",
    "Flexión a una mano",
    "push",
    ["Suelo", "Paralelas"],
    [
      "Izquierda · suelo",
      "Derecha · suelo",
      "Izquierda · inclinada",
      "Derecha · inclinada",
    ],
    [
      move("One-arm push-ups", "reps", "Flexiones a un brazo"),
      move("Negativas", "reps", "Descensos controlados"),
    ],
    [
      "oapu",
      "flexiones a una mano",
      "flexion unilateral",
      "lagartija a un brazo",
    ],
  ),
  dips: family(
    "Dips",
    "Fondos",
    "push",
    ["Paralelas", "Anillas", "Barra"],
    ["Estándar", "L-sit"],
    [
      move("Dips", "reps", "Fondos"),
      move("Straight bar dips", "reps", "Fondos en barra recta"),
      move("Russian dips", "reps", "Fondos rusos"),
      move("Negativas", "reps", "Descensos controlados"),
      move("Static hold", "seconds", "Aguante estático"),
    ],
    ["fondo", "fondos", "dip"],
  ),
  legRaises: family(
    "Hanging leg raises",
    "Elevaciones de piernas",
    "core",
    ["Barra", "Anillas", "Paralelas"],
    ["Estándar"],
    [
      move("Knee raises", "reps", "Elevaciones de rodillas"),
      move("Leg raises", "reps", "Elevaciones de piernas rectas"),
      move("Toes-to-bar", "reps", "Pies a la barra", undefined, [
        "ttb",
        "toes to bar",
      ]),
      move("Knees-to-elbows", "reps", "Rodillas a los codos"),
      move("Windshield wipers", "reps", "Limpiaparabrisas"),
    ],
    ["abdominales colgado", "elevacion de piernas", "rodillas al pecho"],
  ),
  hollow: family(
    "Hollow & arch",
    "Hollow y arco",
    "core",
    ["Suelo"],
    ["Tuck", "One leg · izquierda", "One leg · derecha", "Full"],
    [
      move("Hollow hold", "seconds", "Aguante hollow"),
      move("Hollow rocks", "reps", "Balanceos hollow"),
      move("Arch hold", "seconds", "Aguante superman"),
      move("Arch rocks", "reps", "Balanceos en arco"),
    ],
    ["hollow body", "barquito", "superman", "arco", "balanceos"],
  ),
  plank: family(
    "Plank",
    "Plancha abdominal",
    "core",
    ["Suelo"],
    [
      "Antebrazos",
      "Brazos extendidos",
      "Una pierna · izquierda",
      "Una pierna · derecha",
    ],
    [
      move("Static hold", "seconds", "Aguante estático"),
      move("Side plank", "seconds", "Plancha lateral", sides),
      move("Reverse plank", "seconds", "Plancha inversa", ["Estándar"]),
    ],
    ["plank hold", "plancha de abdomen", "planchas abdominales"],
  ),
  abWheel: family(
    "Ab wheel",
    "Rueda abdominal",
    "core",
    ["Rueda"],
    ["De rodillas", "De pie", "Una pierna · izquierda", "Una pierna · derecha"],
    [
      move("Rollouts", "reps", "Extensiones con rueda"),
      move("Static hold", "seconds", "Aguante estático"),
    ],
    ["abwheel", "rueda", "abdominal wheel"],
  ),
  pistol: family(
    "Pistol squat",
    "Sentadilla pistola",
    "legs",
    ["Suelo", "Cajón"],
    sides,
    [
      move("Pistol squats", "reps", "Sentadillas pistola"),
      move("Negativas", "reps", "Descensos controlados"),
      move("Bottom hold", "seconds", "Aguante abajo"),
    ],
    ["pistol", "sentadilla a una pierna", "sentadilla unilateral", "pistola"],
  ),
  shrimp: family(
    "Shrimp squat",
    "Sentadilla camarón",
    "legs",
    ["Suelo"],
    sides,
    [
      move("Shrimp squats", "reps", "Sentadillas camarón"),
      move("Negativas", "reps", "Descensos controlados"),
    ],
    ["shrimp", "camaron", "gamba"],
  ),
  nordic: family(
    "Nordic curl",
    "Curl nórdico",
    "legs",
    ["Suelo", "Banco"],
    ["Ambas piernas"],
    [
      move("Nordic curls", "reps", "Curls nórdicos"),
      move("Negativas", "reps", "Descensos controlados"),
      move("Reverse nordic curls", "reps", "Nórdicos inversos"),
    ],
    ["nordic", "isquiotibiales", "nordicos", "curl nordico"],
  ),
  sissy: family(
    "Sissy squat",
    "Sentadilla sissy",
    "legs",
    ["Suelo"],
    ["Estándar"],
    [
      move("Sissy squats", "reps", "Sentadillas sissy"),
      move("Negativas", "reps", "Descensos controlados"),
    ],
    ["sissy", "sentadilla sissy"],
  ),
  squats: family(
    "Squats & lunges",
    "Sentadillas y zancadas",
    "legs",
    ["Suelo", "Banco", "Cajón"],
    ["Ambas piernas", "Izquierda", "Derecha"],
    [
      move("Squats", "reps", "Sentadillas"),
      move("Bulgarian squats", "reps", "Sentadillas búlgaras", sides),
      move("Lunges", "reps", "Zancadas", sides, [
        "estocada",
        "desplante",
        "lunges",
      ]),
      move("Reverse lunges", "reps", "Zancadas inversas", sides),
      move("Step-ups", "reps", "Subidas al cajón", sides),
      move("Jump squats", "reps", "Sentadillas con salto"),
      move("Calf raises", "reps", "Elevaciones de gemelos", undefined, [
        "pantorrilla",
        "pantorrillas",
        "gemelos",
      ]),
    ],
    ["squat", "sentadilla"],
  ),
  skinCat: family(
    "Skin the cat",
    "Skin the cat y German hang",
    "mobility",
    ["Anillas", "Barra"],
    ["Tuck", "Full"],
    [
      move("Skin the cat", "reps", "Vueltas skin the cat"),
      move("German hang", "seconds", "Colgado alemán"),
    ],
    ["skin cat", "german hang", "colgado aleman"],
  ),
  bridge: family(
    "Bridge",
    "Puente",
    "mobility",
    ["Suelo", "Pared"],
    ["Estándar"],
    [
      move("Bridge hold", "seconds", "Aguante de puente"),
      move("Bridge push-ups", "reps", "Flexiones de puente"),
    ],
    ["back bridge", "puente de espalda"],
  ),
  splits: family(
    "Splits",
    "Aperturas de piernas",
    "mobility",
    ["Suelo"],
    ["Izquierda", "Derecha"],
    [
      move("Front split", "seconds", "Apertura frontal"),
      move("Middle split", "seconds", "Apertura lateral", ["Centro"]),
    ],
    ["spagat", "split", "apertura", "flexibilidad"],
  ),
};
export function infoFor(catalog, key) {
  return familyInfo[key] ?? catalog[key] ?? { category: "other", es: "" };
}
export function normalizeSearch(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
const movementAliases = {
  "static hold": [
    "aguante",
    "aguante estatico",
    "sostenido",
    "isometrico",
    "isometria",
    "hold",
    "mantener",
    "segundos",
  ],
  "lever raises": [
    "elevaciones de palanca",
    "subidas de palanca",
    "levantar palanca",
    "repeticiones",
  ],
  "lever pulls": ["tirones de palanca", "remos de palanca"],
  negativas: ["negatives", "negative", "negativa", "excentricas", "descensos"],
  "planche pushups": ["flexiones de plancha", "planche push ups"],
  "planche lean": ["inclinacion de plancha", "lean", "plancha inclinada"],
  "pseudo planche pushups": [
    "pseudo planche push ups",
    "flexiones pseudo plancha",
  ],
  "muscle ups": [
    "muscleup",
    "muscleups",
    "muscle up",
    "dominada con transicion",
  ],
};
export function variationWords(v) {
  const text = normalizeSearch(v),
    words = [v];
  if (text.includes("advanced tuck"))
    words.push("tuck avanzado tuck avanzada agrupado avanzado");
  else if (text.includes("tuck"))
    words.push("tucked agrupado agrupada recogido recogida");
  if (text.includes("straddle"))
    words.push("piernas abiertas abierto abierta separadas");
  if (text.includes("full"))
    words.push("completo completa extendido extendida");
  if (text.includes("half lay")) words.push("semiextendido semi extendido");
  if (text.includes("one leg") || text.includes("una pierna"))
    words.push("una pierna one leg single leg");
  if (text.includes("izquierda")) words.push("left izquierdo");
  if (text.includes("derecha")) words.push("right derecho");
  if (text.includes("rings turned out")) words.push("rto anillas giradas");
  if (text.includes("estricto")) words.push("strict stricta estricta");
  if (text.includes("kipping")) words.push("kip impulso balanceo");
  if (text.includes("estandar")) words.push("standard regular");
  if (text.includes("pared")) words.push("wall");
  if (text.includes("libre")) words.push("free freestanding");
  if (text.includes("pike")) words.push("pica piernas juntas");
  if (text.includes("wide")) words.push("ancho abierta");
  if (text.includes("narrow")) words.push("cerrado estrecho");
  return words.join(" ");
}
function movementWords(m) {
  return [
    m.name,
    m.es ?? "",
    ...(m.aliases ?? []),
    ...(movementAliases[normalizeSearch(m.name)] ?? []),
  ].join(" ");
}
function familyWords(catalog, key) {
  const c = catalog[key],
    meta = infoFor(catalog, key);
  return [c.name, meta.es, ...(meta.aliases ?? []), ...(c.aliases ?? [])].join(
    " ",
  );
}
const ignore = new Set([
  "de",
  "del",
  "el",
  "la",
  "los",
  "las",
  "the",
  "of",
  "and",
  "en",
  "a",
]);
function tokens(query) {
  return normalizeSearch(query)
    .split(" ")
    .filter((t) => t && !ignore.has(t));
}
function containsQuery(text, query) {
  const doc = normalizeSearch(text),
    ts = tokens(query);
  if (!ts.length) return true;
  const compact = doc.replaceAll(" ", ""),
    needle = normalizeSearch(query).replaceAll(" ", "");
  return (
    compact.includes(needle) ||
    ts.every((t) => doc.includes(t) || compact.includes(t))
  );
}
const equipmentAliases = {
  Barra: ["bar", "straight bar", "pull up bar"],
  Anillas: ["rings", "ring"],
  Suelo: ["floor", "ground"],
  Paralelas: ["parallel bars", "parallettes", "pbars"],
  "Barra vertical": ["vertical bar", "pole"],
  Espaldera: ["stall bars", "wall bars"],
  "Barra baja": ["low bar"],
  Banco: ["bench"],
  Cajón: ["box"],
  Rueda: ["wheel", "ab wheel"],
  Pared: ["wall"],
};
function equipmentWords(a) {
  return [a, ...(equipmentAliases[a] ?? [])].join(" ");
}
function chooseApparatus(list, query) {
  let best = list[0],
    score = 0;
  for (const a of list) {
    const words = normalizeSearch(equipmentWords(a)).split(" "),
      n = tokens(query).filter((t) => words.includes(t)).length;
    if (n > score) {
      score = n;
      best = a;
    }
  }
  return best;
}
export function searchSkillLibrary(
  catalog,
  query = "",
  category = "all",
  limit = 16,
) {
  const q = normalizeSearch(query),
    results = [];
  for (const [family, c] of Object.entries(catalog)) {
    if (family === "other") continue;
    const meta = infoFor(catalog, family);
    if (category !== "all" && meta.category !== category) continue;
    for (const movement of c.movements) {
      const vars = movement.variations ?? c.variations;
      let best = null;
      for (const variation of vars) {
        const base = `${familyWords(catalog, family)} ${movementWords(movement)} ${c.apparatus.map(equipmentWords).join(" ")}`,
          words = variationWords(variation);
        if (!containsQuery(`${base} ${words}`, query)) continue;
        const isFamilyQuery = [
          c.name,
          meta.es,
          ...(meta.aliases ?? []),
          ...(c.aliases ?? []),
        ].some(
          (a) =>
            normalizeSearch(a).replaceAll(" ", "") === q.replaceAll(" ", ""),
        );
        const score =
          (c.movements[0] === movement ? (isFamilyQuery ? 63 : 3) : 0) +
          ([...(meta.aliases ?? []), ...(c.aliases ?? [])].some(
            (a) => normalizeSearch(a) === q,
          )
            ? 60
            : 0) +
          (q && normalizeSearch(meta.es) === q ? 100 : 0) +
          (q && normalizeSearch(movementWords(movement)).includes(q) ? 25 : 0) +
          (normalizeSearch(c.name) === q ? 100 : 0) +
          (normalizeSearch(movement.name) === q ? 90 : 0) +
          (q && normalizeSearch(base).includes(q) ? 30 : 0) +
          tokens(query).filter((t) =>
            normalizeSearch(words).split(" ").includes(t),
          ).length *
            4;
        const item = {
          family,
          movement: movement.name,
          variation,
          metric: movement.metric,
          apparatus: chooseApparatus(c.apparatus, query),
          name: c.name,
          es: meta.es,
          description:
            movement.es ??
            movementAliases[normalizeSearch(movement.name)]?.[0] ??
            movement.name,
          category: meta.category,
          variantCount: vars.length,
          score,
        };
        if (!best || item.score > best.score) best = item;
      }
      if (best) results.push(best);
    }
  }
  const featured = [
    "front",
    "back",
    "planche",
    "muscle",
    "flag",
    "handstand",
    "lsit",
    "pullups",
    "pushups",
    "dips",
  ];
  if (!q) {
    const first = new Map();
    for (const r of results) if (!first.has(r.family)) first.set(r.family, r);
    return [...first.values()]
      .sort(
        (a, b) =>
          (featured.includes(a.family) ? featured.indexOf(a.family) : 100) -
            (featured.includes(b.family) ? featured.indexOf(b.family) : 100) ||
          a.name.localeCompare(b.name),
      )
      .slice(0, limit);
  }
  return results
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.name.localeCompare(b.name) ||
        a.movement.localeCompare(b.movement),
    )
    .slice(0, limit);
}
export function matchesSkillSearch(catalog, query, e) {
  if (!normalizeSearch(query)) return true;
  let words = [
    e.movement,
    e.variation,
    variationWords(e.variation),
    equipmentWords(e.apparatus),
    e.support,
    e.supportNote,
  ];
  for (const [key, c] of Object.entries(catalog)) {
    const sameFamily = key === e.family,
      infer = e.family === "base" || e.family === "other",
      generic = ["static hold", "negativas", "bottom hold"].includes(
        normalizeSearch(e.movement),
      ),
      matching =
        sameFamily || (infer && !generic)
          ? c.movements.filter(
              (m) =>
                normalizeSearch(m.name).replaceAll(" ", "") ===
                normalizeSearch(e.movement).replaceAll(" ", ""),
            )
          : [];
    if (
      sameFamily ||
      (infer &&
        normalizeSearch(c.name).replaceAll(" ", "").length >= 4 &&
        normalizeSearch(e.movement)
          .replaceAll(" ", "")
          .includes(normalizeSearch(c.name).replaceAll(" ", "")))
    )
      words.push(familyWords(catalog, key));
    for (const m of matching)
      words.push(familyWords(catalog, key), movementWords(m));
  }
  return containsQuery(words.join(" "), query);
}
