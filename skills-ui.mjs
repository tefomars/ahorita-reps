import {
  skillCategories,
  infoFor,
  searchSkillLibrary,
  matchesSkillSearch,
} from "./exercise-library.mjs";
import {
  skillCatalog,
  skillSupports,
  defaultSkill,
  validSkillEntry,
  skillEntriesOn,
  skillTotals,
  skillRecordKey,
  allTimeRecords,
} from "./skills-core.mjs";
export function createSkillsUI(ctx) {
  const { esc, save, toast, render, openSheet, dateLabel } = ctx;
  const state = () => ctx.getState(),
    today = () => ctx.getToday();
  let tab = "log",
    draft = { ...state().skills.selected, day: today(), value: "" },
    lastToday = today(),
    historyDay = today(),
    historyFamily = "all",
    recordFamily = "all";
  const num = (n) =>
    new Intl.NumberFormat("es-GT", { maximumFractionDigits: 1 }).format(n);
  const amount = (e) =>
    `${num(e.value)} ${e.metric === "seconds" ? "s" : "reps"}`;
  const load = (w) => (w ? `+${num(w)} lb` : "Sin lastre");
  const familyName = (e) =>
    e.source === "base"
      ? { push: "Push", pull: "Pull", legs: "Legs" }[e.baseGroup]
      : skillCatalog[e.family].name;
  const context = (e) =>
    [
      e.variation,
      e.apparatus,
      e.support === "Libre" ? "Libre" : `${e.support}: ${e.supportNote}`,
    ]
      .filter(Boolean)
      .join(" · ");
  const shortDate = (key) =>
    new Date(key + "T12:00:00").toLocaleDateString("es-GT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  function syncDay() {
    const key = today();
    if (lastToday !== key) {
      if (draft.day === lastToday) draft.day = key;
      if (historyDay === lastToday) historyDay = key;
      lastToday = key;
    }
  }
  function options(list, selected) {
    return list
      .map(
        (x) =>
          `<option value="${esc(x)}" ${x === selected ? "selected" : ""}>${esc(x)}</option>`,
      )
      .join("");
  }
  function customSelect(name, label, list, value, force = false) {
    const custom = force || !list.includes(value);
    return `<label class="field">${label}<select name="${name}">${options(list, custom ? "" : value)}<option value="__custom" ${custom ? "selected" : ""}>Otro / personalizado…</option></select></label><label class="field" data-skill-custom="${name}" ${custom ? "" : "hidden"}>Nombre${name === "variation" ? " de la variante" : name === "apparatus" ? " del equipo" : " del ejercicio"}<input name="custom${name[0].toUpperCase() + name.slice(1)}" maxlength="80" value="${custom ? esc(value) : ""}" ${custom ? "required" : ""} placeholder="${name === "movement" ? "Ej. Handstand hold" : name === "variation" ? "Ej. Half lay" : "Ej. Barras bajas"}"></label>`;
  }
  function formFields(d) {
    const c = skillCatalog[d.family],
      spec = c.movements.find((x) => x.name === d.movement),
      vars = spec?.variations ?? c.variations,
      custom = d.family === "other" || !spec;
    const metric = custom
      ? `<label class="field">Medida<select name="metric">${options(["seconds", "reps"], d.metric).replace(">seconds<", ">Segundos<").replace(">reps<", ">Repeticiones<")}</select></label>`
      : `<input type="hidden" name="metric" value="${d.metric}">`;
    return `<label class="field">Progresión<select name="family">${groupedFamilies(d.family)}</select></label>${customSelect(
      "movement",
      "Movimiento",
      c.movements
        .filter((x) => x.name !== "Ejercicio propio")
        .map((x) => x.name),
      d.family === "other" && d.movement === "Ejercicio propio"
        ? ""
        : d.movement,
      custom,
    )}${metric}<div class="skill-form-grid">${customSelect("variation", "Variante", vars, d.variation)}<label class="field skill-value">${d.metric === "seconds" ? "Segundos de esta serie" : "Reps de esta serie"}<input name="value" type="number" inputmode="${d.metric === "seconds" ? "decimal" : "numeric"}" step="${d.metric === "seconds" ? "0.1" : "1"}" min="${d.metric === "seconds" ? "0.1" : "1"}" max="${d.metric === "seconds" ? "36000" : "10000"}" required value="${d.value ?? ""}" placeholder="${d.metric === "seconds" ? "Ej. 12.5" : "Ej. 8"}"></label></div><details class="skill-equipment"><summary><strong>Equipo, lastre y fecha</strong><span>${esc(d.apparatus)} · ${load(d.weight)} · ${esc(d.support)}${d.day !== today() ? " · " + esc(shortDate(d.day)) : ""}</span></summary>${customSelect("apparatus", "Equipo", c.apparatus, d.apparatus)}<div class="skill-form-grid"><label class="field">Lastre añadido total · lb<input name="weight" type="number" inputmode="decimal" min="0" max="2000" step="0.5" required value="${d.weight}"></label><label class="field">Asistencia<select name="support">${options(skillSupports, d.support)}</select></label></div><label class="field" data-skill-support ${d.support === "Libre" ? "hidden" : ""}>Detalle de la asistencia<input name="supportNote" maxlength="100" value="${esc(d.supportNote)}" ${d.support === "Libre" ? "" : "required"} placeholder="Ej. banda verde, apoyo de pies en caja"></label><label class="field">Fecha<input name="day" type="date" required max="${today()}" value="${d.day}"></label><p class="note">0 lb = sin lastre. Registra el peso añadido total.</p></details><details class="skill-notes"><summary>Notas opcionales</summary><label class="field">Notas<textarea name="notes" maxlength="300" rows="2" placeholder="Ej. técnica o sensaciones de esta serie">${esc(d.notes)}</textarea></label></details>`;
  }
  function readForm(form) {
    const f = new FormData(form),
      read = (name) =>
        f.get(name) === "__custom"
          ? String(
              f.get(`custom${name[0].toUpperCase() + name.slice(1)}`) ?? "",
            ).trim()
          : String(f.get(name) ?? "");
    const family = String(f.get("family")),
      movement = read("movement"),
      spec =
        f.get("movement") !== "__custom" && family !== "other"
          ? skillCatalog[family]?.movements.find((x) => x.name === movement)
          : null;
    return {
      family,
      movement,
      variation: read("variation"),
      apparatus: read("apparatus"),
      metric: spec?.metric ?? form.elements.metric.value,
      support: String(f.get("support")),
      supportNote:
        f.get("support") === "Libre"
          ? ""
          : String(f.get("supportNote") ?? "").trim(),
      weight: Number(f.get("weight")),
      notes: String(f.get("notes") ?? "").trim(),
      day: String(f.get("day")),
      value: f.get("value") === "" ? "" : Number(f.get("value")),
    };
  }
  function dailyStats(list) {
    const t = skillTotals(list);
    return `<div class="skill-totals"><div><strong>${t.series}</strong><span>series</span></div><div><strong>${num(t.seconds)}<small> s</small></strong><span>tiempo acumulado</span></div><div><strong>${t.reps}</strong><span>reps acumuladas</span></div></div>`;
  }
  function rows(list) {
    return list.length
      ? `<div class="skill-entries">${[...list]
          .sort((a, b) => b.at - a.at)
          .map(
            (e) =>
              `<article class="skill-entry"><div class="skill-entry-top"><span class="skill-family-label">${skillCatalog[e.family].name}</span><strong>${amount(e)}</strong></div><h3>${esc(e.movement)} · ${esc(e.variation)}</h3><p>${esc(e.apparatus)} · ${load(e.weight)}<br>${esc(e.support === "Libre" ? "Libre" : `${e.support}: ${e.supportNote}`)}</p>${e.notes ? `<p class="skill-entry-note">${esc(e.notes)}</p>` : ""}<div class="skill-entry-actions"><small>${new Date(e.at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}</small><button type="button" class="text-button" data-action="skill-repeat" data-id="${esc(e.id)}" aria-label="Repetir hoy ${esc(e.movement)} ${esc(e.variation)}">Repetir hoy</button><button type="button" class="text-button" data-action="skill-edit" data-id="${esc(e.id)}" aria-label="Editar ${esc(e.movement)} ${esc(e.variation)}">Editar</button></div></article>`,
          )
          .join("")}</div>`
      : '<div class="empty"><strong>Aún no hay series de calistenia este día.</strong>Cada hold y cada rep quedan aquí.</div>';
  }
  function familyFilter(value, includeBase = false) {
    return `<option value="all" ${value === "all" ? "selected" : ""}>Todos los ejercicios</option>${Object.entries(
      skillCatalog,
    )
      .map(
        ([key, c]) =>
          `<option value="${key}" ${value === key ? "selected" : ""}>${c.name}</option>`,
      )
      .join(
        "",
      )}${includeBase ? `<option value="base" ${value === "base" ? "selected" : ""}>Push / Pull / Legs</option>` : ""}`;
  }
  function logPage() {
    const list = skillEntriesOn(state(), draft.day);
    return `<section class="skill-log-panel"><div class="skill-panel-heading"><span class="eyebrow">REGISTRAR UNA SERIE</span><h2>Tu práctica, a tu ritmo.</h2></div><button type="button" class="skill-search-launch" data-action="skill-library-open"><span aria-hidden="true">⌕</span><span><strong>Buscar ejercicio</strong><small>Español o inglés · catálogo y recientes</small></span><b aria-hidden="true">↗</b></button><form id="skill-entry-form">${formFields(draft)}<button class="primary wide" type="submit">Guardar serie</button></form></section><div class="section-heading"><h2>${draft.day === today() ? "Hoy en calistenia" : esc(shortDate(draft.day))}</h2><button class="text-button" data-action="skill-tab" data-tab="records">Ver mis marcas ↗</button></div>${dailyStats(list)}${rows(list)}`;
  }
  function historyPage() {
    const list = skillEntriesOn(state(), historyDay).filter(
        (e) => historyFamily === "all" || e.family === historyFamily,
      ),
      dates = [
        ...new Set(
          state()
            .skills.entries.filter((e) => e.day <= today())
            .map((e) => e.day),
        ),
      ]
        .sort()
        .reverse();
    return `<div class="skill-history-filters"><label class="field">Día<input type="date" name="skill-history-day" required max="${today()}" value="${historyDay}"></label><label class="field">Progresión<select name="skill-history-family">${familyFilter(historyFamily)}</select></label></div><label class="field">Buscar en este día<input name="skill-history-search" type="search" value="${esc(historySearch)}" autocomplete="off" placeholder="Nombre en español o inglés"></label><div id="skill-history-results">${historyResults()}</div>${
      dates.length
        ? `<details class="skill-date-list"><summary>Días con práctica (${dates.length})</summary><div>${dates
            .slice(0, 90)
            .map(
              (key) =>
                `<button class="secondary" data-action="skill-history-day" data-day="${key}">${esc(shortDate(key))}</button>`,
            )
            .join("")}</div></details>`
        : ""
    }`;
  }
  function recordDate(e) {
    return `<button class="skill-record-date" data-action="skill-record-day" data-source="${e.source}" data-day="${e.day}">${esc(shortDate(e.day))} ↗</button>`;
  }
  function recordCard(r) {
    const e = r.exercise;
    return `<article class="skill-record-card"><div class="mini-heading"><span class="skill-family-label">${familyName(e)}</span><small>${r.series} ${r.series === 1 ? "serie" : "series"}</small></div><h2>${esc(e.movement)}</h2><p class="skill-record-context">${esc(context(e))}</p><div class="skill-record-marks"><div><span>${e.metric === "seconds" ? "Mejor tiempo" : "Máximas reps"}</span><strong>${num(r.best.value)}<small> ${e.metric === "seconds" ? "s" : "reps"}</small></strong><p>${load(r.best.weight)}</p>${recordDate(r.best)}</div><div><span>Máximo lastre</span><strong>${r.heaviest.weight ? `+${num(r.heaviest.weight)}<small> lb</small>` : "0<small> lb</small>"}</strong><p>${amount(r.heaviest)}${r.heaviest.weight ? "" : " · sin lastre"}</p>${recordDate(r.heaviest)}</div></div><details class="skill-load-details"><summary>Mejor serie por lastre (${r.byWeight.length})</summary>${r.byWeight.map((b) => `<div><span>${load(b.weight)}</span><strong>${amount(b)}</strong>${recordDate(b)}</div>`).join("")}</details></article>`;
  }
  function recordsPage() {
    return `<div class="skill-record-intro"><span class="eyebrow">TUS MARCAS DE SIEMPRE</span><h2>Las ganas las pones tú.<br>Las marcas se guardan solas.</h2><p>Mejor serie y máximo lastre de todo tu historial, con fecha y detalle. Incluye tus registros de Push / Pull / Legs.</p></div><label class="field">Ver marcas de<select name="skill-record-family">${familyFilter(recordFamily, true)}</select></label><p class="note">Cada movimiento, variante, equipo y asistencia se compara por separado. Abre «por lastre» para comparar la misma carga. Las marcas cambian al editar o eliminar series.</p><label class="field">Buscar mis marcas<input name="skill-record-search" type="search" value="${esc(recordSearch)}" autocomplete="off" placeholder="Ej. bandera, pull-ups, dominadas…"></label><div id="skill-record-results">${recordResults()}</div>`;
  }
  function page() {
    syncDay();
    return `<div class="intro"><div><p class="eyebrow">FUERZA Y CONTROL</p><h1>Calistenia<span style="color:var(--pull)">.</span></h1><p>Tus progresiones, serie a serie.</p></div></div><div class="panel history-panel"><div class="skill-tabs" role="tablist" aria-label="Calistenia">${[
      ["log", "Registrar"],
      ["history", "Historial"],
      ["records", "Marcas"],
    ]
      .map(
        ([key, label]) =>
          `<button role="tab" aria-selected="${tab === key}" data-action="skill-tab" data-tab="${key}">${label}</button>`,
      )
      .join(
        "",
      )}</div>${tab === "log" ? logPage() : tab === "history" ? historyPage() : recordsPage()}</div>`;
  }
  function saveEntry(data, editingId = null) {
    ctx.beforeMutation?.();
    const entry = {
      ...data,
      id: editingId ?? crypto.randomUUID(),
      at: editingId
        ? state().skills.entries.find((e) => e.id === editingId)?.at
        : Date.now(),
    };
    if (!validSkillEntry(entry) || entry.day > today())
      throw Error("Revisa fecha, ejercicio, reps/segundos y lastre.");
    const previous = allTimeRecords(state(), today()).find(
      (r) => r.key === skillRecordKey({ ...entry, source: "skill" }),
    );
    if (editingId) {
      const index = state().skills.entries.findIndex((e) => e.id === editingId);
      if (index < 0) throw Error("La serie ya no está disponible.");
      state().skills.entries[index] = entry;
    } else state().skills.entries.push(entry);
    const { day, value, id, at, ...config } = entry;
    state().skills.selected = { ...config, notes: "" };
    if (!editingId) draft = { ...config, day, value, notes: "" };
    const saved = save();
    render();
    const oldAtWeight = previous?.byWeight.find(
        (e) => e.weight === entry.weight,
      ),
      isBest =
        !editingId &&
        previous &&
        (entry.weight > previous.heaviest.weight ||
          (oldAtWeight && entry.value > oldAtWeight.value));
    if (saved)
      toast(
        editingId
          ? "Serie actualizada; marcas recalculadas"
          : isBest
            ? `¡Nueva marca! ${amount(entry)} · ${load(entry.weight)}`
            : `${amount(entry)} · ${entry.movement} ${entry.variation}`,
        !editingId
          ? () => {
              state().skills.entries = state().skills.entries.filter(
                (e) => e.id !== entry.id,
              );
              save();
              render();
            }
          : undefined,
      );
    return entry;
  }
  function editEntry(entry) {
    openSheet(
      "Editar serie de calistenia",
      `<form id="skill-edit-form" data-id="${esc(entry.id)}">${formFields(entry)}<div class="sheet-actions"><button class="secondary danger" type="button" data-action="skill-delete" data-id="${esc(entry.id)}">Eliminar</button><button class="primary" type="submit">Guardar cambios</button></div></form>`,
    );
  }
  let libraryQuery = "",
    libraryCategory = "all",
    libraryExpanded = false,
    libraryResults = [],
    recordSearch = "",
    historySearch = "";
  function personalChoices() {
    const seen = new Set(),
      list = [];
    for (const e of [...state().skills.entries].sort((a, b) => b.at - a.at)) {
      const key = skillRecordKey(e) + "|" + e.weight;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(e);
      }
    }
    return list;
  }
  function libraryContents() {
    libraryResults = searchSkillLibrary(
      skillCatalog,
      libraryQuery,
      libraryCategory,
      libraryExpanded
        ? 100
        : libraryQuery
          ? 20
          : libraryCategory === "all"
            ? 10
            : 100,
    );
    const personal = personalChoices()
      .filter(
        (e) =>
          (libraryCategory === "all" ||
            infoFor(skillCatalog, e.family).category === libraryCategory) &&
          matchesSkillSearch(skillCatalog, libraryQuery, e),
      )
      .slice(0, 6);
    return `${personal.length ? `<div class="library-section-title">${libraryQuery ? "De tu historial" : "Recientes"}</div><div class="library-recents">${personal.map((e) => `<button data-action="skill-library-recent" data-id="${esc(e.id)}"><strong>${esc(skillCatalog[e.family].name === "Otro ejercicio" ? e.movement : skillCatalog[e.family].name + " · " + e.movement)}</strong><small>${esc(e.variation)} · ${load(e.weight)} · ${esc(e.apparatus)} · ${esc(e.support === "Libre" ? "Libre" : e.support + ": " + e.supportNote)}</small></button>`).join("")}</div>` : ""}<div class="library-section-title">${libraryQuery ? "Resultados" : libraryCategory === "all" ? "Explorar ejercicios" : skillCategories.find(([key]) => key === libraryCategory)?.[1]} <span>${libraryResults.length}</span></div>${libraryResults.length ? `<div class="library-results">${libraryResults.map((r, i) => `<button data-action="skill-library-result" data-index="${i}" aria-label="Elegir ${esc(r.name)} ${esc(r.movement)} ${esc(r.variation)}"><span><strong>${esc(r.name)}${libraryQuery ? " · " + esc(r.movement) : ""}</strong><small>${esc(r.es)}${libraryQuery ? " · " + esc(r.description) : ""}</small><small>${r.metric === "seconds" ? "Segundos" : "Reps"} · ${r.variantCount} ${r.variantCount === 1 ? "variante" : "variantes"}${libraryQuery ? " · " + esc(r.variation) : ""}</small></span><b aria-hidden="true">↗</b></button>`).join("")}</div>` : personal.length ? '<p class="note">Sin coincidencias adicionales en el catálogo.</p>' : '<div class="empty"><strong>No encontré ese nombre.</strong>Prueba otro término o crea tu propio ejercicio.</div>'}${!libraryQuery && libraryCategory === "all" && !libraryExpanded ? '<button class="secondary wide" data-action="skill-library-all">Ver todas las familias</button>' : ""}<button class="text-button library-custom" data-action="skill-library-custom">+ Crear ejercicio o variante propios</button>`;
  }
  function updateLibrary() {
    const target = document.querySelector("#skill-library-results");
    if (target) target.innerHTML = libraryContents();
    document
      .querySelectorAll('[data-action="skill-library-category"]')
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.category === libraryCategory),
        ),
      );
  }
  function openLibrary() {
    const f = document.querySelector("#skill-entry-form");
    if (f) draft = readForm(f);
    libraryQuery = "";
    libraryCategory = "all";
    libraryExpanded = false;
    openSheet(
      "Buscar ejercicio",
      `<p class="library-intro">${Object.keys(skillCatalog).length - 1} familias. Busca en español o inglés; las variantes aparecen al elegir.</p><label class="library-search"><span class="sr-only">Buscar ejercicio en español o inglés</span><span aria-hidden="true">⌕</span><input name="skill-library-query" type="search" autocomplete="off" placeholder="Human flag, bandera, pino…" aria-controls="skill-library-results"></label><div class="library-categories" aria-label="Familias de ejercicios">${skillCategories.map(([key, label]) => `<button data-action="skill-library-category" data-category="${key}" aria-pressed="${key === libraryCategory}">${label}</button>`).join("")}</div><div id="skill-library-results">${libraryContents()}</div>`,
    );
    document.querySelector("[name=skill-library-query]").focus();
  }
  function chooseLibrary(config) {
    draft = { ...config, day: draft.day || today(), value: "", notes: "" };
    document.querySelector("#sheet").close();
    render();
    document
      .querySelector("#skill-entry-form [name=value]")
      ?.focus({ preventScroll: true });
  }
  function groupedFamilies(selected) {
    return [
      ...skillCategories.filter(([key]) => key !== "all"),
      ["other", "Personalizado"],
    ]
      .map(([key, label]) => {
        const entries = Object.entries(skillCatalog).filter(
          ([id]) => infoFor(skillCatalog, id).category === key,
        );
        return entries.length
          ? `<optgroup label="${label}">${entries.map(([id, c]) => `<option value="${id}" ${id === selected ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</optgroup>`
          : "";
      })
      .join("");
  }
  function recordResults() {
    const records = allTimeRecords(state(), today()).filter(
      (r) =>
        (recordFamily === "all" || r.exercise.family === recordFamily) &&
        matchesSkillSearch(skillCatalog, recordSearch, r.exercise),
    );
    return `<p class="quiet" role="status">${records.length} ${records.length === 1 ? "ejercicio" : "ejercicios"}</p>${records.length ? `<div class="skill-records">${records.map(recordCard).join("")}</div>` : '<div class="empty"><strong>Sin marcas con ese filtro.</strong>Busca otro nombre o registra tu primera serie.</div>'}`;
  }
  function historyResults() {
    const list = skillEntriesOn(state(), historyDay).filter(
      (e) =>
        (historyFamily === "all" || e.family === historyFamily) &&
        matchesSkillSearch(skillCatalog, historySearch, e),
    );
    return `<p class="quiet">${esc(dateLabel(historyDay))}</p>${dailyStats(list)}${rows(list)}`;
  }
  function handleClick(e) {
    const b = e.target.closest('[data-action^="skill-"]');
    if (!b) return;
    const a = b.dataset.action;
    if (a === "skill-library-open") openLibrary();
    if (a === "skill-library-category") {
      libraryCategory = b.dataset.category;
      libraryExpanded = false;
      updateLibrary();
    }
    if (a === "skill-library-all") {
      libraryExpanded = true;
      updateLibrary();
    }
    if (a === "skill-library-result") {
      const r = libraryResults[Number(b.dataset.index)];
      if (r)
        chooseLibrary({
          ...defaultSkill(r.family),
          movement: r.movement,
          variation: r.variation,
          metric: r.metric,
          apparatus: r.apparatus,
        });
    }
    if (a === "skill-library-recent") {
      const e = state().skills.entries.find((e) => e.id === b.dataset.id);
      if (e) {
        const { id, at, day, value, ...config } = e;
        chooseLibrary(config);
      }
    }
    if (a === "skill-library-custom") {
      chooseLibrary(defaultSkill("other"));
      document
        .querySelector("#skill-entry-form [name=customMovement]")
        ?.focus({ preventScroll: true });
    }

    if (a === "skill-tab") {
      tab = b.dataset.tab;
      if (!["log", "history", "records"].includes(tab)) tab = "log";
      render();
      window.scrollTo(0, 0);
    }
    if (a === "skill-edit") {
      const entry = state().skills.entries.find((e) => e.id === b.dataset.id);
      if (entry) editEntry(entry);
    }
    if (a === "skill-repeat") {
      const entry = state().skills.entries.find((e) => e.id === b.dataset.id);
      if (entry)
        try {
          saveEntry({ ...entry, day: today() });
        } catch (err) {
          toast(err.message);
        }
    }
    if (a === "skill-delete") {
      const index = state().skills.entries.findIndex(
          (e) => e.id === b.dataset.id,
        ),
        entry = state().skills.entries[index];
      if (!entry) return;
      state().skills.entries.splice(index, 1);
      save();
      document.querySelector("#sheet").close();
      render();
      toast("Serie eliminada; marcas recalculadas", () => {
        state().skills.entries.splice(index, 0, entry);
        save();
        render();
      });
    }
    if (a === "skill-history-day") {
      historyDay = b.dataset.day;
      tab = "history";
      render();
    }
    if (a === "skill-record-day") {
      if (b.dataset.source === "base") ctx.openBaseDay(b.dataset.day);
      else {
        historyDay = b.dataset.day;
        tab = "history";
        ctx.showSkills();
      }
    }
    if (a === "skill-open-records") {
      tab = "records";
      ctx.showSkills();
    }
  }
  function handleChange(e) {
    const form = e.target.closest("#skill-entry-form,#skill-edit-form");
    if (form) {
      const name = e.target.name;
      if (["movement", "variation", "apparatus"].includes(name)) {
        const custom = e.target.value === "__custom",
          wrap = form.querySelector(`[data-skill-custom="${name}"]`);
        wrap.hidden = !custom;
        wrap.querySelector("input").required = custom;
      }
      if (name === "support") {
        const assisted = e.target.value !== "Libre",
          wrap = form.querySelector("[data-skill-support]");
        wrap.hidden = !assisted;
        wrap.querySelector("input").required = assisted;
      }
      if (
        name === "family" ||
        name === "movement" ||
        name === "metric" ||
        name === "day"
      ) {
        const d = readForm(form),
          previousMetric = form.elements.metric.value;
        if (name === "family") {
          const fresh = defaultSkill(e.target.value);
          Object.assign(d, fresh);
          d.value = "";
        } else if (name === "movement") {
          const c = skillCatalog[d.family],
            spec = c.movements.find((x) => x.name === e.target.value),
            vars = spec?.variations ?? c.variations;
          if (!vars.includes(d.variation)) d.variation = vars[0];
          if (spec) {
            d.metric = spec.metric;
          }
          if (name === "movement" && e.target.value === "__custom")
            d.movement = "";
          if (d.metric !== previousMetric) d.value = "";
        } else if (name === "metric") d.value = "";
        else if (name === "day") d.day = d.day || today();
        if (form.id === "skill-edit-form") {
          form.innerHTML = `${formFields(d)}<div class="sheet-actions"><button class="secondary danger" type="button" data-action="skill-delete" data-id="${esc(form.dataset.id)}">Eliminar</button><button class="primary">Guardar cambios</button></div>`;
        } else {
          draft = d;
          render();
        }
      }
    }
    if (e.target.name === "skill-history-day") {
      historyDay = e.target.value || today();
      render();
    }
    if (e.target.name === "skill-history-family") {
      historyFamily = e.target.value;
      render();
    }
    if (e.target.name === "skill-record-family") {
      recordFamily = e.target.value;
      render();
    }
  }
  function handleSubmit(e) {
    if (!["skill-entry-form", "skill-edit-form"].includes(e.target.id)) return;
    e.preventDefault();
    const form = e.target;
    try {
      const data = readForm(form);
      saveEntry(data, form.id === "skill-edit-form" ? form.dataset.id : null);
      if (form.id === "skill-edit-form")
        document.querySelector("#sheet").close();
    } catch (err) {
      toast(err.message);
    }
  }
  function handleInput(e) {
    if (e.target.name === "skill-library-query") {
      libraryQuery = e.target.value;
      updateLibrary();
    }
    if (e.target.name === "skill-record-search") {
      recordSearch = e.target.value;
      const target = document.querySelector("#skill-record-results");
      if (target) target.innerHTML = recordResults();
    }
    if (e.target.name === "skill-history-search") {
      historySearch = e.target.value;
      const target = document.querySelector("#skill-history-results");
      if (target) target.innerHTML = historyResults();
    }
  }
  document.querySelector("#main").addEventListener("input", handleInput);
  document.querySelector("#sheet").addEventListener("input", handleInput);
  document.querySelector("#main").addEventListener("click", handleClick);
  document.querySelector("#sheet").addEventListener("click", handleClick);
  document.querySelector("#main").addEventListener("change", handleChange);
  document.querySelector("#sheet").addEventListener("change", handleChange);
  document.addEventListener("submit", handleSubmit);
  return {
    page,
    daySection(day) {
      const list = skillEntriesOn(state(), day);
      return list.length
        ? `<div class="section-heading"><h2>Calistenia</h2><button class="text-button" data-action="skill-open-records">Mis marcas ↗</button></div>${dailyStats(list)}${rows(list)}`
        : "";
    },
    reset() {
      draft = { ...state().skills.selected, day: today(), value: "" };
      historyDay = today();
      lastToday = today();
      recordSearch = "";
      historySearch = "";
    },
  };
}
