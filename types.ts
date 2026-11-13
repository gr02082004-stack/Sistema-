export const RANKS = ["E", "D", "C", "B", "A", "S", "SS", "SSS", "Monarch"] as const;
export type Rank = (typeof RANKS)[number];

export const STAT_KEYS = ["str", "vit", "agi", "int", "per"] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export type Slot = "weapon" | "armor" | "relic";
export type QuestTier = "facil" | "media" | "dificil" | "pesadelo";

export type Stats = Record<StatKey, number>;

export type DailyState = {
  date: string;
  push: number;
  sit: number;
  run: number;
  hunt: boolean;
  bonusClaimed: boolean;
  customClears: number;
  gateClears: Record<string, number>;
};

export type CustomQuest = {
  id: string;
  title: string;
  tier: QuestTier;
  done: boolean;
};

export type Shadow = {
  gateId: string;
  level: number;
};

export type Save = {
  version: 1;
  accepted: boolean;
  name: string;
  level: number;
  xp: number;
  rank: Rank;
  essence: number;
  unspent: number;
  stats: Stats;
  inventory: string[];
  equipment: Record<Slot, string | null>;
  shadows: Shadow[];
  deployed: string[];
  cleared: string[];
  pending: Record<string, number>;
  penalty: boolean;
  daily: DailyState;
  quests: CustomQuest[];
  feed: string[];
};

export type Derived = {
  maxHp: number;
  maxMp: number;
  atk: number;
  def: number;
  crit: number;
  dodge: number;
};

export type Fighter = {
  id: string;
  name: string;
  subtitle: string;
  side: "ally" | "enemy";
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  crit: number;
  dodge: number;
  guard: boolean;
  fear: number;
  veil: number;
  stun: number;
  boss: boolean;
  shadow: boolean;
};

export type LogLine = {
  id: number;
  text: string;
  tone: "info" | "hit" | "crit" | "good" | "bad";
};

export type BattleKind = "gate" | "rank" | "penalty";

export type BattleRewards = {
  xp: number;
  essence: number;
  itemId?: string;
  itemConverted?: boolean;
  levelsGained: number;
  skills: string[];
  rankUp?: Rank;
};

export type Battle = {
  kind: BattleKind;
  gateId?: string;
  title: string;
  phase: "fight" | "victory" | "defeat" | "fled";
  fighters: Fighter[];
  log: LogLine[];
  logSeq: number;
  turn: number;
  wave: "mobs" | "boss";
  hunterLevel: number;
  targetId: string | null;
  flashId: string | null;
  resolved: boolean;
  didExtract?: boolean;
  rewards?: BattleRewards;
  extractName?: string;
};

export type Moment =
  | { kind: "level"; from: number; to: number; skills: string[] }
  | { kind: "rank"; rank: Rank }
  | { kind: "extract"; name: string; strengthened: boolean };
