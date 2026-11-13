import { useState } from "react";
import { Plus } from "lucide-react";
import { itemById, nextRank, RANK_LEVEL, RANK_TITLE, rankLabel, SKILLS } from "@/game/data";
import { combatPower, derive, levelForNextRank, statLabel, xpToNext } from "@/game/formulas";
import { useGame } from "@/game/store";
import type { Slot, StatKey } from "@/game/types";
import { RANKS, STAT_KEYS } from "@/game/types";
import { Bar } from "./ui";

const SLOTS: { id: Slot; label: string }[] = [
  { id: "weapon", label: "Arma" },
  { id: "armor", label: "Armadura" },
  { id: "relic", label: "Relíquia" },
];

const STAT_HINT: Record<StatKey, string> = {
  str: "Ataque",
  vit: "Vida e defesa",
  agi: "Esquiva",
  int: "Mana",
  per: "Crítico",
};

export function StatusPanel() {
  const save = useGame((s) => s.save);
  const allocate = useGame((s) => s.allocate);
  const unequip = useGame((s) => s.unequip);
  const rename = useGame((s) => s.rename);
  const enterTrial = useGame((s) => s.enterTrial);
  const reset = useGame((s) => s.reset);
  const derived = derive(save);
  const need = levelForNextRank(save.rank);
  const upcoming = nextRank(save.rank);
  const ready = need != null && save.level >= need;
  const [confirm, setConfirm] = useState(false);
  const [name, setName] = useState(save.name);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <section className="panel">
        <p className="eyebrow">Caminho</p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {RANKS.map((rank) => {
            const current = rank === save.rank;
            const passed = RANKS.indexOf(rank) < RANKS.indexOf(save.rank);
            return (
              <div
                key={rank}
                className="inset min-w-24 shrink-0"
                data-current={current}
                style={{ opacity: passed || current ? 1 : 0.45 }}
              >
                <p className="font-display text-lg leading-none">{rank === "Monarch" ? "M" : rank}</p>
                <p className="mt-1 text-xs text-muted">{passed ? "Superado" : current ? "Agora" : `Nv. ${RANK_LEVEL[rank]}`}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-muted">{RANK_TITLE[save.rank]}</p>
      </section>

      <section className="panel">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Poder de combate</p>
            <p className="mt-1 font-display text-4xl tabular-nums">{combatPower(save)}</p>
          </div>
          <p className="text-sm text-muted tabular-nums">
            {save.xp}/{xpToNext(save.level)} XP para o próximo nível
          </p>
        </div>
        <Bar value={save.xp} max={xpToNext(save.level)} />
      </section>

      {ready && upcoming && (
        <section className="panel flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Prova de rank</p>
            <h2 className="mt-1 font-display text-2xl">Subir para {rankLabel(upcoming)}</h2>
            <p className="mt-1 text-sm text-muted">Um combate. Sem fuga. A escuridão exige prova.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={enterTrial}>
            Enfrentar
          </button>
        </section>
      )}
      {!ready && need != null && (
        <section className="panel">
          <p className="eyebrow">Próxima prova</p>
          <p className="mt-2 text-sm text-muted">
            O rank {upcoming ? rankLabel(upcoming) : ""} abre no nível {need}. Faltam {Math.max(0, need - save.level)}{" "}
            níveis.
          </p>
        </section>
      )}

      <section className="panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl">Atributos</h2>
          <p className="text-sm tabular-nums text-muted">{save.unspent} pontos</p>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {STAT_KEYS.map((key) => (
            <li key={key} className="inset flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{statLabel(key)}</p>
                <p className="text-xs text-muted">{STAT_HINT[key]}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 text-right font-display text-xl tabular-nums">{save.stats[key]}</span>
                <button
                  type="button"
                  className="btn btn-ghost px-3"
                  disabled={save.unspent <= 0}
                  onClick={() => allocate(key)}
                  aria-label={`Aumentar ${statLabel(key)}`}
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <Stat label="Vida" value={derived.maxHp} />
          <Stat label="Mana" value={derived.maxMp} />
          <Stat label="Ataque" value={derived.atk} />
          <Stat label="Defesa" value={derived.def} />
          <Stat label="Crítico" value={`${Math.round(derived.crit * 100)}%`} />
          <Stat label="Esquiva" value={`${Math.round(derived.dodge * 100)}%`} />
        </dl>
      </section>

      <section className="panel">
        <h2 className="font-display text-xl">Equipamento</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {SLOTS.map((slot) => {
            const id = save.equipment[slot.id];
            const item = id ? itemById(id) : undefined;
            return (
              <li key={slot.id} className="inset">
                <p className="text-xs text-muted">{slot.label}</p>
                <p className="mt-1 font-medium">{item ? item.name : "Vazio"}</p>
                {item && (
                  <button type="button" className="btn btn-ghost mt-3 w-full" onClick={() => unequip(slot.id)}>
                    Remover
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel">
        <h2 className="font-display text-xl">Habilidades</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {SKILLS.map((skill) => {
            const owned = save.level >= skill.level;
            return (
              <li key={skill.id} className="inset" style={{ opacity: owned ? 1 : 0.5 }}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium">{skill.name}</p>
                  <p className="text-xs text-muted">{owned ? (skill.kind === "active" ? `${skill.mp} mana` : "Passiva") : `Nível ${skill.level}`}</p>
                </div>
                <p className="mt-1 text-sm text-muted">{skill.desc}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel">
        <h2 className="font-display text-xl">Registro</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {save.feed.slice(0, 6).map((line, index) => (
            <li key={`${line}-${index}`}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2 className="font-display text-xl">Nome</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input className="field" value={name} maxLength={18} onChange={(event) => setName(event.target.value)} />
          <button type="button" className="btn btn-ghost" onClick={() => rename(name)}>
            Salvar
          </button>
        </div>
        <div className="mt-4">
          {confirm ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-danger" onClick={reset}>
                Apagar progresso
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)}>
                Cancelar
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={() => setConfirm(true)}>
              Recomeçar jornada
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="inset">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-display text-lg tabular-nums">{value}</dd>
    </div>
  );
}
