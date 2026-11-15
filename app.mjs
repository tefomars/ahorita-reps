import { createRewardUI } from "./reward-ui.mjs";
import { gameSummary, effortFields, readEffort } from "./game-core.mjs";
import { createGameUI } from "./game-ui.mjs";
import { createWeightUI, rememberWeights } from "./weight-shortcuts.mjs";
import { matchesSkillSearch } from "./exercise-library.mjs";
import { createTrainingUI } from "./training-ui.mjs";
import {
  mergeBackups,
  dataFingerprint,
  progressInsights,
} from "./training-core.mjs";
import { createJourneyUI } from "./journey-ui.mjs";
import {
  universalFavorites,
  moveShortcut,
  appendShortcut,
  shortcutConfig,
  shortcutDailyStats,
  shortcutIncrements,
} from "./journey-core.mjs";
import { createSkillsUI } from "./skills-ui.mjs";
import {
  skillEntriesOn,
  skillContributions,
  skillCatalog,
  allTimeRecords,
  skillRecordKey,
} from "./skills-core.mjs";
import {
  groups,
  exercises,
  dayKey,
  initial,
  ensureDay,
  validateBackup,
  validateEntry,
  shiftDay,
  streakStats,
  upgrade,
  weekPlan,
  goalsForDate,
  setSchedule,
  startOfWeek,
  weeklySummary,
  backupDue,
  hasActivity,
  dayTotals,
} from "./core.mjs";
const KEY = "ahorita.v1",
  labels = { push: "Push", pull: "Pull", legs: "Legs" },
  icons = { push: "↗", pull: "↓", legs: "↟" };
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
let state = initial(),
  storageError = false,
  view = "hoy",
  activeDay = dayKey(),
  historyDay = activeDay,
  calendarMonth = activeDay.slice(0, 7),
  timer,
  undoAction;
try {
  const raw = localStorage.getItem(KEY);
  if (raw) state = upgrade(validateBackup(JSON.parse(raw)));
} catch {
  storageError = true;
}
upgrade(state);
let progressWeek = startOfWeek(activeDay),
  recordGroup = "all",
  progressTab = "summary",
  detailOpen = false;
let lastGame = gameSummary(state, activeDay),
  gameGain = 0,
  gameLevelUp = false,
  gameUnlocks = 0;
const gameUI = createGameUI({
  getState: () => state,
  getToday: () => activeDay,
  openSheet,
  esc,
});
const weightUI = createWeightUI({
  getState: () => state,
  getToday: () => activeDay,
  esc,
  setShortcutWeight: (key, value) => {
    rollover();
    const f = universalFavorites(state).find((x) => x.key === key);
    if (f) setShortcutWeight(f, value, false);
  },
});
const skillsUI = createSkillsUI({
  getState: () => state,
  getToday: () => activeDay,
  save,
  toast,
  render,
  openSheet,
  esc,
  dateLabel,
  beforeMutation: rollover,
  openProgress,
  openExercise,
  weightButtons: (config, weight) => weightUI.buttons(config, weight),
  trainingPage: (tab) => trainingUI.page(tab),
  decorateSkill: (e, meta) => trainingUI.decorate(e, "skill", meta),
  ensureCounterDay: (key) => ensureDay(state, key),
  showSkills: () => {
    view = "calistenia";
    render();
    window.scrollTo(0, 0);
  },
  openBaseDay: (key) => {
    historyDay = key;
    calendarMonth = key.slice(0, 7);
    view = "historial";
    render();
    window.scrollTo(0, 0);
  },
});
const journeyUI = createJourneyUI({
  getState: () => state,
  getToday: () => activeDay,
  esc,
  render,
  back: () => {
    detailOpen = false;
    render();
    window.scrollTo(0, 0);
  },
  log: (e) => {
    if (e.source === "base") openBaseLog(e);
    else skillsUI.prepareLog(e);
  },
  pin: (e) => {
    if (e.source === "base") favoriteForm(baseFromRecord(e));
    else {
      const { id, source, at, day, ...data } = e;
      skillsUI.favoriteEditor(data);
    }
  },
  createGoal: (e) =>
    trainingUI.goalEditor({
      family: e.family,
      movement: e.movement,
      variation: e.variation,
      apparatus: e.apparatus || null,
      weight: e.weight,
      metric: e.metric,
      period: "day",
      name: e.movement,
    }),
  toggleFocus: (family) => skillsUI.toggleFocus(family),
  openDay: (e) => {
    if (e.source === "base") {
      historyDay = e.day;
      calendarMonth = e.day.slice(0, 7);
      view = "historial";
      render();
      window.scrollTo(0, 0);
    } else skillsUI.showHistory(e.day, e.family);
  },
});
const trainingUI = createTrainingUI({
  getState: () => state,
  getToday: () => activeDay,
  esc,
  save,
  render,
  openSheet,
  toast,
  showTab: (tab) => skillsUI.showTab(tab),
  logPreset: (step, meta) =>
    step.kind === "base"
      ? add(step.preset.group, step.preset.reps, step.preset, meta)
      : skillsUI.logPreset(step.preset, meta),
  startRest,
});
const rewardUI = createRewardUI({
  getState: () => state,
  getToday: () => activeDay,
  esc,
  save,
  render,
  openSheet,
  toast,
  log: (config) => skillsUI.prepareLog(config),
});
const weightLabel = (w) => (w ? `+${w} lb` : "Sin peso añadido");
const sideLabel = (s) =>
  s === "left" ? "Izquierda" : s === "right" ? "Derecha" : "Por pierna";
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageError = false;
    const next = gameSummary(state, activeDay);
    gameGain = next.xp - lastGame.xp;
    gameUnlocks = Math.max(
      0,
      next.achievementCount - lastGame.achievementCount,
    );
    gameLevelUp = next.level > lastGame.level;
    lastGame = next;
    return true;
  } catch {
    storageError = true;
    toast("No se pudo guardar. Exporta una copia en Ajustes.");
    return false;
  }
}
function dateLabel(key) {
  return new Date(key + "T12:00:00").toLocaleDateString("es-GT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
function current() {
  return ensureDay(state, activeDay);
}
function toast(message, undo) {
  if (gameGain > 0) {
    message += ` · +${gameGain} XP${gameLevelUp ? " · ¡Nivel " + lastGame.level + "!" : ""}`;
    if (gameUnlocks)
      message += ` · 🏆 ${gameUnlocks} ${gameUnlocks === 1 ? "logro" : "logros"}`;
    gameUnlocks = 0;
    gameGain = 0;
    gameLevelUp = false;
  }
  clearTimeout(timer);
  undoAction = undo;
  $("#toast").innerHTML =
    `<span>${esc(message)}</span>${undo ? '<button id="undo">Deshacer</button>' : ""}`;
  $("#toast").classList.add("visible");
  timer = setTimeout(() => {
    $("#toast").classList.remove("visible");
    undoAction = null;
  }, 6500);
}
$("#toast").addEventListener("click", (e) => {
  if (e.target.id === "undo" && undoAction) {
    const action = undoAction;
    undoAction = null;
    action();
    $("#toast").classList.remove("visible");
  }
});
function render() {
  document.querySelectorAll("nav button").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === view);
    b.setAttribute("aria-current", b.dataset.view === view ? "page" : "false");
  });
  $("#main").innerHTML =
    view === "hoy"
      ? today()
      : view === "historial"
        ? history()
        : view === "progreso"
          ? progress()
          : view === "calistenia"
            ? skillsUI.page()
            : settings();
  const strip = $(".exercise-switcher"),
    selected = strip?.querySelector('[aria-pressed="true"]');
  if (selected) {
    const box = strip.getBoundingClientRect(),
      item = selected.getBoundingClientRect();
    strip.scrollLeft +=
      item.left - box.left - (strip.clientWidth - selected.offsetWidth) / 2;
  }
}
function intro(title, sub, eyebrow = "A TU RITMO") {
  return `<div class="intro"><div><p class="eyebrow">${esc(eyebrow)}</p><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div></div>`;
}
function today() {
  const d = current(),
    done = groups.filter(
      (g) =>
        d.goals[g] > 0 && dayTotals(state, activeDay, g).count >= d.goals[g],
    ).length;
  return `<div class="intro"><div><p class="eyebrow">${esc(dateLabel(activeDay))}</p><h1>Cada rep cuenta<span style="color:var(--push)">.</span></h1><p>Un toque. Una serie más cerca.</p></div><div class="day-summary"><div class="dots">${groups.map((g) => `<b class="${d.goals[g] > 0 && dayTotals(state, activeDay, g).count >= d.goals[g] ? "done" : ""}"></b>`).join("")}</div>${done}/${groups.filter((g) => d.goals[g] > 0).length} metas</div></div>${storageError ? '<p class="note danger" role="alert">El almacenamiento no está disponible o la copia guardada no se pudo leer. Exporta tus datos antes de cerrar; no se reemplazará una copia dañada hasta que registres cambios.</p>' : ""}${gameUI.card()}${favoriteSection()}<div class="cards">${groups.map((g) => card(g, d)).join("")}</div>${timerSection()}${trainingUI.dashboard()}${backupBanner()}<div class="section-heading"><h2>Lo que llevas hoy</h2><span>${d.entries.length + skillContributions(state, activeDay).length} series</span></div>${d.entries.length ? entries(d.entries, activeDay) : skillContributions(state, activeDay).length ? "" : entries([], activeDay)}${skillsUI.daySection(activeDay, { counterOnly: true })}`;
}
function card(g, d) {
  const t = dayTotals(state, activeDay, g),
    goal = d.goals[g],
    p = state.selected[g],
    remaining = Math.max(0, goal - t.count);
  const hint =
    goal === 0
      ? "Día de descanso"
      : t.count >= goal
        ? "Meta completa. Bien hecho."
        : `Faltan ${remaining}${g === "legs" ? " por pierna" : " reps"}`;
  return `<section class="card ${g}" aria-label="${labels[g]}"><div class="card-top"><div class="card-heading"><div class="group-label"><span class="group-icon">${icons[g]}</span><h2>${labels[g]}</h2></div><button class="goal" data-action="goal" data-group="${g}" aria-label="Editar meta de ${labels[g]}">Meta ${goal} ↗</button></div><div class="card-body"><div><div class="counter"><strong id="count-${g}">${t.count}</strong><span>/ ${goal}${g === "legs" ? " <small>por lado</small>" : ""}</span></div><div class="progress" role="progressbar" aria-label="Meta ${labels[g]}" aria-valuemin="0" aria-valuemax="${goal || 1}" aria-valuenow="${Math.min(t.count, goal || 1)}"><i style="width:${goal ? Math.min(100, (t.count / goal) * 100) : 0}%"></i></div><p class="remaining">${g === "legs" && t.left !== t.right ? `Izq. ${t.left} · Der. ${t.right} · ` : ""}${hint}${skillContributions(state, activeDay).some((e) => e.group === g) ? " · Incluye calistenia" : ""}</p></div><button class="config" data-action="config" data-group="${g}" aria-label="Cambiar ejercicio y peso de ${labels[g]}"><span><strong>${esc(p.exercise)}</strong><small>${esc(weightLabel(p.weight))}${g === "legs" ? ` · ${sideLabel(p.side)}` : ""}</small></span><span>⌄</span></button></div></div><div class="quick">${state.quick.map((n) => `<button data-action="add" data-group="${g}" data-reps="${n}" aria-label="Sumar ${n} a ${labels[g]}">+${n}</button>`).join("")}<button class="custom" data-action="custom" data-group="${g}" aria-label="Otra cantidad para ${labels[g]}">···</button></div></section>`;
}
function entries(list, key) {
  return list.length
    ? `<div class="entries">${[...list]
        .reverse()
        .map(
          (e) =>
            `<div class="entry"><span class="badge ${e.group}">${icons[e.group]}</span><div class="entry-info"><strong>${esc(e.exercise)}</strong><small>${esc(weightLabel(e.weight))}${e.group === "legs" ? ` · ${sideLabel(e.side)}` : ""} · ${new Date(e.at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}</small></div><span class="entry-reps">+${e.reps}</span><button data-action="edit" data-id="${esc(e.id)}" data-day="${key}" aria-label="Editar serie de ${esc(e.exercise)}">···</button></div>`,
        )
        .join("")}</div>`
    : '<div class="empty"><strong>Tu siguiente serie empieza aquí.</strong>Toca un + para guardar tus primeras reps.</div>';
}
function history() {
  const d = state.days[historyDay] ?? {
      goals: goalsForDate(state, historyDay),
      entries: [],
    },
    streak = streakStats(state, activeDay);
  return `${intro("Tu constancia.", "Cada día tiene su propia historia.", "HISTORIAL")}<div class="panel history-panel"><section class="streak-hero" aria-label="Racha general"><div><span class="eyebrow">RACHA DE ACTIVIDAD</span><div class="streak-count">${streak.current}<span>${streak.current === 1 ? "día" : "días"}</span><span class="streak-spark" aria-hidden="true">✦</span></div><p>Un día cuenta al registrar cualquier serie.</p></div><div class="streak-record"><strong>${streak.best}</strong><span>mejor racha</span><strong>${streak.total}</strong><span>días activos</span></div></section><div class="group-streaks">${groups
    .map((g) => {
      const t = streakStats(state, activeDay, g);
      return `<div class="group-streak ${g}"><span>${labels[g]}</span><strong>${t.current}<small> ${t.current === 1 ? "día" : "días"}</small></strong><small>Récord ${t.best} · ${t.total} metas</small></div>`;
    })
    .join(
      "",
    )}</div><p class="note streak-explainer">Las rachas de Push, Pull y Legs cuentan días cumpliendo su meta. Los descansos con meta 0 conservan esa racha sin sumar días. Hoy tienes hasta medianoche para continuar.</p>${calendar()}<div class="section-heading"><h2>Detalle del día</h2></div><div class="history-date"><input aria-label="Día del historial" type="date" id="history-date" max="${activeDay}" value="${historyDay}"><span class="quiet">${d.entries.length + skillEntriesOn(state, historyDay).length} series</span></div><div class="history-stats">${groups.map((g) => `<div class="stat"><small>${labels[g]}</small><strong>${dayTotals(state, historyDay, g).count}</strong> <span>/ ${d.goals[g]}${g === "legs" ? " por lado" : ""}</span></div>`).join("")}</div><p class="quiet">${esc(dateLabel(historyDay))}</p>${d.entries.length ? entries(d.entries, historyDay) : skillEntriesOn(state, historyDay).length ? '<p class="note">Tu práctica de calistenia de este día está abajo.</p>' : '<div class="empty"><strong>Sin series este día.</strong>El calendario se llena con cada día de actividad.</div>'}${skillsUI.daySection(historyDay)}</div>`;
}
function calendar() {
  const first = new Date(calendarMonth + "-01T12:00:00"),
    offset = (first.getDay() + 6) % 7,
    count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const monthName = first.toLocaleDateString("es-GT", {
    month: "long",
    year: "numeric",
  });
  let cells = '<span class="calendar-blank" aria-hidden="true"></span>'.repeat(
    offset,
  );
  for (let day = 1; day <= count; day++) {
    const key = calendarMonth + "-" + String(day).padStart(2, "0"),
      d = state.days[key],
      active = hasActivity(state, key);
    const goals = d?.goals ?? goalsForDate(state, key);
    const completed = groups.filter(
      (g) => goals[g] > 0 && dayTotals(state, key, g).count >= goals[g],
    ).length;
    const dots = groups
      .map((g) => {
        const goal = goals[g],
          n = dayTotals(state, key, g).count;
        return `<i class="${goal > 0 && n >= goal ? "met" : n > 0 ? "partial" : ""} ${g}"></i>`;
      })
      .join("");
    cells += `<button class="calendar-day ${active ? "has-activity" : ""} ${key === activeDay ? "is-today" : ""}" data-action="history-day" data-day="${key}" aria-pressed="${key === historyDay}" aria-label="${esc(dateLabel(key))}: ${active ? "con actividad" : "sin actividad"}, ${completed} metas completas" ${key > activeDay ? "disabled" : ""}><span>${day}</span><span class="calendar-dots" aria-hidden="true">${dots}</span></button>`;
  }
  return `<section class="calendar" aria-label="Calendario de actividad"><div class="calendar-heading"><h2>${esc(monthName)}</h2><div><button class="calendar-arrow" data-action="calendar-prev" aria-label="Mes anterior">‹</button><button class="calendar-arrow" data-action="calendar-next" aria-label="Mes siguiente" ${calendarMonth >= activeDay.slice(0, 7) ? "disabled" : ""}>›</button></div></div><div class="calendar-grid"><span class="weekday">L</span><span class="weekday">M</span><span class="weekday">M</span><span class="weekday">J</span><span class="weekday">V</span><span class="weekday">S</span><span class="weekday">D</span>${cells}</div><div class="calendar-legend"><span><i class="legend-activity"></i>Actividad</span><span><i class="legend-met"></i>Meta completa</span><button data-action="history-day" data-day="${activeDay}">Ir a hoy ↗</button></div></section>`;
}

function openSheet(title, body) {
  const s = $("#sheet");
  s.innerHTML = `<div class="sheet-head"><h2 id="sheet-title">${esc(title)}</h2><button class="close" data-close aria-label="Cerrar">×</button></div>${body}`;
  s.showModal();
}
function configForm(g, edit, duration = false) {
  const p = edit ?? state.selected[g],
    opts = [...new Set([...exercises[g], p.exercise])];
  return `<label class="field">Ejercicio<select name="exercise">${opts.map((x) => `<option ${x === p.exercise ? "selected" : ""}>${esc(x)}</option>`).join("")}<option value="__custom">Otro ejercicio…</option></select></label><label class="field" id="custom-name-field" hidden>Nombre del ejercicio<input name="customName" maxlength="80" placeholder="Ej. Ring pushups"></label><label class="field">Peso añadido total · lb<input name="weight" type="number" inputmode="decimal" min="0" max="2000" step="0.5" value="${p.weight}" required></label>${weightUI.buttons(shortcutConfig({ kind: "base", item: { ...p, group: g } }), p.weight)}<p class="note">0 = sin peso añadido. Suma el peso de ambas mancuernas.</p>${g === "legs" ? `<label class="field">Lado<select name="side"><option value="both" ${p.side === "both" ? "selected" : ""}>Ambas · reps por pierna</option><option value="left" ${p.side === "left" ? "selected" : ""}>Solo izquierda</option><option value="right" ${p.side === "right" ? "selected" : ""}>Solo derecha</option></select></label>` : ""}<details class="skill-equipment"><summary>Equipo y variante para Progreso</summary><label class="field">Equipo<input name="apparatus" maxlength="80" value="${esc(p.apparatus ?? "")}" placeholder="Ej. Barra, Anillas, Suelo"></label><label class="field">Variante<input name="variation" maxlength="80" value="${esc(p.variation ?? "")}" placeholder="Vacío = estándar o lado elegido"></label><p class="note">Usa el mismo nombre de equipo y variante en Entrenar para unir sus marcas.</p></details>${effortFields(p, duration)}`;
}
function add(g, reps, preset = null, meta = {}) {
  rollover();
  const previousRecords = allTimeRecords(state, activeDay);
  const d = current(),
    p = preset ?? state.selected[g],
    before = dayTotals(state, activeDay, g).count,
    id = crypto.randomUUID(),
    key = activeDay;
  const { id: presetId, day: presetDay, ...config } = p;
  const entry = trainingUI.decorate(
    {
      ...config,
      ...(meta.durationSeconds
        ? { durationSeconds: meta.durationSeconds }
        : {}),
      id,
      group: g,
      reps,
      at: Date.now(),
    },
    "base",
    meta,
  );
  if (!validateEntry(entry)) return toast("Revisa el número de repeticiones.");
  d.entries.push(entry);
  const saved = save();
  render();
  const count = $(`#count-${g}`);
  count?.classList.add("pop");
  const complete =
    d.goals[g] > 0 &&
    before < d.goals[g] &&
    dayTotals(state, activeDay, g).count >= d.goals[g];
  const recordKey = skillRecordKey({
    source: "base",
    family: "base",
    movement: p.exercise,
    variation:
      p.variation ||
      (g === "legs"
        ? p.side === "left"
          ? "Izquierda"
          : p.side === "right"
            ? "Derecha"
            : "Ambas piernas"
        : "Estándar"),
    metric: "reps",
    apparatus: p.apparatus ?? "",
    support: "Libre",
    supportNote: "",
  });
  const oldRecord = previousRecords
    .find((r) => r.key === recordKey)
    ?.byWeight.find((e) => e.weight === p.weight);
  const newRecord = oldRecord && reps > oldRecord.value;

  toast(
    saved
      ? newRecord
        ? `¡Nuevo récord! ${reps} ${p.exercise}`
        : complete
          ? `¡Meta de ${labels[g]} completa!`
          : `+${reps} ${p.exercise}${g === "legs" ? ` · ${sideLabel(p.side).toLowerCase()}` : ""}`
      : "Reps en memoria; no se pudo guardar.",
    () => {
      const day = state.days[key];
      day.entries = day.entries.filter((e) => e.id !== id);
      save();
      render();
    },
  );
}
function formValues(form, g) {
  const f = new FormData(form),
    exercise =
      f.get("exercise") === "__custom"
        ? String(f.get("customName")).trim()
        : String(f.get("exercise"));
  if (!exercise) throw Error("Escribe el nombre del ejercicio.");
  return {
    exercise,
    ...readEffort(form, false),
    weight: Number(f.get("weight")),
    side: g === "legs" ? String(f.get("side")) : "both",
    apparatus: String(f.get("apparatus") ?? "").trim(),
    variation: String(f.get("variation") ?? "").trim(),
  };
}
$("#main").addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const g = b.dataset.group,
    a = b.dataset.action;
  rollover();
  if (a === "add") return add(g, Number(b.dataset.reps));
  if (a === "config" || a === "custom") {
    const custom = a === "custom";
    openSheet(
      `${custom ? "Sumar a" : "Preparar"} ${labels[g]}`,
      `<form id="series-form" data-group="${g}" data-mode="${a}">${custom ? '<label class="field">Repeticiones<input name="reps" type="number" inputmode="numeric" min="1" max="10000" step="1" required autofocus></label>' : ""}${configForm(g, null, custom)}<button class="primary wide">${custom ? "Sumar repeticiones" : "Guardar selección"}</button></form>`,
    );
  }
  if (a === "goal") {
    openSheet(
      `Meta de ${labels[g]}`,
      `<form id="goal-form" data-group="${g}"><label class="field">${g === "legs" ? "Reps diarias por pierna" : "Reps diarias"}<input name="goal" type="number" inputmode="numeric" min="0" max="10000" step="1" required value="${current().goals[g]}"></label><p class="note">Para hoy y los próximos días. Usa 0 para descansar.</p><button class="primary wide">Guardar meta</button></form>`,
    );
  }
  if (a === "edit") {
    const entry = state.days[b.dataset.day].entries.find(
      (x) => x.id === b.dataset.id,
    );
    openSheet(
      "Editar serie",
      `<form id="edit-form" data-day="${b.dataset.day}" data-id="${esc(entry.id)}" data-group="${entry.group}"><label class="field">Repeticiones<input name="reps" type="number" inputmode="numeric" min="1" max="10000" step="1" required value="${entry.reps}"></label>${configForm(entry.group, entry, true)}<div class="sheet-actions"><button type="button" class="secondary danger" data-delete="${esc(entry.id)}" data-day="${b.dataset.day}">Eliminar</button><button class="primary">Guardar</button></div></form>`,
    );
  }
  if (a === "history-day") {
    historyDay = b.dataset.day;
    calendarMonth = historyDay.slice(0, 7);
    render();
  }
  if (a === "calendar-prev" || a === "calendar-next") {
    const month = new Date(calendarMonth + "-01T12:00:00");
    month.setMonth(month.getMonth() + (a === "calendar-prev" ? -1 : 1));
    const next = dayKey(month).slice(0, 7);
    if (next <= activeDay.slice(0, 7)) {
      calendarMonth = next;
      render();
    }
  }
  if (a === "export") exportData();
  if (a === "icon-help") iconHelp();
  if (a === "recover-local") {
    try {
      const backup = upgrade(
        validateBackup(JSON.parse(localStorage.getItem("reps.recovery.v1"))),
      );
      importReview(backup);
    } catch {
      toast("No hay una copia local de recuperación válida.");
    }
  }
  if (a === "import") $("#import-file").click();
  if (a === "offline") offlineStatus();
});
$("#sheet").addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) $("#sheet").close();
  const b = e.target.closest("[data-delete]");
  if (b) {
    const key = b.dataset.day,
      d = state.days[key],
      entry = d.entries.find((x) => x.id === b.dataset.delete),
      index = d.entries.indexOf(entry);
    d.entries.splice(index, 1);
    save();
    $("#sheet").close();
    render();
    toast("Serie eliminada", () => {
      state.days[key].entries.splice(index, 0, entry);
      save();
      render();
    });
  }
});
$("#sheet").addEventListener("change", (e) => {
  if (e.target.name === "exercise") {
    $("#custom-name-field").hidden = e.target.value !== "__custom";
    $("#custom-name-field input").required = e.target.value === "__custom";
  }
});
document.addEventListener("submit", (e) => {
  e.preventDefault();
  rollover();
  const f = e.target,
    id = f.id,
    fd = new FormData(f),
    g = f.dataset.group;
  try {
    if (id === "series-form") {
      state.selected[g] = formValues(f, g);
      if (f.dataset.mode === "custom") {
        add(g, Number(fd.get("reps")), null, readEffort(f));
      } else {
        save();
        render();
        toast("Selección guardada");
      }
      $("#sheet").close();
    }
    if (id === "edit-form") {
      const entry = state.days[f.dataset.day].entries.find(
          (x) => x.id === f.dataset.id,
        ),
        next = {
          ...entry,
          ...formValues(f, g),
          difficulty: readEffort(f).difficulty,
          durationSeconds: readEffort(f).durationSeconds,
          reps: Number(fd.get("reps")),
        };
      if (!validateEntry(next)) throw Error("Revisa los valores de la serie.");
      Object.assign(entry, next);
      save();
      $("#sheet").close();
      render();
      toast("Serie actualizada");
    }
    if (id === "goal-form") {
      state.goals[g] = Number(fd.get("goal"));
      current().goals[g] = state.goals[g];
      save();
      $("#sheet").close();
      render();
      toast("Meta guardada");
    }
    if (id === "goals-form") {
      groups.forEach((k) => (state.goals[k] = Number(fd.get(k))));
      current().goals = goalsForDate(state, activeDay);
      save();
      render();
      toast("Metas guardadas");
    }
    if (id === "quick-form") {
      state.quick = [0, 1, 2].map((i) => Number(fd.get("q" + i)));
      save();
      render();
      toast("Botones guardados");
    }
  } catch (err) {
    toast(err.message);
  }
});
$("#main").addEventListener("change", async (e) => {
  if (e.target.id === "history-date") {
    historyDay = e.target.value || activeDay;
    calendarMonth = historyDay.slice(0, 7);
    render();
  }
  if (e.target.id === "import-file" && e.target.files[0]) {
    try {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024)
        throw Error("La copia es demasiado grande.");
      const incoming = upgrade(validateBackup(JSON.parse(await file.text())));
      importReview(incoming);
    } catch {
      toast("No se pudo importar: elige una copia válida de Reps.");
    }
    e.target.value = "";
  }
});
function readRecovery() {
  try {
    return localStorage.getItem("reps.recovery.v1");
  } catch {
    return null;
  }
}
function replaceState(next, label) {
  const previous = state;
  state = upgrade(validateBackup(next));
  if (save()) {
    try {
      localStorage.setItem("reps.recovery.v1", JSON.stringify(previous));
    } catch {}
    skillsUI.reset();
    journeyUI.reset();
    detailOpen = false;
    $("#sheet").close();
    render();
    toast(label);
  } else {
    state = previous;
    toast("No se pudo guardar; se conservaron los datos anteriores.");
  }
}
function importReview(incoming, prefer = "local") {
  const result = mergeBackups(state, incoming, prefer),
    r = result.report;
  let valid = true;
  try {
    validateBackup(result.state);
  } catch {
    valid = false;
  }
  openSheet(
    "Combinar copia",
    `<p>Vista previa: <strong>${r.added} nuevos</strong> · ${r.duplicates} iguales · ${r.conflicts} conflictos.</p><p class="note">Los registros con el mismo ID se conservan una sola vez. Los ajustes generales y el calendario de este dispositivo se mantienen. Dos series con IDs diferentes se conservan aunque se parezcan.</p>${r.conflicts ? `<label class="field">Si el mismo registro fue editado en ambos lugares<select id="merge-preference"><option value="local" ${prefer === "local" ? "selected" : ""}>Conservar la versión de este dispositivo</option><option value="incoming" ${prefer === "incoming" ? "selected" : ""}>Usar la versión de la copia</option></select></label><details><summary>Ver conflictos</summary>${r.examples.map((x) => `<p class="note">${esc(x.label)} · ${esc(x.id)}</p>`).join("")}</details>` : ""}${!valid ? '<p class="note danger" role="alert">La combinación supera los límites de favoritas, metas o planes, o tiene datos incompatibles. Reduce esos elementos antes de combinar.</p>' : ""}<button class="secondary wide" id="pre-export">Exportar datos actuales</button><button class="primary wide" id="confirm-merge" ${!valid ? "disabled" : ""}>Combinar con mis datos</button><details class="import-advanced"><summary>Opciones avanzadas</summary><p class="note">Reemplazar borra del registro activo lo que solo existe en este dispositivo. Antes exporta una copia. Se intentará conservar una copia local de recuperación.</p><button class="secondary danger wide" id="confirm-import">Reemplazar con esta copia</button></details>`,
  );
  $("#pre-export").onclick = exportData;
  const select = $("#merge-preference");
  if (select) select.onchange = () => importReview(incoming, select.value);
  $("#confirm-merge").onclick = () =>
    replaceState(result.state, "Copias combinadas");
  $("#confirm-import").onclick = () => {
    openSheet(
      "Confirmar reemplazo",
      `<p>Se usará únicamente la copia seleccionada. Tus datos actuales dejarán de aparecer.</p><button class="secondary wide" id="replace-export">Exportar datos actuales</button><button class="primary danger wide" id="replace-final">Sí, reemplazar datos</button>`,
    );
    $("#replace-export").onclick = exportData;
    $("#replace-final").onclick = () =>
      replaceState(incoming, "Copia restaurada");
  };
}
function iconHelp() {
  openSheet(
    "Icono R · conservar tus datos",
    `<div class="icon-help-preview"><img src="./reps-icon-180-v9.png" width="80" height="80" alt="Nuevo icono R"><div><h3>Este es el nuevo icono.</h3><p>iOS puede conservar el que usó al instalar. La app no puede obligarlo a cambiar.</p></div></div><ol class="safe-icon-steps"><li>Exporta una copia desde el icono donde están tus registros y guárdala en Archivos.</li><li>Selecciona ese archivo abajo para comprobar que coincide con los datos de esta instalación.</li><li>Para probar el nuevo icono, abre esta misma dirección en Safari y usa Compartir → Agregar a pantalla de inicio. Si iOS lo permite, conserva el icono anterior.</li><li>Abre el nuevo acceso. Si no muestra tus registros, importa la copia y revisa tus contadores, historial y marcas antes de eliminar el acceso anterior.</li></ol><p class="note danger">Si iOS exige borrar el acceso anterior, conserva primero la copia verificada en Archivos. Eliminar una app web puede borrar su almacenamiento. Esta comprobación verifica el archivo; no crea sincronización.</p><button class="secondary wide" id="icon-export">1 · Exportar copia actual</button><label class="field">2 · Comprobar la copia guardada<input type="file" id="icon-verify" accept=".json,application/json"></label><p id="icon-verify-result" role="status"></p><p class="note">Para actualizar funciones basta con cerrar y volver a abrir con internet, manteniendo el icono actual.</p>`,
  );
  $("#icon-export").onclick = exportData;
  $("#icon-verify").onchange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file || file.size > 10 * 1024 * 1024) throw Error();
      const backup = upgrade(validateBackup(JSON.parse(await file.text())));
      $("#icon-verify-result").textContent =
        dataFingerprint(backup) === dataFingerprint(state)
          ? "✓ Copia válida y completa: coincide con tus datos actuales. Consérvala en Archivos."
          : "La copia es válida, pero no coincide con todos los datos actuales. Exporta una copia nueva desde esta instalación.";
    } catch {
      $("#icon-verify-result").textContent =
        "No se pudo verificar. Selecciona una copia JSON de Reps.";
    }
  };
}
function exportData() {
  state.backup.lastExportAt = Date.now();
  state.backup.snoozedUntil = null;
  save();
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `reps-${dayKey()}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  render();
  if (view === "ajustes") offlineStatus();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
document.querySelector(".shell").addEventListener("click", (e) => {
  const b = e.target.closest("[data-view]");
  if (b) {
    view = b.dataset.view;
    if (view === "progreso") detailOpen = false;
    render();
    if (view === "ajustes") offlineStatus();
    window.scrollTo(0, 0);
  }
});
$(".brand").onclick = (e) => {
  e.preventDefault();
  view = "hoy";
  render();
  window.scrollTo(0, 0);
};
function rollover() {
  const key = dayKey();
  if (key !== activeDay) {
    activeDay = key;
    historyDay = key;
    calendarMonth = key.slice(0, 7);
    progressWeek = startOfWeek(key);
    ensureDay(state, key);
    save();
    render();
  }
}
window.addEventListener("pageshow", rollover);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) rollover();
});
setInterval(rollover, 15000);
window.addEventListener("storage", (e) => {
  if (e.key === KEY && e.newValue) {
    try {
      state = upgrade(validateBackup(JSON.parse(e.newValue)));
      skillsUI.reset();
      journeyUI.reset();
      detailOpen = false;
      render();
    } catch {
      toast("No se pudo leer el cambio de otra pestaña.");
    }
  }
});
async function offlineStatus() {
  const el = $("#offline-info");
  if (!el) return;
  try {
    const cache = await caches.open("ahorita-v14");
    const keys = await cache.keys();
    el.textContent =
      keys.length >= 8
        ? "Lista para abrirse sin conexión en este navegador."
        : "Abre la app con internet y espera unos segundos para preparar el modo sin conexión.";
  } catch {
    el.textContent =
      "No fue posible preparar el modo sin conexión en este navegador.";
  }
}
function favoriteTitle(f) {
  return f.kind === "base"
    ? f.item.exercise
    : skillCatalog[f.item.family].name + " · " + f.item.variation;
}
function favoriteAmount(f) {
  return f.kind === "base"
    ? f.item.reps + " reps"
    : f.item.value + (f.item.metric === "seconds" ? " s" : " reps");
}
function favoriteMeta(f) {
  return f.kind === "base"
    ? labels[f.item.group] +
        " · " +
        weightLabel(f.item.weight) +
        (f.item.group === "legs" ? " · " + sideLabel(f.item.side) : "")
    : f.item.movement +
        " · " +
        weightLabel(f.item.weight) +
        (f.item.metric === "reps"
          ? " · " +
            (f.item.counterGroup ? labels[f.item.counterGroup] : "Sin contador")
          : "");
}
function shortcutTitle(f) {
  const c = shortcutConfig(f),
    family = skillCatalog[c.family]?.name;
  return f.kind === "base"
    ? c.movement
    : family?.toLowerCase() === c.movement.toLowerCase()
      ? c.movement
      : family + " · " + c.movement;
}
function selectedShortcut() {
  const items = universalFavorites(state);
  return (
    items.find((f) => f.key === state.preferences.activeShortcut) ?? items[0]
  );
}
function shortcutChoice(f, stats = shortcutDailyStats(state, f, activeDay)) {
  return `<button class="exercise-chip" data-action="shortcut-select" data-key="${esc(f.key)}" aria-pressed="${selectedShortcut()?.key === f.key}"><strong>${esc(shortcutTitle(f))}</strong><span>${esc(stats.config.variation)} · ${weightLabel(f.item.weight)}</span><small>${stats.total} ${stats.config.metric === "seconds" ? "s" : "reps"} hoy</small></button>`;
}
function favoriteSection() {
  const items = universalFavorites(state);
  if (!items.length)
    return '<div class="favorites-empty"><span>Tu ejercicio, con contador propio</span><button class="text-button" data-action="shortcut-new">+ Fijar ejercicio</button></div>';
  const f = selectedShortcut(),
    m = shortcutDailyStats(state, f, activeDay),
    c = m.config,
    unit = c.metric === "seconds" ? "s" : "reps",
    edit = f.kind === "base" ? "favorite-edit" : "skill-favorite-edit";
  const visible = items.slice(0, 6);
  if (!visible.some((x) => x.key === f.key)) visible[visible.length - 1] = f;
  return `<section class="exercise-shortcuts" aria-label="Mis ejercicios"><div class="mini-heading"><h2>Mis ejercicios</h2><div>${items.length > 6 ? `<button class="text-button" data-action="favorite-all">Todos (${items.length})</button>` : ""}<button class="text-button" data-action="shortcut-new">+ Fijar</button></div></div>${items.length > 1 ? `<div class="exercise-switcher" aria-label="Elegir contador">${visible.map((x) => shortcutChoice(x)).join("")}</div>` : ""}<article class="exercise-counter" data-key="${esc(f.key)}"><div class="exercise-counter-head"><div><span class="eyebrow">${esc(f.kind === "base" ? labels[c.baseGroup] : skillCatalog[c.family].name)}</span><h3>${esc(c.movement)}</h3><p>${esc([c.variation, c.apparatus, c.support === "Libre" ? "" : c.support + ": " + c.supportNote].filter(Boolean).join(" · "))}</p></div><button class="exercise-counter-edit" data-action="${edit}" data-id="${esc(f.item.id)}" aria-label="Cambiar o quitar ${esc(c.movement)}">···</button></div><div class="exercise-counter-body"><div><strong class="exercise-total" aria-live="polite">${m.total}</strong><span> ${unit}${m.perLeg ? " / lado" : ""}</span><small>Hoy · todas las cargas</small></div><div class="shortcut-weight-picker"><button class="shortcut-load" data-action="shortcut-load" data-key="${esc(f.key)}" aria-label="Cambiar lastre de ${esc(c.movement)}"><small>Próxima serie</small><strong>${esc(weightLabel(f.item.weight))} ⌄</strong></button>${weightUI.buttons(c, f.item.weight, { compact: true, key: f.key, limit: 2 })}</div></div><div class="quick exercise-quick">${shortcutIncrements(
    f,
    state.quick,
  )
    .map(
      (value) =>
        `<button class="${value === (f.kind === "base" ? f.item.reps : f.item.value) ? "habitual" : ""}" data-action="shortcut-add" data-key="${esc(f.key)}" data-value="${value}" aria-label="Sumar ${value} ${unit} de ${esc(c.movement)}">+${value}${c.metric === "seconds" ? " s" : ""}</button>`,
    )
    .join(
      "",
    )}<button class="custom" data-action="shortcut-custom" data-key="${esc(f.key)}" aria-label="Otra cantidad de ${esc(c.movement)}">···</button></div><p class="exercise-counter-link">${m.group ? `Cada rep suma a ${labels[m.group]}${m.group === "legs" ? " · " + sideLabel(f.kind === "base" ? f.item.side : (f.item.counterSide ?? "both")) : ""}` : c.metric === "seconds" ? "Holds en segundos · sin convertir a reps" : "Sin contador de grupo · asígnalo en ···"}<span>${m.entries.length} ${m.entries.length === 1 ? "serie" : "series"}</span></p></article></section>`;
}
function logShortcut(f, value, effort = {}) {
  if (!f) return;
  const seconds = f.kind === "skill" && f.item.metric === "seconds";
  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    value > (seconds ? 36000 : 10000) ||
    (!seconds && !Number.isInteger(value)) ||
    (seconds && Math.abs(value * 10 - Math.round(value * 10)) > 1e-7)
  )
    throw Error("Revisa la cantidad de esta serie.");
  if (f.kind === "base")
    add(f.item.group, value, { ...f.item, ...effort }, effort);
  else skillsUI.logPreset({ ...f.item, ...effort, value });
}
function setShortcutWeight(f, value, announce = true) {
  rememberWeights(state, shortcutConfig(f), f.item.weight, value);
  f.item.weight = value;
  save();
  render();
  if (announce)
    toast(value ? `Próxima serie: +${value} lb` : "Próxima serie sin lastre");
}
function shortcutSheet(f, mode) {
  if (!f) return;
  const c = shortcutConfig(f),
    seconds = c.metric === "seconds",
    load = mode === "load";
  openSheet(
    load ? "Cambiar lastre" : "Registrar una serie",
    `<p class="note">${esc(shortcutTitle(f))} · ${esc(c.variation)}</p><form id="shortcut-form" data-key="${esc(f.key)}" data-mode="${mode}"><label class="field">${load ? "Lastre añadido total · lb" : seconds ? "Segundos de esta serie" : "Reps de esta serie"}<input name="value" required type="number" inputmode="${load || seconds ? "decimal" : "numeric"}" min="${load ? 0 : seconds ? 0.1 : 1}" max="${load ? 2000 : seconds ? 36000 : 10000}" step="${load ? 0.5 : seconds ? 0.1 : 1}" value="${load ? f.item.weight : ""}" autofocus></label>${load ? weightUI.buttons(c, f.item.weight, { target: "value" }) : ""}<p class="note">${load ? "Se usa para las próximas series de este ejercicio. Las series guardadas conservan su peso." : weightLabel(f.item.weight) + ". Se guarda una sola serie y actualiza tus metas, historial y marcas."}</p>${load ? "" : effortFields(f.item, seconds ? false : true)}<button class="primary wide">${load ? "Usar este lastre" : "Guardar serie"}</button></form>`,
  );
}
function allShortcutChoices() {
  const items = universalFavorites(state);
  openSheet(
    "Mis ejercicios fijados",
    `<label class="field">Buscar entre mis ejercicios<input type="search" id="shortcut-search" placeholder="Nombre en español o inglés" autocomplete="off"></label><div class="all-shortcut-choices">${items.map((x) => `<div data-shortcut-choice="${esc(x.key)}">${shortcutChoice(x)}</div>`).join("")}</div><p class="note" id="shortcut-no-results" hidden>Sin coincidencias entre tus ejercicios fijados.</p><button class="secondary wide" data-action="shortcut-new">+ Fijar otro ejercicio</button>`,
  );
}

function favoriteManagement() {
  const items = universalFavorites(state);
  return `<p>Reps y segundos en un toque desde Hoy. Puedes ordenar tus accesos.</p>${items.length ? items.map((f, i) => `<div class="favorite-manage"><div><strong>${esc(favoriteTitle(f))} · ${favoriteAmount(f)}</strong><small>${esc(favoriteMeta(f))}</small></div><div class="favorite-order"><button class="text-button" data-action="favorite-move" data-key="${esc(f.key)}" data-delta="-1" aria-label="Subir ${esc(favoriteTitle(f))}" ${i === 0 ? "disabled" : ""}>↑</button><button class="text-button" data-action="favorite-move" data-key="${esc(f.key)}" data-delta="1" aria-label="Bajar ${esc(favoriteTitle(f))}" ${i === items.length - 1 ? "disabled" : ""}>↓</button><button class="text-button" data-action="${f.kind === "base" ? "favorite-edit" : "skill-favorite-edit"}" data-id="${esc(f.item.id)}" aria-label="Editar favorita ${esc(favoriteTitle(f))}">Editar</button></div></div>`).join("") : '<p class="note">Crea una favorita desde aquí o desde una serie de Calistenia.</p>'}`;
}
function openFavoriteChooser() {
  openSheet(
    "Crear favorita",
    '<p class="note">Elige qué quieres registrar de un toque en Hoy.</p><div class="favorite-choice"><button class="secondary" data-action="favorite-create-base"><strong>Push / Pull / Legs</strong><small>Reps y lastre de un ejercicio habitual</small></button><button class="secondary" data-action="favorite-create-skill"><strong>Calistenia · reps o segundos</strong><small>Variante, equipo, lastre y objetivo diario</small></button></div>',
  );
}
function baseFromRecord(e) {
  return {
    group: e.baseGroup,
    apparatus: e.apparatus,
    variation: e.variation,
    exercise: e.movement,
    reps: e.value,
    weight: e.weight,
    side: ["Solo izquierda", "Izquierda"].includes(e.variation)
      ? "left"
      : ["Solo derecha", "Derecha"].includes(e.variation)
        ? "right"
        : "both",
  };
}
function openBaseLog(e) {
  const f = baseFromRecord(e);
  openSheet(
    "Registrar otra serie",
    `<form id="series-form" data-group="${f.group}" data-mode="custom"><label class="field">Repeticiones<input name="reps" type="number" inputmode="numeric" min="1" max="10000" required value="${f.reps}"></label>${configForm(f.group, f, true)}<button class="primary wide">Sumar repeticiones</button></form>`,
  );
}
function openProgress(options = {}) {
  progressTab = "exercises";
  detailOpen = false;
  skillsUI.filterRecords(options.family ?? "all");
  view = "progreso";
  render();
  window.scrollTo(0, 0);
}
function openExercise(key) {
  journeyUI.open(key);
  detailOpen = true;
  progressTab = "exercises";
  view = "progreso";
  render();
  window.scrollTo(0, 0);
}
function insightsSection() {
  const m = progressInsights(state, activeDay);
  return `<section class="progress-insights"><h2>Últimos 30 días</h2><p>${m.activeDays} días de práctica registrados.</p>${m.improvements.map((x) => `<button class="insight-row" data-action="skill-exercise-detail" data-key="${esc(x.key)}"><span><strong>${esc(x.movement)} · ${esc(x.variation)}</strong><small>${esc(x.apparatus || "Equipo no especificado")} · ${weightLabel(x.weight)}</small></span><b>${x.from} → ${x.to} ${x.metric === "seconds" ? "s" : "reps"} ↗</b></button>`).join("")}<p class="note">${m.improvements.length ? "Mejores series de los últimos 30 días frente a los 30 anteriores, con la misma variante, equipo, asistencia y carga." : "Las mejoras aparecerán cuando haya registros comparables en los dos periodos de 30 días."}</p></section>`;
}
function progress() {
  if (detailOpen) return journeyUI.page();
  return `${intro("Tu progreso.", "Tu constancia, con todo el detalle.", "PROGRESO")}<div class="panel history-panel"><div class="progress-tabs" role="tablist" aria-label="Progreso"><button role="tab" data-action="progress-tab" data-tab="summary" aria-selected="${progressTab === "summary"}">Resumen semanal</button><button role="tab" data-action="progress-tab" data-tab="exercises" aria-selected="${progressTab === "exercises"}">Ejercicios y marcas</button></div>${skillsUI.focusSection("progress")}${progressTab === "summary" ? insightsSection() + weeklyProgress() : skillsUI.recordsPage()}</div>`;
}
function handleUniversalFavorites(e) {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const a = b.dataset.action;
  if (a === "favorite-create-base") favoriteForm();
  if (a === "favorite-create-skill") skillsUI.favoriteEditor();
  if (a === "favorite-all") allShortcutChoices();
  if (a === "shortcut-new") skillsUI.pinExercise();
  if (a === "shortcut-select") {
    if (!universalFavorites(state).some((f) => f.key === b.dataset.key)) return;
    state.preferences.activeShortcut = b.dataset.key;
    save();
    if (e.currentTarget.id === "sheet") $("#sheet").close();
    view = "hoy";
    render();
  }
  if (["shortcut-add", "shortcut-custom", "shortcut-load"].includes(a)) {
    rollover();
    const f = universalFavorites(state).find((f) => f.key === b.dataset.key);
    try {
      if (a === "shortcut-add") logShortcut(f, Number(b.dataset.value));
      else shortcutSheet(f, a === "shortcut-load" ? "load" : "custom");
    } catch (err) {
      toast(err.message);
    }
  }
  if (a === "universal-skill-add") {
    skillsUI.logFavorite(b.dataset.id);
    if (e.currentTarget.id === "sheet") $("#sheet").close();
  }
  if (a === "favorite-move") {
    if (moveShortcut(state, b.dataset.key, Number(b.dataset.delta))) {
      save();
      render();
    }
  }
  if (e.currentTarget.id === "sheet" && a === "favorite-add") {
    const f = state.favorites.find((f) => f.id === b.dataset.id);
    if (f) {
      add(f.group, f.reps, f);
      $("#sheet").close();
    }
  }
  if (e.currentTarget.id === "sheet" && a === "favorite-edit") {
    const f = state.favorites.find((f) => f.id === b.dataset.id);
    if (f) favoriteForm(f);
  }
  if (a === "progress-tab") {
    progressTab = b.dataset.tab;
    detailOpen = false;
    render();
  }
}

function backupBanner() {
  return backupDue(state, activeDay)
    ? '<aside class="backup-banner"><div><strong>Tu constancia merece una copia.</strong><p>Exporta tu historial antes de cambiar de teléfono o reinstalar.</p></div><div><button class="primary" data-action="export">Exportar copia</button><button class="text-button" data-action="backup-snooze">En 7 días</button></div></aside>'
    : "";
}
function timerSection() {
  return '<section class="rest-section"><div><h2>Descanso opcional</h2><p>Para cuando haces varias series seguidas.</p></div><div class="rest-presets"><button data-action="timer-start" data-seconds="60">60 s</button><button data-action="timer-start" data-seconds="90">90 s</button><button data-action="timer-start" data-seconds="120">2 min</button></div></section>';
}
function weeklyProgress() {
  const start = progressWeek,
    summary = weeklySummary(state, start, activeDay),
    max = Math.max(
      1,
      ...summary.days.flatMap((d) => groups.map((g) => d.counts[g])),
    ),
    short = (k) =>
      new Date(k + "T12:00:00").toLocaleDateString("es-GT", {
        day: "numeric",
        month: "short",
      });
  return `<div class="week-heading"><div><h2>${start === startOfWeek(activeDay) ? "Esta semana" : "Tu semana"}</h2><span>${short(start)} – ${short(shiftDay(start, 6))}</span></div><div><button class="calendar-arrow" data-action="week-prev" aria-label="Semana anterior">‹</button><button class="calendar-arrow" data-action="week-next" aria-label="Semana siguiente" ${start >= startOfWeek(activeDay) ? "disabled" : ""}>›</button></div></div><div class="weekly-kpis"><div><strong>${summary.active}<small> / ${summary.elapsed}</small></strong><span>días con actividad</span></div><div><strong>${summary.met}</strong><span>metas completas</span></div><div><strong>${summary.series}</strong><span>series registradas</span></div></div><div class="weekly-counts">${groups
    .map((g) => {
      const delta = summary.counts[g] - summary.previousCounts[g];
      return `<div class="${g}"><span>${labels[g]}</span><strong>${summary.counts[g]}</strong><small>${delta > 0 ? "+" : ""}${delta} vs. anterior${g === "legs" ? "<br>reps por lado" : ""}</small></div>`;
    })
    .join(
      "",
    )}</div><section class="week-chart" aria-label="Repeticiones por día y grupo"><div class="chart-columns">${summary.days.map((d) => `<button class="chart-day ${d.future ? "future" : ""}" data-action="week-day" data-day="${d.key}" ${d.future ? "disabled" : ""} aria-label="${esc(dateLabel(d.key))}: Push ${d.counts.push}, Pull ${d.counts.pull}, Legs ${d.counts.legs} por lado"><span class="chart-bars">${groups.map((g) => `<i class="${g}" style="height:${Math.max(2, (d.counts[g] / max) * 100)}%"></i>`).join("")}</span><span>${new Date(d.key + "T12:00:00").toLocaleDateString("es-GT", { weekday: "narrow" })}</span><small>${Number(d.key.slice(-2))}</small></button>`).join("")}</div><div class="chart-legend">${groups.map((g) => `<span><i class="${g}"></i>${labels[g]}</span>`).join("")}</div></section>${summary.skills.series ? `<div class="skill-week-summary"><strong>Calistenia esta semana</strong><span>${summary.skills.series} series · ${summary.skills.seconds} s de holds · ${summary.skills.reps} reps</span><button class="text-button" data-action="skill-open-records">Mis marcas ↗</button></div>` : ""}<p class="note">${summary.elapsed < 7 ? `Comparación de los primeros ${summary.elapsed} días de cada semana.` : "Comparación con la semana completa anterior."} Las barras incluyen las reps de calistenia asignadas a cada grupo; Legs cuenta por lado. Toca un día para ver el detalle.</p><button class="secondary wide" data-action="progress-tab" data-tab="exercises">Ver evolución por ejercicio ↗</button>`;
}
function settings() {
  const plan = weekPlan(state, activeDay),
    weekdays = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];
  return `${intro("A tu manera.", "Todo listo para seguir sumando.", "AJUSTES")}<div class="panel"><section class="settings-block"><h2>Tus metas diarias</h2><p>Objetivo de cada grupo en sus días de entrenamiento. Usa 0 para descansar.</p><form id="goals-form"><div class="row">${groups.map((g) => `<label class="field">${labels[g]}${g === "legs" ? " / lado" : ""}<input name="${g}" type="number" inputmode="numeric" min="0" max="10000" step="1" required value="${state.goals[g]}"></label>`).join("")}</div><button class="primary">Guardar metas</button></form></section><section class="settings-block"><h2>Tu semana de entrenamiento</h2><p>Marca los grupos que quieres trabajar cada día. Los demás descansan. El cambio se aplica desde hoy y conserva tus días anteriores.</p><form id="schedule-form"><div class="schedule-table"><div class="schedule-head"><span>Día</span>${groups.map((g) => `<span>${labels[g]}</span>`).join("")}</div>${weekdays.map((name, i) => `<div class="schedule-row"><span>${name}</span>${groups.map((g) => `<label><input type="checkbox" name="${i}-${g}" ${plan[i][g] ? "checked" : ""} aria-label="${name} ${labels[g]}"><span class="sr-only">${name} ${labels[g]}</span></label>`).join("")}</div>`).join("")}</div><button class="primary">Guardar calendario</button></form></section><section class="settings-block"><div class="mini-heading"><h2>Series favoritas</h2><button class="text-button" data-action="favorite-new">Crear ↗</button></div>${favoriteManagement()}</section><section class="settings-block"><h2>Tus botones rápidos</h2><form id="quick-form"><div class="row">${state.quick.map((n, i) => `<label class="field">Botón ${i + 1}<input name="q${i}" type="number" inputmode="numeric" min="1" max="999" step="1" required value="${n}"></label>`).join("")}</div><button class="secondary">Guardar botones</button></form></section><section class="settings-block"><h2>Descanso entre series</h2><p>Inicia 60 s, 90 s o 2 min desde Hoy. Puedes pausarlo y seguir usando la app. Si bloqueas el iPhone, al volver verás cuánto queda; el aviso sonoro requiere tener la app abierta.</p><label class="check-label"><input id="timer-sound" type="checkbox" ${state.preferences.timerSound ? "checked" : ""}> Sonido al terminar, con la app abierta</label></section><section class="settings-block"><h2>Tus datos se quedan contigo</h2><p>Guarda una copia en Archivos o iCloud Drive antes de reinstalar, cambiar de teléfono o borrar datos del sitio. La app no sincroniza automáticamente.</p><div class="row"><button class="secondary" data-action="export">Exportar copia</button><button class="secondary" data-action="import">Importar / combinar</button></div>${readRecovery() ? '<button class="text-button wide" data-action="recover-local">Revisar copia local anterior a la última importación ↗</button>' : ""}<input type="file" id="import-file" accept=".json,application/json" hidden><label class="check-label"><input id="backup-reminders" type="checkbox" ${state.backup.enabled ? "checked" : ""}> Recordarme hacer una copia</label><p class="note">${state.backup.lastExportAt ? "Última exportación preparada: " + esc(new Date(state.backup.lastExportAt).toLocaleDateString("es-GT")) + "." : "Aún no has preparado una copia."} El recordatorio aparece dentro de la app después de 3 días activos; luego, si hay datos nuevos, cada 7 días.</p></section><section class="settings-block"><h2>En tu pantalla de inicio</h2><p>Safari → Compartir → Agregar a pantalla de inicio. Para actualizar, conserva el icono: cierra y vuelve a abrir con internet. Eliminar y reinstalar puede borrar tus registros. Safari y el icono pueden tener historiales separados.</p><button class="secondary wide" data-action="icon-help">Veo la A: actualizar icono con respaldo ↗</button><p id="offline-info">Preparando disponibilidad sin conexión…</p><button class="secondary" data-action="offline">Revisar modo sin conexión</button></section><section class="settings-block"><h2>Cómo contamos</h2><p>Los intentos no completados cuentan como práctica, sin aumentar reps, segundos ni récords. Las metas de días de práctica sí los incluyen.</p><p>Las series de calistenia en repeticiones pueden sumar a Push, Pull o Legs con «Sumar al objetivo diario». Los holds en segundos se registran aparte. Las series anteriores a esta función conservan su contador; puedes editar una y asignarle un grupo.</p><p>Push y Pull suman reps de sus ejercicios, con cualquier peso. Las lb son el peso añadido total: dos mancuernas de 15 lb = +30 lb.</p><p>Legs lleva un contador por pierna. «Ambas» registra reps para cada lado. Si registras por separado, la meta usa el lado con menos reps.</p><p>La racha general requiere alguna serie cada día. Las de cada grupo requieren cumplir su meta; un descanso del calendario o meta 0 conserva esa racha sin sumar días. Hoy sigue abierto hasta medianoche.</p></section><section class="settings-block"><h2>Tu app, independiente</h2><p>Reps se aloja en tu GitHub Pages. No requiere ChatGPT para funcionar. El código y el alojamiento están en tu cuenta de GitHub; el historial está en este dispositivo.</p><a class="secondary inline-link" href="https://github.com/tefomars/ahorita-reps" target="_blank" rel="noopener">Ver código y guía ↗</a></section><p class="note">Reps · Hecha para ir sumando.<br>Sin suscripciones, anuncios ni rastreadores.</p></div>`;
}
function favoriteForm(f = null) {
  const g = f?.group ?? "push";
  openSheet(
    f?.id ? "Editar favorita" : "Crear favorita",
    `<form id="favorite-form" data-id="${f?.id ? esc(f.id) : ""}" data-group="${g}"><label class="field">Grupo<select name="group" id="favorite-group">${groups.map((x) => `<option value="${x}" ${x === g ? "selected" : ""}>${labels[x]}</option>`).join("")}</select></label><div id="favorite-config">${configForm(g, f)}</div><label class="field">Repeticiones<input name="reps" type="number" inputmode="numeric" min="1" max="10000" step="1" required value="${f?.reps ?? 10}"></label><div class="sheet-actions">${f?.id ? `<button class="secondary danger" type="button" data-delete-favorite="${esc(f.id)}">Eliminar</button>` : ""}<button class="primary">Guardar favorita</button></div></form>`,
  );
}
let restTimer = loadRestTimer(),
  audioContext = null;
function loadRestTimer() {
  try {
    const t = JSON.parse(localStorage.getItem("reps.timer.v1"));
    return t &&
      ((Number.isFinite(t.endAt) && t.endAt > 0) ||
        (t.endAt === null && Number.isFinite(t.remaining) && t.remaining > 0))
      ? t
      : null;
  } catch {
    return null;
  }
}
function storeTimer() {
  try {
    if (restTimer)
      localStorage.setItem("reps.timer.v1", JSON.stringify(restTimer));
    else localStorage.removeItem("reps.timer.v1");
  } catch {}
}
function prepareAudio() {
  if (state.preferences.timerSound) {
    try {
      audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
      audioContext.resume().catch(() => {});
    } catch {}
  }
}
function beep() {
  if (!state.preferences.timerSound || document.hidden || !audioContext) return;
  try {
    const o = audioContext.createOscillator(),
      gain = audioContext.createGain();
    o.connect(gain);
    gain.connect(audioContext.destination);
    o.frequency.value = 740;
    gain.gain.setValueAtTime(0.12, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.5,
    );
    o.start();
    o.stop(audioContext.currentTime + 0.5);
  } catch {}
}
function startRest(seconds) {
  prepareAudio();
  restTimer = {
    endAt: Date.now() + seconds * 1000,
    remaining: seconds,
    duration: seconds,
    done: false,
  };
  storeTimer();
  renderTimer();
}
function renderTimer() {
  const el = $("#rest-timer");
  if (!el) return;
  el.hidden = !restTimer;
  document.body.classList.toggle("has-rest-timer", !!restTimer);
  if (!restTimer) return;
  let seconds = restTimer.endAt
    ? Math.max(0, Math.ceil((restTimer.endAt - Date.now()) / 1000))
    : restTimer.remaining;
  if (restTimer.endAt && seconds === 0 && !restTimer.done) {
    restTimer = { ...restTimer, remaining: 0, done: true };
    storeTimer();
    beep();
  }
  const text = restTimer.done
    ? "Descanso terminado"
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const mode = restTimer.done ? "done" : restTimer.endAt ? "running" : "paused";
  if (el.dataset.mode === mode) {
    el.querySelector("strong").textContent = text;
    return;
  }
  el.dataset.mode = mode;
  el.innerHTML = `<span><small>${restTimer.done ? "A TU RITMO" : restTimer.endAt ? "DESCANSANDO" : "EN PAUSA"}</small><strong role="timer" aria-label="Descanso">${text}</strong></span><div>${restTimer.done ? '<button data-timer="restart">Otra vez</button>' : `<button data-timer="${restTimer.endAt ? "pause" : "resume"}">${restTimer.endAt ? "Pausar" : "Seguir"}</button>`}<button data-timer="stop" aria-label="Cerrar temporizador">×</button></div>`;
}

ensureDay(state, activeDay);
render();
if ("serviceWorker" in navigator) {
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController) {
      toast("Hay una actualización lista. Cierra y vuelve a abrir la app.");
    } else {
      hadController = true;
    }
  });
  navigator.serviceWorker
    .register("./sw.js")
    .then(() => navigator.serviceWorker.ready)
    .then(() => {
      setTimeout(offlineStatus, 1000);
    })
    .catch(() => {});
}

$("#main").addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const a = b.dataset.action;
  if (a === "favorite-new") openFavoriteChooser();
  if (a === "favorite-edit") {
    const f = state.favorites.find((f) => f.id === b.dataset.id);
    if (f) favoriteForm(f);
  }
  if (a === "favorite-add") {
    const f = state.favorites.find((f) => f.id === b.dataset.id);
    if (f) add(f.group, f.reps, f);
  }
  if (a === "backup-snooze") {
    state.backup.snoozedUntil = Date.now() + 7 * 86400000;
    save();
    render();
  }
  if (a === "timer-start") startRest(Number(b.dataset.seconds));
  if (a === "week-prev" || a === "week-next") {
    const next = shiftDay(progressWeek, a === "week-prev" ? -7 : 7);
    if (next <= startOfWeek(activeDay)) {
      progressWeek = next;
      render();
    }
  }
  if (a === "week-day") {
    historyDay = b.dataset.day;
    calendarMonth = historyDay.slice(0, 7);
    view = "historial";
    render();
    window.scrollTo(0, 0);
  }
  if (a === "record-filter") {
    recordGroup = b.dataset.group;
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }
});
$("#sheet").addEventListener("change", (e) => {
  if (e.target.id === "favorite-group") {
    const g = e.target.value;
    $("#favorite-form").dataset.group = g;
    $("#favorite-config").innerHTML = configForm(g);
  }
});
$("#sheet").addEventListener("click", (e) => {
  const b = e.target.closest("[data-delete-favorite]");
  if (!b) return;
  const index = state.favorites.findIndex(
      (f) => f.id === b.dataset.deleteFavorite,
    ),
    f = state.favorites[index];
  if (!f) return;
  state.favorites.splice(index, 1);
  save();
  $("#sheet").close();
  render();
  toast("Favorita eliminada", () => {
    state.favorites.splice(index, 0, f);
    save();
    render();
  });
});
document.addEventListener("submit", (e) => {
  const f = e.target,
    fd = new FormData(f);
  if (f.id === "favorite-form") {
    try {
      const g = String(fd.get("group")),
        favorite = {
          id: f.dataset.id || crypto.randomUUID(),
          group: g,
          ...formValues(f, g),
          reps: Number(fd.get("reps")),
        };
      if (!validateEntry({ ...favorite, at: Date.now() }))
        throw Error("Revisa los datos de la favorita.");
      const i = state.favorites.findIndex((x) => x.id === favorite.id);
      if (i >= 0) state.favorites[i] = favorite;
      else {
        if (state.favorites.length >= 100)
          throw Error("Puedes guardar hasta 100 favoritas.");
        state.favorites.push(favorite);
        appendShortcut(state, "base:" + favorite.id);
      }
      state.preferences.activeShortcut = "base:" + favorite.id;
      save();
      $("#sheet").close();
      render();
      toast("Ejercicio fijado en Hoy");
    } catch (err) {
      toast(err.message);
    }
  }
  if (f.id === "schedule-form") {
    const week = Array.from({ length: 7 }, (_, i) =>
      Object.fromEntries(groups.map((g) => [g, fd.has(`${i}-${g}`)])),
    );
    setSchedule(state, activeDay, week);
    save();
    render();
    toast("Calendario guardado desde hoy");
  }
});
$("#main").addEventListener("change", (e) => {
  if (e.target.id === "timer-sound") {
    state.preferences.timerSound = e.target.checked;
    prepareAudio();
    save();
  }
  if (e.target.id === "backup-reminders") {
    state.backup.enabled = e.target.checked;
    save();
  }
});
$("#rest-timer").addEventListener("click", (e) => {
  const b = e.target.closest("[data-timer]");
  if (!b || !restTimer) return;
  const a = b.dataset.timer;
  if (a === "stop") restTimer = null;
  if (a === "pause")
    restTimer = {
      ...restTimer,
      endAt: null,
      remaining: Math.max(1, Math.ceil((restTimer.endAt - Date.now()) / 1000)),
      done: false,
    };
  if (a === "resume") {
    prepareAudio();
    restTimer.endAt = Date.now() + restTimer.remaining * 1000;
  }
  if (a === "restart") startRest(restTimer.duration ?? 90);
  storeTimer();
  renderTimer();
});
setInterval(renderTimer, 500);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) renderTimer();
});
renderTimer();

$("#main").addEventListener("click", handleUniversalFavorites);
$("#sheet").addEventListener("click", handleUniversalFavorites);

$("#sheet").addEventListener("input", (e) => {
  if (e.target.id !== "shortcut-search") return;
  let count = 0;
  const items = universalFavorites(state);
  document.querySelectorAll("[data-shortcut-choice]").forEach((row) => {
    const f = items.find((x) => x.key === row.dataset.shortcutChoice);
    row.hidden =
      !f ||
      !matchesSkillSearch(skillCatalog, e.target.value, shortcutConfig(f));
    if (!row.hidden) count++;
  });
  $("#shortcut-no-results").hidden = count > 0;
});
document.addEventListener("submit", (e) => {
  const form = e.target;
  if (form.id !== "shortcut-form") return;
  e.preventDefault();
  try {
    rollover();
    const f = universalFavorites(state).find((x) => x.key === form.dataset.key);
    if (!f) throw Error("Este ejercicio ya no está fijado.");
    const value = Number(new FormData(form).get("value"));
    if (form.dataset.mode === "load") {
      if (
        !Number.isFinite(value) ||
        value < 0 ||
        value > 2000 ||
        value * 2 !== Math.round(value * 2)
      )
        throw Error("Usa un peso entre 0 y 2000 lb, en pasos de 0.5.");
      setShortcutWeight(f, value);
    } else logShortcut(f, value, readEffort(form));
    $("#sheet").close();
  } catch (err) {
    toast(err.message);
  }
});
