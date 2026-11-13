import { gateById, rankLabel } from "@/game/data";
import { passives, shadowCap, shadowStats } from "@/game/formulas";
import { useGame } from "@/game/store";

export function ShadowsPanel() {
  const save = useGame((s) => s.save);
  const toggle = useGame((s) => s.toggleDeploy);
  const cap = shadowCap(save.rank);
  const mods = passives(save.level);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="panel">
        <p className="eyebrow">Exército</p>
        <h2 className="mt-1 font-display text-2xl">Sombras</h2>
        <p className="mt-2 text-sm text-muted">
          Em campo {save.deployed.length}/{cap}. Elas atacam com você dentro dos portões. O rank limita quantas
          marcham ao mesmo tempo.
        </p>
      </header>
      {save.shadows.length === 0 && (
        <section className="panel">
          <p className="text-sm text-muted">
            Nenhuma sombra ajoelhou ainda. Derrube o chefe de um portão e extraia o que restar dele.
          </p>
        </section>
      )}
      <ul className="flex flex-col gap-2">
        {save.shadows.map((shadow) => {
          const gate = gateById(shadow.gateId);
          if (!gate) return null;
          const stats = shadowStats(shadow);
          const on = save.deployed.includes(shadow.gateId);
          const atk = Math.round(stats.atk * mods.shadowAtk);
          const hp = Math.round(stats.hp * mods.shadowHp);
          return (
            <li key={shadow.gateId} className="panel">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl">{gate.boss.name}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {gate.boss.role} · {rankLabel(gate.rank)} · nível {shadow.level}
                  </p>
                </div>
                <p className="text-sm text-muted">{on ? "Em campo" : "No vazio"}</p>
              </div>
              <p className="mt-2 text-sm text-muted">{gate.boss.lore}</p>
              <p className="mt-2 text-sm tabular-nums">
                Ataque {atk} · Vida {hp} · Defesa {stats.def}
              </p>
              <p className="mt-1 text-xs text-muted">Origem: {gate.name}</p>
              <button type="button" className="btn btn-primary mt-4 w-full sm:w-auto" onClick={() => toggle(shadow.gateId)}>
                {on ? "Recolher" : "Colocar em campo"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
