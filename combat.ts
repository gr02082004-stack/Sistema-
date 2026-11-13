import { examinerFor, gateById, SKILLS, skillsAt } from "./data";
import { derive, passives, shadowStats } from "./formulas";
import type { Battle, Fighter, LogLine, Save } from "./types";
import { nextRank } from "./data";

let seq = 1;
function uid(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

function push(battle: Battle, text: string, tone: LogLine["tone"] = "info"): void {
  battle.logSeq += 1;
  battle.log = [{ id: battle.logSeq, text, tone }, ...battle.log].slice(0, 14);
}

function living(fighters: Fighter[], side: Fighter["side"]): Fighter[] {
  return fighters.filter((f) => f.side === side && f.hp > 0);
}

export function strike(
  att: Fighter,
  def: Fighter,
  rng: () => number,
  mult = 1,
  ignoreDef = 0,
): { dmg: number; crit: boolean; miss: boolean } {
  if (!def.boss && rng() < def.dodge + (def.veil > 0 ? 0.14 : 0)) return { dmg: 0, crit: false, miss: true };
  const fear = att.fear > 0 ? 0.75 : 1;
  const veil = att.veil > 0 ? 1.08 : 1;
  const defn = def.def * (1 - ignoreDef);
  let raw = att.atk * fear * veil * (0.9 + rng() * 0.22) * mult;
  if (def.guard) raw *= 0.55;
  let dmg = Math.max(1, Math.round(raw * (100 / (100 + Math.max(0, defn)))));
  const crit = rng() < att.crit;
  if (crit) dmg = Math.round(dmg * 1.7);
  return { dmg, crit, miss: false };
}

function applyHit(battle: Battle, att: Fighter, def: Fighter, result: { dmg: number; crit: boolean; miss: boolean }) {
  if (result.miss) {
    push(battle, `${def.name} esquiva o golpe de ${att.name}.`, "info");
    return;
  }
  def.hp = Math.max(0, def.hp - result.dmg);
  battle.flashId = def.id;
  const verb = result.crit ? "acerto crítico" : "causa";
  push(
    battle,
    `${att.name} ${verb} ${result.dmg} em ${def.name}.`,
    result.crit ? "crit" : "hit",
  );
  if (def.hp <= 0) push(battle, `${def.name} cai.`, "bad");
}

function foe(battle: Battle, preferred?: string | null): Fighter | undefined {
  const enemies = living(battle.fighters, "enemy");
  if (preferred) {
    const chosen = enemies.find((f) => f.id === preferred);
    if (chosen) return chosen;
  }
  return enemies[0];
}

function alliesShadows(battle: Battle): Fighter[] {
  return living(battle.fighters, "ally").filter((f) => f.shadow);
}

function playerOf(battle: Battle): Fighter | undefined {
  return battle.fighters.find((f) => f.id === "player");
}

export type Action =
  | { type: "attack"; targetId?: string | null }
  | { type: "defend" }
  | { type: "flee" }
  | { type: "skill"; skillId: string; targetId?: string | null };

function enemyPhase(battle: Battle, rng: () => number) {
  const player = playerOf(battle);
  if (!player || player.hp <= 0) return;
  for (const enemy of living(battle.fighters, "enemy")) {
    if (enemy.stun > 0) {
      push(battle, `${enemy.name} não consegue se mover.`, "info");
      enemy.stun = 0;
      continue;
    }
    const shadows = alliesShadows(battle);
    const hitShadow = shadows.length > 0 && rng() < 0.22;
    const target = hitShadow ? shadows[Math.floor(rng() * shadows.length)]! : player;
    applyHit(battle, enemy, target, strike(enemy, target, rng));
    if (player.hp <= 0) return;
  }
}

function shadowPhase(battle: Battle, rng: () => number, extra: boolean) {
  const times = extra ? 2 : 1;
  for (let n = 0; n < times; n += 1) {
    for (const shadow of alliesShadows(battle)) {
      const target = foe(battle);
      if (!target) return;
      applyHit(battle, shadow, target, strike(shadow, target, rng, n === 1 ? 0.85 : 1));
    }
  }
}

function endTurn(battle: Battle, rng: () => number, shadowExtra: boolean) {
  if (living(battle.fighters, "enemy").length === 0) return;
  shadowPhase(battle, rng, shadowExtra);
  if (living(battle.fighters, "enemy").length === 0) return;
  enemyPhase(battle, rng);
  const player = playerOf(battle);
  if (player && player.hp > 0) {
    player.mp = Math.min(player.maxMp, player.mp + 3);
    if (player.fear > 0) player.fear -= 1;
    if (player.veil > 0) player.veil -= 1;
  }
  for (const enemy of battle.fighters) {
    if (enemy.side === "enemy" && enemy.fear > 0) enemy.fear -= 1;
  }
  battle.turn += 1;
}

function defeated(battle: Battle): boolean {
  const player = playerOf(battle);
  return !player || player.hp <= 0;
}

export function step(battle: Battle, action: Action, rng: () => number = Math.random): Battle {
  if (battle.phase !== "fight") return battle;
  const next: Battle = {
    ...battle,
    fighters: battle.fighters.map((f) => ({ ...f, guard: f.id === "player" ? false : f.guard })),
    flashId: null,
  };
  const player = playerOf(next);
  if (!player) return next;

  let shadowExtra = false;

  if (action.type === "attack") {
    const target = foe(next, action.targetId);
    if (!target) return next;
    applyHit(next, player, target, strike(player, target, rng));
  } else if (action.type === "defend") {
    player.guard = true;
    player.mp = Math.min(player.maxMp, player.mp + 5);
    push(next, `${player.name} fecha a guarda.`, "info");
  } else if (action.type === "flee") {
    if (next.kind !== "gate") {
      push(next, "O sistema não permite fugir desta prova.", "bad");
      return next;
    }
    if (rng() < 0.68) {
      next.phase = "fled";
      push(next, "Você recua. O portão se fecha sem recompensa.", "info");
      return next;
    }
    push(next, "A fuga falha.", "bad");
  } else if (action.type === "skill") {
    const skill = SKILLS.find((s) => s.id === action.skillId);
    if (!skill || skill.kind !== "active" || !skillsAt(next.hunterLevel).some((s) => s.id === skill.id)) {
      push(next, "Essa habilidade ainda não responde.", "bad");
      return next;
    }
    if (player.mp < skill.mp) {
      push(next, "Mana insuficiente.", "bad");
      return next;
    }
    player.mp -= skill.mp;
    const target = foe(next, action.targetId);
    if (skill.id === "golpe" && target) {
      applyHit(next, player, target, strike(player, target, rng, 1.6));
    } else if (skill.id === "passo" && target) {
      player.veil = 2;
      applyHit(next, player, target, strike(player, target, rng, 0.85));
      push(next, "O passo sombrio cobre a sua esquiva.", "good");
    } else if (skill.id === "medo") {
      for (const enemy of living(next.fighters, "enemy")) enemy.fear = 3;
      push(next, "O medo desce sobre os inimigos.", "good");
    } else if (skill.id === "corte" && target) {
      applyHit(next, player, target, strike(player, target, rng, 2.2, 0.4));
    } else if (skill.id === "avanco") {
      shadowExtra = true;
      if (alliesShadows(next).length === 0) {
        push(next, "Não há sombra em campo para avançar.", "bad");
        player.mp += skill.mp;
        return next;
      }
      push(next, "As sombras avançam em dobro.", "good");
    } else if (skill.id === "manto") {
      const heal = Math.round(player.maxHp * 0.18);
      player.hp = Math.min(player.maxHp, player.hp + heal);
      player.guard = true;
      push(next, `O manto fecha feridas. +${heal} de vida.`, "good");
    } else if (skill.id === "autoridade" && target) {
      applyHit(next, player, target, strike(player, target, rng, 2.35));
      if (target.hp > 0) {
        target.stun = 1;
        push(next, `${target.name} obedece e para.`, "good");
      }
    } else if (skill.id === "eclipse") {
      for (const enemy of living(next.fighters, "enemy")) {
        applyHit(next, player, enemy, strike(player, enemy, rng, 1.65));
      }
    } else if (skill.id === "decreto" && target) {
      applyHit(next, player, target, strike(player, target, rng, 3));
      const heal = Math.round(player.maxHp * 0.1);
      player.hp = Math.min(player.maxHp, player.hp + heal);
      push(next, `O decreto devolve ${heal} de vida.`, "good");
    } else if (!target && skill.target === "enemy") {
      player.mp += skill.mp;
      push(next, "Não há alvo.", "bad");
      return next;
    }
  }

  if (living(next.fighters, "enemy").length === 0) {
    if (advanceWave(next)) return next;
    next.phase = "victory";
    push(next, "O último inimigo se desfaz.", "good");
    return next;
  }
  endTurn(next, rng, shadowExtra);
  if (defeated(next)) {
    next.phase = "defeat";
    push(next, "Você cai. O sistema o expulsa.", "bad");
    return next;
  }
  if (living(next.fighters, "enemy").length === 0) {
    if (advanceWave(next)) return next;
    next.phase = "victory";
    push(next, "O último inimigo se desfaz.", "good");
  }
  const still = foe(next, next.targetId);
  next.targetId = still?.id ?? null;
  return next;
}

function advanceWave(battle: Battle): boolean {
  if (battle.kind !== "gate" || battle.wave !== "mobs" || !battle.gateId) return false;
  const gate = gateById(battle.gateId);
  if (!gate) return false;
  battle.fighters = battle.fighters.filter((f) => f.side !== "enemy");
  const boss = makeEnemy(gate.boss, true, gate.boss.title);
  battle.fighters.push(boss);
  battle.wave = "boss";
  battle.targetId = boss.id;
  battle.phase = "fight";
  const player = playerOf(battle);
  if (player) {
    const heal = Math.max(1, Math.round(player.maxHp * 0.12));
    player.hp = Math.min(player.maxHp, player.hp + heal);
    player.mp = Math.min(player.maxMp, player.mp + 6);
    push(battle, `A sala esvazia. ${gate.boss.name} entra. +${heal} de vida.`, "info");
  }
  return true;
}

function makePlayer(save: Save): Fighter {
  const d = derive(save);
  return {
    id: "player",
    name: save.name || "Caçador",
    subtitle: "Você",
    side: "ally",
    hp: d.maxHp,
    maxHp: d.maxHp,
    mp: d.maxMp,
    maxMp: d.maxMp,
    atk: d.atk,
    def: d.def,
    crit: d.crit,
    dodge: d.dodge,
    guard: false,
    fear: 0,
    veil: 0,
    stun: 0,
    boss: false,
    shadow: false,
  };
}

function makeShadow(save: Save, gateId: string): Fighter | null {
  const owned = save.shadows.find((s) => s.gateId === gateId);
  const gate = gateById(gateId);
  if (!owned || !gate) return null;
  const p = passives(save.level);
  const base = shadowStats(owned);
  return {
    id: `shadow-${gateId}`,
    name: gate.boss.name,
    subtitle: gate.boss.role,
    side: "ally",
    hp: Math.round(base.hp * p.shadowHp),
    maxHp: Math.round(base.hp * p.shadowHp),
    mp: 0,
    maxMp: 0,
    atk: Math.round(base.atk * p.shadowAtk),
    def: base.def,
    crit: 0.08,
    dodge: 0.04,
    guard: false,
    fear: 0,
    veil: 0,
    stun: 0,
    boss: false,
    shadow: true,
  };
}

function makeEnemy(def: { name: string; hp: number; atk: number; def: number }, boss: boolean, subtitle: string): Fighter {
  return {
    id: uid(boss ? "boss" : "mob"),
    name: def.name,
    subtitle,
    side: "enemy",
    hp: def.hp,
    maxHp: def.hp,
    mp: 0,
    maxMp: 0,
    atk: def.atk,
    def: def.def,
    crit: boss ? 0.08 : 0.04,
    dodge: 0,
    guard: false,
    fear: 0,
    veil: 0,
    stun: 0,
    boss,
    shadow: false,
  };
}

function party(save: Save): Fighter[] {
  const shadows = save.deployed
    .map((id) => makeShadow(save, id))
    .filter((f): f is Fighter => !!f);
  return [makePlayer(save), ...shadows];
}

export function startGate(save: Save, gateId: string): Battle | null {
  const gate = gateById(gateId);
  if (!gate) return null;
  const wave = gate.waves[0]!;
  const count = wave.count ?? 1;
  const mobs = Array.from({ length: count }, () => makeEnemy(wave, false, "Inimigo"));
  const fighters = [...party(save), ...mobs];
  const battle: Battle = {
    kind: "gate",
    gateId,
    title: gate.name,
    phase: "fight",
    fighters,
    log: [],
    logSeq: 0,
    turn: 1,
    wave: "mobs",
    hunterLevel: save.level,
    targetId: mobs[0]?.id ?? null,
    flashId: null,
    resolved: false,
    extractName: gate.boss.name,
  };
  push(battle, `${gate.place} O portão aceita a sua entrada.`, "info");
  return battle;
}

export function startRankTrial(save: Save): Battle | null {
  const target = nextRank(save.rank);
  if (!target) return null;
  const exam = examinerFor(target);
  if (!exam) return null;
  const enemy = makeEnemy(exam, true, exam.epithet);
  const battle: Battle = {
    kind: "rank",
    title: exam.epithet,
    phase: "fight",
    fighters: [...party(save), enemy],
    log: [],
    logSeq: 0,
    turn: 1,
    wave: "boss",
    hunterLevel: save.level,
    targetId: enemy.id,
    flashId: null,
    resolved: false,
  };
  push(battle, `O sistema exige uma prova. ${exam.name} espera.`, "info");
  return battle;
}

export function startPenalty(save: Save): Battle {
  const d = derive(save);
  const jailer = makeEnemy(
    {
      name: "Carcereiro do Sistema",
      hp: Math.round(d.maxHp * 0.95 + 40),
      atk: Math.round(d.atk * 0.72),
      def: Math.round(d.def * 0.85),
    },
    true,
    "Penalidade",
  );
  const adds = makeEnemy(
    {
      name: "Corrente",
      hp: Math.round(d.maxHp * 0.28),
      atk: Math.round(d.atk * 0.35),
      def: Math.round(d.def * 0.4),
    },
    false,
    "Punição",
  );
  const battle: Battle = {
    kind: "penalty",
    title: "Zona de Penalidade",
    phase: "fight",
    fighters: [...party(save), adds, jailer],
    log: [],
    logSeq: 0,
    turn: 1,
    wave: "boss",
    hunterLevel: save.level,
    targetId: adds.id,
    flashId: null,
    resolved: false,
  };
  push(battle, "Missões diárias ignoradas. O sistema cobra em sangue.", "bad");
  return battle;
}

export function activeSkills(level: number) {
  return skillsAt(level).filter((s) => s.kind === "active");
}
