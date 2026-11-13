import { itemById, ITEMS, rankIndex, rankLabel } from "@/game/data";
import { useGame } from "@/game/store";
import type { ItemDef } from "@/game/data";
import type { Slot } from "@/game/types";

const SLOT_LABEL: Record<Slot, string> = {
  weapon: "Arma",
  armor: "Armadura",
  relic: "Relíquia",
};

export function ShopPanel() {
  const save = useGame((s) => s.save);
  const buy = useGame((s) => s.buy);
  const equip = useGame((s) => s.equip);
  const visible = ITEMS.filter((item) => rankIndex(item.rank) <= rankIndex(save.rank) + 1);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="panel">
        <p className="eyebrow">Loja do abismo</p>
        <h2 className="mt-1 font-display text-2xl">O que aceita a sua mão</h2>
        <p className="mt-2 text-sm text-muted">
          Essência {save.essence}. Cada peça foi nomeada por quem já deixou a luz para trás. Itens acima do seu rank
          apenas se deixam ver.
        </p>
      </header>
      <ul className="flex flex-col gap-2">
        {visible.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </ul>
      <section className="panel">
        <h3 className="font-display text-lg">Inventário</h3>
        {save.inventory.length === 0 && <p className="mt-2 text-sm text-muted">Nada guardado ainda.</p>}
        <ul className="mt-3 flex flex-col gap-2">
          {save.inventory.map((id) => {
            const item = itemById(id);
            if (!item) return null;
            const worn = save.equipment[item.slot] === item.id;
            return (
              <li key={id} className="inset flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted">
                    {SLOT_LABEL[item.slot]} · {rankLabel(item.rank)}
                  </p>
                </div>
                <button type="button" className="btn btn-ghost" disabled={worn} onClick={() => equip(item.id)}>
                  {worn ? "Equipada" : "Equipar"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function ItemRow({ item }: { item: ItemDef }) {
  const save = useGame((s) => s.save);
  const buy = useGame((s) => s.buy);
  const locked = rankIndex(item.rank) > rankIndex(save.rank);
  const owned = save.inventory.includes(item.id);
  return (
    <li className="panel" style={{ opacity: locked ? 0.6 : 1 }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">
            {SLOT_LABEL[item.slot]} · {rankLabel(item.rank)}
          </p>
          <h3 className="mt-1 font-display text-xl">{item.name}</h3>
        </div>
        <p className="text-sm tabular-nums text-muted">{item.price} essência</p>
      </div>
      <p className="mt-2 text-sm text-muted">{item.lore}</p>
      <p className="mt-2 text-sm tabular-nums">{bonusLine(item)}</p>
      <button
        type="button"
        className="btn btn-primary mt-4 w-full sm:w-auto"
        disabled={locked || owned || save.essence < item.price}
        onClick={() => buy(item.id)}
      >
        {locked ? "Rank insuficiente" : owned ? "Já é seu" : "Comprar"}
      </button>
    </li>
  );
}

function bonusLine(item: ItemDef): string {
  const parts: string[] = [];
  if (item.atk) parts.push(`Ataque +${item.atk}`);
  if (item.def) parts.push(`Defesa +${item.def}`);
  if (item.hp) parts.push(`Vida +${item.hp}`);
  if (item.mp) parts.push(`Mana +${item.mp}`);
  if (item.crit) parts.push(`Crítico +${Math.round(item.crit * 100)}%`);
  return parts.join(" · ");
}
