import type { SaveData, TomeInstance, ActiveWeapon } from '../types';
import { getTome } from '../config/tomes';
import { getRelic } from '../config/relics';
import { getClass } from '../config/classes';
import { getWeapon } from '../config/weapons';

export interface PlayerStats {
  maxHp: number;
  currentHp: number;
  moveSpeed: number;
  damageMult: number;
  attackSpeedMult: number;
  areaMult: number;
  rangeMult: number;
  critChance: number;
  critDamage: number;
  armor: number;
  dodge: number;
  thorns: number;
  xpGainMult: number;
  goldGainMult: number;
  pickupRadius: number;
  lifesteal: number;
  luck: number;
  hpRegen: number;
  projectileBonus: number;
  pierceBonus: number;
  executioner: number;
  eliteHunter: number;
  bonebreaker: number;
  marked: number;
  opportunist: number;
  undying: number;
  vampiricEdge: number;
  hoarder: number;
  adaptiveArmor: number;
  bulwark: number;
}

export interface GameState {
  save: SaveData;
  classId: string;
  tomes: TomeInstance[];
  relics: string[];
  weapons: ActiveWeapon[];
  stats: PlayerStats;
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  kills: number;
  damageDealt: number;
  damageTaken: number;
  bossesDefeated: number;
  survivalTime: number;
  dangerLevel: number;
  frenzyStacks: number;
  frenzyTimer: number;
  momentumStillTimer: number;
  bloodCultistCd: number;
  bloodCultistActive: number;
  secondWindUsed: boolean;
  phoenixAshUsed: boolean;
  shield: number;
  shieldTimer: number;
  relicTimers: Record<string, number>;
  upgradeLog: { name: string; rarity: string; type: 'tome' | 'relic'; stack: number }[];
}

function baseStatsForClass(classId: string): PlayerStats {
  const cls = getClass(classId);
  let armor = cls.armor;
  let areaMult = 1;
  let critChance = 5;
  let lifesteal = 0;

  if (classId === 'mage') areaMult = 1.10;
  if (classId === 'ranger') critChance = 20;
  if (classId === 'necromancer') lifesteal = 0.12;
  if (classId === 'frostWarden') { /* handled in combat */ }

  return {
    maxHp: cls.hp,
    currentHp: cls.hp,
    moveSpeed: cls.speed * 47,
    damageMult: 1,
    attackSpeedMult: 1,
    areaMult,
    rangeMult: 1,
    critChance,
    critDamage: 50,
    armor,
    dodge: 0,
    thorns: 0,
    xpGainMult: 1,
    goldGainMult: 1,
    pickupRadius: 70,
    lifesteal,
    luck: 0,
    hpRegen: 0,
    projectileBonus: 0,
    pierceBonus: 0,
    executioner: 0,
    eliteHunter: 0,
    bonebreaker: 0,
    marked: 0,
    opportunist: 0,
    undying: 0,
    vampiricEdge: 0,
    hoarder: 0,
    adaptiveArmor: 0,
    bulwark: 0,
  };
}

export function computeStats(tomes: TomeInstance[], relics: string[], base: PlayerStats): PlayerStats {
  const s = { ...base };
  for (const t of tomes) {
    const cfg = getTome(t.id);
    if (!cfg) continue;
    const val = cfg.tiers[t.tierIndex].value;
    switch (cfg.stat) {
      case 'damage': s.damageMult += val / 100; break;
      case 'attackSpeed': s.attackSpeedMult *= (1 - val / 100); break;
      case 'maxHp': s.maxHp += s.maxHp * val / 100; break;
      case 'moveSpeed': s.moveSpeed *= 1 + val / 100; break;
      case 'attackRange': s.rangeMult *= 1 + val / 100; break;
      case 'hpRegen': s.hpRegen += val; break;
      case 'areaSize': s.areaMult *= 1 + val / 100; break;
      case 'projectileCount': s.projectileBonus += val; break;
      case 'pierce': s.pierceBonus += val; break;
      case 'critChance': s.critChance += val; break;
      case 'critDamage': s.critDamage += val; break;
      case 'armor': s.armor += val; break;
      case 'dodge': s.dodge += val; break;
      case 'thorns': s.thorns += val; break;
      case 'xpGain': s.xpGainMult *= 1 + val / 100; break;
      case 'pickupRadius': s.pickupRadius *= 1 + val / 100; break;
      case 'luck': s.luck += val; break;
      case 'goldGain': s.goldGainMult *= 1 + val / 100; break;
      case 'lifesteal': s.lifesteal += val / 100; break;
      case 'executioner': s.executioner += val; break;
      case 'eliteHunter': s.eliteHunter += val; break;
      case 'bonebreaker': s.bonebreaker += val; break;
      case 'marked': s.marked += val; break;
      case 'opportunist': s.opportunist += val; break;
      case 'undying': s.undying += val; break;
      case 'vampiricEdge': s.vampiricEdge += val; break;
      case 'hoarder': s.hoarder += val; break;
      case 'adaptiveArmor': s.adaptiveArmor = val; break;
      case 'bulwark': s.bulwark = val; break;
    }
  }

  for (const rId of relics) {
    const r = getRelic(rId);
    if (!r) continue;
    switch (rId) {
      case 'glassCannon': s.damageMult += 0.25; s.maxHp *= 0.80; break;
      case 'overcharge': s.areaMult *= 1.30; s.attackSpeedMult *= 1.15; break;
      case 'goldRush': s.goldGainMult *= 1.40; s.xpGainMult *= 0.80; break;
      case 'recklessMomentum': s.moveSpeed *= 1.20; s.armor = Math.max(0, s.armor - 0.15); break;
      case 'vampiresCurse': s.lifesteal += 0.30; s.maxHp *= 0.70; break;
    }
  }

  if (s.currentHp > s.maxHp) s.currentHp = s.maxHp;
  return s;
}

export function createGameState(
  save: SaveData,
  classId: string,
  tomes: TomeInstance[],
  relics: string[],
  weapons: ActiveWeapon[],
): GameState {
  const cls = getClass(classId);
  const base = baseStatsForClass(classId);
  const stats = computeStats(tomes, relics, base);
  const startingWeapon: ActiveWeapon = {
    id: cls.startingWeaponId,
    tier: 0,
    cooldownTimer: 0,
  };
  return {
    save,
    classId,
    tomes,
    relics,
    weapons: [startingWeapon, ...weapons.filter(w => w.id !== cls.startingWeaponId)],
    stats,
    level: 1,
    xp: 0,
    xpToNext: 10,
    gold: 0,
    kills: 0,
    damageDealt: 0,
    damageTaken: 0,
    bossesDefeated: 0,
    survivalTime: 0,
    dangerLevel: 1,
    frenzyStacks: 0,
    frenzyTimer: 0,
    momentumStillTimer: 0,
    bloodCultistCd: 0,
    bloodCultistActive: 0,
    secondWindUsed: false,
    phoenixAshUsed: false,
    shield: 0,
    shieldTimer: 0,
    relicTimers: {},
    upgradeLog: [],
  };
}

export function weaponDamage(weapon: ActiveWeapon, stats: PlayerStats, classId: string): number {
  const cfg = getWeapon(weapon.id);
  let dmg = cfg.baseDamage * stats.damageMult;
  if (weapon.tier > 0) {
    const tierMults = [1, 1, 1.2, 1.4, 1.65, 1.95];
    dmg *= tierMults[Math.min(weapon.tier, 5)];
  }
  if (classId === 'berserker') {
    const missingPct = 1 - stats.currentHp / stats.maxHp;
    dmg *= 1 + Math.min(0.40, missingPct);
  }
  if (classId === 'frostWarden') {
    // +10% to slowed enemies handled in damage application
  }
  return dmg;
}

export function weaponCooldown(weapon: ActiveWeapon, stats: PlayerStats): number {
  const cfg = getWeapon(weapon.id);
  let cd = cfg.baseCooldown * stats.attackSpeedMult;
  return cd;
}

export function weaponRange(weapon: ActiveWeapon, stats: PlayerStats): number {
  const cfg = getWeapon(weapon.id);
  return cfg.range * stats.rangeMult;
}

export function weaponArea(weapon: ActiveWeapon, stats: PlayerStats): number {
  const cfg = getWeapon(weapon.id);
  return cfg.area * stats.areaMult;
}
