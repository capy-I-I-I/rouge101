export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type EnemyType = 'shambler' | 'cryptHound';
export type EnemyTier = 'normal' | 'veteran' | 'elite';
export type EnemyKind = 'normal' | 'veteran' | 'elite' | 'miniBoss' | 'boss';

export interface Vec2 { x: number; y: number }

export interface TomeTier { rarity: Rarity; value: number }
export interface TomeConfig {
  id: string;
  name: string;
  description: string;
  stat: StatKey;
  mode: 'additive' | 'flat' | 'multiplier';
  tiers: TomeTier[];
  cost: number;
  quest: string;
  free: boolean;
  flavor: string;
}

export interface RelicConfig {
  id: string;
  name: string;
  description: string;
  cost: number;
  quest: string;
  free: boolean;
  flavor: string;
  category: 'proc' | 'timer' | 'oneshot' | 'tradeoff';
}

export interface WeaponConfig {
  id: string;
  name: string;
  description: string;
  baseDamage: number;
  baseCooldown: number;
  range: number;
  area: number;
  cost: number;
  quest: string;
  free: boolean;
  flavor: string;
  type: 'melee' | 'ranged' | 'orbit' | 'summon' | 'aoe' | 'line' | 'thrown';
  projectileCount?: number;
  pierce?: number;
  homing?: boolean;
  tickRate?: number;
  shopOnly?: boolean;
}

export interface ClassConfig {
  id: string;
  name: string;
  description: string;
  hp: number;
  speed: number;
  damage: number;
  armor: number;
  passive: string;
  startingWeaponId: string;
  cost: number;
  quest: string;
  free: boolean;
  color: string;
}

export interface EnemyConfig {
  id: EnemyType;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  xp: number;
  size: number;
  color: string;
}

export interface QuestConfig {
  id: string;
  name: string;
  description: string;
  target: number;
  type: 'kills' | 'survival' | 'stat' | 'cumulative';
  statKey?: string;
  reward: { type: 'class' | 'tome' | 'relic' | 'weapon'; id: string };
}

export type StatKey =
  | 'damage' | 'attackSpeed' | 'maxHp' | 'moveSpeed' | 'attackRange'
  | 'hpRegen' | 'areaSize' | 'projectileCount' | 'pierce' | 'critChance'
  | 'critDamage' | 'armor' | 'dodge' | 'thorns' | 'xpGain' | 'pickupRadius'
  | 'luck' | 'goldGain' | 'lifesteal' | 'executioner' | 'eliteHunter'
  | 'bonebreaker' | 'marked' | 'opportunist' | 'undying' | 'vampiricEdge'
  | 'hoarder' | 'adaptiveArmor' | 'bulwark';

export interface RunStats {
  survivalTime: number;
  kills: number;
  damageDealt: number;
  damageTaken: number;
  goldEarned: number;
  xpEarned: number;
  level: number;
  dangerLevel: number;
  bossesDefeated: number;
  classId: string;
  date: string;
}

export interface AllTimeStats {
  bestSurvivalTime: number;
  bestSurvivalDate: string;
  totalRuns: number;
  totalKills: number;
  totalDamage: number;
  totalGoldEarned: number;
  highestDangerLevel: number;
  highestLevel: number;
  totalPlayTime: number;
  bossesDefeated: number;
  classUsage: Record<string, number>;
  recentRuns: RunStats[];
}

export interface SaveData {
  gold: number;
  unlockedClasses: string[];
  unlockedTomes: string[];
  unlockedRelics: string[];
  unlockedWeapons: string[];
  equippedTomes: string[];
  equippedRelics: string[];
  equippedWeapons: string[];
  questProgress: Record<string, number>;
  questCompleted: string[];
  allTimeStats: AllTimeStats;
  settings: GameSettings;
  playerName: string;
  autoSkip: boolean;
  autoChoose: boolean;
}

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  screenShake: boolean;
  damageNumbers: boolean;
  controls: Record<string, string>;
}

export interface TomeInstance {
  id: string;
  rarity: Rarity;
  tierIndex: number;
}

export interface ActiveWeapon {
  id: string;
  tier: number;
  cooldownTimer: number;
  lastTarget?: Vec2;
  extraData?: Record<string, unknown>;
}
