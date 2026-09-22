import type { GameState, PlayerStats } from './stats';
import type { SaveData, TomeInstance, ActiveWeapon, Rarity } from '../types';
import { createGameState, weaponDamage, weaponCooldown, weaponRange, weaponArea } from './stats';
import { createPool, getFromPool, releaseItem, type Pool } from './pool';
import type { EnemyEntity, ProjectileEntity, ParticleEntity, XPOrbEntity, GoldOrbEntity, ChestEntity } from './pool';
import { ENEMIES, BOSSES, TIER_MULTIPLIERS, ARENA_SIZE, enemyHP, enemyDamage, enemySpeed, spawnRate, dangerLevel as calcDanger } from '../config/enemies';
import { getWeapon } from '../config/weapons';
import { getTome } from '../config/tomes';
import { getClass } from '../config/classes';
import { computeStats } from './stats';

export interface GameCallbacks {
  onLevelUp: () => void;
  onShop: () => void;
  onChest: (chestId: number) => void;
  onDeath: () => void;
  onStateChange: (state: GameState) => void;
}

interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  state: GameState;
  callbacks: GameCallbacks;
  running = false;
  paused = false;
  lastTime = 0;
  cameraX = 0;
  cameraY = 0;
  shakeIntensity = 0;
  shakeTimer = 0;
  freezeTimer = 0;
  flashTimer = 0;
  playerX = ARENA_SIZE / 2;
  playerY = ARENA_SIZE / 2;
  playerVx = 0;
  playerVy = 0;
  input: InputState = { up: false, down: false, left: false, right: false };
  enemyPool: Pool<EnemyEntity>;
  projPool: Pool<ProjectileEntity>;
  particlePool: Pool<ParticleEntity>;
  xpPool: Pool<XPOrbEntity>;
  goldPool: Pool<GoldOrbEntity>;
  chestPool: Pool<ChestEntity>;
  spawnTimer = 0;
  bossTimer = 0;
  lastMiniBossDanger = 0;
  lastBossTime = 0;
  rafId = 0;
  width = 0;
  height = 0;
  chestIdCounter = 0;
  nextBossTime = 600;
  skipWaveCd = 0;
  pendingLevelUp = false;
  pendingShop = false;
  pendingChestId = -1;
  dead = false;
  levelUpFlashTimer = 0;
  relicTimerState: Record<string, number> = {};
  damageDpsWindow: number[] = [];
  dpsTimer = 0;
  currentDps = 0;
  bossEntity: EnemyEntity | null = null;
  miniBossEntity: EnemyEntity | null = null;

  constructor(canvas: HTMLCanvasElement, state: GameState, callbacks: GameCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.state = state;
    this.callbacks = callbacks;
    this.resize();
    this.enemyPool = createPool<EnemyEntity>(() => this.createEnemy());
    this.projPool = createPool<ProjectileEntity>(() => this.createProjectile());
    this.particlePool = createPool<ParticleEntity>(() => this.createParticle());
    this.xpPool = createPool<XPOrbEntity>(() => this.createXPOrb());
    this.goldPool = createPool<GoldOrbEntity>(() => this.createGoldOrb());
    this.chestPool = createPool<ChestEntity>(() => this.createChest());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  // --- Entity factory methods ---
  createEnemy(): EnemyEntity {
    return { id: 0, type: '', kind: 'normal', x: 0, y: 0, vx: 0, vy: 0, hp: 0, maxHp: 0, damage: 0, speed: 0, xp: 0, size: 32, color: '', slowTimer: 0, slowFactor: 0, stunTimer: 0, hitFlash: 0, hitCount: 0, lastHitTime: 0, marked: false, burningTimer: 0, knockbackX: 0, knockbackY: 0, attackCooldown: 0, slamTimer: 0, isSlamming: false, active: false };
  }
  createProjectile(): ProjectileEntity {
    return { id: 0, x: 0, y: 0, vx: 0, vy: 0, damage: 0, pierce: 0, hitList: [], homing: false, targetId: 0, range: 0, traveled: 0, size: 16, color: '#fff', crit: false, slowFactor: 0, slowDuration: 0, isExplosion: false, explosionRadius: 0, isOrbit: false, orbitAngle: 0, orbitRadius: 0, orbitOwner: 0, orbitSpeed: 0, tickTimer: 0, tickDamage: 0, tickHitList: [], trail: [], isChakram: false, chakramPhase: 'out', isHound: false, isJavelin: false, isArrow: false, isFrost: false, isLightning: false, chainTargets: [], active: false };
  }
  createParticle(): ParticleEntity {
    return { id: 0, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, color: '', size: 4, active: false, isText: false };
  }
  createXPOrb(): XPOrbEntity {
    return { id: 0, x: 0, y: 0, value: 0, active: false, vx: 0, vy: 0, attracted: false };
  }
  createGoldOrb(): GoldOrbEntity {
    return { id: 0, x: 0, y: 0, value: 0, active: false, vx: 0, vy: 0, attracted: false };
  }
  createChest(): ChestEntity {
    return { id: 0, x: 0, y: 0, active: false };
  }

  // --- Input ---
  setKey(key: string, pressed: boolean) {
    const k = key.toLowerCase();
    const controls = this.state.save.settings.controls;
    if (k === controls.up || k === 'arrowup') this.input.up = pressed;
    if (k === controls.down || k === 'arrowdown') this.input.down = pressed;
    if (k === controls.left || k === 'arrowleft') this.input.left = pressed;
    if (k === controls.right || k === 'arrowright') this.input.right = pressed;
  }

  // --- Spawning ---
  spawnEnemy() {
    const minutes = this.state.survivalTime / 60;
    const rng = Math.random();
    const type = rng < 0.6 ? 'shambler' : 'cryptHound';
    const base = ENEMIES[type];
    let kind: EnemyEntity['kind'] = 'normal';
    const tierRoll = Math.random();
    if (minutes > 2 && tierRoll < 0.08 + Math.min(0.15, minutes * 0.005)) kind = 'elite';
    else if (minutes > 1 && tierRoll < 0.25 + Math.min(0.25, minutes * 0.01)) kind = 'veteran';
    const tier = TIER_MULTIPLIERS[kind === 'elite' ? 'elite' : kind === 'veteran' ? 'veteran' : 'normal'];
    const enemy = getFromPool(this.enemyPool);
    enemy.type = type;
    enemy.kind = kind;
    enemy.maxHp = enemyHP(base.hp * tier.hp, minutes);
    enemy.hp = enemy.maxHp;
    enemy.damage = enemyDamage(base.damage * tier.damage, minutes);
    enemy.speed = enemySpeed(base.speed * tier.speed, minutes);
    enemy.xp = base.xp * (kind === 'elite' ? 5 : kind === 'veteran' ? 2.5 : 1);
    enemy.size = base.size;
    enemy.color = base.color;
    enemy.slowTimer = 0;
    enemy.slowFactor = 0;
    enemy.stunTimer = 0;
    enemy.hitFlash = 0;
    enemy.hitCount = 0;
    enemy.lastHitTime = 0;
    enemy.marked = false;
    enemy.burningTimer = 0;
    enemy.knockbackX = 0;
    enemy.knockbackY = 0;
    enemy.attackCooldown = 0;
    enemy.slamTimer = 0;
    enemy.isSlamming = false;

    // spawn at arena edge near player
    const angle = Math.random() * Math.PI * 2;
    const dist = 400 + Math.random() * 200;
    enemy.x = Math.max(20, Math.min(ARENA_SIZE - 20, this.playerX + Math.cos(angle) * dist));
    enemy.y = Math.max(20, Math.min(ARENA_SIZE - 20, this.playerY + Math.sin(angle) * dist));
  }

  spawnBoss(bossKey: string) {
    const cfg = BOSSES[bossKey];
    if (!cfg) return;
    const minutes = this.state.survivalTime / 60;
    const enemy = getFromPool(this.enemyPool);
    enemy.type = cfg.id;
    enemy.kind = cfg.type === 'boss' ? 'boss' : 'miniBoss';
    enemy.maxHp = enemyHP(cfg.hp, minutes);
    enemy.hp = enemy.maxHp;
    enemy.damage = enemyDamage(cfg.damage, minutes);
    enemy.speed = enemySpeed(cfg.speed, minutes);
    enemy.xp = cfg.xp;
    enemy.size = cfg.size;
    enemy.color = cfg.color;
    enemy.slowTimer = 0;
    enemy.slowFactor = 0;
    enemy.stunTimer = 0;
    enemy.hitFlash = 0;
    enemy.hitCount = 0;
    enemy.lastHitTime = 0;
    enemy.marked = false;
    enemy.burningTimer = 0;
    enemy.knockbackX = 0;
    enemy.knockbackY = 0;
    enemy.attackCooldown = 0;
    enemy.slamTimer = 2.0;
    enemy.isSlamming = false;

    const angle = Math.random() * Math.PI * 2;
    enemy.x = Math.max(50, Math.min(ARENA_SIZE - 50, this.playerX + Math.cos(angle) * 300));
    enemy.y = Math.max(50, Math.min(ARENA_SIZE - 50, this.playerY + Math.sin(angle) * 300));

    if (cfg.type === 'boss') this.bossEntity = enemy;
    else this.miniBossEntity = enemy;
  }

  spawnChest() {
    const chest = getFromPool(this.chestPool);
    chest.x = Math.max(40, Math.min(ARENA_SIZE - 40, this.playerX + (Math.random() - 0.5) * 200));
    chest.y = Math.max(40, Math.min(ARENA_SIZE - 40, this.playerY + (Math.random() - 0.5) * 200));
  }

  // --- Particles ---
  spawnParticle(x: number, y: number, color: string, count = 1, spread = 50, size = 4) {
    for (let i = 0; i < count; i++) {
      const p = getFromPool(this.particlePool);
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * spread + 10;
      p.x = x; p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 0.5 + Math.random() * 0.3;
      p.maxLife = p.life;
      p.color = color;
      p.size = size;
      p.isText = false;
    }
  }

  spawnDamageNumber(x: number, y: number, dmg: number, crit: boolean) {
    if (!this.state.save.settings.damageNumbers) return;
    const p = getFromPool(this.particlePool);
    p.x = x + (Math.random() - 0.5) * 20;
    p.y = y;
    p.vx = (Math.random() - 0.5) * 30;
    p.vy = -60 - Math.random() * 20;
    p.life = 0.8;
    p.maxLife = 0.8;
    p.color = crit ? '#ff3333' : '#ffdd44';
    p.size = crit ? 18 : 14;
    p.text = String(Math.floor(dmg));
    p.isText = true;
  }

  spawnDeathParticles(x: number, y: number, color: string) {
    this.spawnParticle(x, y, color, 8, 80, 5);
    this.spawnParticle(x, y, '#999999', 4, 60, 3);
  }

  // --- Combat ---
  dealDamageToEnemy(enemy: EnemyEntity, baseDmg: number, isCrit: boolean, weaponId: string) {
    let dmg = baseDmg;
    const stats = this.state.stats;
    if (isCrit) dmg *= (1 + stats.critDamage / 100);

    // Conditional damage bonuses
    const hpPct = enemy.hp / enemy.maxHp;
    if (hpPct < 0.2 && stats.executioner > 0) dmg *= 1 + stats.executioner / 100;
    if ((enemy.kind === 'veteran' || enemy.kind === 'elite') && stats.eliteHunter > 0) dmg *= 1 + stats.eliteHunter / 100;
    if (hpPct >= 1 && stats.bonebreaker > 0) dmg *= 1 + stats.bonebreaker / 100;
    if (enemy.slowTimer > 0 && stats.opportunist > 0) dmg *= 1 + stats.opportunist / 100;

    // Marked for death: 3 hits in 2s
    const now = this.state.survivalTime;
    if (enemy.lastHitTime > 0 && now - enemy.lastHitTime < 2) {
      enemy.hitCount++;
      if (enemy.hitCount >= 3) enemy.marked = true;
    } else {
      enemy.hitCount = 1;
    }
    enemy.lastHitTime = now;
    if (enemy.marked && stats.marked > 0) dmg *= 1 + stats.marked / 100;

    // Frenzy relic
    if (this.state.relics.includes('frenzy')) {
      dmg *= 1 + this.state.frenzyStacks * 0.02;
    }

    // Momentum Breaker
    if (this.state.relics.includes('momentumBreaker')) {
      if (this.state.momentumStillTimer >= 2) dmg *= 1.30;
      else dmg *= 0.80;
    }

    enemy.hp -= dmg;
    enemy.hitFlash = 0.1;
    this.state.damageDealt += dmg;
    this.damageDpsWindow.push(dmg);
    this.spawnDamageNumber(enemy.x, enemy.y, dmg, isCrit);

    // Lifesteal
    if (stats.lifesteal > 0) {
      const heal = dmg * stats.lifesteal;
      this.state.stats.currentHp = Math.min(this.state.stats.maxHp, this.state.stats.currentHp + heal);
    }

    // Vampiric Edge (crit heal)
    if (isCrit && stats.vampiricEdge > 0) {
      this.state.stats.currentHp = Math.min(this.state.stats.maxHp, this.state.stats.currentHp + dmg * stats.vampiricEdge / 100);
    }

    // Slow Field relic
    if (this.state.relics.includes('slowField')) {
      enemy.slowTimer = 1.5;
      enemy.slowFactor = 0.15;
    }

    // Frost Warden weapon slow
    if (weaponId === 'rimeShard') {
      enemy.slowTimer = 2.0;
      enemy.slowFactor = 0.20;
    }
    if (weaponId === 'rimeShard' && this.state.classId === 'frostWarden') {
      dmg *= 1.10;
    }

    // Chain Spark relic
    if (isCrit && this.state.relics.includes('chainSpark') && Math.random() < 0.20) {
      const nearby = this.findNearestEnemies(enemy.x, enemy.y, 150, [enemy.id]);
      if (nearby.length > 0) {
        this.dealDamageToEnemy(nearby[0], dmg * 0.5, false, weaponId);
      }
    }

    // Explosive Kills relic
    if (enemy.hp <= 0 && this.state.relics.includes('explosiveKills') && Math.random() < 0.20) {
      this.createExplosion(enemy.x, enemy.y, 60, dmg * 0.5, '#ff8822');
    }

    if (enemy.hp <= 0) {
      this.killEnemy(enemy, weaponId);
    }
  }

  killEnemy(enemy: EnemyEntity, weaponId: string) {
    if (!enemy.active) return;
    this.spawnDeathParticles(enemy.x, enemy.y, enemy.color);
    this.state.kills++;

    // XP orb
    const xpVal = enemy.xp * this.state.stats.xpGainMult;
    const orb = getFromPool(this.xpPool);
    orb.x = enemy.x;
    orb.y = enemy.y;
    orb.value = xpVal;
    orb.vx = (Math.random() - 0.5) * 40;
    orb.vy = (Math.random() - 0.5) * 40;
    orb.attracted = false;

    // Gold orb
    const hasScavenger = this.state.relics.includes('scavenger');
    const goldVal = Math.ceil((enemy.kind === 'elite' ? 5 : enemy.kind === 'veteran' ? 2 : 1) * this.state.stats.goldGainMult * (hasScavenger && Math.random() < 0.18 ? 2 : 1));
    const goldOrb = getFromPool(this.goldPool);
    goldOrb.x = enemy.x;
    goldOrb.y = enemy.y;
    goldOrb.value = goldVal;
    goldOrb.vx = (Math.random() - 0.5) * 40;
    goldOrb.vy = (Math.random() - 0.5) * 40;
    goldOrb.attracted = false;

    // Frenzy relic stacking
    if (this.state.relics.includes('frenzy')) {
      this.state.frenzyStacks = Math.min(10, this.state.frenzyStacks + 1);
      this.state.frenzyTimer = 4;
    }

    // Soul Harvest
    if (this.state.relics.includes('soulHarvest') && Math.random() < 0.15) {
      this.state.stats.currentHp = Math.min(this.state.stats.maxHp, this.state.stats.currentHp + this.state.stats.maxHp * 0.01);
    }

    // Reaper's Bargain
    if (this.state.relics.includes('reapersBargain') && Math.random() < 0.20) {
      const lowHpEnemy = this.enemyPool.items.find(e => e.active && e.id !== enemy.id && e.hp < e.maxHp * 0.2);
      if (lowHpEnemy) {
        this.dealDamageToEnemy(lowHpEnemy, lowHpEnemy.hp + 1, false, weaponId);
      }
    }

    // Momentum Surge
    if (this.state.relics.includes('momentumSurge') && (enemy.kind === 'veteran' || enemy.kind === 'elite')) {
      const stacks = (this.state.relicTimers['momentumSurge_count'] ?? 0) + 1;
      this.state.relicTimers['momentumSurge_count'] = Math.min(2, stacks);
      this.state.relicTimers['momentumSurge'] = 6;
    }

    // Pyromancer burning patch
    if (this.state.classId === 'pyromancer') {
      enemy.burningTimer = 2;
      // burning patch handled by leaving a short-lived particle marker
    }

    // Boss kill
    if (enemy.kind === 'boss' || enemy.kind === 'miniBoss') {
      this.state.bossesDefeated++;
      this.spawnChest();
      if (enemy.kind === 'boss') {
        this.bossEntity = null;
        this.spawnChest();
      } else {
        this.miniBossEntity = null;
      }
      this.shake(15, 0.5);
    }

    releaseItem(enemy);
  }

  createExplosion(x: number, y: number, radius: number, dmg: number, color: string) {
    const p = getFromPool(this.projPool);
    p.x = x; p.y = y; p.vx = 0; p.vy = 0;
    p.damage = dmg; p.pierce = 999;
    p.hitList = [];
    p.isExplosion = true;
    p.explosionRadius = radius;
    p.size = radius;
    p.color = color;
    p.homing = false;
    p.range = 0;
    p.traveled = 0;
    p.crit = false;
    p.isOrbit = false;
    p.isChakram = false;
    p.isHound = false;
    p.isJavelin = false;
    p.isArrow = false;
    p.isFrost = false;
    p.isLightning = false;
    p.tickTimer = 0.2;
    p.tickDamage = dmg;
    p.tickHitList = [];
    p.trail = [];
    this.spawnParticle(x, y, color, 12, 100, 6);
  }

  findNearestEnemies(x: number, y: number, range: number, exclude: number[], limit = 1): EnemyEntity[] {
    const result: EnemyEntity[] = [];
    for (const e of this.enemyPool.items) {
      if (!e.active || exclude.includes(e.id)) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      if (dx * dx + dy * dy < range * range) {
        result.push(e);
        if (result.length >= limit) break;
      }
    }
    return result;
  }

  findFurthestEnemy(x: number, y: number, range: number): EnemyEntity | null {
    let furthest: EnemyEntity | null = null;
    let maxDist = 0;
    for (const e of this.enemyPool.items) {
      if (!e.active) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const d = dx * dx + dy * dy;
      if (d > maxDist && d < range * range) {
        maxDist = d;
        furthest = e;
      }
    }
    return furthest;
  }

  findNearestEnemy(x: number, y: number, range: number): EnemyEntity | null {
    let nearest: EnemyEntity | null = null;
    let minDist = Infinity;
    for (const e of this.enemyPool.items) {
      if (!e.active) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const d = dx * dx + dy * dy;
      if (d < minDist && d < range * range) {
        minDist = d;
        nearest = e;
      }
    }
    return nearest;
  }

  // --- Weapon firing ---
  fireWeapon(weapon: ActiveWeapon, dt: number) {
    const cfg = getWeapon(weapon.id);
    weapon.cooldownTimer -= dt;
    if (weapon.cooldownTimer > 0) return;
    weapon.cooldownTimer = weaponCooldown(weapon, this.state.stats);

    const px = this.playerX;
    const py = this.playerY;
    const range = weaponRange(weapon, this.state.stats);
    const area = weaponArea(weapon, this.state.stats);
    const dmg = weaponDamage(weapon, this.state.stats, this.state.classId);
    const projCount = (cfg.projectileCount ?? 1) + this.state.stats.projectileBonus;
    const pierce = (cfg.pierce ?? 0) + this.state.stats.pierceBonus;
    const crit = Math.random() < this.state.stats.critChance / 100;

    switch (cfg.type) {
      case 'melee': {
        const enemies = this.findNearestEnemies(px, py, range, [], 99);
        for (const e of enemies) {
          const isCrit = Math.random() < this.state.stats.critChance / 100;
          this.dealDamageToEnemy(e, dmg, isCrit, weapon.id);
          if (weapon.id === 'twinCleavers') {
            const isCrit2 = Math.random() < this.state.stats.critChance / 100;
            this.dealDamageToEnemy(e, dmg, isCrit2, weapon.id);
          }
        }
        this.spawnParticle(px, py, '#dddddd', 3, 30, 3);
        break;
      }
      case 'ranged': {
        const target = this.findNearestEnemy(px, py, range);
        if (target) {
          const angle = Math.atan2(target.y - py, target.x - px);
          for (let i = 0; i < projCount; i++) {
            const spread = (i - (projCount - 1) / 2) * 0.15;
            this.spawnProjectile(px, py, angle + spread, dmg, pierce, cfg, weapon.id, crit);
          }
        }
        break;
      }
      case 'line': {
        const target = this.findNearestEnemy(px, py, range);
        if (target) {
          const angle = Math.atan2(target.y - py, target.x - px);
          for (let i = 0; i < projCount; i++) {
            const spread = (i - (projCount - 1) / 2) * 0.1;
            const p = getFromPool(this.projPool);
            p.x = px; p.y = py;
            const speed = 600;
            p.vx = Math.cos(angle + spread) * speed;
            p.vy = Math.sin(angle + spread) * speed;
            p.damage = dmg;
            p.pierce = pierce;
            p.hitList = [];
            p.homing = false;
            p.targetId = 0;
            p.range = range;
            p.traveled = 0;
            p.size = 16;
            p.color = weapon.id === 'rimeShard' ? '#44ccff' : weapon.id === 'longbow' ? '#ccaa44' : '#ffffff';
            p.crit = Math.random() < this.state.stats.critChance / 100;
            p.isExplosion = false;
            p.isOrbit = false;
            p.isChakram = false;
            p.isHound = false;
            p.isJavelin = false;
            p.isArrow = weapon.id === 'longbow' || weapon.id === 'javelin';
            p.isFrost = weapon.id === 'rimeShard';
            p.isLightning = false;
            p.slowFactor = weapon.id === 'rimeShard' ? 0.20 : 0;
            p.slowDuration = weapon.id === 'rimeShard' ? 2 : 0;
            p.tickTimer = 0; p.tickDamage = 0; p.tickHitList = [];
            p.trail = [];
          }
        }
        break;
      }
      case 'orbit': {
        // Orbiting weapons: create orbit projectiles that persist
        if (weapon.id === 'fireBrazier') {
          const bladeCount = 3 + this.state.stats.projectileBonus;
          for (let i = 0; i < bladeCount; i++) {
            const p = getFromPool(this.projPool);
            const angle = (i / bladeCount) * Math.PI * 2;
            p.x = px + Math.cos(angle) * area;
            p.y = py + Math.sin(angle) * area;
            p.vx = 0; p.vy = 0;
            p.damage = dmg;
            p.pierce = 999;
            p.hitList = [];
            p.homing = false;
            p.isOrbit = true;
            p.orbitAngle = angle;
            p.orbitRadius = area;
            p.orbitOwner = 0;
            p.orbitSpeed = 3;
            p.tickTimer = cfg.tickRate ?? 0.5;
            p.tickDamage = dmg;
            p.tickHitList = [];
            p.range = 0; p.traveled = 0;
            p.size = 20;
            p.color = '#ff6622';
            p.crit = false;
            p.isExplosion = false;
            p.isChakram = false;
            p.isHound = false;
            p.isJavelin = false;
            p.isArrow = false;
            p.isFrost = false;
            p.isLightning = false;
            p.slowFactor = 0; p.slowDuration = 0;
            p.trail = [];
          }
        } else if (weapon.id === 'bladeStorm') {
          const bladeCount = 3 + this.state.stats.projectileBonus;
          for (let i = 0; i < bladeCount; i++) {
            const p = getFromPool(this.projPool);
            const angle = (i / bladeCount) * Math.PI * 2;
            p.x = px + Math.cos(angle) * area;
            p.y = py + Math.sin(angle) * area;
            p.vx = 0; p.vy = 0;
            p.damage = dmg;
            p.pierce = 999;
            p.hitList = [];
            p.homing = false;
            p.isOrbit = true;
            p.orbitAngle = angle;
            p.orbitRadius = area * (0.4 + 0.6 * Math.random());
            p.orbitOwner = 0;
            p.orbitSpeed = 4;
            p.tickTimer = cfg.tickRate ?? 0.4;
            p.tickDamage = dmg;
            p.tickHitList = [];
            p.range = 0; p.traveled = 0;
            p.size = 18;
            p.color = '#cccccc';
            p.crit = false;
            p.isExplosion = false;
            p.isChakram = false;
            p.isHound = false;
            p.isJavelin = false;
            p.isArrow = false;
            p.isFrost = false;
            p.isLightning = false;
            p.slowFactor = 0; p.slowDuration = 0;
            p.trail = [];
          }
        }
        break;
      }
      case 'summon': {
        if (weapon.id === 'grimwalker') {
          const target = this.findNearestEnemy(px, py, range);
          if (target) {
            const angle = Math.atan2(target.y - py, target.x - px);
            this.spawnProjectile(px, py, angle, dmg, 1, cfg, weapon.id, crit);
          }
        } else if (weapon.id === 'stormTotem') {
          // Place a totem that strikes nearby enemies
          const totemX = px;
          const totemY = py;
          const enemies = this.findNearestEnemies(totemX, totemY, range, [], 3);
          for (const e of enemies) {
            this.dealDamageToEnemy(e, dmg, Math.random() < this.state.stats.critChance / 100, weapon.id);
            this.spawnParticle(e.x, e.y, '#88ccff', 4, 60, 4);
          }
        }
        break;
      }
      case 'aoe': {
        if (weapon.id === 'tornado') {
          const cluster = this.findNearestEnemies(px, py, range, [], 1);
          if (cluster.length > 0) {
            const target = cluster[0];
            const p = getFromPool(this.projPool);
            p.x = px; p.y = py;
            p.vx = (target.x - px) * 0.5;
            p.vy = (target.y - py) * 0.5;
            p.damage = 0;
            p.pierce = 999;
            p.hitList = [];
            p.homing = false;
            p.isExplosion = true;
            p.explosionRadius = area;
            p.size = area;
            p.color = '#aaccff';
            p.crit = false;
            p.range = 0; p.traveled = 0;
            p.tickTimer = cfg.tickRate ?? 0.4;
            p.tickDamage = dmg;
            p.tickHitList = [];
            p.isOrbit = false; p.isChakram = false; p.isHound = false;
            p.isJavelin = false; p.isArrow = false; p.isFrost = false; p.isLightning = false;
            p.slowFactor = 0; p.slowDuration = 0;
            p.trail = [];
          }
        } else if (weapon.id === 'fireball') {
          const target = this.findNearestEnemy(px, py, range);
          if (target) {
            const angle = Math.atan2(target.y - py, target.x - px);
            const p = getFromPool(this.projPool);
            p.x = px; p.y = py;
            const speed = 350;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.damage = dmg;
            p.pierce = 0;
            p.hitList = [];
            p.homing = false;
            p.isExplosion = true;
            p.explosionRadius = area;
            p.size = 20;
            p.color = '#ff5500';
            p.crit = Math.random() < this.state.stats.critChance / 100;
            p.range = range; p.traveled = 0;
            p.tickTimer = 0; p.tickDamage = 0; p.tickHitList = [];
            p.isOrbit = false; p.isChakram = false; p.isHound = false;
            p.isJavelin = false; p.isArrow = false; p.isFrost = false; p.isLightning = false;
            p.slowFactor = 0; p.slowDuration = 0;
            p.trail = [];
          }
        } else if (weapon.id === 'meteorStorm') {
          const enemies = this.findNearestEnemies(px, py, range, [], 3);
          for (const e of enemies) {
            this.dealDamageToEnemy(e, dmg, Math.random() < this.state.stats.critChance / 100, weapon.id);
            this.spawnParticle(e.x, e.y, '#ff6600', 8, 80, 5);
          }
        } else if (weapon.id === 'poisonFlask') {
          const target = this.findNearestEnemy(px, py, range);
          if (target) {
            const p = getFromPool(this.projPool);
            p.x = target.x; p.y = target.y;
            p.vx = 0; p.vy = 0;
            p.damage = 0;
            p.pierce = 999;
            p.hitList = [];
            p.homing = false;
            p.isExplosion = true;
            p.explosionRadius = area;
            p.size = area;
            p.color = '#66aa44';
            p.crit = false;
            p.range = 0; p.traveled = 0;
            p.tickTimer = cfg.tickRate ?? 0.6;
            p.tickDamage = dmg;
            p.tickHitList = [];
            p.isOrbit = false; p.isChakram = false; p.isHound = false;
            p.isJavelin = false; p.isArrow = false; p.isFrost = false; p.isLightning = false;
            p.slowFactor = 0; p.slowDuration = 0;
            p.trail = [];
          }
        } else if (weapon.id === 'frostBomb') {
          const enemies = this.findNearestEnemies(px, py, range, [], 99);
          for (const e of enemies) {
            this.dealDamageToEnemy(e, dmg, Math.random() < this.state.stats.critChance / 100, weapon.id);
            e.slowTimer = 1;
            e.slowFactor = 1;
            e.stunTimer = 1;
          }
          this.spawnParticle(px, py, '#44ccff', 10, 70, 5);
        }
        break;
      }
      case 'thrown': {
        if (weapon.id === 'chakram') {
          const target = this.findNearestEnemy(px, py, range);
          if (target) {
            const angle = Math.atan2(target.y - py, target.x - px);
            for (let i = 0; i < projCount; i++) {
              const p = getFromPool(this.projPool);
              p.x = px; p.y = py;
              const speed = 500;
              p.vx = Math.cos(angle) * speed;
              p.vy = Math.sin(angle) * speed;
              p.damage = dmg;
              p.pierce = 999;
              p.hitList = [];
              p.homing = false;
              p.isChakram = true;
              p.chakramPhase = 'out';
              p.range = range;
              p.traveled = 0;
              p.size = 18;
              p.color = '#cccc44';
              p.crit = Math.random() < this.state.stats.critChance / 100;
              p.isExplosion = false; p.isOrbit = false;
              p.isHound = false; p.isJavelin = false; p.isArrow = false;
              p.isFrost = false; p.isLightning = false;
              p.slowFactor = 0; p.slowDuration = 0;
              p.tickTimer = 0; p.tickDamage = 0; p.tickHitList = [];
              p.trail = [];
            }
          }
        }
        break;
      }
    }

    // Twin Strike relic
    if (this.state.relics.includes('twinStrike') && Math.random() < 0.15 && cfg.type !== 'melee') {
      weapon.cooldownTimer = 0.05;
    }
  }

  spawnProjectile(px: number, py: number, angle: number, dmg: number, pierce: number, cfg: ReturnType<typeof getWeapon>, weaponId: string, _crit: boolean) {
    const p = getFromPool(this.projPool);
    p.x = px; p.y = py;
    const speed = weaponId === 'crackedWand' ? 250 : 450;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.damage = dmg;
    p.pierce = pierce;
    p.hitList = [];
    p.homing = cfg.homing ?? false;
    p.targetId = 0;
    p.range = this.weaponRangeVal(weaponId);
    p.traveled = 0;
    p.size = 16;
    p.color = weaponId === 'crackedWand' ? '#88aaff' : weaponId === 'grimwalker' ? '#ddccaa' : '#ffffff';
    p.crit = Math.random() < this.state.stats.critChance / 100;
    p.isExplosion = false;
    p.isOrbit = false;
    p.isChakram = false;
    p.isHound = weaponId === 'spectralHounds';
    p.isJavelin = false;
    p.isArrow = false;
    p.isFrost = false;
    p.isLightning = weaponId === 'lightningStaff';
    p.slowFactor = 0;
    p.slowDuration = 0;
    p.tickTimer = 0; p.tickDamage = 0; p.tickHitList = [];
    p.trail = [];
  }

  weaponRangeVal(weaponId: string): number {
    const w = this.state.weapons.find(w => w.id === weaponId);
    if (!w) return 300;
    return weaponRange(w, this.state.stats);
  }

  // --- Shake ---
  shake(intensity: number, duration: number) {
    if (!this.state.save.settings.screenShake) return;
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  // --- Main update ---
  update(dt: number) {
    if (this.paused || this.dead) return;
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      dt *= 0.1;
    }

    const state = this.state;
    state.survivalTime += dt;
    state.dangerLevel = calcDanger(state.survivalTime);
    const minutes = state.survivalTime / 60;

    // Player movement
    let mx = 0, my = 0;
    if (this.input.up) my -= 1;
    if (this.input.down) my += 1;
    if (this.input.left) mx -= 1;
    if (this.input.right) mx += 1;
    const len = Math.hypot(mx, my);
    if (len > 0) { mx /= len; my /= len; }
    const isMoving = len > 0;
    if (isMoving) {
      state.momentumStillTimer = 0;
    } else {
      state.momentumStillTimer += dt;
    }
    const speed = state.stats.moveSpeed;
    this.playerVx = mx * speed;
    this.playerVy = my * speed;
    this.playerX = Math.max(20, Math.min(ARENA_SIZE - 20, this.playerX + this.playerVx * dt));
    this.playerY = Math.max(20, Math.min(ARENA_SIZE - 20, this.playerY + this.playerVy * dt));

    // Camera
    this.cameraX = this.playerX - this.width / 2;
    this.cameraY = this.playerY - this.height / 2;

    // HP Regen
    if (state.stats.hpRegen > 0) {
      state.stats.currentHp = Math.min(state.stats.maxHp, state.stats.currentHp + state.stats.hpRegen * dt);
    }

    // Adaptive Armor & Bulwark
    if (state.stats.adaptiveArmor > 0) {
      const stacks = Math.floor(minutes / 3);
      // Applied as flat armor bonus (already in base, re-compute not needed each frame)
    }

    // Blood Cultist passive
    if (state.classId === 'bloodCultist') {
      state.bloodCultistCd -= dt;
      if (state.stats.currentHp / state.stats.maxHp < 0.30 && state.bloodCultistCd <= 0) {
        state.bloodCultistActive = 5;
        state.bloodCultistCd = 60;
      }
      if (state.bloodCultistActive > 0) {
        state.bloodCultistActive -= dt;
      }
    }

    // Berserk Blood relic
    if (state.relics.includes('berserkBlood')) {
      const missingPct = 1 - state.stats.currentHp / state.stats.maxHp;
      state.stats.damageMult = 1 + missingPct / 2;
    }

    // Frenzy decay
    if (state.frenzyTimer > 0) {
      state.frenzyTimer -= dt;
      if (state.frenzyTimer <= 0) {
        state.frenzyStacks = 0;
      }
    }

    // Momentum Surge
    if (state.relicTimers['momentumSurge'] !== undefined) {
      state.relicTimers['momentumSurge'] -= dt;
      if (state.relicTimers['momentumSurge'] <= 0) {
        delete state.relicTimers['momentumSurge'];
        state.relicTimers['momentumSurge_count'] = 0;
      }
    }

    // Momentum Shield
    if (state.relics.includes('momentumShield')) {
      if (isMoving) {
        state.shield = Math.min(state.stats.maxHp * 0.15, state.shield + state.stats.maxHp * 0.01 * dt);
      }
    }

    // Relic timers
    const timerRelics: Record<string, number> = {
      mirrorImage: 25, staticField: 12, guardianSpirit: 20,
      vampiricAura: 3, magnetPulse: 15,
    };
    for (const [relic, cd] of Object.entries(timerRelics)) {
      if (state.relics.includes(relic)) {
        state.relicTimers[relic] = (state.relicTimers[relic] ?? 0) - dt;
        if (state.relicTimers[relic] <= 0) {
          state.relicTimers[relic] = cd;
          this.triggerTimerRelic(relic);
        }
      }
    }

    // Adrenaline
    if (state.relics.includes('adrenaline')) {
      state.relicTimers['adrenaline'] = (state.relicTimers['adrenaline'] ?? 0) - dt;
      if (state.stats.currentHp / state.stats.maxHp < 0.25 && (state.relicTimers['adrenaline'] ?? 0) <= 0) {
        state.stats.currentHp = Math.min(state.stats.maxHp, state.stats.currentHp + state.stats.maxHp * 0.10);
        state.relicTimers['adrenaline'] = 60;
      }
    }

    // Spawn enemies
    let rate = spawnRate(minutes);
    if (state.relics.includes('enemySpawnDown')) rate *= 0.80;
    if (state.relics.includes('swarmCall')) rate *= 1.25;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 1 / rate;
      const batch = Math.max(1, Math.floor(minutes * 0.5));
      for (let i = 0; i < Math.min(batch, 10); i++) this.spawnEnemy();
    }

    // Boss spawning
    const dl = state.dangerLevel;
    if (dl > 0 && dl % 5 === 0 && dl !== this.lastMiniBossDanger && !this.miniBossEntity) {
      this.lastMiniBossDanger = dl;
      this.spawnBoss('wretchedBrute');
    }
    if (state.survivalTime >= this.nextBossTime && !this.bossEntity) {
      this.spawnBoss('cryptTyrant');
      this.nextBossTime += 600;
    }

    // Chest spawn chance
    const chestChance = state.relics.includes('treasureSense') ? 0.0039 : 0.003;
    if (Math.random() < chestChance * dt * 60) {
      this.spawnChest();
    }

    // Update enemies
    for (const e of this.enemyPool.items) {
      if (!e.active) continue;
      // Slow
      let speed = e.speed;
      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        speed *= (1 - e.slowFactor);
      }
      if (e.stunTimer > 0) {
        e.stunTimer -= dt;
        speed = 0;
      }
      // Move toward player
      const dx = this.playerX - e.x;
      const dy = this.playerY - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        e.x += (dx / dist) * speed * dt;
        e.y += (dy / dist) * speed * dt;
      }
      // Knockback
      if (e.knockbackX !== 0 || e.knockbackY !== 0) {
        e.x += e.knockbackX * dt;
        e.y += e.knockbackY * dt;
        e.knockbackX *= 0.9;
        e.knockbackY *= 0.9;
        if (Math.abs(e.knockbackX) < 1) e.knockbackX = 0;
        if (Math.abs(e.knockbackY) < 1) e.knockbackY = 0;
      }
      // Hit flash
      if (e.hitFlash > 0) e.hitFlash -= dt;
      // Attack player
      if (dist < e.size / 2 + 20 && e.attackCooldown <= 0) {
        e.attackCooldown = 1.0;
        this.damagePlayer(e.damage, e);
      }
      if (e.attackCooldown > 0) e.attackCooldown -= dt;

      // Boss slam
      if ((e.kind === 'miniBoss' || e.kind === 'boss') && !e.isSlamming) {
        e.slamTimer -= dt;
        if (e.slamTimer <= 0) {
          e.isSlamming = true;
          e.slamTimer = 3 + Math.random() * 2;
          const slamDist = e.size / 2 + 50;
          if (dist < slamDist) {
            this.damagePlayer(e.damage * 1.5, e);
            this.shake(20, 0.4);
          }
          this.spawnParticle(e.x, e.y, '#ff4400', 15, 120, 8);
          setTimeout(() => { e.isSlamming = false; }, 100);
        }
      }

      // Burning patch (Pyromancer)
      if (e.burningTimer > 0) {
        e.burningTimer -= dt;
        // Only visual; damage applied via particles
      }
    }

    // Update projectiles
    for (const p of this.projPool.items) {
      if (!p.active) continue;
      // Orbit
      if (p.isOrbit) {
        p.orbitAngle += p.orbitSpeed * dt;
        p.x = this.playerX + Math.cos(p.orbitAngle) * p.orbitRadius;
        p.y = this.playerY + Math.sin(p.orbitAngle) * p.orbitRadius;
        // Tick damage
        p.tickTimer -= dt;
        if (p.tickTimer <= 0) {
          p.tickTimer = 0.4;
          p.tickHitList = [];
        }
        for (const e of this.enemyPool.items) {
          if (!e.active || p.tickHitList.includes(e.id)) continue;
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          if (dx * dx + dy * dy < (p.size + e.size) ** 2) {
            this.dealDamageToEnemy(e, p.tickDamage, Math.random() < this.state.stats.critChance / 100, 'fireBrazier');
            p.tickHitList.push(e.id);
          }
        }
        // Orbit projectiles don't expire
        p.active = true;
        continue;
      }

      // Explosion/lingering AOE
      if (p.isExplosion && p.vx === 0 && p.vy === 0) {
        p.tickTimer -= dt;
        if (p.tickTimer <= 0) {
          releaseItem(p);
          continue;
        }
        for (const e of this.enemyPool.items) {
          if (!e.active || p.tickHitList.includes(e.id)) continue;
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          if (dx * dx + dy * dy < p.explosionRadius * p.explosionRadius) {
            this.dealDamageToEnemy(e, p.tickDamage, Math.random() < this.state.stats.critChance / 100, '');
            p.tickHitList.push(e.id);
            if (p.id % 3 === 0) p.tickHitList = []; // re-hit periodically for lingering
          }
        }
        continue;
      }

      // Moving projectile
      // Homing
      if (p.homing) {
        const target = this.enemyPool.items.find(e => e.id === p.targetId && e.active);
        if (!target) {
          const nt = this.findNearestEnemy(p.x, p.y, 400);
          if (nt) p.targetId = nt.id;
        }
        if (target) {
          const dx = target.x - p.x;
          const dy = target.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 1) {
            const speed = Math.hypot(p.vx, p.vy);
            p.vx = (dx / dist) * speed;
            p.vy = (dy / dist) * speed;
          }
        }
      }

      // Chakram return
      if (p.isChakram) {
        if (p.chakramPhase === 'out' && p.traveled > p.range) {
          p.chakramPhase = 'back';
        }
        if (p.chakramPhase === 'back') {
          const dx = this.playerX - p.x;
          const dy = this.playerY - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 30) {
            releaseItem(p);
            continue;
          }
          const speed = Math.hypot(p.vx, p.vy);
          p.vx = (dx / dist) * speed;
          p.vy = (dy / dist) * speed;
        }
      }

      // Trail
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 6) p.trail.shift();

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.traveled += Math.hypot(p.vx, p.vy) * dt;

      // Out of range
      if (p.traveled > p.range && !p.isChakram) {
        releaseItem(p);
        continue;
      }

      // Out of arena
      if (p.x < 0 || p.x > ARENA_SIZE || p.y < 0 || p.y > ARENA_SIZE) {
        releaseItem(p);
        continue;
      }

      // Fireball explosion on impact
      if (p.isExplosion && p.vx !== 0) {
        for (const e of this.enemyPool.items) {
          if (!e.active) continue;
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          if (dx * dx + dy * dy < (p.size + e.size / 2) ** 2) {
            this.createExplosion(p.x, p.y, p.explosionRadius, p.damage, p.color);
            releaseItem(p);
            break;
          }
        }
        continue;
      }

      // Lightning chain
      if (p.isLightning) {
        for (const e of this.enemyPool.items) {
          if (!e.active || p.hitList.includes(e.id)) continue;
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          if (dx * dx + dy * dy < (p.size + e.size / 2) ** 2) {
            this.dealDamageToEnemy(e, p.damage, p.crit, '');
            p.hitList.push(e.id);
            // Chain to 2 more
            const chainCount = p.id > 0 && this.state.weapons.some(w => w.id === 'lightningStaff' && w.tier >= 5) ? 4 : 2;
            let chains = 0;
            let lastX = e.x, lastY = e.y;
            const chained: number[] = [e.id];
            while (chains < chainCount) {
              const next = this.findNearestEnemies(lastX, lastY, 120, chained, 1);
              if (next.length === 0) break;
              const c = next[0];
              this.dealDamageToEnemy(c, p.damage * 0.5, false, '');
              this.spawnParticle(c.x, c.y, '#88aaff', 3, 40, 3);
              chained.push(c.id);
              lastX = c.x; lastY = c.y;
              chains++;
            }
            releaseItem(p);
            break;
          }
        }
        continue;
      }

      // Normal projectile hit
      for (const e of this.enemyPool.items) {
        if (!e.active || p.hitList.includes(e.id)) continue;
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        if (dx * dx + dy * dy < (p.size + e.size / 2) ** 2) {
          this.dealDamageToEnemy(e, p.damage, p.crit, '');
          p.hitList.push(e.id);
          if (p.hitList.length > p.pierce) {
            releaseItem(p);
            break;
          }
        }
      }
    }

    // Update XP orbs
    for (const orb of this.xpPool.items) {
      if (!orb.active) continue;
      const dx = this.playerX - orb.x;
      const dy = this.playerY - orb.y;
      const dist = Math.hypot(dx, dy);
      if (dist < state.stats.pickupRadius || orb.attracted) {
        orb.attracted = true;
        if (dist > 1) {
          orb.x += (dx / dist) * 300 * dt;
          orb.y += (dy / dist) * 300 * dt;
        }
      } else {
        orb.x += orb.vx * dt;
        orb.y += orb.vy * dt;
        orb.vx *= 0.95;
        orb.vy *= 0.95;
      }
      if (dist < 25) {
        this.gainXP(orb.value);
        releaseItem(orb);
      }
    }

    // Update Gold orbs
    for (const orb of this.goldPool.items) {
      if (!orb.active) continue;
      const dx = this.playerX - orb.x;
      const dy = this.playerY - orb.y;
      const dist = Math.hypot(dx, dy);
      if (dist < state.stats.pickupRadius || orb.attracted) {
        orb.attracted = true;
        if (dist > 1) {
          orb.x += (dx / dist) * 300 * dt;
          orb.y += (dy / dist) * 300 * dt;
        }
      } else {
        orb.x += orb.vx * dt;
        orb.y += orb.vy * dt;
        orb.vx *= 0.95;
        orb.vy *= 0.95;
      }
      if (dist < 25) {
        this.state.gold += orb.value;
        releaseItem(orb);
      }
    }

    // Chest pickup
    for (const chest of this.chestPool.items) {
      if (!chest.active) continue;
      const dx = this.playerX - chest.x;
      const dy = this.playerY - chest.y;
      if (dx * dx + dy * dy < 40 * 40) {
        chest.active = false;
        this.pendingChestId = chest.id;
        this.paused = true;
        this.callbacks.onChest(chest.id);
        break;
      }
    }

    // Update particles
    for (const p of this.particlePool.items) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        releaseItem(p);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.isText) {
        p.vy += 100 * dt;
      } else {
        p.vx *= 0.95;
        p.vy *= 0.95;
      }
    }

    // Fire weapons
    for (const w of state.weapons) {
      this.fireWeapon(w, dt);
    }

    // DPS calculation
    this.dpsTimer += dt;
    if (this.dpsTimer >= 1) {
      this.dpsTimer = 0;
      this.currentDps = this.damageDpsWindow.reduce((a, b) => a + b, 0);
      this.damageDpsWindow = [];
    }

    // Shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) this.shakeIntensity = 0;
    }

    // Flash
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.levelUpFlashTimer > 0) this.levelUpFlashTimer -= dt;

    // Skip wave cooldown
    if (this.skipWaveCd > 0) this.skipWaveCd -= dt;

    // Notify state
    this.callbacks.onStateChange({ ...this.state, stats: { ...this.state.stats } });
  }

  triggerTimerRelic(relic: string) {
    switch (relic) {
      case 'mirrorImage': {
        // Decoy: enemies target a point for 4s
        const decoyX = this.playerX;
        const decoyY = this.playerY;
        for (const e of this.enemyPool.items) {
          if (!e.active) continue;
          const dx = decoyX - e.x;
          const dy = decoyY - e.y;
          if (dx * dx + dy * dy < 300 * 300) {
            // Just move them toward decoy for a brief time (simplified)
            e.x += dx * 0.1;
            e.y += dy * 0.1;
          }
        }
        break;
      }
      case 'staticField': {
        for (const e of this.enemyPool.items) {
          if (!e.active) continue;
          const dx = e.x - this.playerX;
          const dy = e.y - this.playerY;
          if (dx * dx + dy * dy < 150 * 150) {
            e.stunTimer = 0.8;
            this.spawnParticle(e.x, e.y, '#ffffaa', 4, 40, 3);
          }
        }
        break;
      }
      case 'guardianSpirit': {
        this.state.shield = this.state.stats.maxHp * 0.15;
        break;
      }
      case 'vampiricAura': {
        let count = 0;
        for (const e of this.enemyPool.items) {
          if (!e.active) continue;
          const dx = e.x - this.playerX;
          const dy = e.y - this.playerY;
          if (dx * dx + dy * dy < 200 * 200) count++;
        }
        if (count > 0) {
          this.state.stats.currentHp = Math.min(this.state.stats.maxHp, this.state.stats.currentHp + count * 2);
        }
        break;
      }
      case 'magnetPulse': {
        for (const orb of this.xpPool.items) {
          if (orb.active) orb.attracted = true;
        }
        break;
      }
    }
  }

  damagePlayer(dmg: number, source: EnemyEntity) {
    const state = this.state;
    // Dodge
    if (state.stats.dodge > 0 && Math.random() < state.stats.dodge / 100) return;

    // Null Field (level-up invuln)
    if (state.relics.includes('nullField') && (state.relicTimers['nullField'] ?? 0) > 0) {
      return;
    }

    // Guardian Spirit shield
    if (state.shield > 0) {
      const absorbed = Math.min(state.shield, dmg);
      state.shield -= absorbed;
      dmg -= absorbed;
      if (state.relics.includes('guardianSpirit') && state.shield <= 0) {
        state.relicTimers['guardianSpirit'] = 20;
      }
    }

    if (dmg <= 0) return;

    // Armor reduction
    let finalDmg = dmg;
    const flatArmor = state.stats.armor > 1 ? state.stats.armor : 0;
    if (flatArmor > 0) {
      finalDmg = Math.max(1, dmg - flatArmor);
    } else if (state.stats.armor > 0 && state.stats.armor < 1) {
      finalDmg = dmg * (1 - state.stats.armor);
    }

    // Undying Will: reduce hits over 30% current HP
    if (state.stats.undying > 0 && finalDmg > state.stats.currentHp * 0.30) {
      finalDmg *= (1 - state.stats.undying / 100);
    }

    state.stats.currentHp -= finalDmg;
    state.damageTaken += finalDmg;
    this.shake(5, 0.15);

    // Thorns
    if (state.stats.thorns > 0) {
      this.dealDamageToEnemy(source, finalDmg * state.stats.thorns / 100, false, '');
    }

    // Unstable Core
    if (state.relics.includes('unstableCore') && Math.random() < 0.18) {
      this.createExplosion(this.playerX, this.playerY, 80, finalDmg * 2, '#ff6600');
    }

    // Second Wind
    if (state.stats.currentHp <= 0 && !state.secondWindUsed && state.relics.includes('secondWind')) {
      state.secondWindUsed = true;
      state.stats.currentHp = 1;
      this.spawnParticle(this.playerX, this.playerY, '#ffdd44', 20, 100, 6);
    }

    // Phoenix Ash
    if (state.stats.currentHp <= 0 && !state.phoenixAshUsed && state.relics.includes('phoenixAsh')) {
      state.phoenixAshUsed = true;
      state.stats.currentHp = state.stats.maxHp * 0.30;
      this.spawnParticle(this.playerX, this.playerY, '#ff8822', 30, 120, 8);
    }

    if (state.stats.currentHp <= 0) {
      state.stats.currentHp = 0;
      this.dead = true;
      this.callbacks.onDeath();
    }
  }

  gainXP(amount: number) {
    const state = this.state;
    state.xp += amount;
    if (state.xp >= state.xpToNext) {
      state.xp -= state.xpToNext;
      state.level++;
      state.xpToNext = Math.floor(state.xpToNext * 1.4 + 5);
      this.levelUpFlashTimer = 0.5;
      this.freezeTimer = 0.3;
      this.spawnParticle(this.playerX, this.playerY, '#ffdd44', 20, 120, 6);

      // Time Dilation
      if (state.relics.includes('timeDilation')) {
        for (const e of this.enemyPool.items) {
          if (e.active) e.slowTimer = Math.max(e.slowTimer, 2);
          if (e.active) e.slowFactor = Math.max(e.slowFactor, 0.5);
        }
      }
      // Null Field
      if (state.relics.includes('nullField')) {
        state.relicTimers['nullField'] = 2;
      }

      this.pendingLevelUp = true;
      this.paused = true;
      this.callbacks.onLevelUp();
    }
  }

  // --- Level Up / Shop resolution ---
  applyLevelUpChoice(tomeId: string, rarity: Rarity, tierIndex: number) {
    const state = this.state;
    const existing = state.tomes.find(t => t.id === tomeId);
    if (existing) {
      existing.tierIndex = Math.min(existing.tierIndex + 1, 3);
    } else {
      state.tomes.push({ id: tomeId, rarity, tierIndex });
    }
    state.upgradeLog.push({ name: getTome(tomeId)?.name ?? tomeId, rarity, type: 'tome', stack: 1 });
    // Recompute stats
    const cls = getClass(state.classId);
    const base = {
      maxHp: cls.hp,
      currentHp: state.stats.currentHp,
      moveSpeed: cls.speed * 47,
      damageMult: 1,
      attackSpeedMult: 1,
      areaMult: state.classId === 'mage' ? 1.10 : 1,
      rangeMult: 1,
      critChance: state.classId === 'ranger' ? 20 : 5,
      critDamage: 50,
      armor: cls.armor,
      dodge: 0,
      thorns: 0,
      xpGainMult: 1,
      goldGainMult: 1,
      pickupRadius: 70,
      lifesteal: state.classId === 'necromancer' ? 0.12 : 0,
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
    const newStats = computeStats(state.tomes, state.relics, base);
    state.stats = newStats;
    this.pendingLevelUp = false;
    this.paused = false;
  }

  applyRelicChoice(relicId: string) {
    const state = this.state;
    if (!state.relics.includes(relicId)) {
      state.relics.push(relicId);
      state.upgradeLog.push({ name: relicId, rarity: 'epic', type: 'relic', stack: 1 });
    }
    this.pendingChestId = -1;
    this.paused = false;
  }

  buyWeapon(weaponId: string): boolean {
    const state = this.state;
    const cost = 400;
    if (state.gold < cost) return false;
    if (state.weapons.length >= 4) return false; // 1 starting + 3 extras
    state.gold -= cost;
    state.weapons.push({ id: weaponId, tier: 1, cooldownTimer: 0 });
    return true;
  }

  upgradeWeapon(weaponId: string): boolean {
    const state = this.state;
    const w = state.weapons.find(w => w.id === weaponId);
    if (!w || w.tier >= 5) return false;
    const costs = [0, 300, 600, 1000, 1600];
    const cost = costs[w.tier];
    if (state.gold < cost) return false;
    state.gold -= cost;
    w.tier++;
    return true;
  }

  closeShop() {
    this.pendingShop = false;
    this.paused = false;
  }

  skipWave() {
    if (this.skipWaveCd > 0) return;
    this.skipWaveCd = 3;
    const minutes = this.state.survivalTime / 60;
    const batch = Math.max(5, Math.floor(minutes * 3));
    for (let i = 0; i < Math.min(batch, 30); i++) this.spawnEnemy();
  }

  // --- Rendering ---
  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Shake offset
    let sx = 0, sy = 0;
    if (this.shakeIntensity > 0 && this.shakeTimer > 0) {
      sx = (Math.random() - 0.5) * this.shakeIntensity;
      sy = (Math.random() - 0.5) * this.shakeIntensity;
    }

    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(-this.cameraX + sx, -this.cameraY + sy);

    // Arena floor
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, 0, ARENA_SIZE, ARENA_SIZE);

    // Grid pattern
    ctx.strokeStyle = '#222233';
    ctx.lineWidth = 1;
    const grid = 64;
    const startX = Math.floor(this.cameraX / grid) * grid;
    const startY = Math.floor(this.cameraY / grid) * grid;
    for (let x = startX; x < this.cameraX + w + grid; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, this.cameraY - grid);
      ctx.lineTo(x, this.cameraY + h + grid);
      ctx.stroke();
    }
    for (let y = startY; y < this.cameraY + h + grid; y += grid) {
      ctx.beginPath();
      ctx.moveTo(this.cameraX - grid, y);
      ctx.lineTo(this.cameraX + w + grid, y);
      ctx.stroke();
    }

    // Arena border
    ctx.strokeStyle = '#444466';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, ARENA_SIZE, ARENA_SIZE);

    // XP orbs
    for (const orb of this.xpPool.items) {
      if (!orb.active) continue;
      ctx.fillStyle = '#44ddff';
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gold orbs
    for (const orb of this.goldPool.items) {
      if (!orb.active) continue;
      ctx.fillStyle = '#ffdd44';
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chests
    for (const chest of this.chestPool.items) {
      if (!chest.active) continue;
      ctx.fillStyle = '#aa8833';
      ctx.fillRect(chest.x - 12, chest.y - 10, 24, 20);
      ctx.fillStyle = '#665522';
      ctx.fillRect(chest.x - 12, chest.y - 4, 24, 4);
      ctx.fillStyle = '#ffcc33';
      ctx.fillRect(chest.x - 2, chest.y - 4, 4, 4);
    }

    // Projectiles (trails first)
    for (const p of this.projPool.items) {
      if (!p.active) continue;
      if (p.trail.length > 1) {
        ctx.strokeStyle = p.color + '88';
        ctx.lineWidth = p.size * 0.4;
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) ctx.lineTo(p.trail[i].x, p.trail[i].y);
        ctx.stroke();
      }
    }

    // Enemies
    for (const e of this.enemyPool.items) {
      if (!e.active) continue;
      const px = e.x - e.size / 2;
      const py = e.y - e.size / 2;
      ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : e.color;
      // Pixel-art style: draw as a blocky sprite
      ctx.fillRect(px, py, e.size, e.size);
      // Outline
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, e.size, e.size);
      // Eyes
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(px + e.size * 0.25, py + e.size * 0.3, 4, 4);
      ctx.fillRect(px + e.size * 0.6, py + e.size * 0.3, 4, 4);
      // Elite/veteran glow
      if (e.kind === 'elite') {
        ctx.strokeStyle = '#ffff44';
        ctx.lineWidth = 2;
        ctx.strokeRect(px - 2, py - 2, e.size + 4, e.size + 4);
      } else if (e.kind === 'veteran') {
        ctx.strokeStyle = '#666688';
        ctx.lineWidth = 2;
        ctx.strokeRect(px - 1, py - 1, e.size + 2, e.size + 2);
      }
      // Boss telegraph
      if ((e.kind === 'miniBoss' || e.kind === 'boss') && e.isSlamming) {
        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size / 2 + 50, 0, Math.PI * 2);
        ctx.stroke();
      }
      // HP bar for bosses
      if (e.kind === 'boss' || e.kind === 'miniBoss') {
        const barW = e.size + 20;
        ctx.fillStyle = '#330000';
        ctx.fillRect(e.x - barW / 2, py - 12, barW, 6);
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(e.x - barW / 2, py - 12, barW * (e.hp / e.maxHp), 6);
        // Name
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(e.type === 'cryptTyrant' ? 'Crypt Tyrant' : e.type === 'wretchedBrute' ? 'Wretched Brute' : 'Boss', e.x, py - 16);
      }
      // Slow effect
      if (e.slowTimer > 0) {
        ctx.strokeStyle = '#44aaff88';
        ctx.lineWidth = 1;
        ctx.strokeRect(px - 1, py - 1, e.size + 2, e.size + 2);
      }
    }

    // Projectiles (on top)
    for (const p of this.projPool.items) {
      if (!p.active) continue;
      if (p.isExplosion && p.vx === 0 && p.vy === 0) {
        // AOE circle
        ctx.fillStyle = p.color + '33';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.explosionRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.explosionRadius * (p.tickTimer / 0.4), 0, Math.PI * 2);
        ctx.stroke();
        continue;
      }
      // Bright core + glow
      ctx.fillStyle = p.color + '44';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Player
    const ps = 32;
    const ppx = this.playerX - ps / 2;
    const ppy = this.playerY - ps / 2;
    const cls = getClass(this.state.classId);
    ctx.fillStyle = cls.color;
    ctx.fillRect(ppx, ppy, ps, ps);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(ppx, ppy, ps, ps);
    // Player eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ppx + 8, ppy + 10, 5, 5);
    ctx.fillRect(ppx + 19, ppy + 10, 5, 5);
    ctx.fillStyle = '#000';
    ctx.fillRect(ppx + 10, ppy + 12, 2, 2);
    ctx.fillRect(ppx + 21, ppy + 12, 2, 2);
    // Shield ring
    if (this.state.shield > 0) {
      ctx.strokeStyle = '#44aaff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.playerX, this.playerY, ps, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Particles
    for (const p of this.particlePool.items) {
      if (!p.active) continue;
      const alpha = p.life / p.maxLife;
      if (p.isText && p.text) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.font = `bold ${p.size}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();

    // Level up flash
    if (this.levelUpFlashTimer > 0) {
      ctx.fillStyle = `rgba(255, 221, 68, ${this.levelUpFlashTimer * 0.5})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (this.flashTimer > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashTimer * 0.3})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  loop = () => {
    if (!this.running) return;
    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > 0.1) dt = 0.1;

    if (!this.paused && !this.dead) {
      this.update(dt);
    }
    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }
}


