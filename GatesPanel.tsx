import { GATES, gateThreat, rankIndex, rankLabel } from "@/game/data";
import { combatPower } from "@/game/formulas";
import { useGame } from "@/game/store";
import { RANKS } from "@/game/types";
import { outlook } from "./ui";

export function GatesPanel() {
  const save = useGame((s) => s.save);
  const enter = useGame((s) => s.enterGate);
  const claim = useGame((s) => s.claimShadow);
  const power = combatPower(save);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <p className="eyebrow">Portões</p>
        <h2 className="mt-1 font-display text-2xl">Onde a escuridão tem dono</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Entre, limpe a sala e derrube o chefe. Se vencer, pode extraí-lo como sombra. Portões acima do seu rank
          permanecem fechados.
        </p>
      </header>
      {RANKS.map((rank) => {
        const gates = GATES.filter((gate) => gate.rank === rank);
        const locked = rankIndex(rank) > rankIndex(save.rank);
        return (
          <section key={rank} className="flex flex-col gap-2" style={{ opacity: locked ? 0.55 : 1 }}>
            <h3 className="font-display text-lg">{rankLabel(rank)}</h3>
            {gates.map((gate) => {
              const threat = gateThreat(gate);
              const owned = save.shadows.find((shadow) => shadow.gateId === gate.id);
              const banked = save.pending[gate.id] ?? 0;
              const canClaim = save.cleared.includes(gate.id) && (!owned || (banked > 0 && owned.level < 10));
              return (
                <article key={gate.id} className="panel">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-display text-xl">{gate.name}</h4>
                      <p className="mt-1 text-sm text-muted">{gate.place}</p>
                    </div>
                    <p className="text-sm text-muted">{locked ? "Fechado" : outlook(power, threat)}</p>
                  </div>
                  <p className="mt-3 text-sm">
                    Chefe: {gate.boss.name} · {gate.boss.role}
                  </p>
                  <p className="mt-1 text-sm text-muted">{gate.boss.lore}</p>
                  <p className="mt-2 text-xs text-muted tabular-nums">
                    Ameaça {threat} · seu poder {power}
                    {owned ? ` · sombra nível ${owned.level}` : save.cleared.includes(gate.id) ? " · chefe caído" : ""}
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button type="button" className="btn btn-primary flex-1" disabled={locked} onClick={() => enter(gate.id)}>
                      Entrar
                    </button>
                    {canClaim && (
                      <button type="button" className="btn btn-ghost flex-1" onClick={() => claim(gate.id)}>
                        {owned ? "Adensar sombra" : "Extrair sombra"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
