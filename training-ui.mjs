import { skillCatalog } from "./skills-core.mjs";
import { universalFavorites } from "./journey-core.mjs";
import {
  activeSession,
  sessionSummary,
  nextSessionStep,
  goalProgress,
  validTemplate,
  validGoal,
  attachSession,
} from "./training-core.mjs";
export function createTrainingUI(ctx) {
  const { esc, save, render, openSheet, toast } = ctx,
    s = () => ctx.getState(),
    today = () => ctx.getToday();
  let editTemplate = null;
  const n = (x) =>
      new Intl.NumberFormat("es-GT", { maximumFractionDigits: 1 }).format(x),
    unit = { seconds: "s", reps: "reps", sets: "series", days: "días" };
  const title = (p) =>
    p.kind === "base"
      ? p.preset.exercise
      : skillCatalog[p.preset.family].name + " · " + p.preset.variation;
  const amount = (p) =>
    p.kind === "base"
      ? p.preset.reps + " reps"
      : p.preset.value + (p.preset.metric === "seconds" ? " s" : " reps");
  function error(form, msg) {
    let e = form.querySelector("[role=alert]");
    if (!e) {
      e = document.createElement("p");
      e.className = "note danger";
      e.setAttribute("role", "alert");
      form.prepend(e);
    }
    e.textContent = msg;
  }
  function goalCard(g, mini = false) {
    const p = goalProgress(s(), g, today());
    return `<article class="training-goal ${p.complete ? "complete" : ""}"><div><strong>${esc(g.name)}</strong><span>${n(p.value)} / ${g.target} ${unit[g.metric]} · ${g.period === "day" ? "hoy" : "semana"}</span></div><div class="progress"><i style="width:${p.percent}%"></i></div>${!mini ? `<div class="mini-heading"><small>${p.complete ? "✓ Meta completa" : (skillCatalog[g.family]?.name ?? "Todos los ejercicios")}</small><button class="text-button" data-action="training-goal-edit" data-id="${esc(g.id)}">Editar</button></div>` : ""}</article>`;
  }
  function dashboard() {
    const a = activeSession(s()),
      goals = s().training.goals;
    return `${a ? `<button class="training-session-link" data-action="training-resume"><span><strong>Sesión: ${esc(a.name)}</strong><small>${sessionSummary(s(), a, today()).completed} series · continuar ↗</small></span><b>◷</b></button>` : ""}${
      goals.length
        ? `<section class="training-mini-goals"><div class="mini-heading"><h2>Mis metas de habilidades</h2><button class="text-button" data-action="training-goals">Ver todas ↗</button></div>${goals
            .slice(0, 2)
            .map((g) => goalCard(g, true))
            .join("")}</section>`
        : ""
    }`;
  }
  function runner(a) {
    const summary = sessionSummary(s(), a, today()),
      next = nextSessionStep(s(), a, today());
    return `<section class="session-runner"><p class="eyebrow">SESIÓN EN CURSO</p><div class="mini-heading"><h2>${esc(a.name)}</h2><span>${summary.completed} series</span></div>${next ? `<p>Paso ${next.index + 1}/${a.steps.length} · serie ${next.done + 1}/${next.step.sets}</p><button class="primary wide runner-log" data-action="training-log-step"><strong>${esc(title(next.step))}</strong><span>Registrar ${amount(next.step)}${next.step.preset.weight ? " · +" + next.step.preset.weight + " lb" : ""}</span></button><p class="note">${next.step.rest ? "Descanso de " + next.step.rest + " s después de registrar." : "Sin descanso automático."}</p><button class="text-button" data-action="training-skip">Omitir este paso</button>` : a.steps.length ? "<p>✓ Completaste los pasos del plan. Puedes seguir registrando o cerrar la sesión.</p>" : "<p>Registra desde Hoy o Entrenar. Las series nuevas de hoy se unen a esta sesión.</p>"}<button class="secondary wide" data-action="training-finish">Cerrar y ver resumen</button></section>`;
  }
  function plansPage() {
    const a = activeSession(s());
    return `${a ? runner(a) : '<div class="training-start"><h2>A tu ritmo.</h2><p>Una sesión es opcional. Tus registros sueltos siguen funcionando igual.</p><button class="secondary" data-action="training-free">Iniciar sesión libre</button></div>'}<div class="section-heading"><h2>Mis planes</h2><button class="text-button" data-action="training-template-new">Crear ↗</button></div>${
      s().training.templates.length
        ? s()
            .training.templates.map(
              (t) =>
                `<article class="training-plan"><h3>${esc(t.name)}</h3><p>${t.steps.length} pasos · ${t.steps.reduce((n, x) => n + x.sets, 0)} series</p><details><summary>Ver ejercicios</summary>${t.steps.map((x) => `<p>${x.sets} × ${amount(x)} · ${esc(title(x))}</p>`).join("")}</details><div class="row"><button class="primary" data-action="training-start" data-id="${esc(t.id)}">Iniciar</button><button class="secondary" data-action="training-template-edit" data-id="${esc(t.id)}">Editar</button></div></article>`,
            )
            .join("")
        : '<div class="empty"><strong>Tu secuencia de favoritas.</strong>Crea un plan con tus propias series, repeticiones y descansos.</div>'
    }<div class="section-heading"><h2>Sesiones anteriores</h2></div>${
      s()
        .training.sessions.filter((x) => x.id !== a?.id)
        .sort((x, y) => y.startedAt - x.startedAt)
        .slice(0, 12)
        .map(
          (x) =>
            `<button class="session-history" data-action="training-session" data-id="${esc(x.id)}"><span><strong>${esc(x.name)}</strong><small>${new Date(x.startedAt).toLocaleDateString("es-GT")} · ${sessionSummary(s(), x, today()).completed} series</small></span><b>↗</b></button>`,
        )
        .join("") ||
      '<p class="note">Aquí verás los resúmenes de tus sesiones.</p>'
    }`;
  }
  function goalsPage() {
    return `<div class="section-heading"><h2>Metas de habilidades</h2><button class="text-button" data-action="training-goal-new">Crear ↗</button></div><p class="note">Cada registro avanza las metas que coincidan. Los intentos cuentan como práctica para metas de días; las demás usan series completadas.</p>${
      s().training.goals.length
        ? s()
            .training.goals.map((g) => goalCard(g))
            .join("")
        : '<div class="empty"><strong>Elige qué quieres practicar.</strong>Puedes medir segundos, reps, series o días de práctica.</div>'
    }`;
  }
  function goalEditor(g = null) {
    openSheet(
      g?.id ? "Editar meta" : "Nueva meta de habilidad",
      `<form id="training-goal-form" data-id="${esc(g?.id ?? "")}"><label class="field">Nombre<input name="name" maxlength="80" value="${esc(g?.name ?? "")}" placeholder="Ej. práctica de tuck lever"></label><label class="field">Habilidad<select name="family"><option value="all">Todas</option>${Object.entries(
        skillCatalog,
      )
        .map(
          ([id, c]) =>
            `<option value="${id}" ${id === g?.family ? "selected" : ""}>${c.name}</option>`,
        )
        .join(
          "",
        )}</select></label><div class="row"><label class="field">Medir<select name="metric">${Object.entries(
        unit,
      )
        .map(
          ([k, v]) =>
            `<option value="${k}" ${k === g?.metric ? "selected" : ""}>${v}</option>`,
        )
        .join(
          "",
        )}</select></label><label class="field">Objetivo<input name="target" required type="number" inputmode="decimal" min="0.1" max="100000" step="0.1" value="${g?.target ?? ""}"></label></div><label class="field">Periodo<select name="period"><option value="day" ${g?.period === "day" ? "selected" : ""}>Cada día</option><option value="week" ${g?.period === "week" ? "selected" : ""}>Cada semana · lunes a domingo</option></select></label><details><summary>Filtros opcionales</summary><label class="field">Movimiento exacto<input name="movement" maxlength="80" value="${esc(g?.movement ?? "")}" placeholder="Vacío = todos los movimientos"></label><label class="field">Variante exacta<input name="variation" maxlength="80" value="${esc(g?.variation ?? "")}" placeholder="Ej. Tuck"></label><label class="field">Equipo exacto<input name="apparatus" maxlength="80" value="${esc(g?.apparatus ?? "")}" placeholder="Vacío = todos"></label><label class="field">Lastre exacto · lb<input name="weight" type="number" min="0" max="2000" step="0.5" value="${g?.weight ?? ""}" placeholder="Vacío = todas las cargas"></label></details><p class="note">Una meta de días admite hasta 1 día diario o 7 por semana.</p><div class="sheet-actions">${g?.id ? `<button type="button" class="secondary danger" data-action="training-goal-delete" data-id="${esc(g.id)}">Eliminar</button>` : ""}<button class="primary">Guardar meta</button></div></form>`,
    );
  }
  function syncTemplate() {
    const f = document.querySelector("#training-template-form");
    if (!f) return;
    editTemplate.name = f.elements.name.value;
    editTemplate.steps.forEach((x, i) => {
      x.sets = Number(f.elements["sets" + i].value);
      x.rest = Number(f.elements["rest" + i].value);
    });
  }
  function templateEditor(t = null, keep = false) {
    if (!keep)
      editTemplate = t
        ? JSON.parse(JSON.stringify(t))
        : { id: crypto.randomUUID(), name: "", steps: [] };
    const faves = universalFavorites(s());
    openSheet(
      "Plan de entrenamiento",
      `<form id="training-template-form"><label class="field">Nombre<input name="name" maxlength="80" required value="${esc(editTemplate.name)}" placeholder="Ej. Pull + Front lever"></label>${editTemplate.steps.map((x, i) => `<div class="plan-step"><div class="mini-heading"><strong>${i + 1}. ${esc(title(x))}</strong><div><button type="button" class="text-button" data-action="training-step-up" data-index="${i}" aria-label="Subir paso ${i + 1}">↑</button><button type="button" class="text-button" data-action="training-step-remove" data-index="${i}" aria-label="Quitar paso ${i + 1}">×</button></div></div><p class="note">${amount(x)}${x.preset.weight ? " · +" + x.preset.weight + " lb" : ""}</p><div class="row"><label class="field">Series<input name="sets${i}" type="number" required min="1" max="20" value="${x.sets}"></label><label class="field">Descanso · s<input name="rest${i}" type="number" required min="0" max="600" step="1" value="${x.rest}"></label></div></div>`).join("")}<label class="field">Agregar una favorita<select name="favorite"><option value="">Elegir…</option>${faves.map((x) => `<option value="${esc(x.key)}">${esc(x.kind === "base" ? x.item.exercise : skillCatalog[x.item.family].name + " · " + x.item.variation)} · ${x.kind === "base" ? x.item.reps + " reps" : x.item.value + (x.item.metric === "seconds" ? " s" : " reps")}</option>`).join("")}</select></label><button class="secondary wide" type="button" data-action="training-step-add">Agregar paso</button>${!faves.length ? '<p class="note">Crea favoritas en Hoy o Entrenar para armar tu plan.</p>' : ""}<p class="note">El plan guarda una copia de cada serie. Puedes registrar también series sueltas durante la sesión.</p><div class="sheet-actions">${s().training.templates.some((x) => x.id === editTemplate.id) ? '<button type="button" class="secondary danger" data-action="training-template-delete">Eliminar</button>' : ""}<button class="primary">Guardar plan</button></div></form>`,
    );
  }
  function start(template = null, name = "Sesión libre") {
    if (activeSession(s())) {
      ctx.showTab("plans");
      toast("Ya tienes una sesión en curso.");
      return;
    }
    const a = {
      id: crypto.randomUUID(),
      name: template?.name ?? name,
      startedAt: Date.now(),
      endedAt: null,
      steps: template ? JSON.parse(JSON.stringify(template.steps)) : [],
      skipped: [],
    };
    s().training.sessions.push(a);
    s().training.activeSessionId = a.id;
    save();
    document.querySelector("#sheet").close();
    ctx.showTab("plans");
  }
  function summary(a) {
    const x = sessionSummary(s(), a, today());
    openSheet(
      "Resumen de sesión",
      `<h3>${esc(a.name)}</h3><p class="note">${new Date(a.startedAt).toLocaleString("es-GT")} · ${Math.floor(x.duration / 60)} min${a.endedAt ? "" : " · sin cerrar"}</p><div class="skill-totals"><div><strong>${x.completed}</strong><span>series completadas</span></div><div><strong>${x.reps}</strong><span>reps</span></div><div><strong>${x.seconds} s</strong><span>holds acumulados</span></div></div><p class="note">${x.attempts} intentos no completados. Cada serie sigue formando parte de tus metas y marcas correspondientes.</p>`,
    );
  }
  function click(e) {
    const b = e.target.closest('[data-action^="training-"]');
    if (!b) return;
    const a = b.dataset.action;
    if (a === "training-resume") ctx.showTab("plans");
    if (a === "training-goals") ctx.showTab("goals");
    if (a === "training-free")
      openSheet(
        "Sesión libre",
        '<form id="training-free-form"><label class="field">Nombre<input name="name" maxlength="80" value="Sesión libre" required></label><button class="primary wide">Iniciar sesión</button></form>',
      );
    if (a === "training-start") {
      const t = s().training.templates.find((x) => x.id === b.dataset.id);
      if (t) start(t);
    }
    if (a === "training-template-new") templateEditor();
    if (a === "training-template-edit")
      templateEditor(s().training.templates.find((x) => x.id === b.dataset.id));
    if (a === "training-step-add") {
      syncTemplate();
      const f = document.querySelector("#training-template-form"),
        item = universalFavorites(s()).find(
          (x) => x.key === f.elements.favorite.value,
        );
      if (item) {
        if (editTemplate.steps.length >= 30)
          return error(f, "Máximo 30 pasos.");
        editTemplate.steps.push({
          id: crypto.randomUUID(),
          kind: item.kind,
          preset: JSON.parse(JSON.stringify(item.item)),
          sets: 1,
          rest: 0,
        });
        templateEditor(null, true);
      }
    }
    if (a === "training-step-up" || a === "training-step-remove") {
      syncTemplate();
      const i = Number(b.dataset.index);
      if (a === "training-step-remove") editTemplate.steps.splice(i, 1);
      else if (i > 0)
        [editTemplate.steps[i - 1], editTemplate.steps[i]] = [
          editTemplate.steps[i],
          editTemplate.steps[i - 1],
        ];
      templateEditor(null, true);
    }
    if (a === "training-template-delete") {
      s().training.templates = s().training.templates.filter(
        (x) => x.id !== editTemplate.id,
      );
      save();
      document.querySelector("#sheet").close();
      render();
    }
    if (a === "training-log-step") {
      const session = activeSession(s()),
        next = session && nextSessionStep(s(), session, today());
      if (next) {
        ctx.logPreset(next.step, { sessionStepId: next.step.id });
        if (next.step.rest) ctx.startRest(next.step.rest);
      }
    }
    if (a === "training-skip") {
      const session = activeSession(s()),
        next = session && nextSessionStep(s(), session, today());
      if (next) {
        session.skipped.push(next.step.id);
        save();
        render();
      }
    }
    if (a === "training-finish") {
      const session = activeSession(s());
      if (session) {
        session.endedAt = Date.now();
        s().training.activeSessionId = null;
        save();
        render();
        summary(session);
      }
    }
    if (a === "training-session") {
      const session = s().training.sessions.find((x) => x.id === b.dataset.id);
      if (session) summary(session);
    }
    if (a === "training-goal-new") goalEditor();
    if (a === "training-goal-edit")
      goalEditor(s().training.goals.find((x) => x.id === b.dataset.id));
    if (a === "training-goal-delete") {
      s().training.goals = s().training.goals.filter(
        (x) => x.id !== b.dataset.id,
      );
      save();
      document.querySelector("#sheet").close();
      render();
    }
  }
  document.querySelector("#main").addEventListener("click", click);
  document.querySelector("#sheet").addEventListener("click", click);
  document.addEventListener("submit", (e) => {
    const f = e.target;
    if (!f.id.startsWith("training-")) return;
    e.preventDefault();
    try {
      if (f.id === "training-free-form")
        start(null, f.elements.name.value.trim());
      if (f.id === "training-template-form") {
        syncTemplate();
        if (!validTemplate(editTemplate))
          throw Error("Agrega al menos un paso y revisa series y descansos.");
        const i = s().training.templates.findIndex(
          (x) => x.id === editTemplate.id,
        );
        if (i >= 0) s().training.templates[i] = editTemplate;
        else {
          if (s().training.templates.length >= 100)
            throw Error("Máximo 100 planes.");
          s().training.templates.push(editTemplate);
        }
        save();
        document.querySelector("#sheet").close();
        render();
        toast("Plan guardado");
      }
      if (f.id === "training-goal-form") {
        const fd = new FormData(f),
          old = s().training.goals.find((x) => x.id === f.dataset.id),
          g = {
            id: f.dataset.id || crypto.randomUUID(),
            name: String(fd.get("name")).trim() || "Mi meta",
            family: String(fd.get("family")),
            metric: String(fd.get("metric")),
            period: String(fd.get("period")),
            target: Number(fd.get("target")),
            createdDay: old?.createdDay ?? today(),
            movement: String(fd.get("movement")).trim() || null,
            variation: String(fd.get("variation")).trim() || null,
            apparatus: String(fd.get("apparatus")).trim() || null,
            weight: fd.get("weight") === "" ? null : Number(fd.get("weight")),
          };
        if (!validGoal(g))
          throw Error(
            "Revisa la meta y las unidades; los días no pueden superar el periodo.",
          );
        const i = s().training.goals.findIndex((x) => x.id === g.id);
        if (i >= 0) s().training.goals[i] = g;
        else {
          if (s().training.goals.length >= 30) throw Error("Máximo 30 metas.");
          s().training.goals.push(g);
        }
        save();
        document.querySelector("#sheet").close();
        render();
        toast("Meta guardada");
      }
    } catch (err) {
      error(f, err.message);
    }
  });
  return {
    page: (tab) => (tab === "goals" ? goalsPage() : plansPage()),
    dashboard,
    decorate(e, kind, meta = {}) {
      return attachSession(s(), e, kind, today(), meta);
    },
    goalEditor,
  };
}
