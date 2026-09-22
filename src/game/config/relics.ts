import type { RelicConfig } from '../types';

export const RELICS: RelicConfig[] = [
  { id: 'explosiveKills', name: 'Explosive Kills', description: '~20% chance kill explodes for AOE dmg', cost: 1950, quest: 'chainReaction', free: false, flavor: 'Pop goes the enemy.', category: 'proc' },
  { id: 'chainSpark', name: 'Chain Spark', description: '~20% chance crit chains 50% dmg to nearby enemy', cost: 1800, quest: 'staticDischarge', free: false, flavor: 'Arcing electricity.', category: 'proc' },
  { id: 'twinStrike', name: 'Twin Strike', description: '~15% chance for a free second shot', cost: 1700, quest: 'doubleTap', free: false, flavor: 'Double trouble.', category: 'proc' },
  { id: 'frenzy', name: 'Frenzy', description: '+2% dmg per kill, stacks to +20%, 4s decay', cost: 1500, quest: 'killStreak', free: false, flavor: 'Bloodlust.', category: 'proc' },
  { id: 'enemySpawnDown', name: 'Enemy Spawn Down', description: '-20% spawn rate', cost: 1800, quest: 'thinTheHerd', free: false, flavor: 'Fewer foes.', category: 'proc' },
  { id: 'slowField', name: 'Slow Field', description: 'Hits apply 15% slow for 1.5s', cost: 1200, quest: 'coldTouch', free: false, flavor: 'Chilling touch.', category: 'proc' },
  { id: 'timeDilation', name: 'Time Dilation', description: 'Level-up slows all enemies 50% for 2s', cost: 1500, quest: 'slowTheWorld', free: false, flavor: 'Time bends.', category: 'proc' },
  { id: 'soulHarvest', name: 'Soul Harvest', description: '~15% chance kill heals 1% Max HP', cost: 1350, quest: 'reapWhatYouSow', free: false, flavor: 'Reap souls.', category: 'proc' },
  { id: 'nullField', name: 'Null Field', description: 'First hit within 2s of level-up negated', cost: 1650, quest: 'gracePeriod', free: false, flavor: 'Brief invulnerability.', category: 'proc' },
  { id: 'momentumShield', name: 'Momentum Shield', description: 'Shield while moving, +1%/s, cap 15% Max HP', cost: 1500, quest: 'keepMoving', free: false, flavor: 'Stay mobile.', category: 'proc' },
  { id: 'reapersBargain', name: "Reaper's Bargain", description: '~20% chance kill executes a second low-HP enemy', cost: 1700, quest: 'twoForOne', free: false, flavor: 'Two for one.', category: 'proc' },
  { id: 'mirrorImage', name: 'Mirror Image', description: 'Every 25s, decoy draws aggro 4s', cost: 1600, quest: 'smokeAndMirrors', free: false, flavor: 'Now you see me.', category: 'timer' },
  { id: 'staticField', name: 'Static Field', description: 'Every 12s, stun nearby enemies 0.8s', cost: 1750, quest: 'shockTherapy', free: false, flavor: 'Static shock.', category: 'timer' },
  { id: 'unstableCore', name: 'Unstable Core', description: '~18% chance to retaliate-explode when hit', cost: 1650, quest: 'volatile', free: false, flavor: 'Volatile.', category: 'proc' },
  { id: 'guardianSpirit', name: 'Guardian Spirit', description: 'Every 20s, shield blocks next hit', cost: 1900, quest: 'watchedOver', free: false, flavor: 'Guardian angel.', category: 'timer' },
  { id: 'adrenaline', name: 'Adrenaline', description: 'Below 25% HP, heal 10% Max HP (60s CD)', cost: 2000, quest: 'secondBreath', free: false, flavor: 'Second breath.', category: 'timer' },
  { id: 'secondWind', name: 'Second Wind', description: 'Once/run, survive killing blow at 1 HP', cost: 2400, quest: 'cheatDeath', free: false, flavor: 'Cheat death.', category: 'oneshot' },
  { id: 'phoenixAsh', name: 'Phoenix Ash', description: 'Once/run, revive at 30% HP', cost: 3600, quest: 'oneMoreLife', free: false, flavor: 'Rise from ashes.', category: 'oneshot' },
  { id: 'vampiricAura', name: 'Vampiric Aura', description: 'Every 3s, heal per nearby enemy', cost: 1650, quest: 'bloodAura', free: false, flavor: 'Blood aura.', category: 'timer' },
  { id: 'magnetPulse', name: 'Magnet Pulse', description: 'Every 15s, pull all XP orbs to you', cost: 1350, quest: 'gravityWell', free: false, flavor: 'Gravity well.', category: 'timer' },
  { id: 'treasureSense', name: 'Treasure Sense', description: '+chest spawn rate ~30%', cost: 1300, quest: 'vaultHunter', free: false, flavor: 'Find the loot.', category: 'proc' },
  { id: 'scavenger', name: 'Scavenger', description: '~18% chance for bonus gold drop', cost: 1250, quest: 'pocketsFull', free: false, flavor: 'Pockets full.', category: 'proc' },
  { id: 'glassCannon', name: 'Glass Cannon', description: '+25% Dmg, -20% Max HP', cost: 1500, quest: 'allIn', free: false, flavor: 'All or nothing.', category: 'tradeoff' },
  { id: 'overcharge', name: 'Overcharge', description: '+30% Area, -15% Attack Speed', cost: 1350, quest: 'overload', free: false, flavor: 'Overload.', category: 'tradeoff' },
  { id: 'goldRush', name: 'Gold Rush', description: '+40% Gold, -20% XP', cost: 1200, quest: 'getRichQuick', free: false, flavor: 'Get rich quick.', category: 'tradeoff' },
  { id: 'recklessMomentum', name: 'Reckless Momentum', description: '+20% Move Speed, -15% Armor', cost: 1200, quest: 'noBrakes', free: false, flavor: 'No brakes.', category: 'tradeoff' },
  { id: 'berserkBlood', name: 'Berserk Blood', description: '+1% Dmg per 2% missing HP (uncapped), -50% Regen', cost: 1650, quest: 'embraceThePain', free: false, flavor: 'Embrace the pain.', category: 'tradeoff' },
  { id: 'swarmCall', name: 'Swarm Call', description: '+25% spawn rate, +20% Gold, +15% XP', cost: 1800, quest: 'ringTheBell', free: false, flavor: 'Ring the bell.', category: 'tradeoff' },
  { id: 'vampiresCurse', name: "Vampire's Curse", description: '+30% Lifesteal, Max HP capped at 70%', cost: 1900, quest: 'hungryGhost', free: false, flavor: 'Hungry ghost.', category: 'tradeoff' },
  { id: 'momentumBreaker', name: 'Momentum Breaker', description: '+30% Dmg standing still 2s+, -20% Dmg moving', cost: 1600, quest: 'plantedFeet', free: false, flavor: 'Planted feet.', category: 'tradeoff' },
  { id: 'momentumSurge', name: 'Momentum Surge', description: 'Kill Veteran/Elite: +15% Atk Spd 6s, stacks 2x', cost: 1550, quest: 'bigKillsBigSpeed', free: false, flavor: 'Big kills.', category: 'proc' },
];

export function getRelic(id: string): RelicConfig | undefined {
  return RELICS.find(r => r.id === id);
}
