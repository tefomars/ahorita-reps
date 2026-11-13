import { createSkillsUI } from "./skills-ui.mjs";
import { skillEntriesOn, skillContributions } from "./skills-core.mjs";
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
  personalRecords,
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
  recordGroup = "all";
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
const weightLabel = (w) => (w ? `+${w} lb` : "Sin peso añadido");
const sideLabel = (s) =>
  s === "left" ? "Izquierda" : s === "right" ? "Derecha" : "Por pierna";
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageError = false;
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
  return `<div class="intro"><div><p class="eyebrow">${esc(dateLabel(activeDay))}</p><h1>Cada rep cuenta<span style="color:var(--push)">.</span></h1><p>Un toque. Una serie más cerca.</p></div><div class="day-summary"><div class="dots">${groups.map((g) => `<b class="${d.goals[g] > 0 && dayTotals(state, activeDay, g).count >= d.goals[g] ? "done" : ""}"></b>`).join("")}</div>${done}/${groups.filter((g) => d.goals[g] > 0).length} metas</div></div>${storageError ? '<p class="note danger" role="alert">El almacenamiento no está disponible o la copia guardada no se pudo leer. Exporta tus datos antes de cerrar; no se reemplazará una copia dañada hasta que registres cambios.</p>' : ""}${backupBanner()}${state.favorites.length ? favoriteSection() : ""}<div class="cards">${groups.map((g) => card(g, d)).join("")}</div>${!state.favorites.length ? favoriteSection() : ""}${timerSection()}<div class="section-heading"><h2>Lo que llevas hoy</h2><span>${d.entries.length + skillContributions(state, activeDay).length} series</span></div>${d.entries.length ? entries(d.entries, activeDay) : skillContributions(state, activeDay).length ? "" : entries([], activeDay)}${skillsUI.daySection(activeDay, { counterOnly: true })}`;
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
function configForm(g, edit) {
  const p = edit ?? state.selected[g],
    opts = [...new Set([...exercises[g], p.exercise])];
  return `<label class="field">Ejercicio<select name="exercise">${opts.map((x) => `<option ${x === p.exercise ? "selected" : ""}>${esc(x)}</option>`).join("")}<option value="__custom">Otro ejercicio…</option></select></label><label class="field" id="custom-name-field" hidden>Nombre del ejercicio<input name="customName" maxlength="80" placeholder="Ej. Ring pushups"></label><label class="field">Peso añadido total · lb<input name="weight" type="number" inputmode="decimal" min="0" max="2000" step="0.5" value="${p.weight}" required></label><p class="note">0 = sin peso añadido. Suma el peso de ambas mancuernas.</p>${g === "legs" ? `<label class="field">Lado<select name="side"><option value="both" ${p.side === "both" ? "selected" : ""}>Ambas · reps por pierna</option><option value="left" ${p.side === "left" ? "selected" : ""}>Solo izquierda</option><option value="right" ${p.side === "right" ? "selected" : ""}>Solo derecha</option></select></label>` : ""}`;
}
function add(g, reps, preset = null) {
  rollover();
  const previousRecords = personalRecords(state, activeDay);
  const d = current(),
    p = preset ?? state.selected[g],
    before = dayTotals(state, activeDay, g).count,
    id = crypto.randomUUID(),
    key = activeDay;
  const entry = { id, group: g, ...p, reps, at: Date.now() };
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
  const oldRecord = previousRecords.find(
    (r) =>
      r.group === g &&
      r.exercise.trim().toLocaleLowerCase() ===
        p.exercise.trim().toLocaleLowerCase() &&
      r.weight === p.weight &&
      (g !== "legs" || r.side === p.side),
  );
  const newRecord = oldRecord && reps > oldRecord.reps;
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
    weight: Number(f.get("weight")),
    side: g === "legs" ? String(f.get("side")) : "both",
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
      `<form id="series-form" data-group="${g}" data-mode="${a}">${custom ? '<label class="field">Repeticiones<input name="reps" type="number" inputmode="numeric" min="1" max="10000" step="1" required autofocus></label>' : ""}${configForm(g)}<button class="primary wide">${custom ? "Sumar repeticiones" : "Guardar selección"}</button></form>`,
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
      `<form id="edit-form" data-day="${b.dataset.day}" data-id="${esc(entry.id)}" data-group="${entry.group}"><label class="field">Repeticiones<input name="reps" type="number" inputmode="numeric" min="1" max="10000" step="1" required value="${entry.reps}"></label>${configForm(entry.group, entry)}<div class="sheet-actions"><button type="button" class="secondary danger" data-delete="${esc(entry.id)}" data-day="${b.dataset.day}">Eliminar</button><button class="primary">Guardar</button></div></form>`,
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
        add(g, Number(fd.get("reps")));
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
        next = { ...entry, ...formValues(f, g), reps: Number(fd.get("reps")) };
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
      openSheet(
        "Restaurar copia",
        `<p>Esta copia contiene ${Object.values(incoming.days).reduce((n, d) => n + d.entries.length, incoming.skills.entries.length)} series. Reemplazará los datos de este dispositivo.</p><p class="note">Exporta una copia de tus datos actuales antes de reemplazarlos.</p><button class="secondary wide" id="pre-export">Exportar datos actuales</button><button class="primary wide" id="confirm-import">Reemplazar con esta copia</button>`,
      );
      $("#pre-export").onclick = exportData;
      $("#confirm-import").onclick = () => {
        const previous = state;
        state = incoming;
        skillsUI.reset();
        if (save()) {
          $("#sheet").close();
          render();
          toast("Copia restaurada");
        } else {
          state = previous;
          skillsUI.reset();
          toast("No se pudo restaurar. Los datos anteriores se conservaron.");
        }
      };
    } catch {
      toast("No se pudo importar: elige una copia válida de Reps.");
    }
    e.target.value = "";
  }
});
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
document.querySelector("nav").addEventListener("click", (e) => {
  const b = e.target.closest("[data-view]");
  if (b) {
    view = b.dataset.view;
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
    const cache = await caches.open("ahorita-v7");
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
function favoriteSection() {
  if (!state.favorites.length)
    return '<div class="favorites-empty"><span>★ Tus series, a un toque</span><button class="text-button" data-action="favorite-new">Crear favorita ↗</button></div>';
  return `<section class="favorites-section" aria-label="Series favoritas"><div class="mini-heading"><h2>★ Favoritas</h2><button class="text-button" data-action="favorite-new">Crear ↗</button></div><div class="favorite-scroll">${state.favorites.map((f) => `<button class="favorite-chip ${f.group}" data-action="favorite-add" data-id="${esc(f.id)}" aria-label="Registrar favorita: ${esc(f.exercise)}, ${f.reps} reps, ${esc(weightLabel(f.weight))}"><strong>+${f.reps} ${esc(f.exercise)}</strong><small>${labels[f.group]} · ${weightLabel(f.weight)}${f.group === "legs" ? " · " + sideLabel(f.side) : ""}</small></button>`).join("")}</div></section>`;
}
function backupBanner() {
  return backupDue(state, activeDay)
    ? '<aside class="backup-banner"><div><strong>Tu constancia merece una copia.</strong><p>Exporta tu historial antes de cambiar de teléfono o reinstalar.</p></div><div><button class="primary" data-action="export">Exportar copia</button><button class="text-button" data-action="backup-snooze">En 7 días</button></div></aside>'
    : "";
}
function timerSection() {
  return '<section class="rest-section"><div><h2>Descanso opcional</h2><p>Para cuando haces varias series seguidas.</p></div><div class="rest-presets"><button data-action="timer-start" data-seconds="60">60 s</button><button data-action="timer-start" data-seconds="90">90 s</button><button data-action="timer-start" data-seconds="120">2 min</button></div></section>';
}
function progress() {
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
  const records = personalRecords(state, activeDay).filter(
    (r) => recordGroup === "all" || r.group === recordGroup,
  );
  return `${intro("Mira lo que sumas.", "Semana a semana, serie a serie.", "PROGRESO")}<div class="panel history-panel"><div class="week-heading"><div><h2>${start === startOfWeek(activeDay) ? "Esta semana" : "Tu semana"}</h2><span>${short(start)} – ${short(shiftDay(start, 6))}</span></div><div><button class="calendar-arrow" data-action="week-prev" aria-label="Semana anterior">‹</button><button class="calendar-arrow" data-action="week-next" aria-label="Semana siguiente" ${start >= startOfWeek(activeDay) ? "disabled" : ""}>›</button></div></div><div class="weekly-kpis"><div><strong>${summary.active}<small> / ${summary.elapsed}</small></strong><span>días con actividad</span></div><div><strong>${summary.met}</strong><span>metas completas</span></div><div><strong>${summary.series}</strong><span>series registradas</span></div></div><div class="weekly-counts">${groups
    .map((g) => {
      const delta = summary.counts[g] - summary.previousCounts[g];
      return `<div class="${g}"><span>${labels[g]}</span><strong>${summary.counts[g]}</strong><small>${delta > 0 ? "+" : ""}${delta} vs. anterior${g === "legs" ? "<br>reps por lado" : ""}</small></div>`;
    })
    .join(
      "",
    )}</div><section class="week-chart" aria-label="Repeticiones por día y grupo"><div class="chart-columns">${summary.days.map((d) => `<button class="chart-day ${d.future ? "future" : ""}" data-action="week-day" data-day="${d.key}" ${d.future ? "disabled" : ""} aria-label="${esc(dateLabel(d.key))}: Push ${d.counts.push}, Pull ${d.counts.pull}, Legs ${d.counts.legs} por lado"><span class="chart-bars">${groups.map((g) => `<i class="${g}" style="height:${Math.max(2, (d.counts[g] / max) * 100)}%"></i>`).join("")}</span><span>${new Date(d.key + "T12:00:00").toLocaleDateString("es-GT", { weekday: "narrow" })}</span><small>${Number(d.key.slice(-2))}</small></button>`).join("")}</div><div class="chart-legend">${groups.map((g) => `<span><i class="${g}"></i>${labels[g]}</span>`).join("")}</div></section>${summary.skills.series ? `<div class="skill-week-summary"><strong>Calistenia esta semana</strong><span>${summary.skills.series} series · ${summary.skills.seconds} s de holds · ${summary.skills.reps} reps</span><button class="text-button" data-action="skill-open-records">Mis marcas ↗</button></div>` : ""}<p class="note">${summary.elapsed < 7 ? `Comparación de los primeros ${summary.elapsed} días de cada semana.` : "Comparación con la semana completa anterior."} Las barras incluyen las reps de calistenia asignadas a cada grupo; Legs cuenta por lado. Toca un día para ver el detalle.</p><section class="records-section"><div class="section-heading"><h2>Récords personales</h2><button class="text-button" data-action="skill-open-records">Todas mis marcas ↗</button></div><div class="record-filters" aria-label="Filtrar récords"><button data-action="record-filter" data-group="all" aria-pressed="${recordGroup === "all"}">Todos</button>${groups.map((g) => `<button data-action="record-filter" data-group="${g}" aria-pressed="${recordGroup === g}">${labels[g]}</button>`).join("")}</div><p class="note">Comparamos el mismo ejercicio, peso y lado. Si corriges una serie, el récord se recalcula.</p>${records.length ? `<div class="entries">${records.map((r) => `<button class="record-row" data-action="week-day" data-day="${r.day}"><span class="badge ${r.group}">${icons[r.group]}</span><span class="entry-info"><strong>${esc(r.exercise)}</strong><small>${weightLabel(r.weight)}${r.group === "legs" ? " · " + sideLabel(r.side) : ""}<br>${short(r.day)} ${r.day.slice(0, 4)}</small></span><span class="record-reps">${r.reps}<small>reps ↗</small></span></button>`).join("")}</div>` : '<div class="empty"><strong>Aquí empieza tu próxima marca.</strong>Registra una serie para crear tu primer récord.</div>'}</section></div>`;
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
  return `${intro("A tu manera.", "Todo listo para seguir sumando.", "AJUSTES")}<div class="panel"><section class="settings-block"><h2>Tus metas diarias</h2><p>Objetivo de cada grupo en sus días de entrenamiento. Usa 0 para descansar.</p><form id="goals-form"><div class="row">${groups.map((g) => `<label class="field">${labels[g]}${g === "legs" ? " / lado" : ""}<input name="${g}" type="number" inputmode="numeric" min="0" max="10000" step="1" required value="${state.goals[g]}"></label>`).join("")}</div><button class="primary">Guardar metas</button></form></section><section class="settings-block"><h2>Tu semana de entrenamiento</h2><p>Marca los grupos que quieres trabajar cada día. Los demás descansan. El cambio se aplica desde hoy y conserva tus días anteriores.</p><form id="schedule-form"><div class="schedule-table"><div class="schedule-head"><span>Día</span>${groups.map((g) => `<span>${labels[g]}</span>`).join("")}</div>${weekdays.map((name, i) => `<div class="schedule-row"><span>${name}</span>${groups.map((g) => `<label><input type="checkbox" name="${i}-${g}" ${plan[i][g] ? "checked" : ""} aria-label="${name} ${labels[g]}"><span class="sr-only">${name} ${labels[g]}</span></label>`).join("")}</div>`).join("")}</div><button class="primary">Guardar calendario</button></form></section><section class="settings-block"><div class="mini-heading"><h2>Series favoritas</h2><button class="text-button" data-action="favorite-new">Crear ↗</button></div><p>Ejercicio, libras y reps juntos. Tócalas en Hoy para registrar una serie.</p>${state.favorites.length ? state.favorites.map((f) => `<div class="favorite-manage"><div><strong>${esc(f.exercise)} · ${f.reps} reps</strong><small>${labels[f.group]} · ${weightLabel(f.weight)}${f.group === "legs" ? " · " + sideLabel(f.side) : ""}</small></div><button class="text-button" data-action="favorite-edit" data-id="${esc(f.id)}" aria-label="Editar favorita ${esc(f.exercise)}">Editar</button></div>`).join("") : '<p class="note">Aún no tienes favoritas. Crea tu primera serie.</p>'}</section><section class="settings-block"><h2>Tus botones rápidos</h2><form id="quick-form"><div class="row">${state.quick.map((n, i) => `<label class="field">Botón ${i + 1}<input name="q${i}" type="number" inputmode="numeric" min="1" max="999" step="1" required value="${n}"></label>`).join("")}</div><button class="secondary">Guardar botones</button></form></section><section class="settings-block"><h2>Descanso entre series</h2><p>Inicia 60 s, 90 s o 2 min desde Hoy. Puedes pausarlo y seguir usando la app. Si bloqueas el iPhone, al volver verás cuánto queda; el aviso sonoro requiere tener la app abierta.</p><label class="check-label"><input id="timer-sound" type="checkbox" ${state.preferences.timerSound ? "checked" : ""}> Sonido al terminar, con la app abierta</label></section><section class="settings-block"><h2>Tus datos se quedan contigo</h2><p>Guarda una copia en Archivos o iCloud Drive antes de reinstalar, cambiar de teléfono o borrar datos del sitio. La app no sincroniza automáticamente.</p><div class="row"><button class="secondary" data-action="export">Exportar copia</button><button class="secondary" data-action="import">Importar copia</button></div><input type="file" id="import-file" accept=".json,application/json" hidden><label class="check-label"><input id="backup-reminders" type="checkbox" ${state.backup.enabled ? "checked" : ""}> Recordarme hacer una copia</label><p class="note">${state.backup.lastExportAt ? "Última exportación preparada: " + esc(new Date(state.backup.lastExportAt).toLocaleDateString("es-GT")) + "." : "Aún no has preparado una copia."} El recordatorio aparece dentro de la app después de 3 días activos; luego, si hay datos nuevos, cada 7 días.</p></section><section class="settings-block"><h2>En tu pantalla de inicio</h2><p>Safari → Compartir → Agregar a pantalla de inicio. Para actualizar, conserva el icono: cierra y vuelve a abrir con internet. Eliminar y reinstalar puede borrar tus registros. Safari y el icono pueden tener historiales separados.</p><p id="offline-info">Preparando disponibilidad sin conexión…</p><button class="secondary" data-action="offline">Revisar modo sin conexión</button></section><section class="settings-block"><h2>Cómo contamos</h2><p>Las series de calistenia en repeticiones pueden sumar a Push, Pull o Legs con «Sumar al objetivo diario». Los holds en segundos se registran aparte. Las series anteriores a esta función conservan su contador; puedes editar una y asignarle un grupo.</p><p>Push y Pull suman reps de sus ejercicios, con cualquier peso. Las lb son el peso añadido total: dos mancuernas de 15 lb = +30 lb.</p><p>Legs lleva un contador por pierna. «Ambas» registra reps para cada lado. Si registras por separado, la meta usa el lado con menos reps.</p><p>La racha general requiere alguna serie cada día. Las de cada grupo requieren cumplir su meta; un descanso del calendario o meta 0 conserva esa racha sin sumar días. Hoy sigue abierto hasta medianoche.</p></section><section class="settings-block"><h2>Tu app, independiente</h2><p>Reps se aloja en tu GitHub Pages. No requiere ChatGPT para funcionar. El código y el alojamiento están en tu cuenta de GitHub; el historial está en este dispositivo.</p><a class="secondary inline-link" href="https://github.com/tefomars/ahorita-reps" target="_blank" rel="noopener">Ver código y guía ↗</a></section><p class="note">Reps · Hecha para ir sumando.<br>Sin suscripciones, anuncios ni rastreadores.</p></div>`;
}
function favoriteForm(f = null) {
  const g = f?.group ?? "push";
  openSheet(
    f ? "Editar favorita" : "Crear favorita",
    `<form id="favorite-form" data-id="${f ? esc(f.id) : ""}" data-group="${g}"><label class="field">Grupo<select name="group" id="favorite-group">${groups.map((x) => `<option value="${x}" ${x === g ? "selected" : ""}>${labels[x]}</option>`).join("")}</select></label><div id="favorite-config">${configForm(g, f)}</div><label class="field">Repeticiones<input name="reps" type="number" inputmode="numeric" min="1" max="10000" step="1" required value="${f?.reps ?? 10}"></label><div class="sheet-actions">${f ? `<button class="secondary danger" type="button" data-delete-favorite="${esc(f.id)}">Eliminar</button>` : ""}<button class="primary">Guardar favorita</button></div></form>`,
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
  if (a === "favorite-new") favoriteForm();
  if (a === "favorite-edit") {
    const f = state.favorites.find((f) => f.id === b.dataset.id);
    if (f) favoriteForm(f);
  }
  if (a === "favorite-add") {
    const f = state.favorites.find((f) => f.id === b.dataset.id);
    if (f)
      add(f.group, f.reps, {
        exercise: f.exercise,
        weight: f.weight,
        side: f.side,
      });
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
      }
      save();
      $("#sheet").close();
      render();
      toast("Favorita guardada");
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
