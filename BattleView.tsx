import { useState } from "react";
import { itemById, SKILLS } from "@/game/data";
import { useGame } from "@/game/store";
import type { Fighter } from "@/game/types";
import { Bar } from "./ui";

export function BattleView() {
  const battle = useGame((s) => s.battle);
  const save = useGame((s) => s.save);
  const act = useGame((s) => s.act);
  const finish = useGame((s) => s.finishBattle);
  const extract = useGame((s) => s.extract);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [target, setTarget] = useState<string | null>(null);

  if (!battle) return null;
  const chosen = target && battle.fighters.some((f) => f.id === target && f.hp > 0) ? target : battle.targetId;
  const enemies = battle.fighters.filter((f) => f.side === "enemy");
  const allies = battle.fighters.filter((f) => f.side === "ally");
  const skills = SKILLS.filter((skill) => skill.kind === "active" && skill.level <= battle.hunterLevel);
  const gateOwned = battle.gateId ? save.shadows.some((s) => s.gateId === battle.gateId) : false;
  const banked = battle.gateId ? (save.pending[battle.gateId] ?? 0) : 0;
  const shadow = battle.gateId ? save.shadows.find((s) => s.gateId === battle.gateId) : undefined;
  const canExtract =
    battle.phase === "victory" &&
    battle.kind === "gate" &&
    !!battle.gateId &&
    !battle.didExtract &&
    (!gateOwned || (banked > 0 && (shadow?.level ?? 1) < 10));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header>
        <p className="eyebrow">Combate · turno {battle.turn}</p>
        <h2 className="mt-1 font-display text-2xl">{battle.title}</h2>
      </header>

      <section className="grid gap-2">
        {enemies.map((fighter) => (
          <FighterCard
            key={fighter.id}
            fighter={fighter}
            selected={fighter.id === chosen && fighter.hp > 0}
            flash={battle.flashId === fighter.id}
            onSelect={
              battle.phase === "fight" && fighter.hp > 0 ? () => setTarget(fighter.id) : undefined
            }
          />
        ))}
      </section>

      <section className="panel">
        <p className="eyebrow">Registro</p>
        <ul className="mt-2 space-y-1 text-sm">
          {battle.log.slice(0, 7).map((line) => (
            <li key={line.id} className={line.tone === "bad" ? "text-blood" : line.tone === "good" || line.tone === "crit" ? "text-fg" : "text-muted"}>
              {line.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-2">
        {allies.map((fighter) => (
          <FighterCard key={fighter.id} fighter={fighter} flash={battle.flashId === fighter.id} />
        ))}
      </section>

      {battle.phase === "fight" && (
        <section className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-primary" onClick={() => act({ type: "attack", targetId: chosen })}>
            Atacar
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setSkillsOpen((open) => !open)}>
            Habilidade
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => act({ type: "defend" })}>
            Defender
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={battle.kind !== "gate"}
            onClick={() => act({ type: "flee" })}
          >
            Fugir
          </button>
          {skillsOpen &&
            skills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                className="btn btn-ghost col-span-2"
                onClick={() => {
                  act({ type: "skill", skillId: skill.id, targetId: chosen });
                  setSkillsOpen(false);
                }}
              >
                {skill.name} · {skill.mp} mana
              </button>
            ))}
        </section>
      )}

      {battle.phase !== "fight" && battle.rewards && (
        <section className="panel">
          <p className="eyebrow">{battle.phase === "victory" ? "Vitória" : "Fim"}</p>
          <h3 className="mt-1 font-display text-2xl">
            {battle.kind === "rank" ? "Prova superada" : battle.kind === "penalty" ? "Dívida paga" : "O portão cede"}
          </h3>
          {battle.phase === "victory" && (
            <ul className="mt-3 space-y-1 text-sm">
              <li className="tabular-nums">Experiência +{battle.rewards.xp}{save.penalty ? "" : ""}</li>
              {battle.rewards.essence > 0 && <li className="tabular-nums">Essência +{battle.rewards.essence}</li>}
              {battle.rewards.itemId && <li>Item: {itemById(battle.rewards.itemId)?.name}</li>}
              {battle.rewards.itemConverted && <li>A peça repetida virou essência.</li>}
              {battle.rewards.rankUp && <li>Novo rank: {battle.rewards.rankUp === "Monarch" ? "Monarca" : battle.rewards.rankUp}</li>}
              {battle.rewards.levelsGained > 0 && <li>Níveis ganhos: {battle.rewards.levelsGained}</li>}
            </ul>
          )}
          <div className="mt-4 flex flex-col gap-2">
            {canExtract && (
              <button type="button" className="btn btn-primary" onClick={extract}>
                {gateOwned ? "Adensar sombra" : "Extrair sombra"}
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={finish}>
              Continuar
            </button>
          </div>
        </section>
      )}

      {battle.phase !== "fight" && !battle.rewards && (
        <section className="panel">
          <h3 className="font-display text-2xl">{battle.phase === "fled" ? "Retirada" : "Derrota"}</h3>
          <p className="mt-2 text-sm text-muted">
            {battle.phase === "fled" ? "Nada foi ganho." : "O sistema não paga a quem cai."}
          </p>
          <button type="button" className="btn btn-primary mt-4 w-full" onClick={finish}>
            Continuar
          </button>
        </section>
      )}
    </div>
  );
}

function FighterCard({
  fighter,
  selected,
  flash,
  onSelect,
}: {
  fighter: Fighter;
  selected?: boolean;
  flash?: boolean;
  onSelect?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="font-medium">{fighter.name}</p>
          <p className="text-xs text-muted">{fighter.subtitle}</p>
        </div>
        <p className="text-sm tabular-nums text-muted">
          {fighter.hp}/{fighter.maxHp}
          {fighter.maxMp > 0 ? ` · ${fighter.mp} mana` : ""}
        </p>
      </div>
      <div className="mt-2">
        <Bar value={fighter.hp} max={fighter.maxHp} tone={fighter.side === "enemy" ? "blood" : "accent"} />
      </div>
    </>
  );
  const className = `inset text-left ${flash ? "flash" : ""} ${selected ? "outline outline-1 outline-accent" : ""}`;
  if (!onSelect) return <div className={className}>{body}</div>;
  return (
    <button type="button" className={className} onClick={onSelect}>
      {body}
    </button>
  );
}
