import type { Rarity } from '../game/types';

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#888888',
  rare: '#4488dd',
  epic: '#aa44cc',
  legendary: '#ddaa22',
};

export const RARITY_BORDER: Record<Rarity, string> = {
  common: 'border-gray-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-amber-500',
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export const RARITY_GLOW: Record<Rarity, string> = {
  common: 'shadow-gray-500/30',
  rare: 'shadow-blue-500/30',
  epic: 'shadow-purple-500/30',
  legendary: 'shadow-amber-500/40',
};
