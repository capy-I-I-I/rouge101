import type { EnemyConfig, QuestConfig } from '../types';

export const ENEMIES: Record<string, EnemyConfig> = {
  shambler: {
    id: 'shambler',
    name: 'Shambler',
    hp: 14,
    speed: 44,
    damage: 6,
    xp: 3,
    size: 32,
    color: '#5a8a3a',
  },
  cryptHound: {
    id: 'cryptHound',
    name: 'Crypt Hound',
    hp: 9,
    speed: 110,
    damage: 4,
    xp: 4,
    size: 32,
    color: '#884422',
  },
};

export const TIER_MULTIPLIERS = {
  normal: { hp: 1, damage: 1, speed: 1 },
  veteran: { hp: 1.8, damage: 1.4, speed: 1.12 },
  elite: { hp: 3.2, damage: 1.9, speed: 1.25 },
};

export interface BossConfig {
  id: string;
  name: string;
  hp: number;
  damage: number;
  speed: number;
  size: number;
  xp: number;
  color: string;
  type: 'miniBoss' | 'boss';
}

export const BOSSES: Record<string, BossConfig> = {
  wretchedBrute: {
    id: 'wretchedBrute',
    name: 'Wretched Brute',
    hp: 420,
    damage: 16,
    speed: 55,
    size: 64,
    xp: 50,
    color: '#7a3a8a',
    type: 'miniBoss',
  },
  cryptTyrant: {
    id: 'cryptTyrant',
    name: 'Crypt Tyrant',
    hp: 1200,
    damage: 26,
    speed: 45,
    size: 64,
    xp: 200,
    color: '#aa2244',
    type: 'boss',
  },
};

export const ARENA_SIZE = 1800;

export function enemyHP(base: number, minutes: number): number {
  const exp = Math.min(1.6, 1.2 + 0.05 * Math.floor(minutes / 5));
  return base * Math.pow(1 + 0.06 * minutes, exp);
}

export function enemyDamage(base: number, minutes: number): number {
  const exp = Math.min(1.7, 1.25 + 0.05 * Math.floor(minutes / 5));
  return base * Math.pow(1 + 0.05 * minutes, exp);
}

export function enemySpeed(base: number, minutes: number): number {
  return base * Math.min(1.25, 1 + 0.005 * minutes);
}

export function spawnRate(minutes: number): number {
  const effective = Math.max(0, minutes - 0.5);
  return 0.25 + 0.34 * effective;
}

export function dangerLevel(seconds: number): number {
  return Math.floor(seconds / 35) + 1;
}
