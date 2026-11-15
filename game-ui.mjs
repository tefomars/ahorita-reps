import { allTitles } from "./title-pack.mjs";
import { wallet } from "./economy-core.mjs";
import { gameSummary } from "./game-core.mjs";
export function createGameUI(ctx) {
  const m = () => gameSummary(ctx.getState(), ctx.getToday()),
    n = (v) => Math.floor(v).toLocaleString("es-GT");
  function card(preview = false) {
    const w = preview ? null : wallet(ctx.getState(), ctx.getToday()),
      x = preview ? m() : w.game,
      title = allTitles(ctx.getState()).find(
        (t) => t.id === ctx.getState().economy.equipped,
      );
    const markup = `<${preview ? "div" : "button"} class="${preview ? "level-preview" : "level-card"}" ${preview ? "" : "data-action=game-open"}><span class="level-token">${x.level}</span><span class="level-copy"><strong>Nivel ${x.level}<small>+${n(x.todayXP)} XP hoy</small></strong><span class="progress"><i style="width:${x.percent}%"></i></span><small>${n(x.xp)} XP total · faltan ${n(x.remaining)} para nivel ${x.level + 1} ↗</small></span></${preview ? "div" : "button"}>`;
    return preview
      ? markup
      : `<div class="game-profile">${title ? `<div class="equipped-title rarity ${title.rarity}">✦ ${ctx.esc(title.name)}</div>` : ""}<div class="level-hub">${markup}<button class="store-access" data-action="reward-store" aria-label="Abrir tienda de títulos"><b aria-hidden="true"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 10V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4M3 10h18v10H3zM7 4v16M17 4v16"/><path d="M10 8h4v5h-4z" fill="#edf1e4"/></svg></b><small>◈ ${w.balance}</small></button></div></div>`;
  }
  function open() {
    const x = m();
    ctx.openSheet(
      "Tu nivel y experiencia",
      `${card(true)}<div class="row"><button class="secondary" data-action="reward-achievements">Logros por ejercicio ↗</button><button class="secondary" data-action="reward-store">▣ Tienda de títulos</button></div><p class="note">Tu historial anterior también aporta XP. Los niveles no tienen límite y cada nivel requiere 100 XP más que el anterior. Editar, eliminar o deshacer una serie recalcula tus puntos y logros.</p><section class="game-quest"><h3>Constancia de esta semana</h3><strong>${x.weekDays} / 3 días activos</strong><p>${x.weekDays >= 3 ? "✓ +50 XP conseguidos" : "Registra práctica en 3 días distintos para +50 XP."}</p><small>Se renueva el lunes. Tu XP acumulada permanece. No hay penalización por descansar.</small></section><h3>Tus logros</h3><div class="game-badges">${x.badges.map((b) => `<div class="${b.earned ? "earned" : ""}"><b>${b.earned ? "✦" : "◇"}</b><strong>${b.name}</strong><small>${n(Math.min(b.value, b.target))} / ${n(b.target)}</small></div>`).join("")}</div><details class="game-rules"><summary>Cómo ganas XP</summary><p>Reps: 2 puntos por rep más duración / 15. Holds: segundos / 3. Luego multiplicamos por dificultad (×1 a ×2) y por lastre (bonificación gradual de hasta +100 %).</p><p>Duración de reps: la que ingreses o una estimación de 3 segundos por rep, con un máximo de 3600 segundos para ese componente. La asistencia se conserva en tus registros; puedes ajustar la dificultad para reflejarla.</p><p>+20 XP por día con práctica, incluidos intentos. Los intentos no dan XP de serie. Crear favoritas o planes y cambiar peso no dan XP. Las rutas de series cuentan las series completadas que registras.</p><p>Son reglas de motivación del juego, no una medida fisiológica de esfuerzo ni una recomendación de cuánto entrenar.</p><p>Desglose: ${n(x.seriesXP)} de series · ${n(x.dailyBonus)} por días · ${n(x.weeklyBonus)} por semanas · ${n(x.achievementXP)} por logros.</p></details><h3>Series recientes</h3><div class="game-recent">${
        x.details
          .slice(-8)
          .reverse()
          .map(
            (v) =>
              `<div><strong>${ctx.esc(v.entry.movement)} · ${ctx.esc(v.entry.variation)}</strong><span>${v.xp.toFixed(1)} XP · dificultad ${v.difficulty}/5 · +${v.entry.weight} lb</span><small>${v.entry.day} · ${v.estimated ? "duración estimada" : v.entry.outcome === "attempt" ? "intento" : "duración registrada"}: ${Math.round(v.seconds * 10) / 10} s</small></div>`,
          )
          .join("") ||
        '<p class="note">Registra tu primera serie para empezar.</p>'
      }</div>`,
    );
  }
  document.querySelector("#main").addEventListener("click", (e) => {
    if (e.target.closest('[data-action="game-open"]')) open();
  });
  return { card, open };
}
