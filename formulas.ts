import {
  gateById,
  itemById,
  newSkillsBetween,
  PUSH_GOAL,
  RANK_LEVEL,
  RUN_GOAL,
  SHADOW_CAP,
  SIT_GOAL,
  skillsAt,
  TIER_XP,
} from "./data";
import type { Derived, QuestTier, Rank, Save, Shadow, StatKey, Stats } from "./types";
import { RANKS } from "./types";

export function xpToNext(level: number): number {
  return Math.round(42 + level * 18 + Math.pow(level, 1.48) * 7);
}

export function pointsForLevel(level: number): number {
  return 4 + (level % 5 === 0 ? 2 : 0);
}

export function localDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function freshDaily(date = localDate()): Save["daily"] {
  return {
    date,
    push: 0,
    sit: 0,
    run: 0,
    hunt: false,
    bonusClaimed: false,
    customClears: 0,
    gateClears: {},
  };
}

export function defaultSave(): Save {
  return {
    version: 1,
    accepted: false,
    name: "Caçador",
    level: 1,
    xp: 0,
    rank: "E",
    essence: 0,
    unspent: 5,
    stats: { str: 10, vit: 10, agi: 10, int: 10, per: 10 },
    inventory: [],
    equipment: { weapon: null, armor: null, relic: null },
    shadows: [],
    deployed: [],
    cleared: [],
    pending: {},
    penalty: false,
    daily: freshDaily(),
    quests: [],
    feed: ["O sistema abre os olhos. Rank E. Nível 1."],
  };
}

export function passives(level: number) {
  return {
    shadowAtk: (level >= 5 ? 1.2 : 1) * (level >= 18 ? 1.3 : 1),
    shadowHp: level >= 18 ? 1.18 : 1,
    all: level >= 70 ? 1.08 : 1,
    monarch: level >= 108 ? 1.12 : 1,
    essence: level >= 108 ? 1.2 : 1,
  };
}

export function gearBonuses(save: Save) {
  const ids = [save.equipment.weapon, save.equipment.armor, save.equipment.relic].filter(
    (id): id is string => !!id,
  );
  return ids.reduce(
    (acc, id) => {
      const item = itemById(id);
      if (!item) return acc;
      acc.atk += item.atk ?? 0;
      acc.def += item.def ?? 0;
      acc.hp += item.hp ?? 0;
      acc.mp += item.mp ?? 0;
      acc.crit += item.crit ?? 0;
      return acc;
    },
    { atk: 0, def: 0, hp: 0, mp: 0, crit: 0 },
  );
}

export function derive(save: Save): Derived {
  const g = gearBonuses(save);
  const p = passives(save.level);
  const all = p.all * p.monarch;
  const { str, vit, agi, int, per } = save.stats;
  return {
    maxHp: Math.round((100 + vit * 12 + save.level * 5 + g.hp) * all),
    maxMp: Math.round(22 + int * 5 + g.mp),
    atk: Math.round((8 + str * 2.4 + save.level * 0.55 + g.atk) * all),
    def: Math.round((4 + vit * 1.45 + g.def) * all),
    crit: Math.min(0.45, 0.04 + per * 0.0042 + g.crit),
    dodge: Math.min(0.3, 0.02 + agi * 0.0032 + per * 0.001),
  };
}

export function combatPower(save: Save): number {
  const d = derive(save);
  return Math.round(
    d.atk * 2.4 + d.maxHp * 0.32 + d.def * 2.1 + d.crit * 220 + d.dodge * 160 + deployedPower(save),
  );
}

export function shadowStats(shadow: Shadow): { hp: number; atk: number; def: number } {
  const gate = gateById(shadow.gateId);
  if (!gate) return { hp: 40, atk: 8, def: 3 };
  const lv = 1 + (shadow.level - 1) * 0.14;
  return {
    hp: Math.round(gate.boss.hp * 0.4 * lv),
    atk: Math.round(gate.boss.atk * 0.7 * lv),
    def: Math.round(gate.boss.def * 0.55 * lv),
  };
}

export function deployedPower(save: Save): number {
  const p = passives(save.level);
  return save.deployed.reduce((sum, id) => {
    const shadow = save.shadows.find((s) => s.gateId === id);
    if (!shadow) return sum;
    const base = shadowStats(shadow);
    return sum + Math.round(base.atk * p.shadowAtk * 1.6);
  }, 0);
}

export function shadowCap(rank: Rank): number {
  return SHADOW_CAP[rank];
}

export function levelForNextRank(rank: Rank): number | null {
  const i = RANKS.indexOf(rank);
  if (i < 0 || i >= RANKS.length - 1) return null;
  return RANK_LEVEL[RANKS[i + 1]!];
}

export type XpGrant = {
  save: Save;
  levelsGained: number;
  skills: string[];
  from: number;
};

export function grantXp(save: Save, raw: number): XpGrant {
  const amount = save.penalty ? Math.floor(raw * 0.7) : raw;
  let xp = save.xp + Math.max(0, amount);
  let level = save.level;
  let unspent = save.unspent;
  const from = save.level;
  while (level < 200 && xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level += 1;
    unspent += pointsForLevel(level);
  }
  const skills = newSkillsBetween(from, level).map((s) => s.name);
  return {
    save: { ...save, xp, level, unspent },
    levelsGained: level - from,
    skills,
    from,
  };
}

export function questXp(tier: QuestTier, level: number): number {
  return Math.round(TIER_XP[tier] * (1 + level * 0.045));
}

export function gateXpMult(clearsToday: number): number {
  return [1, 0.85, 0.7, 0.55][Math.min(clearsToday, 3)] ?? 0.55;
}

export function physicalDone(daily: Save["daily"]): boolean {
  return daily.push >= PUSH_GOAL && daily.sit >= SIT_GOAL && daily.run >= RUN_GOAL;
}

export function rollDaily(save: Save, today = localDate()): Save {
  if (save.daily.date === today) return save;
  const hadDay = save.accepted && save.daily.date !== "";
  const missed = hadDay && !physicalDone(save.daily);
  return {
    ...save,
    penalty: save.penalty || missed,
    daily: freshDaily(today),
    feed: missed
      ? ["O sistema cobra a missão diária. A penalidade está aberta.", ...save.feed].slice(0, 30)
      : save.feed,
  };
}

export function addFeed(save: Save, text: string): Save {
  return { ...save, feed: [text, ...save.feed].slice(0, 30) };
}

export function ownedSkillCount(level: number): number {
  return skillsAt(level).length;
}

export function statLabel(key: StatKey): string {
  switch (key) {
    case "str":
      return "Força";
    case "vit":
      return "Vitalidade";
    case "agi":
      return "Agilidade";
    case "int":
      return "Inteligência";
    case "per":
      return "Percepção";
  }
}

export function bumpStat(stats: Stats, key: StatKey): Stats {
  return { ...stats, [key]: stats[key] + 1 };
}
