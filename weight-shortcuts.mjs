import { allExerciseEntries, exerciseProfileId } from "./skills-core.mjs";
import { shortcutConfig, universalFavorites } from "./journey-core.mjs";
const validWeight = (value) =>
  Number.isFinite(value) && value >= 0 && value <= 2000;
const profile = (config) =>
  config?.movement?.trim() ? exerciseProfileId(config) : null;
export function rememberWeights(state, config, ...values) {
  const exercise = profile(config);
  if (!exercise) return;
  let presets = state.preferences.weightPresets ?? [];
  for (const weight of values) {
    if (!validWeight(weight) || weight === 0) continue;
    presets = [
      { exercise, weight },
      ...presets.filter((p) => p.exercise !== exercise || p.weight !== weight),
    ];
  }
  state.preferences.weightPresets = presets.slice(0, 24);
}
export function weightOptions(state, config, today, current, limit = 4) {
  const exercise = profile(config),
    remembered = (state.preferences.weightPresets ?? [])
      .filter((p) => p.exercise === exercise)
      .map((p) => p.weight);
  const history = exercise
    ? allExerciseEntries(state, today)
        .filter((e) => exerciseProfileId(e) === exercise)
        .reverse()
        .map((e) => e.weight)
    : [];
  return [
    0,
    ...[...new Set([current, ...remembered, ...history])]
      .filter((w) => validWeight(w) && w > 0)
      .slice(0, limit - 1),
  ];
}
export function createWeightUI(ctx) {
  const { esc } = ctx;
  function content(config, current, compact, limit) {
    const weights = weightOptions(
      ctx.getState(),
      config,
      ctx.getToday(),
      current,
      limit,
    );
    if (compact && weights.length < 2) return "";
    return weights
      .map(
        (weight) =>
          `<button type="button" data-weight-pick="${weight}" aria-label="${weight === 0 ? "Sin lastre, 0 lb" : "Usar +" + weight + " lb"}" aria-pressed="${Number.isFinite(current) && weight === current}">${weight === 0 ? (compact ? "0 lb" : "Sin lastre · 0 lb") : "+" + weight + " lb"}</button>`,
      )
      .join("");
  }
  function buttons(
    config,
    current,
    { target = "weight", compact = false, key = null, limit = 4 } = {},
  ) {
    const html = content(config, current, compact, limit);
    if (!html) return "";
    return `<div class="weight-presets ${compact ? "compact" : ""}" data-weight-controls data-weight-target="${esc(target)}" data-weight-limit="${limit}" ${key ? `data-weight-shortcut="${esc(key)}"` : ""} role="group" aria-label="Elegir lastre en libras">${html}</div>`;
  }
  function readContext(form) {
    const fields = form.elements,
      read = (name) => {
        const value = fields[name]?.value;
        return value === "__custom"
          ? (fields["custom" + name[0].toUpperCase() + name.slice(1)]?.value ??
              "")
          : (value ?? "");
      };
    if (form.id === "shortcut-form") {
      const f = universalFavorites(ctx.getState()).find(
        (x) => x.key === form.dataset.key,
      );
      return f ? shortcutConfig(f) : null;
    }
    if (fields.family)
      return {
        family: read("family"),
        movement: read("movement"),
        variation: read("variation"),
        metric: read("metric"),
      };
    return shortcutConfig({
      kind: "base",
      item: {
        group: form.dataset.group,
        exercise: read("exercise") || read("customName"),
        variation: read("variation"),
        side: read("side") || "both",
        apparatus: read("apparatus"),
      },
    });
  }
  function refresh(form) {
    if (!form) return;
    for (const wrap of form.querySelectorAll(
      "[data-weight-controls]:not([data-weight-shortcut])",
    )) {
      const input = form.elements[wrap.dataset.weightTarget];
      if (!input) continue;
      const current = input.value === "" ? NaN : Number(input.value);
      const config = readContext(form),
        limit = Number(wrap.dataset.weightLimit);
      const weights = weightOptions(
        ctx.getState(),
        config,
        ctx.getToday(),
        current,
        limit,
      );
      const existing = [...wrap.querySelectorAll("[data-weight-pick]")];
      // Keep buttons mounted when an input blurs before the tap reaches them.
      if (
        existing.map((b) => Number(b.dataset.weightPick)).join(",") ===
        weights.join(",")
      ) {
        existing.forEach((b) =>
          b.setAttribute(
            "aria-pressed",
            String(
              Number.isFinite(current) &&
                Number(b.dataset.weightPick) === current,
            ),
          ),
        );
      } else wrap.innerHTML = content(config, current, false, limit);
    }
  }
  document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-weight-pick]");
    if (!button) return;
    const wrap = button.closest("[data-weight-controls]"),
      value = Number(button.dataset.weightPick);
    if (!wrap || !validWeight(value)) return;
    if (wrap.dataset.weightShortcut) {
      ctx.setShortcutWeight(wrap.dataset.weightShortcut, value);
      return;
    }
    const form = wrap.closest("form"),
      input = form?.elements[wrap.dataset.weightTarget];
    if (!input) return;
    rememberWeights(
      ctx.getState(),
      readContext(form),
      input.value === "" ? NaN : Number(input.value),
      value,
    );
    input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.blur();
  });
  document.addEventListener("input", (e) => {
    if (
      e.target.name === "weight" ||
      e.target.closest('#shortcut-form[data-mode="load"]')
    )
      refresh(e.target.closest("form"));
  });
  document.addEventListener("change", (e) => refresh(e.target.closest("form")));
  return { buttons };
}
