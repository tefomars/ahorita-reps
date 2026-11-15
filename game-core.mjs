import { achievementSummary } from "./achievement-core.mjs";
import { allJournalEntries } from "./skills-core.mjs";
export function difficulty(e) {
  if (Number.isInteger(e.difficulty) && e.difficulty >= 1 && e.difficulty <= 5)
    return e.difficulty;
  const v = (e.variation ?? "").toLowerCase(),
    skill = [
      "front",
      "back",
      "planche",
      "flag",
      "maltese",
      "victorian",
      "ironCross",
      "muscle",
    ].includes(e.family);
  if (skill) {
    if (/full|completa/.test(v)) return 5;
    if (/straddle|half lay|one leg/.test(v)) return 4;
    if (/advanced/.test(v)) return 3;
    return 2;
  }
  return 2;
}
export function setExperience(e) {
  if (e.outcome === "attempt")
    return {
      xp: 0,
      seconds: 0,
      estimated: false,
      difficulty: difficulty(e),
      loadBonus: 0,
    };
  const seconds =
      e.metric === "seconds" ? e.value : (e.durationSeconds ?? e.value * 3),
    estimated = e.metric === "reps" && e.durationSeconds == null;
  const loadBonus = Math.min(1, Math.log2(1 + e.weight / 25) / 3),
    d = difficulty(e);
  const work =
    e.metric === "seconds"
      ? e.value / 3
      : e.value * 2 + Math.min(seconds, 3600) / 15;
  return {
    xp: work * (0.75 + d * 0.25) * (1 + loadBonus),
    seconds,
    estimated,
    difficulty: d,
    loadBonus,
  };
}
export function levelFromXP(xp) {
  const level = Math.floor((1 + Math.sqrt(1 + (8 * xp) / 100)) / 2),
    start = (100 * level * (level - 1)) / 2,
    next = (100 * level * (level + 1)) / 2;
  return {
    level,
    start,
    next,
    remaining: next - xp,
    percent: Math.max(0, Math.min(100, ((xp - start) / (next - start)) * 100)),
  };
}
function monday(day) {
  const d = new Date(day + "T12:00:00");
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function gameSummary(s, today) {
  const entries = allJournalEntries(s, today),
    days = new Map(),
    weeks = new Map();
  let seriesXP = 0;
  const details = entries.map((e) => {
    const score = setExperience(e);
    seriesXP += score.xp;
    days.set(e.day, (days.get(e.day) ?? 0) + score.xp);
    const week = monday(e.day);
    if (!weeks.has(week)) weeks.set(week, new Set());
    weeks.get(week).add(e.day);
    return { entry: e, ...score };
  });
  const completed = entries.filter((e) => e.outcome !== "attempt").length,
    activeDays = days.size,
    weekDays = weeks.get(monday(today))?.size ?? 0,
    completedWeeks = [...weeks.values()].filter((x) => x.size >= 3).length;
  const achievementRewards = achievementSummary(s, today);
  const xp = Math.floor(
      seriesXP + activeDays * 20 + completedWeeks * 50 + achievementRewards.xp,
    ),
    weekReward = weekDays >= 3 ? 50 : 0,
    todayXP = Math.floor(
      achievementRewards.todayXP +
        (days.get(today) ?? 0) +
        (days.has(today) ? 20 : 0) +
        (weekDays >= 3 && [...weeks.get(monday(today))].sort()[2] === today
          ? 50
          : 0),
    );
  const badges = [
    ["Primera serie", completed, 1],
    ["10 series", completed, 10],
    ["100 series", completed, 100],
    ["1000 series", completed, 1000],
    ["7 días activos", activeDays, 7],
    ["30 días activos", activeDays, 30],
    ["100 días activos", activeDays, 100],
    ["Un año de práctica", activeDays, 365],
  ].map(([name, value, target]) => ({
    name,
    value,
    target,
    earned: value >= target,
  }));
  return {
    xp,
    ...levelFromXP(xp),
    todayXP,
    activeDays,
    completed,
    weekDays,
    weekReward,
    seriesXP: Math.floor(seriesXP),
    achievementXP: achievementRewards.xp,
    achievementRewards,
    achievementCount: achievementRewards.earned.length,
    dailyBonus: activeDays * 20,
    weeklyBonus: completedWeeks * 50,
    details,
    badges,
  };
}
export function effortFields(e = {}, duration = true) {
  return `<details class="game-effort"><summary>Dificultad${duration ? " y duración" : ""} · opcional</summary><label class="field">Dificultad de esta configuración<select name="difficulty"><option value="">Automática según variante</option>${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${e.difficulty === n ? "selected" : ""}>${n} / 5${n === 1 ? " · fácil" : n === 5 ? " · muy difícil" : ""}</option>`).join("")}</select></label>${duration ? `<label class="field">Duración de la serie · segundos<input name="durationSeconds" type="number" min="0.1" max="3600" step="0.1" inputmode="decimal" value="${Number.isFinite(e.durationSeconds) ? e.durationSeconds : ""}" placeholder="Vacío = estimación para XP"></label>` : ""}<p class="note">La dificultad es personal y solo cambia la XP. En holds usamos los segundos registrados. En reps, sin duración, estimamos 3 s por rep para el juego.</p></details>`;
}
export function readEffort(form, duration = true) {
  const d = form.elements.difficulty?.value,
    t = form.elements.durationSeconds?.value;
  return {
    ...(d ? { difficulty: Number(d) } : {}),
    ...(duration && t ? { durationSeconds: Number(t) } : {}),
  };
}
