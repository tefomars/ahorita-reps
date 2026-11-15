import { exerciseProfiles, saveExercise } from "./exercise-book.mjs";
import { masterySummary } from "./mastery-core.mjs";
import { achievementSummary } from "./achievement-core.mjs";
import { defaultSkill, skillCatalog } from "./skills-core.mjs";
import { normalizeSearch } from "./exercise-library.mjs";
export function createExerciseUI(ctx) {
  const { esc, openSheet } = ctx,
    s = () => ctx.getState(),
    today = () => ctx.getToday();
  let query = "",
    limit = 24,
    currentId = null,
    editProfile = null,
    afterSave = null;
  const profiles = () => exerciseProfiles(s(), today()),
    find = (id) => profiles().find((p) => p.id === id);
  function listRows() {
    const models = new Map(
      masterySummary(s(), today()).profiles.map((p) => [p.id, p]),
    );
    const terms = normalizeSearch(query).split(" ").filter(Boolean),
      items = profiles()
        .filter((p) => {
          const text = normalizeSearch(
            [
              p.name,
              p.familyName,
              p.description,
              ...p.aliases,
              ...p.variations,
              ...p.equipment,
            ].join(" "),
          );
          return terms.every((t) => text.includes(t));
        })
        .sort(
          (a, b) =>
            (models.get(b.id)?.sets ?? 0) - (models.get(a.id)?.sets ?? 0) ||
            a.familyName.localeCompare(b.familyName) ||
            a.name.localeCompare(b.name),
        );
    return `<p class="quiet" role="status">${items.length} ejercicios</p>${items
      .slice(0, limit)
      .map((p) => {
        const m = models.get(p.id);
        return `<article class="book-card"><div><span class="skill-family-label">${esc(p.familyName)}</span><h3>${esc(p.name)}</h3><p>${m?.sets ? `Mastery ${m.mastery.level} · ${m.total} ${p.config.metric === "seconds" ? "s" : "reps"} · ${m.sets} series` : "Sin práctica registrada todavía"}${p.bookId ? " · guardado en tu biblioteca" : ""}</p></div><button class="secondary" data-action="book-profile" data-id="${esc(p.id)}">Ver ficha ↗</button></article>`;
      })
      .join(
        "",
      )}${items.length > limit ? '<button class="secondary wide" data-action="book-more">Ver más ejercicios</button>' : ""}`;
  }
  function open() {
    openSheet(
      "Biblioteca y mastery",
      `<p class="note">Catálogo, ejercicios propios e historial. La mastery es independiente para cada movimiento; todas sus variantes contribuyen a su volumen y conservan sus récords separados.</p><button class="secondary wide" data-action="book-new">+ Agregar ejercicio permanente</button><label class="field">Buscar ejercicio<input id="book-query" type="search" autocomplete="off" value="${esc(query)}" placeholder="Dips, fondos, archer, front lever…"></label><div id="book-results">${listRows()}</div>`,
    );
  }
  function profile(id) {
    const p = find(id);
    if (!p) return;
    currentId = id;
    const m = masterySummary(s(), today()).profiles.find((x) => x.id === id),
      related = achievementSummary(s(), today()).achievements.filter(
        (a) =>
          a.profileId === id ||
          (a.family === p.family && a.movement === p.config.movement),
      ),
      unit = p.config.metric === "seconds" ? "s" : "reps";
    openSheet(
      "Ficha del ejercicio",
      `<button class="text-button" data-action="book-list">← Biblioteca</button><p class="eyebrow">${esc(p.familyName)}</p><h2>${esc(p.name)}</h2><p>${esc(p.description)}</p><div class="book-actions"><button class="primary" data-action="book-log" data-id="${esc(id)}">Registrar una serie</button><button class="secondary" data-action="book-edit" data-id="${esc(id)}">Editar información</button></div><section class="mastery-card"><h3>Mastery ${m?.sets ? m.mastery.level : 0}</h3><div class="progress"><i style="width:${m?.mastery.percent ?? 0}%"></i></div><p>${m?.xp ?? 0} XP de práctica · ${m?.mastery.remaining ?? 100} para el siguiente nivel</p><div class="skill-totals"><div><strong>${m?.total ?? 0}</strong><span>${unit} acumuladas</span></div><div><strong>${m?.sets ?? 0}</strong><span>series</span></div><div><strong>${m?.days ?? 0}</strong><span>días activos</span></div></div><p class="note">Acumulados: series completadas, también asistidas. Cada contexto conserva sus datos. La XP de mastery mide progreso dentro de Reps, no esfuerzo fisiológico.</p></section><h3>Siguientes hitos sin límite</h3>${(
        m?.tracks ?? []
      )
        .filter((t) => !t.context)
        .map(
          (t) =>
            `<div class="mastery-track"><strong>${esc(t.name)}</strong><span>${Math.round(t.value * 10) / 10} / ${t.next} · próximo rango ${t.rank + 1}</span><small>+${t.xpPer} XP · ◈ ${t.coinsPer} por rango</small></div>`,
        )
        .join(
          "",
        )}<button class="secondary wide" data-action="book-achievements" data-id="${esc(id)}">Logros y rutas infinitas de este ejercicio ↗</button><h3>Variantes, peso y mejores series</h3>${
        m?.contexts.length
          ? m.contexts
              .map(
                (c) =>
                  `<article class="book-context"><strong>${esc([c.entry.variation, c.entry.apparatus, c.entry.support === "Libre" ? "Libre" : c.entry.support + ": " + c.entry.supportNote].filter(Boolean).join(" · "))}</strong><p>${c.total} ${unit} · ${c.sets} series · mejor ${c.best} ${unit} · máximo +${c.maxWeight} lb</p><details><summary>Mejor serie por carga</summary>${[
                    ...c.weights.entries(),
                  ]
                    .sort((a, b) => a[0] - b[0])
                    .map(
                      ([w, v]) => `<p class="note">+${w} lb: ${v} ${unit}</p>`,
                    )
                    .join(
                      "",
                    )}</details><button class="text-button" data-action="book-evolution" data-key="${esc(c.key)}">Ver gráfica e historial ↗</button></article>`,
              )
              .join("")
          : '<p class="note">Tus variantes aparecerán al registrar series.</p>'
      }<details class="earning-rules"><summary>Información del catálogo</summary><p>Medida: ${unit}. Equipo: ${p.equipment.map(esc).join(", ")}.</p><p>Variantes: ${p.variations.map(esc).join(", ")}.</p><p>Otros nombres: ${p.aliases.filter(Boolean).map(esc).join(", ") || "—"}.</p></details>`,
    );
  }
  function editor(p = null, callback = null) {
    editProfile = p;
    afterSave = callback;
    const c = p?.config ?? { ...defaultSkill("other"), movement: "" };
    openSheet(
      p ? "Información del ejercicio" : "Agregar ejercicio",
      `<form id="book-form"><p class="note">Se guarda sin registrar reps ni ganar XP. ${p ? "Editar información no renombra tus series anteriores." : "Los ejercicios propios también tendrán mastery y logros acumulativos."}</p><label class="field">Nombre del movimiento<input name="movement" maxlength="80" required value="${esc(c.movement)}" ${p ? "readonly" : ""} placeholder="Ej. Reverse Nordic curl"></label><label class="field">Familia<select name="family" ${p ? "disabled" : ""}>${Object.entries(
        skillCatalog,
      )
        .map(
          ([k, v]) =>
            `<option value="${k}" ${k === c.family ? "selected" : ""}>${esc(v.name)}</option>`,
        )
        .join(
          "",
        )}</select></label><div class="row"><label class="field">Medida<select name="metric" ${p ? "disabled" : ""}><option value="reps" ${c.metric === "reps" ? "selected" : ""}>Repeticiones</option><option value="seconds" ${c.metric === "seconds" ? "selected" : ""}>Segundos</option></select></label><label class="field">Variante inicial<input name="variation" maxlength="80" required value="${esc(c.variation)}"></label></div><label class="field">Equipo<input name="apparatus" maxlength="80" required value="${esc(c.apparatus)}"></label><label class="field">Sumar reps al contador<select name="counterGroup"><option value="">Sin contador</option>${["push", "pull", "legs"].map((g) => `<option value="${g}" ${c.counterGroup === g ? "selected" : ""}>${g[0].toUpperCase() + g.slice(1)}</option>`).join("")}</select></label><label class="field">Otros nombres · separados por coma<input name="aliases" maxlength="1600" value="${esc(p?.aliases.join(", ") ?? "")}" placeholder="Nombre en español, nombre en inglés"></label><label class="field">Información / notas<textarea name="description" maxlength="1000" rows="4">${esc(p?.description ?? "")}</textarea></label><p class="note">En segundos se mantiene fuera de Push/Pull/Legs. Para Legs podrás elegir el lado al registrar.</p><button class="primary wide">Guardar ejercicio</button><p data-book-error role="alert" class="note danger"></p></form>`,
    );
  }
  function click(e) {
    const b = e.target.closest('[data-action^="book-"]');
    if (!b) return;
    const a = b.dataset.action;
    if (a === "book-list") open();
    if (a === "book-new") editor();
    if (a === "book-more") {
      limit += 24;
      document.querySelector("#book-results").innerHTML = listRows();
    }
    if (a === "book-profile") profile(b.dataset.id);
    if (a === "book-edit") editor(find(b.dataset.id));
    if (a === "book-log") {
      const p = find(b.dataset.id);
      if (p) {
        document.querySelector("#sheet").close();
        ctx.log(p.config);
      }
    }
    if (a === "book-achievements") {
      const p = find(b.dataset.id);
      if (p) ctx.achievements(p);
    }
    if (a === "book-evolution") {
      document.querySelector("#sheet").close();
      ctx.evolution(b.dataset.key);
    }
  }
  document.querySelector("#main").addEventListener("click", click);
  document.querySelector("#sheet").addEventListener("click", click);
  document.querySelector("#sheet").addEventListener("input", (e) => {
    if (e.target.id === "book-query") {
      query = e.target.value;
      limit = 24;
      document.querySelector("#book-results").innerHTML = listRows();
    }
  });
  document.addEventListener("submit", (e) => {
    const f = e.target;
    if (f.id !== "book-form") return;
    e.preventDefault();
    try {
      const fd = new FormData(f),
        family = editProfile?.config.family ?? String(fd.get("family")),
        metric = editProfile?.config.metric ?? String(fd.get("metric")),
        config = {
          ...defaultSkill(family),
          movement: String(fd.get("movement")).trim(),
          metric,
          variation: String(fd.get("variation")).trim(),
          apparatus: String(fd.get("apparatus")).trim(),
          counterGroup:
            metric === "seconds"
              ? null
              : String(fd.get("counterGroup")) || null,
        },
        entry = {
          id: editProfile?.bookId ?? crypto.randomUUID(),
          config,
          aliases: String(fd.get("aliases"))
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          description: String(fd.get("description")).trim(),
        };
      const previous = structuredClone(s().exerciseBook),
        id = saveExercise(s(), entry);
      if (!ctx.save()) {
        s().exerciseBook = previous;
        throw Error(
          "No se pudo guardar. Tus ejercicios anteriores se conservan.",
        );
      }
      ctx.render();
      if (afterSave) {
        const cb = afterSave;
        afterSave = null;
        cb(config);
      } else profile(id);
    } catch (err) {
      const el = f.querySelector("[data-book-error]");
      if (el) el.textContent = err.message;
    }
  });
  return { open, profile, create: (callback) => editor(null, callback) };
}
