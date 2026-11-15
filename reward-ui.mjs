import { activeTitles, allTitles, themeReady } from "./title-pack.mjs";
import { wallet, buyChest, CHEST_PRICE } from "./economy-core.mjs";
import { RARITIES, THEMES } from "./title-catalog.mjs";
import { skillCatalog } from "./skills-core.mjs";
import { normalizeSearch } from "./exercise-library.mjs";
import { achievementInfo, compareAchievements } from "./achievement-view.mjs";
export function createRewardUI(ctx) {
  const s = () => ctx.getState(),
    today = () => ctx.getToday(),
    esc = ctx.esc;
  let tab = "achievements",
    family = "all",
    profileFilter = null,
    status = "next",
    order = "nearest",
    achievementKind = "all",
    filtersOpen = false,
    query = "",
    theme = "all",
    inventoryRarity = "all",
    inventoryTheme = "all",
    inventoryQuery = "",
    inventoryLimit = 24,
    achievementLimit = 24,
    busy = false,
    reveal = null;
  const rarity = (id) => RARITIES.find((r) => r.id === id),
    money = (n) => n.toLocaleString("es-GT");
  function owned() {
    return new Set(s().economy.rolls.map((r) => r.titleId));
  }
  function tabs(w) {
    return `<div class="reward-tabs" role="tablist" aria-label="Recompensas">${[
      ["achievements", "Logros"],
      ["store", "▣ Tienda"],
      ["collection", "Títulos"],
    ]
      .map(
        ([key, label]) =>
          `<button role="tab" data-action="reward-tab" data-tab="${key}" aria-selected="${tab === key}">${label}</button>`,
      )
      .join(
        "",
      )}</div><div class="wallet-line"><strong>◈ ${money(w.balance)} monedas</strong><small>${w.achievements.earnedCount} logros · rutas ∞</small></div>${w.balance < 0 ? '<p class="note danger">El saldo bajó al corregir registros o combinar copias con compras diferentes. Conservas tus títulos; las próximas recompensas cubren el saldo antes de poder abrir otro cofre.</p>' : ""}`;
  }
  function achievementRows(w) {
    const results = w.achievements.achievements.filter(
      (a) =>
        (family === "all" || a.family === family) &&
        (achievementKind === "all" ||
          achievementInfo(a).kind === achievementKind) &&
        (!profileFilter ||
          a.profileId === profileFilter.id ||
          (a.family === profileFilter.family &&
            a.movement === profileFilter.config.movement)) &&
        (status === "all" ||
          (status === "earned" && a.earned) ||
          (status === "next" && !a.earned)) &&
        normalizeSearch(
          a.name +
            " " +
            a.description +
            " " +
            (skillCatalog[a.family]?.name ?? "actividad"),
        ).includes(normalizeSearch(query)),
    );
    results.sort((a, b) => compareAchievements(a, b, order));
    return `<p class="quiet" role="status">${results.length} logros${status === "next" ? " por conquistar" : ""}</p><div class="achievement-list">${
      results
        .slice(0, achievementLimit)
        .map((a) => {
          const info = achievementInfo(a);
          return `<article class="achievement ${a.earned ? "earned" : ""}" data-achievement="${esc(a.id)}" data-percent="${a.percent}"><div class="mini-heading"><span class="skill-family-label">${esc(skillCatalog[a.family]?.name ?? "Constancia")}</span><b>${a.earned ? "✓" : "◇"}</b></div><h3>${esc(a.name)}</h3><span class="achievement-kind ${info.kind}">${esc(info.label)}</span><p>${esc(a.description)}</p><div class="progress" role="progressbar" aria-label="Progreso del logro" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(a.percent)}"><i style="width:${a.percent}%"></i></div><p class="achievement-remaining">${a.earned ? "✓ Conseguido" : `Te ${info.remaining === 1 ? "falta" : "faltan"} ${info.remaining.toLocaleString("es-GT")} ${info.remaining === 1 ? ({ reps: "rep", series: "serie", días: "día" }[info.unit] ?? info.unit) : info.unit}`} · ${Math.floor(a.percent)} %</p><div class="achievement-bottom"><small>${Math.round(Math.min(a.value, a.target) * 10) / 10} / ${a.target} ${info.unit}${a.earnedDay ? " · " + a.earnedDay : a.infinite && a.earned ? " · rango acumulativo" : ""}</small><strong>+${a.xp} XP · ◈ ${a.coins}</strong></div>${a.config && !a.earned ? `<button class="text-button" data-action="reward-log" data-id="${esc(a.id)}">Preparar registro ↗</button>` : ""}</article>`;
        })
        .join("") ||
      '<p class="note">Sin coincidencias. Prueba otro filtro.</p>'
    }${results.length > achievementLimit ? `<button class="secondary wide" data-action="reward-more">Ver más logros (${Math.min(achievementLimit, results.length)} / ${results.length})</button>` : ""}</div>`;
  }
  function achievements(w) {
    const families = [
      ...new Set(w.achievements.achievements.map((a) => a.family)),
    ];
    return `${profileFilter ? `<p class="note">Ficha: ${esc(profileFilter.name)} <button class="text-button" data-action="reward-clear-profile">Ver todos</button></p>` : ""}<p class="note">Siempre hay un próximo rango: avanza con técnica, práctica acumulada o constancia.</p><label class="field">Buscar logro<input id="achievement-query" type="search" autocomplete="off" value="${esc(query)}" placeholder="Front lever Full, pull-ups…"></label><div class="row achievement-controls"><label class="field">Ordenar<select id="achievement-order">${[
      ["nearest", "Más cercanos"],
      ["exercise", "Por ejercicio"],
      ["xp", "Mayor XP"],
    ]
      .map(
        ([id, name]) =>
          `<option value="${id}" ${order === id ? "selected" : ""}>${name}</option>`,
      )
      .join(
        "",
      )}</select></label><label class="field">Mostrar<select id="achievement-status">${[
      ["next", "Pendientes"],
      ["earned", "Conseguidos"],
      ["all", "Todos"],
    ]
      .map(
        ([id, name]) =>
          `<option value="${id}" ${status === id ? "selected" : ""}>${name}</option>`,
      )
      .join(
        "",
      )}</select></label></div><details id="achievement-filters" class="earning-rules" ${filtersOpen ? "open" : ""}><summary>Filtros y criterios${family !== "all" || achievementKind !== "all" ? " · activos" : ""}</summary><div class="row"><label class="field">Ejercicio<select id="achievement-family"><option value="all">Todos</option>${families.map((f) => `<option value="${f}" ${family === f ? "selected" : ""}>${esc(skillCatalog[f]?.name ?? "Constancia")}</option>`).join("")}</select></label><label class="field">Tipo<select id="achievement-kind">${[
      ["all", "Todos"],
      ["technique", "Técnica"],
      ["dedication", "Dedicación"],
    ]
      .map(
        ([id, name]) =>
          `<option value="${id}" ${achievementKind === id ? "selected" : ""}>${name}</option>`,
      )
      .join(
        "",
      )}</select></label></div><p class="note">Más cercanos compara el porcentaje completado entre todos los ejercicios filtrados. Lo que falta corresponde a esa ruta: una mejor serie, tu mejor día o un total acumulado; no siempre se suma a tu récord.</p><p class="note">Técnica: escala orientativa de Reps, de Inicial 1/5 a Élite 5/5, según movimiento, variante y objetivo de reps, tiempo o lastre. La asistencia reduce un grado; los movimientos propios sin criterio quedan sin clasificar. Es distinta de la dificultad 1–5 que eliges para la XP de una serie. Dedicación reconoce volumen y constancia, sin asignarles dificultad técnica. Estas etiquetas no cambian requisitos ni recompensas.</p><p class="note">Las rutas infinitas muestran el último rango ganado y el próximo; las recompensas incluyen todos los anteriores. Los hitos de mejor hold usan una sola serie; volumen acumula segundos. Tuck, advanced tuck y full tienen hitos separados. Los hitos fijos de técnica requieren series sin asistencia; cada ruta infinita conserva su equipo y asistencia. Las correcciones recalculan los premios.</p></details><div id="achievement-results">${achievementRows(w)}</div>`;
  }

  function store(w) {
    return `<p class="note">Cofres de títulos cosméticos, solo con monedas ganadas con tu progreso.</p>${!themeReady(s(), theme) ? '<p class="note danger">Este catálogo necesita un título de cada rareza en el tema elegido. Complétalo en Ajustes → Importar títulos. No se redistribuyen las probabilidades.</p>' : ""}<section class="chest-shop"><div class="chest-illustration" aria-hidden="true"><svg width="88" height="76" viewBox="0 0 64 56"><path d="M6 23V13q0-7 7-7h38q7 0 7 7v10" fill="#d6b270" stroke="#6d522c" stroke-width="3"/><path d="M6 23h52v25H6z" fill="#ad7b39" stroke="#6d522c" stroke-width="3"/><path d="M17 7v40M47 7v40" stroke="#e6ce8d" stroke-width="5"/><path d="M26 20h12v13H26z" fill="#f0d786" stroke="#6d522c" stroke-width="2"/><circle cx="32" cy="26" r="2" fill="#6d522c"/></svg><span>✦</span></div><h3>Cofre de títulos</h3><p>Un título por apertura · ◈ ${CHEST_PRICE}</p><label class="field">Tema<select id="chest-theme">${THEMES.map(([id, name]) => `<option value="${id}" ${theme === id ? "selected" : ""} ${!themeReady(s(), id) ? "disabled" : ""}>${name}${themeReady(s(), id) ? "" : " · faltan rarezas"}</option>`).join("")}</select></label><p class="note">Título repetido: devuelve 25 monedas. Cada título de la rareza y tema elegidos tiene la misma probabilidad.</p><button class="primary wide" data-action="reward-roll" ${w.balance < CHEST_PRICE || busy || !themeReady(s(), theme) ? "disabled" : ""}>${busy ? "Abriendo…" : `Abrir cofre · ◈ ${CHEST_PRICE}`}</button><p class="note">${w.balance < CHEST_PRICE ? `Te faltan ${money(CHEST_PRICE - w.balance)} monedas.` : "La compra se guarda antes de revelar el título."}</p></section>${reveal ? resultCard(reveal) : ""}<section><h3>Probabilidades por apertura</h3><table class="odds-table"><thead><tr><th>Rareza</th><th>Probabilidad</th><th>Referencia</th></tr></thead><tbody>${RARITIES.map((r) => `<tr><td><span class="rarity ${r.id}">${r.name}</span></td><td>${r.percent}</td><td>${r.odds}</td></tr>`).join("")}</tbody></table><p class="note">Porcentajes, no probabilidades decimales: 0.001 % = 1 de 100000. Cada apertura es independiente, sin garantía ni aumento oculto de suerte. Las probabilidades suman 100 %; el tema no las cambia.</p></section>${earnings(w)}`;
  }
  function resultCard(x) {
    return `<section class="chest-result ${x.title.rarity}" role="status"><span class="rarity ${x.title.rarity}">${rarity(x.title.rarity).name}</span><h3>${esc(x.title.name)}</h3><p>${x.duplicate ? "Ya lo tenías · +25 monedas de vuelta" : "¡Nuevo título para tu colección!"}</p><button class="secondary" data-action="reward-equip" data-title="${x.title.id}">Equipar título</button></section>`;
  }
  function earnings(w) {
    return `<details class="earning-rules"><summary>Cómo consigues monedas</summary><p>+10 por cada nivel alcanzado desde el nivel 2; +25 extra en los niveles 5, 10, 15… Los logros dan las monedas que muestra cada ficha. Cada día activo aporta 5 monedas.</p><p>Push, Pull y Legs dan +5 monedas por cada cuarto de su meta: 25 %, 50 %, 75 % y 100 %. Son hasta 20 por grupo y día. Meta 0 es descanso y no genera premios. Se usa la meta guardada de cada día; cambiar una meta recalcula su progreso, sin volver a cobrar el mismo cuarto.</p><div class="coin-goals">${w.daily.map((d) => `<p><strong>${d.group === "push" ? "Push" : d.group === "pull" ? "Pull" : "Legs"}</strong> · ${d.goal ? `${d.count} / ${d.goal} · ${d.quarter}/4 · ◈ ${d.coins}` : "descanso"}</p>`).join("")}</div><p>Totales: logros ◈ ${w.achievementCoins}; niveles ◈ ${w.levelCoins}; metas ◈ ${w.goalCoins}; días activos ◈ ${w.practiceCoins}. Gastado neto: ◈ ${w.spent}.</p><p>Corregir o borrar registros y cambiar metas recalcula las ganancias. Las compras se conservan; el saldo puede bajar. Las monedas, títulos y aperturas van en tu respaldo JSON.</p></details>`;
  }
  function collectionRows() {
    const ids = owned(),
      catalog = allTitles(s()),
      activeIds = new Set(activeTitles(s()).map((t) => t.id)),
      terms = normalizeSearch(inventoryQuery).split(" ").filter(Boolean);
    const items = catalog.filter(
      (t) =>
        (inventoryRarity === "all" || t.rarity === inventoryRarity) &&
        (inventoryTheme === "all" || t.theme === inventoryTheme) &&
        terms.every((term) =>
          normalizeSearch([t.name, t.category, t.reason].join(" ")).includes(
            term,
          ),
        ),
    );
    return `<p class="quiet" role="status">${items.length} títulos</p><div class="title-collection">${items
      .slice(0, inventoryLimit)
      .map(
        (t) =>
          `<article class="title-item ${ids.has(t.id) ? t.rarity : "locked"}"><small class="rarity ${t.rarity}">${rarity(t.rarity).name} · ${THEMES.find((x) => x[0] === t.theme)[1]}</small><strong>${t.rarity === "secret" && !ids.has(t.id) ? "???" : esc(t.name)}</strong><small>${esc(t.category ?? "term")}</small><p class="note">${esc(t.reason ?? "Rareza editorial de Reps.")}</p>${!activeIds.has(t.id) ? "<small>Conservado · fuera del catálogo activo</small>" : ""}${ids.has(t.id) ? `<button class="text-button" data-action="reward-equip" data-title="${t.id}" ${s().economy.equipped === t.id ? "disabled" : ""}>${s().economy.equipped === t.id ? "✓ Equipado" : "Equipar"}</button>` : "<small>Por descubrir en cofres</small>"}</article>`,
      )
      .join(
        "",
      )}</div>${items.length > inventoryLimit ? '<button class="secondary wide" data-action="reward-more-titles">Ver más títulos</button>' : ""}`;
  }
  function collection(w) {
    const ids = owned(),
      catalog = allTitles(s()),
      activeIds = new Set(activeTitles(s()).map((t) => t.id)),
      items = catalog.filter(
        (t) =>
          (inventoryRarity === "all" || t.rarity === inventoryRarity) &&
          (inventoryTheme === "all" || t.theme === inventoryTheme),
      );
    return `<p class="note">${ids.size} / ${catalog.length} títulos conseguidos. El título equipado aparece junto a tu nivel en Hoy.</p><div class="row"><label class="field">Rareza<select id="inventory-rarity"><option value="all">Todas</option>${RARITIES.map((r) => `<option value="${r.id}" ${inventoryRarity === r.id ? "selected" : ""}>${r.name}</option>`).join("")}</select></label><label class="field">Tema<select id="inventory-theme">${THEMES.map(([id, name]) => `<option value="${id}" ${inventoryTheme === id ? "selected" : ""}>${name}</option>`).join("")}</select></label></div>${s().economy.equipped ? '<button class="text-button" data-action="reward-unequip">Quitar título equipado</button>' : ""}<label class="field">Buscar título o categoría<input id="inventory-query" type="search" autocomplete="off" value="${esc(inventoryQuery)}" placeholder="Akira, NPC, bell, item…"></label><div id="title-results">${collectionRows()}</div><details class="earning-rules"><summary>Últimas aperturas</summary>${
      s()
        .economy.rolls.slice(-20)
        .reverse()
        .map(
          (r) =>
            `<p class="note">${esc(allTitles(s()).find((t) => t.id === r.titleId)?.name ?? r.titleId)} · ${new Date(r.at).toLocaleDateString("es-GT")} · −${r.price - r.refund} monedas${r.refund ? " · repetido" : ""}</p>`,
        )
        .join("") || '<p class="note">Aún no hay aperturas.</p>'
    }</details><details class="earning-rules"><summary>Criterio de rareza</summary><p class="note">Nombres directos. La asignación de Reps considera categoría, rareza de objetos y contexto de progresión o lore; no es una clasificación oficial del juego. Toca la ficha para leer su razón.</p></details>`;
  }
  function open(next = tab) {
    tab = next;
    const w = wallet(s(), today());
    ctx.openSheet(
      "Logros y tienda",
      `${tabs(w)}${tab === "achievements" ? achievements(w) : tab === "store" ? store(w) : collection(w)}`,
    );
  }
  function persistEquip(title) {
    if (title && !owned().has(title)) return;
    const previous = s().economy.equipped;
    s().economy.equipped = title;
    if (!ctx.save()) {
      s().economy.equipped = previous;
      return;
    }
    ctx.render();
    open("collection");
  }
  function click(e) {
    const b = e.target.closest('[data-action^="reward-"]');
    if (!b) return;
    const action = b.dataset.action;
    if (action === "reward-more-titles") {
      inventoryLimit += 24;
      document.querySelector("#title-results").innerHTML = collectionRows();
    }
    if (action === "reward-more") {
      achievementLimit += 24;
      document.querySelector("#achievement-results").innerHTML =
        achievementRows(wallet(s(), today()));
    }
    if (action === "reward-clear-profile") {
      profileFilter = null;
      family = "all";
      open("achievements");
    }
    if (action === "reward-achievements") open("achievements");
    if (action === "reward-store") open("store");
    if (action === "reward-tab") open(b.dataset.tab);
    if (action === "reward-equip") persistEquip(b.dataset.title);
    if (action === "reward-unequip") persistEquip(null);
    if (action === "reward-log") {
      const a = wallet(s(), today()).achievements.achievements.find(
        (a) => a.id === b.dataset.id,
      );
      if (a?.config) {
        document.querySelector("#sheet").close();
        ctx.log(a.config);
      }
    }
    if (action === "reward-roll" && !busy) {
      busy = true;
      try {
        const x = buyChest(s(), today(), { theme });
        if (!ctx.save()) {
          s().economy.rolls = s().economy.rolls.filter(
            (r) => r.id !== x.receipt.id,
          );
          busy = false;
          ctx.toast("No se guardó la apertura; conservas tus monedas.");
          return;
        }
        reveal = x;
        ctx.render();
        open("store");
        setTimeout(() => {
          busy = false;
          const button = document.querySelector(
            '#sheet [data-action="reward-roll"]',
          );
          if (button) {
            button.disabled =
              wallet(s(), today()).balance < CHEST_PRICE ||
              !themeReady(s(), theme);
            button.textContent = "Abrir cofre · ◈ " + CHEST_PRICE;
          }
        }, 500);
        document.querySelector(".chest-result")?.scrollIntoView({
          block: "nearest",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
      } catch (err) {
        busy = false;
        ctx.toast(err.message);
      }
    }
  }
  document.querySelector("#main").addEventListener("click", click);
  document.querySelector("#sheet").addEventListener("click", click);
  document.querySelector("#sheet").addEventListener("input", (e) => {
    if (e.target.id === "inventory-query") {
      inventoryQuery = e.target.value;
      inventoryLimit = 24;
      document.querySelector("#title-results").innerHTML = collectionRows();
    }
    if (e.target.id === "achievement-query") {
      query = e.target.value;
      achievementLimit = 24;
      document.querySelector("#achievement-results").innerHTML =
        achievementRows(wallet(s(), today()));
    }
  });
  document.querySelector("#sheet").addEventListener("change", (e) => {
    const id = e.target.id;
    achievementLimit = 24;
    inventoryLimit = 24;
    if (id === "chest-theme") {
      theme = e.target.value;
      reveal = null;
      open("store");
      return;
    }
    if (id === "achievement-family") {
      family = e.target.value;
      profileFilter = null;
    }
    if (id === "achievement-status") status = e.target.value;
    if (id === "achievement-order") order = e.target.value;
    if (id === "achievement-kind") achievementKind = e.target.value;
    if (id === "inventory-rarity") inventoryRarity = e.target.value;
    if (id === "inventory-theme") inventoryTheme = e.target.value;
    if (
      [
        "achievement-order",
        "achievement-kind",
        "achievement-family",
        "achievement-status",
        "inventory-rarity",
        "inventory-theme",
      ].includes(id)
    )
      open();
  });
  document.querySelector("#sheet").addEventListener(
    "toggle",
    (e) => {
      if (e.target.id === "achievement-filters") filtersOpen = e.target.open;
    },
    true,
  );
  return {
    open,
    openForExercise(p) {
      profileFilter = p;
      family = p.family;
      status = "all";
      achievementKind = "all";
      order = "nearest";
      query = "";
      achievementLimit = 24;
      open("achievements");
    },
  };
}
