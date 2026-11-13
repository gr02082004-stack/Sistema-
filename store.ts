import { create } from "zustand";
import { startGate, startPenalty, startRankTrial, step, type Action } from "./combat";
import {
  CUSTOM_CAP,
  gateById,
  itemById,
  ITEMS,
  PUSH_GOAL,
  rankIndex,
  RUN_GOAL,
  SAVE_KEY,
  SIT_GOAL,
  nextRank,
} from "./data";
import {
  addFeed,
  bumpStat,
  defaultSave,
  freshDaily,
  gateXpMult,
  grantXp,
  levelForNextRank,
  passives,
  physicalDone,
  questXp,
  rollDaily,
  shadowCap,
  xpToNext,
} from "./formulas";
import type { Battle, BattleRewards, Moment, QuestTier, Save, Slot, StatKey } from "./types";

type GameState = {
  ready: boolean;
  save: Save;
  battle: Battle | null;
  moments: Moment[];
  toast: string | null;
  boot: () => void;
  accept: (name: string) => void;
  rename: (name: string) => void;
  allocate: (key: StatKey) => void;
  tapDaily: (kind: "push" | "sit" | "run") => void;
  createQuest: (title: string, tier: QuestTier) => void;
  completeQuest: (id: string) => void;
  removeQuest: (id: string) => void;
  buy: (itemId: string) => void;
  equip: (itemId: string) => void;
  unequip: (slot: Slot) => void;
  toggleDeploy: (gateId: string) => void;
  enterGate: (gateId: string) => void;
  enterTrial: () => void;
  enterPenalty: () => void;
  act: (action: Action) => void;
  finishBattle: () => void;
  extract: () => void;
  claimShadow: (gateId: string) => void;
  dismissMoment: () => void;
  clearToast: () => void;
  reset: () => void;
};

function writeSave(save: Save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* private mode or quota — keep the session in memory */
  }
}

function readSave(): Save {
  const base = defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<Save>;
    if (!parsed || parsed.version !== 1) return base;
    return {
      ...base,
      ...parsed,
      stats: { ...base.stats, ...parsed.stats },
      equipment: { ...base.equipment, ...parsed.equipment },
        daily: {
          ...freshDaily(),
          ...parsed.daily,
          date: parsed.daily?.date || base.daily.date,
          gateClears: parsed.daily?.gateClears ?? {},
        },
      inventory: parsed.inventory ?? [],
      shadows: parsed.shadows ?? [],
      deployed: parsed.deployed ?? [],
      cleared: parsed.cleared ?? [],
      pending: parsed.pending ?? {},
      quests: parsed.quests ?? [],
      feed: parsed.feed ?? base.feed,
    };
  } catch {
    return base;
  }
}

function withBonus(save: Save): { save: Save; skills: string[]; levels: number; from: number } {
  if (save.daily.bonusClaimed || !physicalDone(save.daily) || !save.daily.hunt) {
    return { save, skills: [], levels: 0, from: save.level };
  }
  const granted = grantXp(save, 80);
  const next = addFeed(
    {
      ...granted.save,
      essence: granted.save.essence + 45,
      daily: { ...granted.save.daily, bonusClaimed: true },
    },
    "As missões do dia fecharam. O sistema paga o bônus.",
  );
  return { save: next, skills: granted.skills, levels: granted.levelsGained, from: granted.from };
}

function pushMoments(moments: Moment[], from: number, to: number, skills: string[], extra?: Moment): Moment[] {
  const next = [...moments];
  if (to > from) next.push({ kind: "level", from, to, skills });
  if (extra) next.push(extra);
  return next.slice(0, 4);
}

export const useGame = create<GameState>((set, get) => {
  const commit = (save: Save, patch: Partial<GameState> = {}) => {
    writeSave(save);
    set({ save, ...patch });
  };

  const applyGrant = (save: Save, xp: number, essence = 0) => {
    const granted = grantXp({ ...save, essence: save.essence + essence }, xp);
    const bonus = withBonus(granted.save);
    const skills = [...granted.skills, ...bonus.skills];
    const from = granted.from;
    const to = bonus.save.level;
    return { save: bonus.save, from, to, skills };
  };

  return {
    ready: false,
    save: defaultSave(),
    battle: null,
    moments: [],
    toast: null,

    boot: () => {
      if (get().ready) return;
      const rolled = rollDaily(readSave());
      writeSave(rolled);
      set({ save: rolled, ready: true });
    },

    accept: (name) => {
      const clean = name.trim().slice(0, 18) || "Caçador";
      const save = addFeed({ ...get().save, accepted: true, name: clean }, `${clean} aceita o sistema.`);
      commit(save);
    },

    rename: (name) => {
      const clean = name.trim().slice(0, 18);
      if (!clean) return;
      commit({ ...get().save, name: clean });
    },

    allocate: (key) => {
      const save = get().save;
      if (save.unspent <= 0) return;
      commit({ ...save, unspent: save.unspent - 1, stats: bumpStat(save.stats, key) });
    },

    tapDaily: (kind) => {
      const save = get().save;
      const goal = kind === "push" ? PUSH_GOAL : kind === "sit" ? SIT_GOAL : RUN_GOAL;
      const current = save.daily[kind];
      if (current >= goal) return;
      const daily = { ...save.daily, [kind]: current + 1 };
      let next: Save = { ...save, daily };
      let from = save.level;
      let skills: string[] = [];
      if (current + 1 === goal) {
        const xp = kind === "run" ? 48 : 36;
        const label = kind === "push" ? "Flexões" : kind === "sit" ? "Abdominais" : "Corrida";
        const applied = applyGrant(next, xp);
        next = addFeed(applied.save, `${label} concluídas. O sistema anota o esforço.`);
        from = applied.from;
        skills = applied.skills;
      }
      const moments = pushMoments(get().moments, from, next.level, skills);
      commit(next, { moments });
    },

    createQuest: (title, tier) => {
      const clean = title.trim().slice(0, 60);
      if (clean.length < 2) {
        set({ toast: "Dê um nome à missão." });
        return;
      }
      const save = get().save;
      if (save.quests.filter((q) => !q.done).length >= 12) {
        set({ toast: "Conclua alguma missão antes de abrir outra." });
        return;
      }
      const quest = { id: crypto.randomUUID(), title: clean, tier, done: false };
      commit({ ...save, quests: [quest, ...save.quests].slice(0, 40) });
    },

    completeQuest: (id) => {
      const save = get().save;
      const quest = save.quests.find((q) => q.id === id);
      if (!quest || quest.done) return;
      if (save.daily.customClears >= CUSTOM_CAP) {
        set({ toast: "O sistema recusa mais missões livres até amanhã." });
        return;
      }
      const applied = applyGrant(
        {
          ...save,
          quests: save.quests.map((q) => (q.id === id ? { ...q, done: true } : q)),
          daily: { ...save.daily, customClears: save.daily.customClears + 1 },
        },
        questXp(quest.tier, save.level),
        quest.tier === "pesadelo" ? 30 : quest.tier === "dificil" ? 16 : 8,
      );
      const next = addFeed(applied.save, `Missão cumprida: ${quest.title}.`);
      commit(next, { moments: pushMoments(get().moments, applied.from, next.level, applied.skills) });
    },

    removeQuest: (id) => {
      const save = get().save;
      commit({ ...save, quests: save.quests.filter((q) => q.id !== id) });
    },

    buy: (itemId) => {
      const save = get().save;
      const item = itemById(itemId);
      if (!item) return;
      if (rankIndex(item.rank) > rankIndex(save.rank)) {
        set({ toast: "O abismo ainda não aceita a sua mão nesse rank." });
        return;
      }
      if (save.inventory.includes(item.id)) {
        set({ toast: "Você já carrega isso." });
        return;
      }
      if (save.essence < item.price) {
        set({ toast: "Essência insuficiente." });
        return;
      }
      const equipment = { ...save.equipment };
      if (!equipment[item.slot]) equipment[item.slot] = item.id;
      const next = addFeed(
        { ...save, essence: save.essence - item.price, inventory: [...save.inventory, item.id], equipment },
        `${item.name} passa a ser seu.`,
      );
      commit(next);
    },

    equip: (itemId) => {
      const save = get().save;
      const item = itemById(itemId);
      if (!item || !save.inventory.includes(item.id)) return;
      commit({ ...save, equipment: { ...save.equipment, [item.slot]: item.id } });
    },

    unequip: (slot) => {
      const save = get().save;
      commit({ ...save, equipment: { ...save.equipment, [slot]: null } });
    },

    toggleDeploy: (gateId) => {
      const save = get().save;
      if (!save.shadows.some((s) => s.gateId === gateId)) return;
      if (save.deployed.includes(gateId)) {
        commit({ ...save, deployed: save.deployed.filter((id) => id !== gateId) });
        return;
      }
      if (save.deployed.length >= shadowCap(save.rank)) {
        set({ toast: "O seu rank não sustenta mais sombras em campo." });
        return;
      }
      commit({ ...save, deployed: [...save.deployed, gateId] });
    },

    enterGate: (gateId) => {
      const save = get().save;
      if (save.penalty) {
        set({ toast: "A penalidade vem antes de qualquer portão." });
        return;
      }
      const gate = gateById(gateId);
      if (!gate) return;
      if (rankIndex(gate.rank) > rankIndex(save.rank)) {
        set({ toast: "Rank insuficiente. O portão permanece fechado." });
        return;
      }
      const battle = startGate(save, gateId);
      if (battle) set({ battle, toast: null });
    },

    enterTrial: () => {
      const save = get().save;
      if (save.penalty) {
        set({ toast: "A penalidade vem antes da prova." });
        return;
      }
      const need = levelForNextRank(save.rank);
      if (need == null) {
        set({ toast: "Não há rank acima do Monarca." });
        return;
      }
      if (save.level < need) {
        set({ toast: `A prova abre no nível ${need}.` });
        return;
      }
      const battle = startRankTrial(save);
      if (battle) set({ battle, toast: null });
    },

    enterPenalty: () => {
      if (!get().save.penalty) return;
      set({ battle: startPenalty(get().save), toast: null });
    },

    act: (action) => {
      const battle = get().battle;
      if (!battle || battle.phase !== "fight") return;
      let next = step(battle, action);
      if (next.phase === "fight" || next.resolved) {
        set({ battle: next });
        return;
      }
      next = { ...next, resolved: true };
      if (next.phase === "victory") {
        const resolved = resolveVictory(get().save, next);
        commit(resolved.save, {
          battle: { ...next, rewards: resolved.rewards },
          moments: resolved.moments,
        });
        return;
      }
      set({ battle: next });
    },

    finishBattle: () => set({ battle: null }),

    extract: () => {
      const { battle } = get();
      if (!battle || battle.phase !== "victory" || battle.kind !== "gate" || !battle.gateId || battle.didExtract) return;
      const result = takeShadow(get().save, battle.gateId);
      if (!result) {
        set({ toast: "Essa sombra já está no limite." });
        return;
      }
      commit(result.save, {
        battle: { ...battle, didExtract: true },
        moments: pushMoments(get().moments, result.save.level, result.save.level, [], result.moment),
      });
    },

    claimShadow: (gateId) => {
      const save = get().save;
      const result = takeShadow(save, gateId);
      if (!result) {
        const owned = save.shadows.find((s) => s.gateId === gateId);
        if (!save.cleared.includes(gateId)) set({ toast: "Derrote o chefe antes de extraí-lo." });
        else if (owned && owned.level >= 10) set({ toast: "Essa sombra já está no limite." });
        else set({ toast: "Ela já marcha com você. Vença o portão de novo para adensá-la." });
        return;
      }
      commit(result.save, {
        moments: pushMoments(get().moments, result.save.level, result.save.level, [], result.moment),
      });
    },

    dismissMoment: () => set({ moments: get().moments.slice(1) }),
    clearToast: () => set({ toast: null }),

    reset: () => {
      const save = defaultSave();
      writeSave(save);
      set({ save, battle: null, moments: [], toast: null });
    },
  };
});

function takeShadow(save: Save, gateId: string): { save: Save; moment: Moment } | null {
  if (!save.cleared.includes(gateId)) return null;
  const gate = gateById(gateId);
  if (!gate) return null;
  const owned = save.shadows.find((s) => s.gateId === gateId);
  const banked = save.pending[gateId] ?? 0;
  if (owned && (banked <= 0 || owned.level >= 10)) return null;
  const strengthened = !!owned;
  const shadows = owned
    ? save.shadows.map((s) => (s.gateId === gateId ? { ...s, level: Math.min(10, s.level + 1) } : s))
    : [...save.shadows, { gateId, level: 1 }];
  let deployed = save.deployed;
  if (!owned && deployed.length < shadowCap(save.rank)) deployed = [...deployed, gateId];
  const pending = { ...save.pending };
  if (owned) pending[gateId] = Math.max(0, banked - 1);
  const text = strengthened
    ? `${gate.boss.name} fica mais densa.`
    : `${gate.boss.name} ajoelha e passa a marchar com você.`;
  return {
    save: addFeed({ ...save, shadows, deployed, pending }, text),
    moment: { kind: "extract", name: gate.boss.name, strengthened },
  };
}

function resolveVictory(save: Save, battle: Battle): {
  save: Save;
  rewards: BattleRewards;
  moments: Moment[];
} {
  if (battle.kind === "penalty") {
    const applied = grantXp({ ...save, penalty: false }, 28 + save.level * 3);
    const next = addFeed(applied.save, "A penalidade se desfaz.");
    return {
      save: next,
      rewards: { xp: 28 + save.level * 3, essence: 0, levelsGained: applied.levelsGained, skills: applied.skills },
      moments: pushMoments([], applied.from, next.level, applied.skills),
    };
  }

  if (battle.kind === "rank") {
    const target = nextRank(save.rank);
    const applied = grantXp(save, Math.round(xpToNext(save.level) * 0.85));
    if (!target) {
      return {
        save: applied.save,
        rewards: { xp: 0, essence: 0, levelsGained: applied.levelsGained, skills: applied.skills },
        moments: pushMoments([], applied.from, applied.save.level, applied.skills),
      };
    }
    const next = addFeed(
      { ...applied.save, rank: target, unspent: applied.save.unspent + 8 },
      `Prova superada. Você é ${target === "Monarch" ? "o Monarca" : "rank " + target}.`,
    );
    return {
      save: next,
      rewards: {
        xp: Math.round(xpToNext(save.level) * 0.85),
        essence: 0,
        levelsGained: applied.levelsGained,
        skills: applied.skills,
        rankUp: target,
      },
      moments: pushMoments([], applied.from, next.level, applied.skills, { kind: "rank", rank: target }),
    };
  }

  const gate = battle.gateId ? gateById(battle.gateId) : undefined;
  if (!gate) {
    return { save, rewards: { xp: 0, essence: 0, levelsGained: 0, skills: [] }, moments: [] };
  }
  const clears = save.daily.gateClears[gate.id] ?? 0;
  const mult = gateXpMult(clears);
  const p = passives(save.level);
  let essence = Math.round(gate.essence * mult * p.essence);
  let itemId: string | undefined;
  let itemConverted = false;
  if (Math.random() < 0.42) {
    const pool = ITEMS.filter((item) => item.rank === gate.rank && !save.inventory.includes(item.id));
    if (pool.length > 0) itemId = pool[Math.floor(Math.random() * pool.length)]!.id;
    else itemConverted = true;
  }
  if (itemConverted) essence += Math.round(gate.essence * 0.35);
  const daily = {
    ...save.daily,
    hunt: true,
    gateClears: { ...save.daily.gateClears, [gate.id]: clears + 1 },
  };
  const cleared = save.cleared.includes(gate.id) ? save.cleared : [...save.cleared, gate.id];
  const already = save.shadows.some((s) => s.gateId === gate.id);
  const pending = already
    ? { ...save.pending, [gate.id]: (save.pending[gate.id] ?? 0) + 1 }
    : save.pending;
  let inventory = save.inventory;
  const equipment = { ...save.equipment };
  if (itemId) {
    inventory = [...inventory, itemId];
    const item = itemById(itemId);
    if (item && !equipment[item.slot]) equipment[item.slot] = item.id;
  }
  const seeded: Save = { ...save, daily, cleared, pending, inventory, equipment, essence: save.essence + essence };
  const applied = applyGrantLoose(seeded, Math.round(gate.xp * mult));
  const itemName = itemId ? itemById(itemId)?.name : undefined;
  const next = addFeed(
    applied.save,
    itemName ? `O portão cai. Você encontra ${itemName}.` : `O portão ${gate.name} cai.`,
  );
  return {
    save: next,
    rewards: {
      xp: Math.round(gate.xp * mult),
      essence,
      itemId,
      itemConverted,
      levelsGained: applied.levels,
      skills: applied.skills,
    },
    moments: pushMoments([], applied.from, next.level, applied.skills),
  };
}

function applyGrantLoose(save: Save, xp: number): { save: Save; skills: string[]; levels: number; from: number } {
  const granted = grantXp(save, xp);
  const bonus = withBonus(granted.save);
  return {
    save: bonus.save,
    skills: [...granted.skills, ...bonus.skills],
    levels: bonus.save.level - granted.from,
    from: granted.from,
  };
}
