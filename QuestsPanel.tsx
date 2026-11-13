import { useState } from "react";
import { CUSTOM_CAP, PUSH_GOAL, RUN_GOAL, SIT_GOAL, TIER_LABEL } from "@/game/data";
import { physicalDone, questXp } from "@/game/formulas";
import { useGame } from "@/game/store";
import type { QuestTier } from "@/game/types";

const TIERS: QuestTier[] = ["facil", "media", "dificil", "pesadelo"];

export function QuestsPanel() {
  const save = useGame((s) => s.save);
  const tap = useGame((s) => s.tapDaily);
  const create = useGame((s) => s.createQuest);
  const complete = useGame((s) => s.completeQuest);
  const remove = useGame((s) => s.removeQuest);
  const [title, setTitle] = useState("");
  const [tier, setTier] = useState<QuestTier>("media");
  const open = save.quests.filter((quest) => !quest.done);
  const done = save.quests.filter((quest) => quest.done);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <section className="panel">
        <p className="eyebrow">Obrigatórias</p>
        <h2 className="mt-1 font-display text-2xl">Missões do dia</h2>
        <p className="mt-2 text-sm text-muted">
          O sistema cobra isto todo dia. Se o dia virar sem as três físicas, a penalidade abre.
          {save.penalty ? " Há uma penalidade ativa agora." : ""}
        </p>
        <div className="mt-4 grid gap-2">
          <Drill
            label="Flexões"
            value={save.daily.push}
            goal={PUSH_GOAL}
            onTap={() => tap("push")}
          />
          <Drill label="Abdominais" value={save.daily.sit} goal={SIT_GOAL} onTap={() => tap("sit")} />
          <Drill label="Corrida" value={save.daily.run} goal={RUN_GOAL} onTap={() => tap("run")} />
          <div className="inset flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">Caça do dia</p>
              <p className="text-xs text-muted">Feche qualquer portão.</p>
            </div>
            <p className="text-sm text-muted">{save.daily.hunt ? "Cumprida" : "Aberta"}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">
          {save.daily.bonusClaimed
            ? "O bônus de hoje já foi pago."
            : physicalDone(save.daily) && save.daily.hunt
              ? "Bônus pronto."
              : "Completar as três físicas e a caça rende um bônus."}
        </p>
      </section>

      <section className="panel">
        <p className="eyebrow">Suas ordens</p>
        <h2 className="mt-1 font-display text-2xl">Missões criadas</h2>
        <p className="mt-2 text-sm text-muted">
          Até {CUSTOM_CAP} por dia dão experiência. Hoje: {save.daily.customClears}/{CUSTOM_CAP}.
        </p>
        <form
          className="mt-4 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            create(title, tier);
            setTitle("");
          }}
        >
          <input
            className="field"
            placeholder="Nome da missão"
            value={title}
            maxLength={60}
            onChange={(event) => setTitle(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TIERS.map((item) => (
              <button
                key={item}
                type="button"
                className={item === tier ? "btn btn-primary" : "btn btn-ghost"}
                onClick={() => setTier(item)}
              >
                {TIER_LABEL[item]}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">Recompensa prevista: {questXp(tier, save.level)} XP</p>
          <button type="submit" className="btn btn-primary">
            Criar missão
          </button>
        </form>
        <ul className="mt-4 flex flex-col gap-2">
          {open.length === 0 && <li className="text-sm text-muted">Nenhuma missão aberta.</li>}
          {open.map((quest) => (
            <li key={quest.id} className="inset">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{quest.title}</p>
                  <p className="text-xs text-muted">
                    {TIER_LABEL[quest.tier]} · {questXp(quest.tier, save.level)} XP
                  </p>
                </div>
                <button type="button" className="btn btn-ghost" onClick={() => remove(quest.id)} aria-label="Apagar missão">
                  Apagar
                </button>
              </div>
              <button type="button" className="btn btn-primary mt-3 w-full" onClick={() => complete(quest.id)}>
                Concluir
              </button>
            </li>
          ))}
        </ul>
        {done.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted">Concluídas</p>
            <ul className="mt-2 space-y-1 text-sm text-faint">
              {done.slice(0, 8).map((quest) => (
                <li key={quest.id} className="flex justify-between gap-3">
                  <span>{quest.title}</span>
                  <button type="button" className="text-muted" onClick={() => remove(quest.id)}>
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function Drill({ label, value, goal, onTap }: { label: string; value: number; goal: number; onTap: () => void }) {
  const finished = value >= goal;
  return (
    <div className="inset">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{label}</p>
        <p className="text-sm tabular-nums text-muted">
          {Math.min(value, goal)}/{goal}
        </p>
      </div>
      <div className="bar mt-2">
        <span className="bar-accent" style={{ width: `${Math.min(100, (value / goal) * 100)}%` }} />
      </div>
      <button type="button" className="btn btn-primary mt-3 w-full" disabled={finished} onClick={onTap}>
        {finished ? "Cumprida" : "Registrar"}
      </button>
    </div>
  );
}
