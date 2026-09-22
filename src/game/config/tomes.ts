import type { TomeConfig } from '../types';

function tiers(values: number[]): TomeConfig['tiers'] {
  const rarities: Array<'common' | 'rare' | 'epic' | 'legendary'> = ['common', 'rare', 'epic', 'legendary'];
  return values.map((v, i) => ({ rarity: rarities[i], value: v }));
}

export const TOMES: TomeConfig[] = [
  // Free starter tomes
  { id: 'damage', name: 'Damage', description: '+X% damage', stat: 'damage', mode: 'additive', tiers: tiers([5, 8, 12, 18]), cost: 0, quest: '', free: true, flavor: 'Hit harder.' },
  { id: 'attackSpeed', name: 'Attack Speed', description: '-X% cooldown', stat: 'attackSpeed', mode: 'additive', tiers: tiers([5, 8, 12, 18]), cost: 0, quest: '', free: true, flavor: 'Faster strikes.' },
  { id: 'maxHp', name: 'Max HP', description: '+X% max HP', stat: 'maxHp', mode: 'additive', tiers: tiers([8, 12, 18, 25]), cost: 0, quest: '', free: true, flavor: 'More health.' },
  { id: 'moveSpeed', name: 'Move Speed', description: '+X% move speed', stat: 'moveSpeed', mode: 'additive', tiers: tiers([4, 7, 10, 15]), cost: 0, quest: '', free: true, flavor: 'Quick feet.' },
  { id: 'attackRange', name: 'Attack Range', description: '+X% range', stat: 'attackRange', mode: 'additive', tiers: tiers([6, 10, 15, 22]), cost: 0, quest: '', free: true, flavor: 'Reach further.' },
  { id: 'hpRegen', name: 'HP Regen', description: '+X HP/s', stat: 'hpRegen', mode: 'flat', tiers: tiers([0.3, 0.6, 1.0, 1.6]), cost: 0, quest: '', free: true, flavor: 'Slow recovery.' },

  // Unlockable tomes
  { id: 'areaSize', name: 'Area Size', description: '+X% area', stat: 'areaSize', mode: 'additive', tiers: tiers([6, 10, 15, 22]), cost: 750, quest: 'wideReach', free: false, flavor: 'Bigger blasts.' },
  { id: 'projectileCount', name: 'Projectile Count', description: '+1 (Rare+), +2 (Legendary)', stat: 'projectileCount', mode: 'flat', tiers: tiers([0, 1, 1, 2]), cost: 1200, quest: 'moreIsMore', free: false, flavor: 'More shots.' },
  { id: 'pierce', name: 'Pierce', description: '+1 (Rare+), +2 (Legendary)', stat: 'pierce', mode: 'flat', tiers: tiers([0, 1, 1, 2]), cost: 1050, quest: 'straightThrough', free: false, flavor: 'Punch through.' },
  { id: 'critChance', name: 'Crit Chance', description: '+X% crit chance', stat: 'critChance', mode: 'additive', tiers: tiers([4, 7, 11, 16]), cost: 900, quest: 'sharpenedFocus', free: false, flavor: 'Vital points.' },
  { id: 'critDamage', name: 'Crit Damage', description: '+X% crit damage', stat: 'critDamage', mode: 'additive', tiers: tiers([15, 25, 35, 50]), cost: 900, quest: 'vitalStrike', free: false, flavor: 'Deadly precision.' },
  { id: 'armor', name: 'Armor', description: '+X flat armor', stat: 'armor', mode: 'flat', tiers: tiers([1, 2, 3, 5]), cost: 900, quest: 'thickHide', free: false, flavor: 'Thick skin.' },
  { id: 'dodge', name: 'Dodge Chance', description: '+X% dodge', stat: 'dodge', mode: 'additive', tiers: tiers([3, 6, 9, 14]), cost: 1200, quest: 'evasiveManeuvers', free: false, flavor: 'Narrow escapes.' },
  { id: 'thorns', name: 'Thorns', description: 'Reflect X% damage', stat: 'thorns', mode: 'additive', tiers: tiers([10, 20, 30, 45]), cost: 1050, quest: 'painfulRetribution', free: false, flavor: 'They bleed too.' },
  { id: 'xpGain', name: 'XP Gain', description: '+X% XP', stat: 'xpGain', mode: 'additive', tiers: tiers([8, 14, 20, 30]), cost: 750, quest: 'fastLearner', free: false, flavor: 'Learn faster.' },
  { id: 'pickupRadius', name: 'Pickup Radius', description: '+X% pickup radius', stat: 'pickupRadius', mode: 'additive', tiers: tiers([15, 25, 35, 50]), cost: 600, quest: 'wideNet', free: false, flavor: 'Magnetic pull.' },
  { id: 'luck', name: 'Luck', description: '+X% better rarity odds', stat: 'luck', mode: 'additive', tiers: tiers([5, 9, 14, 20]), cost: 1050, quest: 'fortunesFavor', free: false, flavor: 'Fortune smiles.' },
  { id: 'goldGain', name: 'Gold Gain', description: '+X% gold', stat: 'goldGain', mode: 'additive', tiers: tiers([10, 18, 26, 38]), cost: 900, quest: 'coinCounter', free: false, flavor: 'Coin magnet.' },
  { id: 'lifesteal', name: 'Lifesteal', description: '+X% lifesteal', stat: 'lifesteal', mode: 'additive', tiers: tiers([2, 4, 6, 9]), cost: 1200, quest: 'thirstForLife', free: false, flavor: 'Drain life.' },
  { id: 'executioner', name: "Executioner's Edge", description: '+X% dmg vs sub-20% HP', stat: 'executioner', mode: 'additive', tiers: tiers([10, 18, 28, 40]), cost: 1350, quest: 'finishTheJob', free: false, flavor: 'Finish them.' },
  { id: 'eliteHunter', name: 'Elite Hunter', description: '+X% dmg vs Veteran/Elite', stat: 'eliteHunter', mode: 'additive', tiers: tiers([12, 20, 30, 45]), cost: 1500, quest: 'bigGameHunter', free: false, flavor: 'Big game.' },
  { id: 'bonebreaker', name: 'Bonebreaker', description: '+X% dmg vs full HP', stat: 'bonebreaker', mode: 'additive', tiers: tiers([10, 18, 28, 40]), cost: 1350, quest: 'firstStrike', free: false, flavor: 'First blood.' },
  { id: 'marked', name: 'Marked for Death', description: '+X% dmg vs marked (3 hits in 2s)', stat: 'marked', mode: 'additive', tiers: tiers([10, 18, 28, 40]), cost: 1600, quest: 'wearThemDown', free: false, flavor: 'Marked for death.' },
  { id: 'opportunist', name: 'Opportunist', description: '+X% dmg vs debuffed', stat: 'opportunist', mode: 'additive', tiers: tiers([10, 18, 28, 40]), cost: 1650, quest: 'kickThemWhileDown', free: false, flavor: 'No mercy.' },
  { id: 'undying', name: 'Undying Will', description: '-X% hits over 30% current HP', stat: 'undying', mode: 'additive', tiers: tiers([15, 25, 35, 50]), cost: 2100, quest: 'unbreakable', free: false, flavor: 'Unbreakable.' },
  { id: 'vampiricEdge', name: 'Vampiric Edge', description: '+X% crit heal', stat: 'vampiricEdge', mode: 'additive', tiers: tiers([3, 6, 9, 13]), cost: 1500, quest: 'crimsonPrecision', free: false, flavor: 'Crimson precision.' },
  { id: 'hoarder', name: 'Hoarder', description: '+X% gold-to-XP', stat: 'hoarder', mode: 'additive', tiers: tiers([10, 18, 26, 38]), cost: 1100, quest: 'wasteNot', free: false, flavor: 'Waste not.' },
  { id: 'adaptiveArmor', name: 'Adaptive Armor', description: '+1 flat per 3 min survived', stat: 'adaptiveArmor', mode: 'flat', tiers: tiers([1, 1, 1, 1]), cost: 1600, quest: 'weathered', free: false, flavor: 'Weathered warrior.' },
  { id: 'bulwark', name: 'Bulwark', description: '+1 flat per 10% HP missing', stat: 'bulwark', mode: 'flat', tiers: tiers([1, 1, 1, 1]), cost: 1700, quest: 'lastStand', free: false, flavor: 'Last stand.' },
];

export function getTome(id: string): TomeConfig | undefined {
  return TOMES.find(t => t.id === id);
}

export const FREE_TOME_IDS = TOMES.filter(t => t.free).map(t => t.id);
