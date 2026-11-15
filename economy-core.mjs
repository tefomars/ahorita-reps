import { gameSummary } from "./game-core.mjs";
import { allJournalEntries, skillContributions } from "./skills-core.mjs";
import { TITLES, RARITIES } from "./title-catalog.mjs";
export const CHEST_PRICE = 100;
function daily(state, day) {
  const rows = [
      ...(state.days[day]?.entries ?? []),
      ...skillContributions(state, day),
    ],
    goals = state.days[day]?.goals ?? state.goals;
  return ["push", "pull", "legs"].map((group) => {
    const es = rows.filter((e) => e.group === group),
      count =
        group === "legs"
          ? Math.min(
              ...["left", "right"].map((side) =>
                es
                  .filter(
                    (e) => e.side !== (side === "left" ? "right" : "left"),
                  )
                  .reduce((n, e) => n + e.reps, 0),
              ),
            )
          : es.reduce((n, e) => n + e.reps, 0),
      goal = goals[group],
      quarter = goal > 0 ? Math.min(4, Math.floor((count * 4) / goal)) : 0;
    return { group, goal, count, quarter, coins: quarter * 5 };
  });
}
export function wallet(state, today) {
  const game = gameSummary(state, today),
    achievements = game.achievementRewards,
    days = [...new Set(allJournalEntries(state, today).map((e) => e.day))];
  const goalCoins = days.reduce(
      (n, d) => n + daily(state, d).reduce((a, x) => a + x.coins, 0),
      0,
    ),
    levelCoins = 10 * (game.level - 1) + 25 * Math.floor(game.level / 5),
    practiceCoins = days.length * 5,
    earned = achievements.coins + goalCoins + levelCoins + practiceCoins,
    spent = (state.economy?.rolls ?? []).reduce(
      (n, r) => n + r.price - r.refund,
      0,
    );
  return {
    balance: earned - spent,
    earned,
    spent,
    achievementCoins: achievements.coins,
    goalCoins,
    levelCoins,
    practiceCoins,
    daily: daily(state, today),
    game,
    achievements,
  };
}
export function randomInt(max) {
  if (!Number.isInteger(max) || max < 1 || max > 2 ** 32)
    throw Error("Rango inválido.");
  const a = new Uint32Array(1),
    limit = Math.floor(2 ** 32 / max) * max;
  do {
    crypto.getRandomValues(a);
  } while (a[0] >= limit);
  return a[0] % max;
}
export function titleForTicket(ticket, index = 0, theme = "all") {
  if (!Number.isInteger(ticket) || ticket < 0 || ticket >= 100000)
    throw Error("Ticket inválido.");
  let sum = 0;
  const rarity = RARITIES.find((r) => (sum += r.tickets) > ticket);
  const pool = TITLES.filter(
    (t) => t.rarity === rarity.id && (theme === "all" || t.theme === theme),
  );
  if (!pool.length) throw Error("Tema inválido.");
  return pool[index % pool.length];
}
export function buyChest(
  state,
  today,
  {
    theme = "all",
    rng = randomInt,
    now = Date.now(),
    id = crypto.randomUUID(),
  } = {},
) {
  if (!["all", "dental", "minecraft", "deepwoken"].includes(theme))
    throw Error("Elige un tema válido.");
  if (wallet(state, today).balance < CHEST_PRICE)
    throw Error("Necesitas 100 monedas para abrir este cofre.");
  const ticket = rng(100000),
    rarity = titleForTicket(ticket, 0, theme).rarity,
    pool = TITLES.filter(
      (t) => t.rarity === rarity && (theme === "all" || t.theme === theme),
    ),
    title = pool[rng(pool.length)];
  const duplicate = state.economy.rolls.some((r) => r.titleId === title.id),
    receipt = {
      id,
      at: now,
      titleId: title.id,
      price: 100,
      refund: duplicate ? 25 : 0,
    };
  if (state.economy.rolls.some((r) => r.id === id))
    throw Error("Esta apertura ya está guardada.");
  state.economy.rolls.push(receipt);
  return { title, receipt, duplicate };
}
