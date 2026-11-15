import { exerciseDetail } from "./journey-core.mjs";
import { skillCatalog, exerciseProfileId } from "./skills-core.mjs";
export function createJourneyUI(ctx) {
  const { esc, render } = ctx;
  let key = null,
    weight = "last",
    mode = "performance",
    range = "all",
    selectedPoint = null;
  const num = (n) =>
      new Intl.NumberFormat("es-GT", { maximumFractionDigits: 1 }).format(n),
    date = (k) =>
      new Date(k + "T12:00:00").toLocaleDateString("es-GT", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    load = (w) => (w ? `+${num(w)} lb` : "Sin lastre"),
    amount = (e) => `${num(e.value)} ${e.metric === "seconds" ? "s" : "reps"}`;
  const model = () =>
    key
      ? exerciseDetail(ctx.getState(), key, ctx.getToday(), weight, mode, range)
      : null;
  function chart(m) {
    const p = m.points;
    if (!p.length)
      return '<div class="empty"><strong>Sin series en este periodo.</strong>Prueba 90 días o Todo.</div>';
    const max = Math.max(1, ...p.map((x) => x.value)),
      day = (k) => Date.parse(k + "T00:00:00Z"),
      first = day(p[0].day),
      last = day(p.at(-1).day),
      span = last - first || 1;
    const points = p.map((x, i) => ({
      ...x,
      x: p.length === 1 ? 300 : 46 + ((day(x.day) - first) / span) * 508,
      y: 190 - (x.value / max) * 150,
      index: i,
    }));
    const selected =
      points[Math.min(selectedPoint ?? points.length - 1, points.length - 1)];
    return `<div class="journey-chart"><svg viewBox="0 0 600 235" role="group" aria-label="${mode === "weight" ? "Lastre máximo diario" : "Mejor serie diaria a la misma carga"}"><line x1="46" y1="190" x2="554" y2="190" class="journey-axis"/><line x1="46" y1="40" x2="554" y2="40" class="journey-gridline"/><text x="40" y="30">${num(max)} ${m.unit}</text><text x="32" y="194">0</text><polyline points="${points.map((x) => x.x + "," + x.y).join(" ")}" class="journey-line"/>${points.map((x) => `<g data-action="journey-point" data-index="${x.index}" role="button" tabindex="0" aria-label="${esc(date(x.day))}: ${num(x.value)} ${m.unit}, ${amount(x.entry)} con ${load(x.entry.weight)}"><title>${esc(date(x.day))}: ${num(x.value)} ${m.unit}</title><circle cx="${x.x}" cy="${x.y}" r="13" fill="transparent"/><circle cx="${x.x}" cy="${x.y}" r="${x.index === selected.index ? 6 : 4}" class="journey-dot ${x.index === selected.index ? "selected" : ""}"/></g>`).join("")}<text x="46" y="224">${esc(date(p[0].day))}</text><text x="554" y="224" text-anchor="end">${esc(date(p.at(-1).day))}</text></svg><div class="journey-point-info" role="status"><strong>${num(selected.value)} ${m.unit}</strong><span>${esc(date(selected.day))} · ${amount(selected.entry)} · ${load(selected.entry.weight)}</span></div><label class="field journey-point-select">Ver un día<select name="journey-point">${points.map((x) => `<option value="${x.index}" ${x.index === selected.index ? "selected" : ""}>${esc(date(x.day))} · ${num(x.value)} ${m.unit}</option>`).join("")}</select></label></div>`;
  }
  function page() {
    const m = model();
    if (!m)
      return '<div class="panel"><button class="text-button" data-action="journey-back">← Ver ejercicios</button><div class="empty"><strong>Este ejercicio ya no tiene series.</strong>Las fichas se calculan desde tu historial.</div></div>';
    const e = m.record.exercise,
      focus = ctx.getState().focusSkills.includes(e.family);
    return `<div class="panel history-panel journey-detail"><button class="text-button journey-back" data-action="journey-back">← Todos mis ejercicios</button><div class="journey-title"><div><p class="eyebrow">${e.source === "base" ? { push: "PUSH", pull: "PULL", legs: "LEGS" }[e.baseGroup] : skillCatalog[e.family].name}</p><h1>${esc(e.movement)}</h1><p>${esc([e.apparatus, e.support === "Libre" ? "Libre" : e.support + ": " + e.supportNote].filter(Boolean).join(" · "))}</p></div>${e.source === "skill" && e.family !== "other" ? `<button class="focus-star ${focus ? "selected" : ""}" data-action="journey-focus" aria-label="${focus ? "Quitar" : "Fijar"} ${esc(skillCatalog[e.family].name)} de enfoques" aria-pressed="${focus}">${focus ? "★" : "☆"}</button>` : ""}</div><label class="field">Variante<select aria-label="Variante, equipo y asistencia" name="journey-variant">${m.variants.map((v) => `<option value="${esc(v.key)}" ${v.key === key ? "selected" : ""}>${esc(v.label)}</option>`).join("")}</select></label><div class="journey-actions"><button class="primary" data-action="journey-log">Registrar otra serie</button><button class="secondary" data-action="journey-pin">★ Fijar una serie</button></div><button class="text-button" data-action="book-profile" data-id="${esc(exerciseProfileId(e))}">Mastery y logros del ejercicio ↗</button><button class="text-button" data-action="journey-goal">Crear meta para esta variante ↗</button><div class="journey-modes" aria-label="Medida de evolución"><button data-action="journey-mode" data-mode="performance" aria-pressed="${mode === "performance"}">${e.metric === "seconds" ? "Tiempo" : "Reps"}</button><button data-action="journey-mode" data-mode="weight" aria-pressed="${mode === "weight"}">Lastre</button></div>${mode === "performance" ? `<label class="field">Comparar a la misma carga<select name="journey-weight">${m.weights.map((w) => `<option value="${w}" ${w === m.selectedWeight ? "selected" : ""}>${load(w)}</option>`).join("")}</select></label>` : '<p class="note">Máximo lastre registrado cada día para esta variante, entre todas sus cargas. Toca un punto para ver sus reps o segundos.</p>'}<div class="journey-stats"><div><span>Última serie</span><strong>${amount(m.last)}</strong><small>${load(m.last.weight)} · ${esc(date(m.last.day))}</small></div><div><span>${mode === "weight" ? "Máximo lastre" : e.metric === "seconds" ? "Mejor tiempo" : "Mejor serie"}</span><strong>${mode === "weight" ? "+" + num(m.record.heaviest.weight) + " lb" : amount(m.best)}</strong><small>${mode === "weight" ? amount(m.record.heaviest) : load(m.best.weight)}</small></div><div><span>Días de práctica</span><strong>${m.days}</strong><small>${m.selected.length} series · ${num(m.total)} ${e.metric === "seconds" ? "s" : "reps"} acumulados</small></div></div><p class="note">${mode === "performance" ? "Resumen de todo tu historial a la carga elegida." : "Resumen de todo tu historial de esta variante."}</p><div class="mini-heading"><h2>Evolución diaria</h2><div class="journey-ranges">${[
      ["30", "30 d"],
      ["90", "90 d"],
      ["all", "Todo"],
    ]
      .map(
        ([value, label]) =>
          `<button data-action="journey-range" data-range="${value}" aria-pressed="${range === value}">${label}</button>`,
      )
      .join(
        "",
      )}</div></div><p class="quiet">${mode === "weight" ? "Lastre máximo por día" : "Mejor serie por día · " + load(m.selectedWeight)}</p>${chart(m)}<div class="section-heading"><h2>Series recientes</h2><span>${mode === "performance" ? load(m.selectedWeight) : "Todas las cargas"}</span></div><div class="journey-recent">${[
      ...m.selected,
    ]
      .reverse()
      .slice(0, 12)
      .map(
        (x) =>
          `<button data-action="journey-day" data-id="${esc(x.id)}" data-source="${x.source}"><span><strong>${esc(date(x.day))}</strong><small>${load(x.weight)}</small></span><b>${amount(x)} ↗</b></button>`,
      )
      .join("")}</div></div>`;
  }
  function handleClick(ev) {
    const b = ev.target.closest('[data-action^="journey-"]');
    if (!b) return;
    const a = b.dataset.action,
      m = model();
    if (a === "journey-back") {
      ctx.back();
      return;
    }
    if (!m) return;
    if (a === "journey-mode") {
      mode = b.dataset.mode;
      selectedPoint = null;
      render();
    }
    if (a === "journey-range") {
      range = b.dataset.range;
      selectedPoint = null;
      render();
    }
    if (a === "journey-point") {
      selectedPoint = Number(b.dataset.index);
      render();
    }
    if (a === "journey-log") ctx.log(m.latest);
    if (a === "journey-goal") ctx.createGoal(m.latest);
    if (a === "journey-pin") ctx.pin(m.latest);
    if (a === "journey-focus") ctx.toggleFocus(m.record.exercise.family);
    if (a === "journey-day") {
      const e = m.entries.find(
        (x) => x.id === b.dataset.id && x.source === b.dataset.source,
      );
      if (e) ctx.openDay(e);
    }
  }
  document.querySelector("#main").addEventListener("click", handleClick);
  document.querySelector("#main").addEventListener("keydown", (ev) => {
    if (
      (ev.key === "Enter" || ev.key === " ") &&
      ev.target.matches('[data-action="journey-point"]')
    ) {
      ev.preventDefault();
      handleClick(ev);
    }
  });
  document.querySelector("#main").addEventListener("change", (ev) => {
    if (ev.target.name === "journey-point") {
      selectedPoint = Number(ev.target.value);
      render();
    }
    if (ev.target.name === "journey-weight") {
      weight = Number(ev.target.value);
      selectedPoint = null;
      render();
    }
    if (ev.target.name === "journey-variant") {
      key = ev.target.value;
      weight = "last";
      selectedPoint = null;
      render();
    }
  });
  return {
    page,
    open(newKey) {
      key = newKey;
      weight = "last";
      mode = "performance";
      range = "all";
      selectedPoint = null;
    },
    reset() {
      key = null;
    },
  };
}
