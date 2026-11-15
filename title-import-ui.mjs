import {
  activeTitles,
  allTitles,
  parseTitlePack,
  applyTitlePack,
  TITLE_PACK_EXAMPLE,
  TITLE_AI_PROMPT,
  themeReady,
} from "./title-pack.mjs";
import { RARITIES } from "./title-catalog.mjs";
export function createTitleImportUI(ctx) {
  let pack = null;
  const s = () => ctx.getState(),
    esc = ctx.esc;
  let raw = "",
    mode = "append";
  function open() {
    ctx.openSheet(
      "Importar títulos",
      `<p>Agrega listas o reemplaza el catálogo de los cofres. Tu colección, títulos equipados y recibos se conservan. Las probabilidades de rareza no cambian.</p><div class="row"><button class="secondary" type="button" data-action="title-copy-prompt">Copiar prompt para AI</button><button class="secondary" type="button" data-action="title-copy-example">Copiar formato</button></div><details class="earning-rules"><summary>Ver prompt y formato</summary><label class="field">Prompt<textarea readonly id="title-ai-prompt" rows="7">${esc(TITLE_AI_PROMPT)}</textarea></label><label class="field">JSON de ejemplo<textarea readonly id="title-example" rows="9">${esc(JSON.stringify(TITLE_PACK_EXAMPLE, null, 2))}</textarea></label><p class="note">Temas: dental, minecraft, deepwoken, custom. Rarezas: common, rare, epic, legendary, mythic, secret. Cada ID identifica un título de forma estable. Los datos se leen como JSON, no se ejecuta código ni se llama a una AI desde Reps.</p></details><label class="field">Pega el JSON<textarea id="title-pack-input" rows="8" spellcheck="false" placeholder='{"format":"reps.titles.v1","titles":[…]}'>${esc(raw)}</textarea></label><label class="field">O selecciona una lista<input type="file" id="title-pack-file" accept=".json,application/json"></label><label class="field">Importar como<select id="title-pack-mode"><option value="append" ${mode === "append" ? "selected" : ""}>Agregar / actualizar IDs de la lista activa</option><option value="replace" ${mode === "replace" ? "selected" : ""}>Reemplazar la lista activa de cofres</option></select></label><button class="primary wide" data-action="title-preview">Revisar antes de importar</button><p id="title-pack-error" class="note danger" role="alert"></p><div id="title-pack-preview"></div><details class="earning-rules"><summary>Tu lista activa (${activeTitles(s()).length} títulos)</summary><button class="secondary" data-action="title-copy-current">Copiar lista actual</button><button class="secondary" data-action="title-export">Descargar JSON</button><p class="note">Los títulos que salgan del catálogo siguen en la colección si ya los posees. Una lista parcial se puede agregar; para abrir un cofre debe haber títulos en las seis rarezas dentro del tema elegido.</p></details>`,
    );
  }
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      ctx.toast("Copiado");
    } catch {
      ctx.openSheet(
        "Copiar texto",
        `<label class="field">Mantén pulsado y copia<textarea readonly rows="16" id="title-copy-fallback">${esc(text)}</textarea></label>`,
      );
      document.querySelector("#title-copy-fallback").select();
    }
  }
  function current() {
    return JSON.stringify(
      { format: "reps.titles.v1", titles: activeTitles(s()) },
      null,
      2,
    );
  }
  function preview() {
    const input = document.querySelector("#title-pack-input");
    raw = input.value;
    mode = document.querySelector("#title-pack-mode").value;
    const error = document.querySelector("#title-pack-error");
    error.textContent = "";
    try {
      pack = parseTitlePack(raw);
      const before = activeTitles(s()),
        next = structuredClone(s());
      const summary = applyTitlePack(next, pack, mode),
        after = activeTitles(next),
        ids = new Set(before.map((t) => t.id)),
        afterIds = new Set(after.map((t) => t.id)),
        added = after.filter((t) => !ids.has(t.id)).length,
        removed = before.filter((t) => !afterIds.has(t.id)).length,
        changed = after.filter(
          (t) =>
            ids.has(t.id) &&
            JSON.stringify(t) !==
              JSON.stringify(before.find((b) => b.id === t.id)),
        ).length;
      document.querySelector("#title-pack-preview").innerHTML =
        `<section class="mastery-card"><h3>Vista previa</h3><p>${added} IDs nuevos · ${changed} actualizados · ${removed} salen del cofre · ${summary.count} títulos activos.</p><p>${RARITIES.map((r) => `${r.name}: ${after.filter((t) => t.rarity === r.id).length}`).join(" · ")}</p>${!themeReady(next) ? '<p class="note danger">Faltan rarezas: los cofres mixtos quedarán desactivados hasta completar las seis. La colección sigue disponible.</p>' : ""}<details><summary>Ver títulos de la lista</summary>${pack.titles
          .slice(0, 50)
          .map(
            (t) =>
              `<p class="note"><strong>${esc(t.name)}</strong> · ${esc(t.theme)} · ${esc(t.rarity)}<br>${esc(t.reason)}</p>`,
          )
          .join(
            "",
          )}</details><p class="note">${mode === "replace" ? "Se reemplazará el catálogo que puede salir en cofres." : "La lista se combinará con tu catálogo activo por ID."} Los títulos poseídos conservan su identidad; para cambiar nombre/tema/rareza de un ID poseído debes crear otro ID.</p><button class="${mode === "replace" ? "secondary danger" : "primary"} wide" data-action="title-apply">${mode === "replace" ? "Aplicar reemplazo de catálogo" : "Agregar esta lista"}</button></section>`;
    } catch (err) {
      pack = null;
      document.querySelector("#title-pack-preview").innerHTML = "";
      error.textContent = err.message;
    }
  }
  async function click(e) {
    const b = e.target.closest('[data-action^="title-"]');
    if (!b) return;
    const a = b.dataset.action;
    if (a === "title-manage") open();
    if (a === "title-copy-prompt") await copy(TITLE_AI_PROMPT);
    if (a === "title-copy-example")
      await copy(JSON.stringify(TITLE_PACK_EXAMPLE, null, 2));
    if (a === "title-copy-current") await copy(current());
    if (a === "title-preview") preview();
    if (a === "title-apply" && pack) {
      const previous = structuredClone(s().economy);
      try {
        applyTitlePack(s(), pack, mode);
        if (!ctx.save()) {
          s().economy = previous;
          throw Error("No se pudo guardar. El catálogo anterior se conserva.");
        }
        ctx.render();
        open();
        ctx.toast("Catálogo importado; colección conservada");
      } catch (err) {
        s().economy = previous;
        document.querySelector("#title-pack-error").textContent = err.message;
      }
    }
    if (a === "title-export") {
      const url = URL.createObjectURL(
          new Blob([current()], { type: "application/json" }),
        ),
        link = document.createElement("a");
      link.href = url;
      link.download = "reps-titles.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  }
  document.querySelector("#main").addEventListener("click", click);
  document.querySelector("#sheet").addEventListener("click", click);
  document.querySelector("#sheet").addEventListener("input", (e) => {
    if (e.target.id === "title-pack-input") {
      raw = e.target.value;
      pack = null;
      document.querySelector("#title-pack-preview").innerHTML = "";
    }
  });
  document.querySelector("#sheet").addEventListener("change", async (e) => {
    if (e.target.id === "title-pack-mode") {
      pack = null;
      document.querySelector("#title-pack-preview").innerHTML = "";
    }
    if (e.target.id === "title-pack-file") {
      try {
        const f = e.target.files[0];
        if (!f || f.size > 2 * 1024 * 1024)
          throw Error("Elige un archivo JSON de hasta 2 MB.");
        raw = await f.text();
        document.querySelector("#title-pack-input").value = raw;
        preview();
      } catch (err) {
        document.querySelector("#title-pack-error").textContent = err.message;
      }
    }
  });
  return { open };
}
