import { useEffect, useState } from "react";
import {
  DoorOpen,
  Dumbbell,
  Gem,
  ScrollText,
  Users,
} from "lucide-react";
import { rankLabel } from "@/game/data";
import { combatPower, xpToNext } from "@/game/formulas";
import { useGame } from "@/game/store";
import type { Moment } from "@/game/types";
import { BattleView } from "./BattleView";
import { GatesPanel } from "./GatesPanel";
import { QuestsPanel } from "./QuestsPanel";
import { ShadowsPanel } from "./ShadowsPanel";
import { ShopPanel } from "./ShopPanel";
import { StatusPanel } from "./StatusPanel";
import { Bar } from "./ui";

type Tab = "status" | "quests" | "gates" | "shadows" | "shop";

const TABS: { id: Tab; label: string; icon: typeof ScrollText }[] = [
  { id: "status", label: "Status", icon: ScrollText },
  { id: "quests", label: "Missões", icon: Dumbbell },
  { id: "gates", label: "Portões", icon: DoorOpen },
  { id: "shadows", label: "Sombras", icon: Users },
  { id: "shop", label: "Loja", icon: Gem },
];

export function MonarcaApp() {
  const ready = useGame((s) => s.ready);
  const boot = useGame((s) => s.boot);
  const accepted = useGame((s) => s.save.accepted);
  const battle = useGame((s) => s.battle);
  const [tab, setTab] = useState<Tab>("status");

  useEffect(() => {
    boot();
  }, [boot]);

  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <p className="eyebrow">Sistema</p>
      </main>
    );
  }

  if (!accepted) return <Oath />;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl">
      {!battle && (
        <aside className="sticky top-0 hidden h-dvh w-52 shrink-0 flex-col gap-1 border-r border-line p-4 md:flex">
          <p className="eyebrow px-3 pb-3">Monarca</p>
          {TABS.map((item) => (
            <NavButton key={item.id} item={item} active={tab === item.id} onClick={() => setTab(item.id)} />
          ))}
        </aside>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <PenaltyStrip />
        <main className={battle ? "px-4 py-4 md:px-8" : "px-4 py-4 pb-28 md:px-8 md:pb-10"}>
          {battle ? <BattleView /> : <TabBody tab={tab} />}
        </main>
      </div>
      {!battle && (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg md:hidden">
          <div className="mx-auto grid max-w-5xl grid-cols-5 px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
            {TABS.map((item) => (
              <NavButton key={item.id} item={item} active={tab === item.id} onClick={() => setTab(item.id)} compact />
            ))}
          </div>
        </nav>
      )}
      <MomentHost />
      <Toast />
    </div>
  );
}

function TabBody({ tab }: { tab: Tab }) {
  if (tab === "quests") return <QuestsPanel />;
  if (tab === "gates") return <GatesPanel />;
  if (tab === "shadows") return <ShadowsPanel />;
  if (tab === "shop") return <ShopPanel />;
  return <StatusPanel />;
}

function NavButton({
  item,
  active,
  onClick,
  compact,
}: {
  item: (typeof TABS)[number];
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      className={compact ? "nav-btn flex flex-col items-center justify-center gap-1 px-1" : "nav-btn flex items-center gap-3 px-3 text-left"}
      data-active={active}
      onClick={onClick}
    >
      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      <span className="text-xs font-medium">{item.label}</span>
    </button>
  );
}

function TopBar() {
  const save = useGame((s) => s.save);
  const needed = xpToNext(save.level);
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg px-4 py-3 md:px-8">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Sistema</p>
          <h1 className="truncate font-display text-2xl leading-none">{save.name}</h1>
        </div>
        <div className="text-right">
          <p className="font-display text-lg leading-none">{rankLabel(save.rank)}</p>
          <p className="mt-1 text-sm text-muted tabular-nums">Nível {save.level}</p>
        </div>
      </div>
      <div className="mt-3">
        <Bar value={save.xp} max={needed} />
        <div className="mt-2 flex justify-between text-sm text-muted tabular-nums">
          <span>
            XP {save.xp}/{needed}
          </span>
          <span>Poder {combatPower(save)}</span>
          <span>Essência {save.essence}</span>
        </div>
      </div>
    </header>
  );
}

function PenaltyStrip() {
  const penalty = useGame((s) => s.save.penalty);
  const enter = useGame((s) => s.enterPenalty);
  const battle = useGame((s) => s.battle);
  if (!penalty || battle) return null;
  return (
    <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blood-dim bg-blood-dim px-4 py-3 md:mx-8">
      <p className="text-sm text-fg">Missões diárias em atraso. A zona de penalidade está aberta.</p>
      <button type="button" className="btn btn-danger" onClick={enter}>
        Entrar
      </button>
    </div>
  );
}

function Oath() {
  const accept = useGame((s) => s.accept);
  const [name, setName] = useState("Caçador");
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="panel rise w-full max-w-md">
        <p className="eyebrow">Sistema</p>
        <h1 className="mt-3 font-display text-4xl leading-none">Monarca</h1>
        <p className="mt-4 text-muted">
          Uma janela que só você vê. Rank E, nível 1. A escuridão ainda não obedece — ela apenas observa
          quem aceita ficar mais forte.
        </p>
        <label className="mt-6 block text-sm text-muted" htmlFor="hunter-name">
          Nome
        </label>
        <input
          id="hunter-name"
          className="field mt-2"
          value={name}
          maxLength={18}
          onChange={(event) => setName(event.target.value)}
        />
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => accept(name)}>
          Aceitar o sistema
        </button>
      </div>
    </main>
  );
}

function MomentHost() {
  const moment = useGame((s) => s.moments[0]);
  const dismiss = useGame((s) => s.dismissMoment);
  if (!moment) return null;
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-bg/80 p-4">
      <div className="panel rise w-full max-w-md">
        <MomentBody moment={moment} />
        <button type="button" className="btn btn-primary mt-5 w-full" onClick={dismiss}>
          Continuar
        </button>
      </div>
    </div>
  );
}

function MomentBody({ moment }: { moment: Moment }) {
  if (moment.kind === "level") {
    return (
      <>
        <p className="eyebrow">Nível</p>
        <h2 className="mt-2 font-display text-3xl tabular-nums">
          {moment.from} para {moment.to}
        </h2>
        <p className="mt-3 text-muted">Novos pontos de atributo esperam no status.</p>
        {moment.skills.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {moment.skills.map((skill) => (
              <li key={skill}>Habilidade despertada: {skill}</li>
            ))}
          </ul>
        )}
      </>
    );
  }
  if (moment.kind === "rank") {
    return (
      <>
        <p className="eyebrow">Prova</p>
        <h2 className="mt-2 font-display text-3xl">{rankLabel(moment.rank)}</h2>
        <p className="mt-3 text-muted">Portões mais fundos se abrem. Oito pontos foram concedidos.</p>
      </>
    );
  }
  return (
    <>
      <p className="eyebrow">Extração</p>
      <h2 className="mt-2 font-display text-3xl">{moment.name}</h2>
      <p className="mt-3 text-muted">
        {moment.strengthened
          ? "A sombra que já era sua aceitou mais escuridão."
          : "O que você venceu agora luta ao seu lado."}
      </p>
    </>
  );
}

function Toast() {
  const toast = useGame((s) => s.toast);
  const clear = useGame((s) => s.clearToast);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(clear, 2800);
    return () => window.clearTimeout(id);
  }, [toast, clear]);
  if (!toast) return null;
  return (
    <button
      type="button"
      className="fixed top-3 left-1/2 z-40 w-[min(100%-2rem,24rem)] -translate-x-1/2 rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm"
      onClick={clear}
    >
      {toast}
    </button>
  );
}
