import type { Vec2, EnemyKind } from '../types';

export interface EnemyEntity {
  id: number;
  type: string;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  xp: number;
  size: number;
  color: string;
  slowTimer: number;
  slowFactor: number;
  stunTimer: number;
  hitFlash: number;
  hitCount: number;
  lastHitTime: number;
  marked: boolean;
  burningTimer: number;
  knockbackX: number;
  knockbackY: number;
  attackCooldown: number;
  slamTimer: number;
  isSlamming: boolean;
  active: boolean;
}

export interface ProjectileEntity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  pierce: number;
  hitList: number[];
  homing: boolean;
  targetId: number;
  range: number;
  traveled: number;
  size: number;
  color: string;
  crit: boolean;
  slowFactor: number;
  slowDuration: number;
  isExplosion: boolean;
  explosionRadius: number;
  isOrbit: boolean;
  orbitAngle: number;
  orbitRadius: number;
  orbitOwner: number;
  orbitSpeed: number;
  tickTimer: number;
  tickDamage: number;
  tickHitList: number[];
  trail: Vec2[];
  isChakram: boolean;
  chakramPhase: 'out' | 'back';
  isHound: boolean;
  isJavelin: boolean;
  isArrow: boolean;
  isFrost: boolean;
  isLightning: boolean;
  chainTargets: number[];
  active: boolean;
}

export interface ParticleEntity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  active: boolean;
  text?: string;
  isText: boolean;
}

export interface XPOrbEntity {
  id: number;
  x: number;
  y: number;
  value: number;
  active: boolean;
  vx: number;
  vy: number;
  attracted: boolean;
}

export interface GoldOrbEntity {
  id: number;
  x: number;
  y: number;
  value: number;
  active: boolean;
  vx: number;
  vy: number;
  attracted: boolean;
}

export interface ChestEntity {
  id: number;
  x: number;
  y: number;
  active: boolean;
}

export interface Pool<T> {
  items: T[];
  nextId: number;
  create: () => T;
}

export function createPool<T extends { id: number; active: boolean }>(createFn: () => T): Pool<T> {
  return { items: [], nextId: 1, create: createFn };
}

export function getFromPool<T extends { id: number; active: boolean }>(pool: Pool<T>): T {
  for (let i = 0; i < pool.items.length; i++) {
    if (!pool.items[i].active) {
      pool.items[i].active = true;
      return pool.items[i];
    }
  }
  const item = pool.create();
  item.id = pool.nextId++;
  item.active = true;
  pool.items.push(item);
  return item;
}

export function releaseItem<T extends { active: boolean }>(item: T): void {
  item.active = false;
}
