import type { QuestTier, Rank, Slot } from "./types";
import { RANKS } from "./types";

export const SAVE_KEY = "monarca-save-v1";

export const RANK_LEVEL: Record<Rank, number> = {
  E: 1,
  D: 8,
  C: 16,
  B: 26,
  A: 38,
  S: 52,
  SS: 68,
  SSS: 86,
  Monarch: 108,
};

/** How hard a rank's enemies are, relative to an E-rank gate. */
export const ENEMY_SCALE: Record<Rank, { hp: number; atk: number; def: number }> = {
  E: { hp: 1, atk: 1, def: 1 },
  D: { hp: 2.05, atk: 1.62, def: 1.4 },
  C: { hp: 2.85, atk: 2.15, def: 1.85 },
  B: { hp: 3.9, atk: 2.85, def: 2.35 },
  A: { hp: 5.3, atk: 3.7, def: 3 },
  S: { hp: 6.9, atk: 4.7, def: 3.7 },
  SS: { hp: 8.8, atk: 5.8, def: 4.5 },
  SSS: { hp: 12, atk: 7.5, def: 5.6 },
  Monarch: { hp: 16.5, atk: 9.6, def: 7 },
};

const GATE_XP: Record<Rank, number> = {
  E: 120,
  D: 210,
  C: 340,
  B: 560,
  A: 900,
  S: 1400,
  SS: 2200,
  SSS: 3400,
  Monarch: 5400,
};

export const SHADOW_CAP: Record<Rank, number> = {
  E: 1,
  D: 2,
  C: 3,
  B: 4,
  A: 6,
  S: 8,
  SS: 11,
  SSS: 15,
  Monarch: 20,
};

export const RANK_TITLE: Record<Rank, string> = {
  E: "O mais fraco",
  D: "Aprendiz do véu",
  C: "Caçador da noite",
  B: "Portador do medo",
  A: "Soberano em ascensão",
  S: "Rei sem corte",
  SS: "Eclipse ambulante",
  SSS: "Quase-monarca",
  Monarch: "Monarca das Sombras",
};

export const PUSH_GOAL = 20;
export const SIT_GOAL = 20;
export const RUN_GOAL = 12;
export const CUSTOM_CAP = 5;

export function rankIndex(rank: Rank): number {
  return RANKS.indexOf(rank);
}

export function nextRank(rank: Rank): Rank | null {
  const i = rankIndex(rank);
  return i < RANKS.length - 1 ? RANKS[i + 1]! : null;
}

export function rankLabel(rank: Rank): string {
  return rank === "Monarch" ? "Monarca" : `Rank ${rank}`;
}

export type SkillDef = {
  id: string;
  name: string;
  level: number;
  kind: "active" | "passive";
  mp: number;
  target: "enemy" | "all" | "self";
  desc: string;
};

export const SKILLS: SkillDef[] = [
  {
    id: "golpe",
    name: "Golpe Sombrio",
    level: 1,
    kind: "active",
    mp: 6,
    target: "enemy",
    desc: "Um corte carregado de escuridão. 160% do ataque.",
  },
  {
    id: "passo",
    name: "Passo Sombrio",
    level: 3,
    kind: "active",
    mp: 5,
    target: "enemy",
    desc: "Você some e reaparece no flanco. Dano leve e esquiva alta por 2 turnos.",
  },
  {
    id: "extracao",
    name: "Extração",
    level: 5,
    kind: "passive",
    mp: 0,
    target: "self",
    desc: "Sombras extraídas batem com mais força. Reencontrar um chefe as adensa.",
  },
  {
    id: "medo",
    name: "Domínio do Medo",
    level: 8,
    kind: "active",
    mp: 10,
    target: "all",
    desc: "O portão inteiro hesita. Inimigos perdem força por 3 turnos.",
  },
  {
    id: "corte",
    name: "Corte do Abismo",
    level: 12,
    kind: "active",
    mp: 14,
    target: "enemy",
    desc: "Ignora parte da defesa. 220% do ataque.",
  },
  {
    id: "exercito",
    name: "Exército das Sombras",
    level: 18,
    kind: "passive",
    mp: 0,
    target: "self",
    desc: "Quem marcha com você fica mais denso e mais cruel.",
  },
  {
    id: "avanco",
    name: "Comando: Avancem",
    level: 22,
    kind: "active",
    mp: 12,
    target: "all",
    desc: "As sombras atacam duas vezes neste turno.",
  },
  {
    id: "manto",
    name: "Manto do Monarca",
    level: 28,
    kind: "active",
    mp: 16,
    target: "self",
    desc: "A escuridão fecha um corte. Recupera vida e reduz o próximo golpe.",
  },
  {
    id: "autoridade",
    name: "Autoridade",
    level: 40,
    kind: "active",
    mp: 20,
    target: "enemy",
    desc: "Uma ordem que paralisa. Dano alto e o alvo perde o turno.",
  },
  {
    id: "eclipse",
    name: "Eclipse Negro",
    level: 54,
    kind: "active",
    mp: 26,
    target: "all",
    desc: "A luz sai da sala. Dano em todos os inimigos.",
  },
  {
    id: "trono",
    name: "Trono Vazio",
    level: 70,
    kind: "passive",
    mp: 0,
    target: "self",
    desc: "Seu corpo aceita o peso de um trono. Todos os atributos derivados sobem.",
  },
  {
    id: "decreto",
    name: "Decreto do Soberano",
    level: 90,
    kind: "active",
    mp: 30,
    target: "enemy",
    desc: "Uma sentença. Dano devastador e um fio de vida de volta.",
  },
  {
    id: "monarca",
    name: "Monarca das Sombras",
    level: 108,
    kind: "passive",
    mp: 0,
    target: "self",
    desc: "A escuridão deixa de pedir licença. Poder e essência dos portões aumentam.",
  },
];

export function skillsAt(level: number): SkillDef[] {
  return SKILLS.filter((s) => s.level <= level);
}

export function newSkillsBetween(from: number, to: number): SkillDef[] {
  return SKILLS.filter((s) => s.level > from && s.level <= to);
}

export type ItemDef = {
  id: string;
  name: string;
  rank: Rank;
  slot: Slot;
  atk?: number;
  def?: number;
  hp?: number;
  mp?: number;
  crit?: number;
  price: number;
  lore: string;
};

const PRICES: Record<Rank, number> = {
  E: 90,
  D: 240,
  C: 560,
  B: 1200,
  A: 2600,
  S: 5400,
  SS: 11000,
  SSS: 22000,
  Monarch: 48000,
};

function gear(rank: Rank, slot: Slot, name: string, lore: string): ItemDef {
  const pace = Math.pow(1.52, rankIndex(rank));
  const price = PRICES[rank];
  if (slot === "weapon") {
    return {
      id: `${rank}-weapon`,
      name,
      rank,
      slot,
      atk: Math.round(10 * pace),
      crit: Math.min(0.08, 0.01 + rankIndex(rank) * 0.008),
      price,
      lore,
    };
  }
  if (slot === "armor") {
    return {
      id: `${rank}-armor`,
      name,
      rank,
      slot,
      def: Math.round(6 * pace),
      hp: Math.round(36 * pace),
      price,
      lore,
    };
  }
  return {
    id: `${rank}-relic`,
    name,
    rank,
    slot,
    mp: Math.round(8 + rankIndex(rank) * 6),
    atk: Math.round(4 * pace),
    crit: Math.min(0.1, 0.015 + rankIndex(rank) * 0.009),
    price,
    lore,
  };
}

export const ITEMS: ItemDef[] = [
  gear("E", "weapon", "Farpa do Beco", "A primeira lâmina que aceitou ficar na sua mão depois que a luz saiu."),
  gear("E", "armor", "Manto do Primeiro Frio", "Não aquece. Ensina o corpo a não pedir calor."),
  gear("E", "relic", "Olho que Pediu Licença", "Vê o que ainda finge estar morto."),
  gear("D", "weapon", "Fio do Véu Rasgado", "Corta o que o véu tentava esconder de você."),
  gear("D", "armor", "Couro da Cinza Mansa", "Cinza de um portão que não voltou a abrir."),
  gear("D", "relic", "Anel do Pulso Parado", "O tempo ao redor do punho fica um pouco mais educado."),
  gear("C", "weapon", "Juramento de Piche", "Promessa feita no escuro, onde ninguém pode testemunhar a quebra."),
  gear("C", "armor", "Placas do Medo Engolido", "O medo entrou e não achou a saída."),
  gear("C", "relic", "Fio de Fome Antiga", "Puxa mana de um lugar que já estava vazio."),
  gear("B", "weapon", "Lança do Poço Quieto", "O poço não devolve o que cai. Você devolve."),
  gear("B", "armor", "Égide do Sussurro", "Os golpes chegam atrasados, como se pedissem desculpa."),
  gear("B", "relic", "Selo do Comando Baixo", "Uma ordem dita sem voz ainda é obedecida."),
  gear("A", "weapon", "Presa Sem Aurora", "Nasceu de um dia que se recusou a começar."),
  gear("A", "armor", "Carapaça da Noite Cega", "A noite vestida, sem estrela para denunciar você."),
  gear("A", "relic", "Coroa que Ninguém Vê", "Pesa só para quem já aceitou reinar."),
  gear("S", "weapon", "Corte do Rei Oco", "Um rei que saiu do próprio corpo e deixou o gume."),
  gear("S", "armor", "Manto de Quem Não se Curva", "O tecido lembra a postura, mesmo quando você esquece."),
  gear("S", "relic", "Fragmento de um Sol Negro", "Queima por dentro, sem iluminar nada."),
  gear("SS", "weapon", "Glaive do Firmamento Partido", "O céu rachou. Isto é a lasca que escolheu você."),
  gear("SS", "armor", "Regalia do Eclipse Interno", "O eclipse deixou de ser evento e virou pele."),
  gear("SS", "relic", "Chave do Véu", "Abre portas que ainda não existem."),
  gear("SSS", "weapon", "Lamento que Não Ecoa", "O golpe chega antes do som."),
  gear("SSS", "armor", "Pele do Abismo Aceito", "Você parou de resistir. O abismo vestiu a forma do seu corpo."),
  gear("SSS", "relic", "Coração Emprestado do Escuro", "Bate no ritmo de algo que não é você. Ainda."),
  gear(
    "Monarch",
    "weapon",
    "Vontade que Tudo Dobra",
    "Não é uma arma. É a decisão de que tudo ao redor vai ajoelhar.",
  ),
  gear(
    "Monarch",
    "armor",
    "Trono que se Veste",
    "Não há sala. O trono é o que resta quando você aceita a escuridão por inteiro.",
  ),
  gear(
    "Monarch",
    "relic",
    "Autoridade Selada na Palma",
    "Quem morre na sua frente entende, tarde, a quem pertencia.",
  ),
];

export function itemById(id: string): ItemDef | undefined {
  return ITEMS.find((i) => i.id === id);
}

export type EnemyDef = {
  name: string;
  hp: number;
  atk: number;
  def: number;
  count?: number;
};

export type GateDef = {
  id: string;
  name: string;
  rank: Rank;
  place: string;
  waves: EnemyDef[];
  boss: EnemyDef & { title: string; role: string; lore: string };
  xp: number;
  essence: number;
};

function scaled(rank: Rank, role: "mob" | "boss", skew: number): { hp: number; atk: number; def: number } {
  const scale = ENEMY_SCALE[rank];
  if (role === "mob") {
    return {
      hp: Math.round(54 * scale.hp * skew),
      atk: Math.round(11 * scale.atk * skew),
      def: Math.round(4 * scale.def),
    };
  }
  return {
    hp: Math.round(270 * scale.hp * skew),
    atk: Math.round(22 * scale.atk * skew),
    def: Math.round(8 * scale.def),
  };
}

function gate(
  id: string,
  rank: Rank,
  name: string,
  place: string,
  mobName: string,
  mobCount: number,
  bossName: string,
  title: string,
  role: string,
  lore: string,
  skew = 1,
): GateDef {
  const mob = scaled(rank, "mob", skew);
  const boss = scaled(rank, "boss", skew);
  const essenceBase: Record<Rank, number> = {
    E: 48,
    D: 120,
    C: 250,
    B: 520,
    A: 1100,
    S: 2300,
    SS: 4800,
    SSS: 9600,
    Monarch: 20000,
  };
  return {
    id,
    name,
    rank,
    place,
    waves: [{ name: mobName, ...mob, count: mobCount }],
    boss: { name: bossName, title, role, lore, ...boss },
    xp: GATE_XP[rank],
    essence: essenceBase[rank],
  };
}

export const GATES: GateDef[] = [
  gate(
    "viela",
    "E",
    "Viela Sem Luz",
    "Um beco que esqueceu o próprio nome.",
    "Rato do beco",
    3,
    "Lobo de Ferro",
    "Fera faminta",
    "Fera",
    "Nasceu entre grades e aprendeu a morder o escuro antes da carne.",
    0.92,
  ),
  gate(
    "porao",
    "E",
    "Porão das Garrafas",
    "O chão ainda cheira a vinho azedo.",
    "Ébrio armado",
    2,
    "Rei do Porão",
    "Bruto coroado de caco",
    "Bruto",
    "Pôs uma coroa de vidro e exigiu que o porão o chamasse de rei.",
    1,
  ),
  gate(
    "cripta",
    "D",
    "Cripta Úmida",
    "Água negra até o tornozelo. Os mortos não se importam.",
    "Osso inquieto",
    3,
    "Capitão Esqueleto",
    "Sentinela sem bandeira",
    "Sentinela",
    "Continua a ronda de uma guerra que já acabou para todo mundo, menos para ele.",
  ),
  gate(
    "mata",
    "D",
    "Mata Cega",
    "As árvores crescem para dentro.",
    "Ninfa de névoa",
    2,
    "Matriarca da Névoa",
    "Assassina de seda",
    "Assassina",
    "Tece fome em vez de teia. Quem entra já está embrulhado.",
    1.06,
  ),
  gate(
    "mina",
    "C",
    "Mina Oca",
    "Os trilhos descem e não combinam de voltar.",
    "Minerador oco",
    3,
    "Golem de Escória",
    "Colosso de rejeito",
    "Colosso",
    "Feito do que a mina cuspiu fora. Agora cospe de volta.",
  ),
  gate(
    "templo",
    "C",
    "Templo Rachado",
    "O altar foi virado para o chão.",
    "Acólito mudo",
    2,
    "Sacerdote Caído",
    "Mago sem deus",
    "Mago",
    "Rezou até a voz acabar. O que respondeu não era um deus.",
    1.05,
  ),
  gate(
    "fortaleza",
    "B",
    "Fortaleza de Cinza",
    "Muros de pé, guarnição nenhuma.",
    "Soldado de cinza",
    3,
    "Cavaleiro Sem Nome",
    "Sentinela do juramento",
    "Sentinela",
    "Esqueceu o rei, o brasão e o próprio nome. Não esqueceu a espada.",
  ),
  gate(
    "lago",
    "B",
    "Lago Parado",
    "A água não reflete quem olha.",
    "Afogado",
    2,
    "Hidra Menor",
    "Fera de várias fomes",
    "Fera",
    "Cada cabeça aprendeu um jeito diferente de pedir para existir.",
    1.08,
  ),
  gate(
    "palacio",
    "A",
    "Palácio Submerso",
    "Os lustres ainda balançam, debaixo d'água.",
    "Cortesão lívido",
    3,
    "Cantora do Luto",
    "Arauto do salão",
    "Arauto",
    "A música dela convence o pulmão a desistir antes da espada.",
  ),
  gate(
    "cidadela",
    "A",
    "Cidadela de Ossos",
    "Cada tijolo já teve um nome.",
    "Guarda ósseo",
    3,
    "General Ósseo",
    "Bruto de um exército findo",
    "Bruto",
    "Comanda mortos com a mesma frieza com que um dia comandou vivos.",
    1.05,
  ),
  gate(
    "catedral",
    "S",
    "Catedral Invertida",
    "O piso é o que um dia foi o teto.",
    "Penitente",
    3,
    "Arcebispo Vazio",
    "Mago do silêncio",
    "Mago",
    "Tirou o próprio nome do livro e ficou só a autoridade.",
  ),
  gate(
    "forja",
    "SS",
    "Forja do Fim",
    "O fogo aqui é preto e ainda queima.",
    "Brasa andante",
    2,
    "Colosso de Brasa Negra",
    "Colosso do último calor",
    "Colosso",
    "Foi construído para apagar o mundo e esqueceu como se desliga.",
  ),
  gate(
    "veu",
    "SSS",
    "Véu do Abismo",
    "Depois daqui, o chão é uma opinião.",
    "Farpa do véu",
    3,
    "Arauto Sem Face",
    "Arauto do que vem depois",
    "Arauto",
    "Não tem rosto porque já usou todos os que venceu.",
  ),
  gate(
    "salao",
    "Monarch",
    "Salão do Soberano",
    "Um trono, e alguém sentado nele que não é você.",
    "Guarda do trono",
    2,
    "Usurpador do Trono",
    "Soberano emprestado",
    "Soberano",
    "Vestiu a sua escuridão antes de você aceitá-la. Veio cobrar o atraso.",
    1.08,
  ),
];

export function gateById(id: string): GateDef | undefined {
  return GATES.find((g) => g.id === id);
}

export type Examiner = EnemyDef & { epithet: string; rank: Rank };

export const EXAMINERS: Examiner[] = [
  { rank: "D", name: "Inspetor do Véu", epithet: "Prova para o rank D", ...scaled("D", "boss", 1.12) },
  { rank: "C", name: "Juiz da Cinza", epithet: "Prova para o rank C", ...scaled("C", "boss", 1.12) },
  { rank: "B", name: "Carrasco do Contrato", epithet: "Prova para o rank B", ...scaled("B", "boss", 1.1) },
  { rank: "A", name: "Arauto da Noite", epithet: "Prova para o rank A", ...scaled("A", "boss", 1.1) },
  { rank: "S", name: "Regente sem Sol", epithet: "Prova para o rank S", ...scaled("S", "boss", 1.08) },
  { rank: "SS", name: "Eclipse de Prova", epithet: "Prova para o rank SS", ...scaled("SS", "boss", 1.08) },
  { rank: "SSS", name: "Quase-trono", epithet: "Prova para o rank SSS", ...scaled("SSS", "boss", 1.06) },
  { rank: "Monarch", name: "O que Ocupa o Trono", epithet: "Prova do Monarca", ...scaled("Monarch", "boss", 1.05) },
];

export function examinerFor(target: Rank): Examiner | undefined {
  return EXAMINERS.find((e) => e.rank === target);
}

export const TIER_LABEL: Record<QuestTier, string> = {
  facil: "Fácil",
  media: "Média",
  dificil: "Difícil",
  pesadelo: "Pesadelo",
};

export const TIER_XP: Record<QuestTier, number> = {
  facil: 24,
  media: 42,
  dificil: 74,
  pesadelo: 120,
};

export function threatOf(enemy: { hp: number; atk: number; def: number }): number {
  return Math.round(enemy.hp * 0.22 + enemy.atk * 4.2 + enemy.def * 2.4);
}

export function gateThreat(gateDef: GateDef): number {
  const wave = gateDef.waves[0]!;
  const count = wave.count ?? 1;
  return threatOf(wave) * count + threatOf(gateDef.boss);
}
