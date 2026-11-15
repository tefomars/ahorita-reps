import { gameSummary } from "./game-core.mjs";
export function createGameUI(ctx) {
  const m = () => gameSummary(ctx.getState(), ctx.getToday()),
    n = (v) => Math.floor(v).toLocaleString("es-GT");
  function card(preview = false) {
    const x = m();
    return `<${preview ? "div" : "button"} class="${preview ? "level-preview" : "level-card"}" ${preview ? "" : "data-action=game-open"}><span class="level-token">${x.level}</span><span class="level-copy"><strong>Nivel ${x.level}<small>+${n(x.todayXP)} XP hoy</small></strong><span class="progress"><i style="width:${x.percent}%"></i></span><small>${n(x.xp)} XP total · faltan ${n(x.remaining)} para nivel ${x.level + 1} ↗</small></span></${preview ? "div" : "button"}>`;
  }
  function open() {
    const x = m();
    ctx.openSheet(
      "Tu nivel y experiencia",
      `${card(true)}<p class="note">Tu historial anterior también aporta XP. Los niveles no tienen límite y cada nivel requiere 100 XP más que el anterior. Editar, eliminar o deshacer una serie recalcula tus puntos y logros.</p><section class="game-quest"><h3>Constancia de esta semana</h3><strong>${x.weekDays} / 3 días activos</strong><p>${x.weekDays >= 3 ? "✓ +50 XP conseguidos" : "Registra práctica en 3 días distintos para +50 XP."}</p><small>Se renueva el lunes. Tu XP acumulada permanece. No hay penalización por descansar.</small></section><h3>Tus logros</h3><div class="game-badges">${x.badges.map((b) => `<div class="${b.earned ? "earned" : ""}"><b>${b.earned ? "✦" : "◇"}</b><strong>${b.name}</strong><small>${n(Math.min(b.value, b.target))} / ${n(b.target)}</small></div>`).join("")}</div><details class="game-rules"><summary>Cómo ganas XP</summary><p>Reps: 2 puntos por rep más duración / 15. Holds: segundos / 3. Luego multiplicamos por dificultad (×1 a ×2) y por lastre (bonificación gradual de hasta +100 %).</p><p>Duración de reps: la que ingreses o una estimación de 3 segundos por rep, con un máximo de 3600 segundos para ese componente. La asistencia se conserva en tus registros; puedes ajustar la dificultad para reflejarla.</p><p>+20 XP por día con práctica, incluidos intentos. Los intentos no dan XP de serie. Crear favoritas o planes y cambiar peso no dan XP. Dividir una serie no añade puntos fijos.</p><p>Son reglas de motivación del juego, no una medida fisiológica de esfuerzo ni una recomendación de cuánto entrenar.</p><p>Desglose: ${n(x.seriesXP)} de series · ${n(x.dailyBonus)} por días · ${n(x.weeklyBonus)} por semanas.</p></details><h3>Series recientes</h3><div class="game-recent">${
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
