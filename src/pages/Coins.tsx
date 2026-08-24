import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CHECKIN_REWARDS,
  checkInToday,
  hasCheckedToday,
  rewardForDay,
  streak,
} from "../lib/checkin";
import { getCoins } from "../lib/coins";
import { formatBRL } from "../lib/format";

export default function Coins() {
  const [balance, setBalance] = useState(getCoins());
  const [done, setDone] = useState(hasCheckedToday());
  const [streakN, setStreakN] = useState(streak());

  const dayToday = Math.min(done ? streakN : streakN + 1, 7);

  function onCheckIn() {
    const reward = checkInToday();
    if (reward !== null) {
      setBalance(getCoins());
      setDone(true);
      setStreakN(streak());
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-32 pb-12 sm:pt-28">
      <h1 className="text-2xl font-black text-ink">Moedas de fidelidade</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Ganhe 1 moeda por real gasto e use até 5% do total no checkout.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[300px_1fr]">
        <section className="card p-5">
          <p className="text-xs font-black uppercase tracking-wide text-ink-soft">
            Seu saldo
          </p>
          <p className="mt-2 text-4xl font-black text-brand">
            🪙 {balance}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            equivalem a {formatBRL(balance)} em compras
          </p>
          <Link
            to="/carrinho"
            className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Usar moedas no carrinho
          </Link>
        </section>

        <section className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-black text-ink">Check-in diário</h2>
            <span className="text-xs font-bold text-ink-soft">
              sequência: {streakN} dia{streakN === 1 ? "" : "s"}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {CHECKIN_REWARDS.map((reward, i) => {
              const day = i + 1;
              const achieved = day <= streakN;
              const isToday = !achieved && day === dayToday;
              return (
                <div
                  key={day}
                  className={`rounded-md border px-2 py-3 text-center ${
                    achieved
                      ? "border-ship bg-page"
                      : isToday
                        ? "border-brand bg-brand-soft"
                        : "border-line bg-surface"
                  }`}
                >
                  <p
                    className={`text-[11px] font-bold ${
                      achieved ? "text-ship" : isToday ? "text-brand" : "text-ink-soft"
                    }`}
                  >
                    {achieved ? "✓ Dia" : isToday ? "Hoje" : "Dia"} {day}
                  </p>
                  <p className="mt-1 text-sm font-black text-ink">
                    +{reward}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-ink-soft">
              A recompensa cresce a cada dia seguido. Perdeu um dia? A
              sequência recomeça do dia 1.
            </p>
            <button
              onClick={onCheckIn}
              disabled={done}
              className="shrink-0 rounded-md bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-40"
            >
              {done
                ? "Concluído ✓"
                : `Fazer check-in (+${rewardForDay(dayToday)})`}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
